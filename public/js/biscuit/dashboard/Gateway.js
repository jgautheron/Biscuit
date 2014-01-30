YUI.add('gateway-ext', function(Y) {
    function Gateway() {
        this._initGateway();
    }

    const SERVER_EVENT_PREFIX = 'server:';

    Gateway.prototype = {

        _initGateway : function() {
            this.gateway.parent = this;
            this.gateway._init();
        },

        gateway : {
            connectInterval : null,

            socket : null,

            _init : function() {
                this.parent.publish('socket:connected', { preventable: false, broadcast: 1 });
                this.parent.publish('socket:disconnected', { preventable: false, broadcast: 1 });
                this._setupServerConnection();
            },

            getGateway : function() {
                return this.socket;
            },

            emit : function(event, data) {
                data = data || {};
                if (!!event.params) {
                    if (!data.hasOwnProperty('params')) {
                        data['params'] = {};
                    }
                    data.params = this._fillParams(event.params, data.params);
                }
                var request = {
                    'event' : event.name,
                    'data'  : data,
                    'user'  : this.parent.user.name
                };
                this.socket.send(JSON.stringify(request));
            },

            listen : function(event, fn) {
                this.parent.on(SERVER_EVENT_PREFIX + event.name, fn);
            },

            _fillParams : function(locatorParams, givenParams) {
                locatorParams.forEach(Y.bind(function(a) {
                    if (!givenParams.hasOwnProperty(a)) {
                        switch (a) {
                            default:
                                Y.log('missing arg: ' + a, 'error', 'Gateway');
                                throw new Error('missing arg: ' + a);
                        }
                    }
                }, this));
                
                // add user by default
                if (!givenParams.hasOwnProperty('user')) {
                    givenParams['user'] = this.parent.user.name;
                }
                
                return givenParams;
            },

            _setupServerConnection : function() {
                this.socket = new io.Socket();
                this.socket.connect();
                this.socket.on('connect', Y.bind(function() {
                    this.fire('socket:connected');
                    Y.log('established connection with server', null, 'Gateway');
                }, this.parent));
                this.socket.on('message', Y.bind(function(data) {
                    data = JSON.parse(data);
                    var event = data['event'],
                        error = data['error'] || null,
                        data = data['data'];

                    Y.log('received event: ' + event, null, 'Gateway');

                    if (error !== null) {
                        Y.log('got error: ' + error, 'warn', 'Gateway');
                    }

                    // throws dynamically a custom event
                    this.publish('server:' + event, { preventable: false, broadcast: 1 });
                    this.fire(SERVER_EVENT_PREFIX + event, event, data, error);
                }, this.parent));
                this.socket.on('disconnect', Y.bind(function() {
                    this.fire('socket:disconnected');
                    Y.log('lost connection with server', 'warn', 'Gateway');
                    this.gateway._connectInterval();
                }, this.parent));
            },

            _connectInterval : function() {
                var _connect = function() {
                    if (this.socket.connected) {
                        clearInterval(this.connectInterval);
                        return;
                    }
                    Y.log('trying to reconnect with server', 'warn', 'Gateway');
                    this.socket.connect();
                };
                this.connectInterval = window.setInterval(Y.bind(_connect, this), 2000);
            }
        }
    };

    Y.Gateway = Gateway;
}, '3.3.0', {requires:['event-custom']});