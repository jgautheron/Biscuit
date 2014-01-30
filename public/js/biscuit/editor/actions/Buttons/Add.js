YUI.add('template-actions-button-add', function(Y) {
    function ButtonAdd() {
        this._initButtonAdd();
    }

    ButtonAdd.prototype = {
        _initButtonAdd : function() {
            this.add.parent = this;
            this.add.app = this.app;
            this.add._init();
        },

        add : {
            _init : function() {
                this.app = this.parent.get('host');
            },

            _click : function() {
                if (this.app.nodes.templateListContainer.one('input')) {
                    return;
                }

                var li    = Y.Node.create(Y.substitute(this.app.TEMPLATES.LIST, {id: 0, languages: this.app.current.defaultLanguage})),
                    label = Y.Node.create(this.app.TEMPLATES.LABEL),
                    input = Y.Node.create(this.app.TEMPLATES.TEXT_INPUT_IN_PLACE);

                label.setStyle('display', 'none');
                input.set('value', 'template name');

                this.app.nodes.templateList.removeClass(this.app.CLASSNAMES.TEMPLATE_CURRENT);
                li.addClass(this.app.CLASSNAMES.TEMPLATE_CURRENT);
                li.addClass(this.app.CLASSNAMES.TEMPLATE_EDITABLE);
                li.addClass(this.app.CLASSNAMES.TEMPLATE_NEW);
                li.append(label);
                li.append(input);

                this.app.editor.empty();

                this.app.nodes.templateListContainer.prepend(li);
                this.app.nodes.templateList._nodes = this.app.nodes.templateList._nodes.concat(li);
                input.focus();
                input.select();
            }
        }
    };

    Y.namespace('TemplateActions');
    Y.TemplateActions.ButtonAdd = ButtonAdd;
}, '3.3.0', {requires:[]});
