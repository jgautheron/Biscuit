YUI.add('toolbar-plugin', function(Y) {
    Toolbar.NAME = 'toolbar-plugin';
    Toolbar.NS   = 'toolbar';

    Toolbar.ATTRS = {
        srcNode : {
            value : null,
            writeOnce : true
        }
    };

    function Toolbar(config) {
        Toolbar.superclass.constructor.apply(this, arguments);
    }

    Y.extend(Toolbar, Y.Plugin.Base, {

        initializer : function(cfg) {
            this.srcNode = Y.one(cfg.srcNode);
            this.app = this.get('host');

            this._syncState();
            this._bindEvents();

            Y.log('initialized', null, 'Toolbar');
        },

        destructor : function() {
            Y.detach('toolbar|*');
        },

        hide : function() {
            this.srcNode.all('.' + this.CLASSNAMES.BUTTON).hide();
            this.srcNode.one('.version').hide();
        },

        show : function() {
            this.srcNode.all('.' + this.CLASSNAMES.BUTTON + ':not(.hide)').show();
            this.srcNode.one('.version').show();
        },

        setActiveEditorMode : function(button) {
            button = button || this.srcNode.one('li:first-child');
            this.srcNode.one('.context-editor').get('children').removeClass(this.CLASSNAMES.BUTTON_ACTIVE);
            button.addClass(this.CLASSNAMES.BUTTON_ACTIVE);
        },

        _syncState : function() {

        },

        _bindEvents : function() {
            this.srcNode.delegate('click', this._onButtonClick, '.' + this.CLASSNAMES.BUTTON, this);
        },

        _onButtonClick : function(e) {
            var cls = e.currentTarget.get('classList')._nodes, type = null;
            cls.forEach(function(i) {
                switch (i) {
                    case 'button':
                    case 'active':
                        break;
                    default:
                        type = i;
                }
            });

            if (type === null) {
                Y.log('undefined button', 'error', 'Toolbar');
                return;
            }

            Y.log('button ' + type + ' clicked', null, 'Toolbar');

            if (!!this[type]) {
                Y.log('callback found', null, 'Toolbar');
                this[type]._click();
            } else {
                Y.log('callback not found', 'warn', 'Toolbar');
            }
        },

        CLASSNAMES : {
            BUTTON           : 'button',
            BUTTON_ACTIVE    : 'active',
            BUTTON_HIGHLIGHT : 'highlight'
        }

    });

    Y.namespace('Toolbar');
    Y.Toolbar.Main = Y.Base.mix(Toolbar, [
        Y.Toolbar.ButtonContents,
        Y.Toolbar.ButtonSettings,
        Y.Toolbar.ButtonSave,
        Y.Toolbar.ButtonMore,
        Y.Toolbar.ButtonRename,
        Y.Toolbar.ButtonLock,
        Y.Toolbar.ButtonCompile,
        Y.Toolbar.ButtonPush
    ]);

}, '3.3.0', {requires:[
    'plugin',
    'node',
    'event',
    'toolbar-button-contents',
    'toolbar-button-settings',
    'toolbar-button-save',
    'toolbar-button-more',
    'toolbar-button-rename',
    'toolbar-button-lock',
    'toolbar-button-compile',
    'toolbar-button-push'
]});
