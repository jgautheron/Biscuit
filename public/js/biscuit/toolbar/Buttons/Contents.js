YUI.add('toolbar-button-contents', function(Y) {
    function ButtonContents() {
        this._initButtonContents();
    }

    ButtonContents.prototype = {
        _initButtonContents : function() {
            this.contents.parent = this;
            this.contents._init();
        },

        contents : {
            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.button.contents');

                this._syncState();
            },

            _syncState : function() {
                this.app.nodes.templateVersionSelect.show();
            },

            _click : function() {
                this.toggle();
            },

            toggle : function() {
                if (!this.button.hasClass(this.parent.CLASSNAMES.BUTTON_ACTIVE)) {
                    this.app.settings.hide();
                    this.parent.setActiveEditorMode(this.button);
                }
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonContents = ButtonContents;
}, '3.3.0', {requires:[]});