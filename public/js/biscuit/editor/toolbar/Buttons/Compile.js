YUI.add('toolbar-button-compile', function(Y) {
    const BUTTON_COMPILING = 'compiling',
          BUTTON_HIDE      = 'hide';

    function ButtonCompile() {
        this._initButtonCompile();
    }

    ButtonCompile.prototype = {
        _initButtonCompile : function() {
            this.compile.parent = this;
            this.compile._init();
        },

        compile : {
            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.compile');

                this._bindEvents();
            },

            _click : function() {
                this.app.gateway.emit(Biscuit.Locator.rest.services.page.compile);
                this.button.addClass(BUTTON_COMPILING);
            },

            _bindEvents : function() {
                // page compiled
                this.app.gateway.listen(Biscuit.Locator.rest.services.page.compile, Y.bind(function() {
                    this.button.removeClass(BUTTON_COMPILING);
                    this.button.addClass(this.parent.CLASSNAMES.BUTTON_HIGHLIGHT);
                    this.app.notifier.show(this.app.notifier.TYPES.NOTICE, "The compilation has been processed.");
                    setTimeout(Y.bind(function() {
                        this.button.removeClass(this.parent.CLASSNAMES.BUTTON_HIGHLIGHT);
                    }, this), 1200);
                }, this));

                this.app.gateway.listen(Biscuit.Locator.rest.services.template.list, Y.bind(function() {
                    if (this.app.current.page === '__common') {
                        this.button.removeClass(BUTTON_HIDE);
                        this.button.show();
                    } else {
                        this.button.addClass(BUTTON_HIDE);
                        this.button.hide();
                    }
                }, this));
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonCompile = ButtonCompile;
}, '3.3.0', {requires:[]});
