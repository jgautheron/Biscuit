
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
YUI.add('datastore-ext', function(Y) {
    function DataStore() {
        this._initDataStore();
    }

    DataStore.prototype = {

        _initDataStore : function() {
            this.dataStore.parent = this;
            this.dataStore._init();
        },

        dataStore : {
            data : {},

            _init : function() {
                this.parent.publish('datastore:ready', { preventable: false, broadcast: 1 });
            }
        }
    };

    Y.DataStore = DataStore;
}, '3.3.0', {requires:['event-custom']});
YUI.add('notifier-plugin', function(Y) {

    Notifier.NAME = 'notifier-plugin';
    Notifier.NS   = 'notifier';

    function Notifier(config) {
        Notifier.superclass.constructor.apply(this, arguments);
    }

    Y.extend(Notifier, Y.Plugin.Base, {

        initializer : function(cfg) {
            this.app = this.get('host');
            this._syncState();
            Y.log('initialized', null, 'Notifier');
        },

        _syncState : function() {
        },

        show : function(hd, bd, timeout) {
            timeout = timeout || 3000;
        	if (window.webkitNotifications.checkPermission() === 1) {
    			return;
        	}
            var n = window.webkitNotifications.createNotification(
	            document.location + '/images/logo.png', hd, bd
	        );
            n.show();
            if (timeout > 0) {
                setTimeout(function() {
                    n.cancel();
                }, timeout);
            }
        },

        destructor : function() {},

        TYPES : {
        	FORBIDDEN : 'Forbidden',
        	WARNING   : 'Warning',
        	NOTICE    : 'Notice',
        	ERROR     : 'Error'
        }
    });

    Y.Notifier = Notifier;

}, '3.3.0', {requires:[]});
YUI.add('icons-plugin', function(Y) {
    Icons.NAME = 'icons-plugin';
    Icons.NS   = 'icons';

    Icons.ATTRS = {
        srcNode : {
            value : null,
            writeOnce : true
        }
    };

    function Icons(config) {
        Icons.superclass.constructor.apply(this, arguments);
    }

    Y.extend(Icons, Y.Plugin.Base, {

        initializer : function(cfg) {
            this.srcNode = Y.one(cfg.srcNode);
            this.app = this.get('host');

            this._syncState();
            this._bindEvents();

            Y.log('initialized', null, 'Icon');
        },

        destructor : function() {
            Y.detach('Icon|*');
        },

        hide : function() {
            this.srcNode.all('.' + this.CLASSNAMES.ICON).hide();
        },

        show : function() {
            this.srcNode.all('.' + this.CLASSNAMES.ICON + ':not(.hide)').show();
        },

        _syncState : function() {
            var icons = Y.Node.all('.' + this.CLASSNAMES.ICON);
            icons.each(function(v, k) {
                var dd = new Y.DD.Drag({
                    node: v
                });
            });
            Y.DD.DDM.on('drag:start', function(e) {
                var node = e.target.get('node');
                node.addClass('drag');
            });
            Y.DD.DDM.on('drag:end', function(e) {
                var node = e.target.get('node');
                node.removeClass('drag');
            });
        },

        _bindEvents : function() {
            this.srcNode.delegate('mouseup', this._onIconClick, '.' + this.CLASSNAMES.ICON, this);
        },

        _onIconClick : function(e) {
            if (Y.DD.DDM.activeDrag) {
                return;
            }

            var cls = e.currentTarget.get('classList')._nodes, type = null;
            cls.forEach(function(i) {
                switch (i) {
                    case 'out':
                    case 'icon':
                    case 'active':
                    case 'yui3-dd-draggable':
                        break;
                    default:
                        type = i;
                }
            });

            if (type === null) {
                Y.log('undefined icon', 'error', 'Icon');
                return;
            }

            Y.log('icon ' + type + ' clicked', null, 'Icon');

            if (!!this[type]) {
                Y.log('callback found', null, 'Icon');
                this[type]._click();
            } else {
                Y.log('callback not found', 'warn', 'Icon');
            }
        },

        CLASSNAMES : {
            ICON           : 'icon',
            ICON_ACTIVE    : 'active',
            ICON_HIGHLIGHT : 'highlight'
        }

    });

    Y.namespace('Icons');
    Y.Icons.Main = Y.Base.mix(Icons, [
        Y.Icons.IconPush,
        Y.Icons.IconEditor
    ]);

}, '3.3.0', {requires:[
    'plugin',
    'node',
    'event',
    'dd-drag',
    'icon-editor',
    'icon-push'
]});
YUI.add('icon-editor', function(Y) {
    function IconEditor() {
        this._initIconEditor();
    }

    IconEditor.prototype = {
        _initIconEditor : function() {
            this.editor.parent = this;
            this.editor._init();
        },

        editor : {
            _init : function() {
                this.app = this.parent.get('host');
                this.icon = Y.one('.' + this.parent.CLASSNAMES.ICON + '.editor');

                this._syncState();
                this._bindEvents();
            },

            _syncState : function() {
            },

            _bindEvents : function() {
            },

            _click : function() {
                document.location.href = '/';
            },

            toggle : function() {
            }
        }
    };

    Y.namespace('Icons');
    Y.Icons.IconEditor = IconEditor;
}, '3.3.0', {requires:['node']});
YUI.add('icon-push', function(Y) {
    function IconPush() {
        this._initIconPush();
    }

    IconPush.prototype = {
        _initIconPush : function() {
            this.push.parent = this;
            this.push._init();
        },

        push : {
            instance : null,
            interval : null,

            current : {
                queries : {},
                query : null,
                pushed : 0,
                date : 'today'
            },

            nodes : {
                queryListBody : null,
                detailsBox    : null
            },

            _init : function() {
                this.app = this.parent.get('host');
                this.icon = Y.one('.' + this.parent.CLASSNAMES.ICON + '.push');

                this._syncState();
                this._bindEvents();
            },

            _syncState : function() {
                this.instance = new Y.Overlay({
                    srcNode: '#dashboard-push-overlay',
                    visible: false,
                    shim: false
                });
                this.instance.render();
                this.instance.set('centered', true);
                Y.log('rendered IconPush overlay', null, 'IconPush');

                var node = this.instance.get('contentBox');
                node.plug(Y.Plugin.Drag);
                node.dd.addHandle('.yui3-widget-hd');

                this.instance.subscribe('visibleChange', function(e) {
                    if (e.newVal) {
                        this.icon.addClass(this.parent.CLASSNAMES.ICON_ACTIVE);
                    } else {
                        this.icon.removeClass(this.parent.CLASSNAMES.ICON_ACTIVE);
                    }
                }, this);

                this.nodes = {
                    queryListBody : Y.one('#queries-list tbody'),
                    detailsBox    : this.instance.get('contentBox').one('.details')
                };
            },

            _bindEvents : function() {
                this.app.on('socket:connected', function(e) {
                    this.app.gateway.emit(Biscuit.Locator.rest.services.push.getqueries, { params : {
                        'pushed' : this.current.pushed,
                        'date'   : this.current.date,
                    }});
                }, this);

                this.app.gateway.listen(Biscuit.Locator.rest.services.push.getqueries, Y.bind(function(e, event, data) {
                    if (data === null) {
                        data = [];
                    }

                    this.current.queries = data;
                    Y.log('fetched query list', null, 'IconPush');
                    this._buildQueriesList();
                }, this));

                this.app.gateway.listen(Biscuit.Locator.rest.services.push.cancel, Y.bind(function() {
                    this.resetStatus();
                    this.app.gateway.emit(Biscuit.Locator.rest.services.push.getqueries, { params : {
                        'pushed' : this.current.pushed,
                        'date'   : this.current.date,
                    }});
                }, this));

                this.nodes.queryListBody.delegate('click', this._onRowClick, 'tr:not(.none)', this);
                this.nodes.detailsBox.one('.yes').on('click', this._submitPush, this);
                this.nodes.detailsBox.one('.no').on('click', this._cancelPush, this);
                this.instance.bodyNode.one('.tabs').delegate('click', this._onTabClick, '.tab:not(.' + this.CLASSNAMES.DATE_ACTIVE + ')', this);
                this.instance.bodyNode.one('.filters').delegate('click', this._onFilterClick, 'span[data-filter]', this);
            },

            _cancelPush : function() {
                var pushReason = Y.one('#push-cancel-reason'),
                    pushValue  = pushReason.get('value').trim();

                if (pushValue === '') {
                    pushReason.setStyle('visibility', 'visible');
                    pushReason.setStyle('opacity', 100);
                    return;
                }

                pushReason.setStyle('visibility', 'hidden');
                pushReason.setStyle('opacity', 0);
                pushReason.set('value', '');
                this.app.gateway.emit(Biscuit.Locator.rest.services.push.cancel, { params : {
                    'Push_Query__' : this.current.query.ID
                }});
            },

            _submitPush : function() {
            },

            _setRefresh : function() {
                this.interval = setInterval(Y.bind(function() {

                    var loader = this.instance.bodyNode.one('.loader');
                    loader.setStyle('opacity', 100);
                    setTimeout(function() {
                        loader.setStyle('opacity', 0);
                    }, 1000);
                    this.app.gateway.emit(Biscuit.Locator.rest.services.push.getqueries, { params : {
                        'pushed' : this.current.pushed,
                        'date'   : this.current.date,
                    }});
                }, this), 10000);
            },

            _unsetRefresh : function() {
                clearInterval(this.interval);
            },

            _click : function() {
                this.toggle();
            },

            _buildQueriesList : function() {
                var list = this.current.queries;
                if (list.length === 0) {
                    var empty = Y.Node.create('<tr class="none"><td colspan="6">No push query matched your filters.</td></tr>');
                    this.nodes.queryListBody.all('tr').remove();
                    this.nodes.queryListBody.append(empty);
                    return;
                }

                var rows = [], row, rowColumns;
                list.forEach(Y.bind(function(item) {
                    row = Y.Node.create('<tr data-push-query=' + item['ID'] + '></tr>');
                    if (this.current.query) {
                        if (item['ID'] === this.current.query.ID) {
                            row.addClass(this.CLASSNAMES.ROW_SELECTED);
                        }
                    }
                    rowColumns = Y.all([
                        Y.Node.create('<td>' + item['StampHour'] + '</td>'),
                        Y.Node.create('<td>' + item['Caller'] + '</td>'),
                        Y.Node.create('<td>' + item['Ticket'] + '</td>'),
                        Y.Node.create('<td>' + item['Server_Name'] + '</td>'),
                        Y.Node.create('<td>' + item['Page__'] + '</td>'),
                        Y.Node.create('<td>' + item['Type'] + '</td>')
                    ]);
                    row.append(rowColumns);
                    rows.push(row);
                }, this));

                this.nodes.queryListBody.all('tr').remove();
                this.nodes.queryListBody.append(Y.all(rows));
            },

            _onRowClick : function(e) {
                var row   = e.currentTarget,
                    query = this.getQueryFromID(row.getAttribute('data-push-query'));

                this.current.query = query;

                this.nodes.queryListBody.all('tr').removeClass(this.CLASSNAMES.ROW_SELECTED);
                row.addClass(this.CLASSNAMES.ROW_SELECTED);

                var commentBox = this.nodes.detailsBox.one('.comment');
                if (query.Comment !== '') {
                    commentBox.one('p').set('text', query.Comment);
                    commentBox.show();
                } else {
                    commentBox.hide();
                }

                var filesBox = this.nodes.detailsBox.one('.files ul'), html = [], file;
                query.Files.forEach(function(item) {
                    file = Y.Node.create('<li>' + item + '</li>');
                    html.push(file);
                });
                filesBox.get('children').remove();
                filesBox.append(Y.all(html));

                this.nodes.detailsBox.show();
            },

            _onTabClick : function(e) {
                var target = e.currentTarget,
                    date   = target.getAttribute('data-date');

                this.current.date = date;
                this.instance.bodyNode.one('.tabs').all('.tab').removeClass(this.CLASSNAMES.DATE_ACTIVE);
                target.addClass(this.CLASSNAMES.DATE_ACTIVE);

                this.app.gateway.emit(Biscuit.Locator.rest.services.push.getqueries, { params : {
                    'pushed' : this.current.pushed,
                    'date'   : this.current.date,
                }});
            },

            _onFilterClick : function(e) {
                var target = e.currentTarget,
                    filter = target.getAttribute('data-filter'),
                    chk    = target.get('previousSibling');

                switch (filter) {
                    case 'pushed':
                        if (chk.get('checked')) {
                            this.current.pushed = 0;
                        } else {
                            this.current.pushed = 1;
                        }

                        this.app.gateway.emit(Biscuit.Locator.rest.services.push.getqueries, { params : {
                            'pushed' : this.current.pushed,
                            'date'   : this.current.date,
                        }});
                        break;
                }
            },

            getQueryFromID : function(id) {
                var queries = this.current.queries, res = null;
                queries.forEach(function(query) {
                    if (query['ID'] === id) {
                        res = query;
                    }
                });
                return res;
            },

            resetStatus : function() {
                this.nodes.queryListBody.all('tr').removeClass(this.CLASSNAMES.ROW_SELECTED);
                this.instance.get('contentBox').one('.details').hide();
                this.current.query = null;
            },

            toggle : function() {
                if (!this.instance.get('visible')) {
                    this.instance.show();
                    this._setRefresh();
                } else {
                    this.instance.hide();
                    this._unsetRefresh();

                    this.resetStatus();
                }
            },

            CLASSNAMES : {
                ROW_SELECTED : 'selected',
                DATE_ACTIVE  : 'active'
            }
        }
    };

    Y.namespace('Icons');
    Y.Icons.IconPush = IconPush;
}, '3.3.0', {requires:['overlay', 'event-delegate', 'node', 'dd-plugin']});
YUI.add('dashboard', function(Y) {

    var Base = Y.Base.create('Base', Y.Base, [Y.Gateway, Y.DataStore]);

    Dashboard.NAME = 'Dashboard';
    function Dashboard(config) {
        Dashboard.superclass.constructor.apply(this, arguments);
    }

    Y.extend(Dashboard, Base, {
        user : {
            name : '',
            level : 100
        },

        initializer : function(cfg) {
            this._syncState();
            this._bindEvents();

            this.user.name = Biscuit.User;
            this.user.level = Biscuit.UserLevel;

            Y.log('initialized', null, 'Dashboard');
        },

        _syncState : function() {
        },

        _bindEvents : function() {
        },

        destructor : function() { }
    });

    Y.Dashboard = Dashboard;
}, '3.3.0', {requires:['base', 'node', 'event', 'datastore-ext', 'gateway-ext']});
YUI.add('dashboard-console', function(Y) {
    Y.Console = new Y.Console({
        strings: {
            title : 'Biscuit Logger',
            pause : 'Wait',
            clear : 'Flush',
            collapse : 'Shrink',
            expand : 'Grow'
        },
        width: '350px',
        height: '500px',
        newestOnTop: false,
        visible: false
    })
    .plug(Y.Plugin.ConsoleFilters)
    .plug(Y.Plugin.Drag, {handles: ['.yui3-console-hd', '.yui3-console-ft']})
    .render('#yconsole');

    Y.on('key', function(e) {
        if (this.get('visible')) {
            this.hide();
        } else {
            this.show();
        }
    }, 'body', 'press:178', Y.Console);


    Y.one('body').addClass('yui3-skin-sam');
}, '3.3.0', {requires:['console', 'console-filters', 'dd-plugin', 'event-key']});
YUI({
    gallery: 'gallery-2010.11.12-20-45'
}).use(
	'dashboard-console',
	'dashboard',
	'icons-plugin',
	'notifier-plugin',
	'gallery-outside-events',
	function(Y) {

    var app = new Y.Dashboard({
        plugins : [
            {fn: Y.Notifier},
            {fn: Y.Icons.Main, cfg: {srcNode:'.biscuit-dashboard'}}
        ]
    });
});
