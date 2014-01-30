YUI.add('localstore-ext', function(Y) {
    function LocalStore() {
        this._initLocalStore();
    }

    LocalStore.prototype = {
        _initLocalStore : function() {
            this.localStore.parent = this;
            this.localStore._init();
        },

        localStore : {
            definitions : {
                RECENT_SERVERS : {
                    'key'   : 'recent_servers',
                    'value' : []
                },
                RECENT_PAGES : {
                    'key'   : 'recent_pages',
                    'value' : []
                },
                CURRENT_TABS : {
                    'key'   : 'current_tabs',
                    'value' : {}
                }
            },

            _init : function() {
                this.app = this.parent.get('host');
                this._setup();
            },

            _setup : function() {
                for (var i in this.definitions) {
                    var definition = this.definitions[i];
                    if (!localStorage[definition['key']]) {
                        localStorage[definition['key']] = JSON.stringify(definition['value']);
                    }
                }
            },

            clear : function() {
                localStorage.clear();
            },

            set : function(key, value) {
                key = key['key'];
                localStorage[key] = JSON.stringify(value);
            },

            get : function(key) {
                key = key['key'];
                try {
                    return JSON.parse(localStorage[key]);
                } catch (e) {
                    return key['value'];
                }
            }
        }
    };

    Y.LocalStore = LocalStore;
}, '3.3.0', {requires:[]});