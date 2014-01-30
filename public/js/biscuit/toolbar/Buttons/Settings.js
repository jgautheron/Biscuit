YUI.add('toolbar-button-settings', function(Y) {
    function ButtonSettings() {
        this._initButtonSettings();
    }

    ButtonSettings.prototype = {
        _initButtonSettings : function() {
            this.settings.parent = this;
            this.settings._init();
        },

        settings : {
            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.button.settings');
            },

            _click : function() {
                this.toggle();
            },

            toggle : function() {
                if (this.button.hasClass(this.parent.CLASSNAMES.BUTTON_ACTIVE)) {
                    this.app.settings.hide();
                } else {
                    this.app.settings.show();
                }
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonSettings = ButtonSettings;
}, '3.3.0', {requires:[]});