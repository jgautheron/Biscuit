YUI.add('template-actions-button-properties', function(Y) {
    function ButtonProperties() {
        this._initButtonProperties();
    }

    ButtonProperties.prototype = {
        _initButtonProperties : function() {
            this.properties.parent = this;
            this.properties._init();
        },

        properties : {
            _init : function() {
                this.app = this.parent.get('host');
            },

            _click : function() {
                console.log('click');
            }
        }
    };

    Y.namespace('TemplateActions');
    Y.TemplateActions.ButtonProperties = ButtonProperties;
}, '3.3.0', {requires:[]});