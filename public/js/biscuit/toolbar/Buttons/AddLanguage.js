YUI.add('toolbar-button-addlanguage', function(Y) {
    function ButtonAddLanguage() {
        this._initButtonAddLanguage();
    }

    const UL_TEMPLATE = '<ul></ul>',
          LI_TEMPLATE = '<li class="language-{value}">{value}</li>',
          VALID_LANGUAGE_REGEX = /^([a-z]{2})_([A-Z]{2})$/;

    ButtonAddLanguage.prototype = {
        _initButtonAddLanguage : function() {
            this.addlanguage.parent = this;
            this.addlanguage._init();
        },

        addlanguage : {
            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.button.addlanguage');
                this.buttonWidth = this.button.get('offsetWidth');

                this._syncState();
                this._bindEvents();
            },

            _syncState : function() {
                this.instance = new Y.Overlay({
                    srcNode: '#addlanguage-overlay',
                    visible: false,
                    shim: false
                });
                this.instance.render();
                var WidgetPositionAlign = Y.WidgetPositionAlign;
                this.instance.set('align', {node: this.button, points: [WidgetPositionAlign.TR, WidgetPositionAlign.BL]});
                this.instance.bodyNode.setStyle('width', this.buttonWidth);
            },

            _bindEvents : function() {
                this.instance.bodyNode.delegate('click', this._itemClick, 'li', this);
                this.instance.bodyNode.on('clickoutside', this._clickOutside, this);
                this.app.gateway.listen(Biscuit.Locator.rest.services.template.addLanguage, function() {
                    this.gateway.emit(Biscuit.Locator.rest.services.template.list);
                });
            },

            _clickOutside : function(e) {
                var target = e.target;

                if (target.get('className').indexOf('addlanguage') !== -1) {
                    return;
                }

                if (!this.instance.get('visible')) {
                    return;
                }

                this.toggle();
            },

            _itemClick : function(e) {
                var item = e.currentTarget,
                    language = item.get('className').split('language-')[1];

                if (!VALID_LANGUAGE_REGEX.test(language)) {
                    Y.log('invalid language: ' + language, 'error', 'ButtonAddLanguage');
                    return;
                }

                this.app.gateway.emit(Biscuit.Locator.rest.services.template.addLanguage, { 'params' : { 'Posix_Language__' : language }});

                this.toggle();
            },

            _render : function() {
                var currentLanguages = this.app.current.languages, languageNodes = [];
                currentLanguages.forEach(function(item) {
                    if (item.Default === 'Y') {
                        return;
                    }
                    languageNodes.push(
                        Y.Node.create(Y.substitute(LI_TEMPLATE, {value: item.Posix_Language__}))
                    );
                });

                var list = Y.Node.create(UL_TEMPLATE);
                list.append(Y.all(languageNodes));
                this.instance.bodyNode.empty().append(list);
            },

            _click : function() {
                this._render();
                this.toggle();
            },

            toggle : function() {

                if (!this.instance.get('visible')) {
                    this.instance.show();
                    this.button.addClass(this.parent.CLASSNAMES.BUTTON_ACTIVE);
                    Y.log('list opened', null, 'ButtonAddLanguage');
                } else {
                    this.instance.hide();
                    this.button.removeClass(this.parent.CLASSNAMES.BUTTON_ACTIVE);
                    Y.log('list closed', null, 'ButtonAddLanguage');
                }
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonAddLanguage = ButtonAddLanguage;
}, '3.3.0', {requires:['node', 'substitute']});