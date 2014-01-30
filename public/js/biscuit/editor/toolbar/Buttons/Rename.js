YUI.add('toolbar-button-rename', function(Y) {
    function ButtonRename() {
        this._initButtonRename();
    }

    ButtonRename.prototype = {
        _initButtonRename : function() {
            this.rename.parent = this;
            this.rename._init();
        },

        rename : {
            _init : function() {
                this.app = this.parent.get('host');
            },

            _click : function() {
                var tplInput, tpl;
                tpl = this.app.getTemplateById(this.app.current.template);

                if (tplInput = tpl.one('input')) {
                    this.app._validateTemplateInput(tplInput);
                } else {
                    tpl.simulate('dblclick');
                }
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonRename = ButtonRename;
}, '3.3.0', {requires:[]});