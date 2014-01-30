YUI.add('template-actions-button-del', function(Y) {
    function ButtonDel() {
        this._initButtonDel();
    }

    ButtonDel.prototype = {
        _initButtonDel : function() {
            this.del.parent = this;
            this.del.app = this.app;
            this.del._init();
        },

        del : {
            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.template-actions .del');
                this._bindEvents();
            },

            _bindEvents : function() {
                this.button.on('mouseout', this._clickOutside, this);
                
                this.app.gateway.listen(Biscuit.Locator.rest.services.template.delete, Y.bind(function() {
                    var li = this.app.getTemplateById(this.app.current.template);
                    li.remove();
                    this.app.editor.empty();
                    this.button.removeClass(this.CLASSNAMES.SURE);

                    this.app.notifier.show(this.app.notifier.TYPES.NOTICE, "Template " + this.app.current.template + " successfully deleted.");

                    this.app.current.template = null;
                }, this));
            },

            _click : function() {
                if (!this.button.hasClass(this.CLASSNAMES.SURE)) {
                    this.button.addClass(this.CLASSNAMES.SURE);
                    return;
                }
                
                this.app.gateway.emit(Biscuit.Locator.rest.services.template.delete, { 'params' : {
                    'Template__' : this.app.current.template
                }});
            },

            _clickOutside : function() {
                if (this.button.hasClass(this.CLASSNAMES.SURE)) {
                    this.button.removeClass(this.CLASSNAMES.SURE);
                }
            },

            CLASSNAMES : {
                SURE : 'sure'
            }
        }
    };

    Y.namespace('TemplateActions');
    Y.TemplateActions.ButtonDel = ButtonDel;
}, '3.3.0', {requires:['anim']});