YUI.add('template-actions-button-language', function(Y) {
    function ButtonLanguage() {
        this._initButtonLanguage();
    }

    const UL_TEMPLATE = '<ul></ul>',
          LI_TEMPLATE = '<li class="language-{value}">{value}</li>',
          VALID_LANGUAGE_REGEX = /^([a-z]{2})_([A-Z]{2})$/;

    ButtonLanguage.prototype = {
        _initButtonLanguage : function() {
            this.language.parent = this;
            this.language._init();
        },

        language : {
            _init : function() {
                this.app = this.parent.get('host');

                this._syncState();
                this._bindEvents();
            },

            toggle : function() {
                if (!this.instance.get('visible')) {
                    this.instance.show();
                } else {
                    this.instance.hide();
                }
            },

            _syncState : function() {
                this.instance = new Y.Overlay({
                    srcNode: '#addlanguage-overlay',
                    visible: false,
                    shim: false
                });
                this.instance.render();
                Y.log('rendered addlanguage overlay', null, 'LanguageAction');

                this.app.registeredOverlay.push(this.instance);
            },

            _bindEvents : function() {
                this.instance.bodyNode.delegate('click', this._itemClick, 'li', this);
                this.instance.bodyNode.on('clickoutside', this._clickOutside, this);
                this.app.gateway.listen(Biscuit.Locator.rest.services.template.addLanguage, Y.bind(function() {
                    this.app.current.language = this.languageAdded;
                    this.app.gateway.emit(Biscuit.Locator.rest.services.template.list);
                    this.app.notifier.show(this.app.notifier.TYPES.NOTICE, "Language " + this.languageAdded + " added.");
                    this.languageAdded = null;
                }, this));

                this.app.gateway.listen(Biscuit.Locator.rest.services.template.deleteLanguage, Y.bind(function() {
                    this.app.notifier.show(this.app.notifier.TYPES.NOTICE, "Language " + this.app.current.language + " removed.");
                    this.app.current.language = this.app.current.defaultLanguage;
                    this.app.gateway.emit(Biscuit.Locator.rest.services.template.list);
                }, this));

                this.app.gateway.listen(Biscuit.Locator.rest.services.template.content, Y.bind(this._buildLanguageList, this));

                // template list language select click
                this.app.nodes.templateActions.delegate('change', this.app._onTemplateLanguageClick, 'li.language > select', this.app);
                this.app.nodes.templateActions.delegate('click', this._onTemplateLanguageChange, 'li.language > span.addlanguage', this);
                this.app.nodes.templateActions.delegate('click', this._onTemplateLanguageDelete, 'li.language > span.deletelanguage', this);
            },

            _buildLanguageList : function() {
                var WidgetPositionAlign = Y.WidgetPositionAlign;
                this.instance.set('align', {node: this.app.nodes.templateActions, points: [WidgetPositionAlign.BR, WidgetPositionAlign.TR]});

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
                Y.log('built language list', null, 'LanguageAction');
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

                this.languageAdded = language;
                this.app.gateway.emit(Biscuit.Locator.rest.services.template.addLanguage, { 'params' : { 'Posix_Language__' : language }});

                this.toggle();
            },

            _click : function() {
                // do nothing
            },

            _onTemplateLanguageChange : function(e) {
                e.stopImmediatePropagation();
                this.toggle();
            },

            _onTemplateLanguageDelete : function(e) {
                e.stopImmediatePropagation();
                this.app.gateway.emit(Biscuit.Locator.rest.services.template.deleteLanguage);
            }
        }
    };

    Y.namespace('TemplateActions');
    Y.TemplateActions.ButtonLanguage = ButtonLanguage;
}, '3.3.0', {requires:[]});