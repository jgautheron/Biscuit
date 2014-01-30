YUI.add('toolbar-button-more', function(Y) {
    function ButtonMore() {
        this._initButtonMore();
    }

    var items = [
        '<ul>',
            '<li class="reindent">Reindent code</li>',
        '<ul>'
    ];

    ButtonMore.prototype = {
        _initButtonMore : function() {
            this.more.parent = this;
            this.more._init();
        },

        more : {
            instance : null,

            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.' + this.parent.CLASSNAMES.BUTTON + '.more');

                this._syncState();
                this._bindEvents();
            },

            _syncState : function() {
                this.instance = new Y.Overlay({
                    srcNode: '#more-overlay',
                    visible: false,
                    shim: false
                });
                this.instance.render();
                Y.log('rendered buttonmore overlay', null, 'ButtonMore');

                var nodes = Y.Node.create(items.join(''));
                this.instance.bodyNode.append(nodes);

                this.instance.subscribe('visibleChange', function(e) {
                    if (e.newVal) {
                        this.button.addClass(this.parent.CLASSNAMES.BUTTON_ACTIVE);
                    } else {
                        this.button.removeClass(this.parent.CLASSNAMES.BUTTON_ACTIVE);
                    }
                }, this);

                var WidgetPositionAlign = Y.WidgetPositionAlign;
                this.instance.set('align', {node: this.button, points: [WidgetPositionAlign.TR, WidgetPositionAlign.BR]});
            },

            _bindEvents : function() {
                this.instance.bodyNode.delegate('click', this._itemClick, 'li', this);
            },

            _itemClick : function(e) {
                var item = e.currentTarget;
                switch (item.get('className')) {
                    case 'reindent':
                        this.app.editor.reindent();
                        break;
                }

                this.toggle();
            },

            _click : function() {
                this.toggle();
            },

            toggle : function() {
                if (!this.instance.get('visible')) {
                    this.instance.show();
                } else {
                    this.instance.hide();
                }
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonMore = ButtonMore;
}, '3.3.0', {requires:['overlay', 'node']});