YUI.add('template-actions-plugin', function(Y) {
    TemplateActions.NAME = 'template-actions-plugin';
    TemplateActions.NS   = 'template-actions';

    TemplateActions.ATTRS = {
        srcNode : {
            value : null,
            writeOnce : true
        }
    };

    function TemplateActions(config) {
        TemplateActions.superclass.constructor.apply(this, arguments);
    }

    Y.extend(TemplateActions, Y.Plugin.Base, {

        initializer : function(cfg) {
            this.srcNode = Y.one(cfg.srcNode);
            this.app = this.get('host');

            this._syncState();
            this._bindEvents();

            Y.log('initialized', null, 'TemplateActions');
        },

        destructor : function() {
            Y.detach('TemplateActions|*');
        },

        _syncState : function() {

        },

        _bindEvents : function() {
            this.srcNode.delegate('click', this._onButtonClick, 'li', this);
        },

        _onButtonClick : function(e) {
            var cls = e.currentTarget.get('classList')._nodes, cls = cls[0];
            if (cls === null) {
                Y.log('undefined button', 'error', 'TemplateActions');
                return;
            }

            Y.log('button ' + cls + ' clicked', null, 'TemplateActions');

            if (!!this[cls]) {
                Y.log('callback found', null, 'TemplateActions');
                this[cls]._click();
            } else {
                Y.log('callback not found', 'warn', 'TemplateActions');
            }
        },

        CLASSNAMES : {
            BUTTON        : 'button',
            BUTTON_ACTIVE : 'active',
        }

    });

    Y.namespace('TemplateActions');
    Y.TemplateActions.Main = Y.Base.mix(TemplateActions, [
        Y.TemplateActions.ButtonAdd,
        Y.TemplateActions.ButtonDel,
        //Y.TemplateActions.ButtonProperties,
        Y.TemplateActions.ButtonLanguage
    ]);

}, '3.3.0', {requires:[
    'plugin',
    'node',
    'event',
    'template-actions-button-add',
    'template-actions-button-del',
    'template-actions-button-properties',
    'template-actions-button-language'
]});