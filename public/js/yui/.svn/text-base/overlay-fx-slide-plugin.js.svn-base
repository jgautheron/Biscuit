YUI.add('overlay-fx-slide-plugin', function(Y) {
    AnimSlidePlugin.NAME = 'fxslide-plugin';
    AnimSlidePlugin.NS = 'fxslide';
 
    function AnimSlidePlugin(config) {
        AnimSlidePlugin.superclass.constructor.apply(this, arguments);
    }

    Y.extend(AnimSlidePlugin, Y.Plugin.Base, {

        initializer : function(config) {
            this.host = this.get('host');
            this._bindAnimVisible();
            this._bindAnimHidden();
 
            this.after('animVisibleChange', this._bindAnimVisible);
            this.after('animHiddenChange', this._bindAnimHidden);
            this.doBefore('_uiSetVisible', this._uiAnimSetVisible);
        },

        destructor : function() {
        },

        _uiAnimSetVisible : function(val) {
            var hiddenClass = this.host.getClassName('hidden');
            if (this.host.get('rendered')) {
                if (val) {
                    this.host.get('boundingBox').removeClass(hiddenClass);
                    this.host.get('contentBox').addClass('show');
                } else {
                    this.host.get('contentBox').removeClass('show');
                    //this.host.get('boundingBox').addClass(hiddenClass);
                }
                return new Y.Do.Prevent('AnimSlidePlugin prevented default show/hide');
            }
        },

        _uiSetVisible : function(val) {
            var hiddenClass = this.host.getClassName('hidden');
            if (!val) {
                this.host.get('boundingBox').addClass(hiddenClass);
            } else {
                this.host.get('boundingBox').removeClass(hiddenClass);
            }
        },

        _bindAnimVisible : function() {
            this._uiSetVisible(true);
        },

        _bindAnimHidden : function() {
            this._uiSetVisible(false);
        }
    });
 
    Y.AnimSlidePlugin = AnimSlidePlugin;
}, '3.2.0', {requires:['overlay', 'anim', 'plugin']});