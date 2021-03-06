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

                this.parent.on('socket:connected', function(e) {
                    // preload server list
                    this.gateway.emit(Biscuit.Locator.rest.services.server.list);
                });

                this.parent.gateway.listen(Biscuit.Locator.rest.services.server.list, function(e, event, data) {
                    this.dataStore.data.server = { list : data };
                    Y.log('fetched server list', null, 'DataStore');
                    this.fire('datastore:ready');
                });
            }
        }
    };

    Y.DataStore = DataStore;
}, '3.3.0', {requires:['event-custom']});