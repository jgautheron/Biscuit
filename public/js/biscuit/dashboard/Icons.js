YUI.add('icons-plugin', function(Y) {
    Icons.NAME = 'icons-plugin';
    Icons.NS   = 'icons';

    Icons.ATTRS = {
        srcNode : {
            value : null,
            writeOnce : true
        }
    };

    function Icons(config) {
        Icons.superclass.constructor.apply(this, arguments);
    }

    Y.extend(Icons, Y.Plugin.Base, {
        
        initializer : function(cfg) {
            this.srcNode = Y.one(cfg.srcNode);
            this.app = this.get('host');

            this._syncState();
            this._bindEvents();

            Y.log('initialized', null, 'Icon');
        },

        destructor : function() {
            Y.detach('Icon|*');
        },

        hide : function() {
            this.srcNode.all('.' + this.CLASSNAMES.ICON).hide();
        },

        show : function() {
            this.srcNode.all('.' + this.CLASSNAMES.ICON + ':not(.hide)').show();
        },

        _syncState : function() {
            // sets up d&d
            var icons = Y.Node.all('.' + this.CLASSNAMES.ICON);
            icons.each(function(v, k) {
                var dd = new Y.DD.Drag({
                    node: v
                });
            });
            Y.DD.DDM.on('drag:start', function(e) {
                var node = e.target.get('node');
                node.addClass('drag');
            });
            Y.DD.DDM.on('drag:end', function(e) {
                var node = e.target.get('node');
                node.removeClass('drag');
            });
        },

        _bindEvents : function() {
            this.srcNode.delegate('mouseup', this._onIconClick, '.' + this.CLASSNAMES.ICON, this);
        },

        _onIconClick : function(e) {
            if (Y.DD.DDM.activeDrag) {
                return;
            }

            var cls = e.currentTarget.get('classList')._nodes, type = null;
            cls.forEach(function(i) {
                switch (i) {
                    case 'out':
                    case 'icon':
                    case 'active':
                    case 'yui3-dd-draggable':
                        break;
                    default:
                        type = i;
                }
            });

            if (type === null) {
                Y.log('undefined icon', 'error', 'Icon');
                return;
            }

            Y.log('icon ' + type + ' clicked', null, 'Icon');

            if (!!this[type]) {
                Y.log('callback found', null, 'Icon');
                this[type]._click();
            } else {
                Y.log('callback not found', 'warn', 'Icon');
            }
        },

        CLASSNAMES : {
            ICON           : 'icon',
            ICON_ACTIVE    : 'active',
            ICON_HIGHLIGHT : 'highlight'
        }

    });

    Y.namespace('Icons');
    Y.Icons.Main = Y.Base.mix(Icons, [
        Y.Icons.IconPush,
        Y.Icons.IconEditor
    ]);

}, '3.3.0', {requires:[
    'plugin',
    'node',
    'event',
    'dd-drag',
    'icon-editor',
    'icon-push'
]});
