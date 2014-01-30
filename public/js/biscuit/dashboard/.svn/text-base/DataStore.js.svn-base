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