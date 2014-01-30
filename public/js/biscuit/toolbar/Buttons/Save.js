YUI.add('toolbar-button-save', function(Y) {
    function ButtonSave() {
        this._initButtonSave();
    }

    ButtonSave.prototype = {
        _initButtonSave : function() {
            this.save.parent = this;
            this.save._init();
        },

        save : {
            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.save');

                this._bindEvents();
            },

            _bindEvents : function() {
                // template saved
                this.app.gateway.listen(Biscuit.Locator.rest.services.template.save, Y.bind(function() {
                    this.button.addClass(this.parent.CLASSNAMES.BUTTON_HIGHLIGHT);
                    setTimeout(Y.bind(function() {
                        this.button.removeClass(this.parent.CLASSNAMES.BUTTON_HIGHLIGHT);
                    }, this), 1200);
                }, this));
            },

            _click : function() {
                this.app.saveTemplate();
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonSave = ButtonSave;
}, '3.3.0', {requires:[]});