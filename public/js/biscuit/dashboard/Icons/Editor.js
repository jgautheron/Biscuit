YUI.add('icon-editor', function(Y) {
    function IconEditor() {
        this._initIconEditor();
    }

    IconEditor.prototype = {
        _initIconEditor : function() {
            this.editor.parent = this;
            this.editor._init();
        },

        editor : {
            _init : function() {
                this.app = this.parent.get('host');
                this.icon = Y.one('.' + this.parent.CLASSNAMES.ICON + '.editor');

                this._syncState();
                this._bindEvents();
            },

            _syncState : function() {
            },

            _bindEvents : function() {
            },

            _click : function() {
                document.location.href = '/';
            },

            toggle : function() {
            }
        }
    };

    Y.namespace('Icons');
    Y.Icons.IconEditor = IconEditor;
}, '3.3.0', {requires:['node']});