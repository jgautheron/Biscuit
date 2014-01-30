/* composed file */

YUI.add('objects-extension', function(Y) {

    var objectsExtension = {
        hasProperties : function(obj) {
            var m, has = false;
            for (m in obj){
                if (Object.prototype.hasOwnProperty.call(obj, m)) {
                    has = true;
                    break;
                 }
            }
            return has;
        },

        isYNode : function(obj) {
            return ('_node' in obj || '_nodes' in obj);
        }
    };

    Y.mix(Y, objectsExtension);
});

YUI.add('node++', function (Y) {
    // not "this" till YUI 3.3.0 scope bugfix (#2529356)
    function stripHTML(el) {
        el.innerHTML = el.textContent;
    }

    function highlight(el, str) {
        el.innerHTML = el.textContent.replace(str, '<b>' + str + '</b>');
    }

    function isVisible(el) {
        return el.style.display !== 'none';
    }

    function scrollIntoView(el, bool) {
        el.scrollIntoView(bool);
    }

    function getMetaData(el, k) {
        var data;
        el = Y.one(el);
        if (k.indexOf(':') !== -1) {
            var sp = k.split(':');
            if (data = el.getData(sp[0])) {
                return data[sp[1]];
            } else if (data = el.getAttribute('data-' + sp[1])) {
                return data;
            }
            return null;
        } else {
            data = el.getData(k);
            if (data === undefined) {
                return null;
            }
            return data;
        }
    }

    function setMetaData(el, k, v) {
        el = Y.one(el);
        el.setData(k, v);
        Y.fire('tab:datachange', el, k, v);
    }

    Y.Node.addMethod('stripHTML', stripHTML);
    Y.NodeList.importMethod(Y.Node.prototype, 'stripHTML');

    Y.Node.addMethod('highlight', highlight);
    Y.NodeList.importMethod(Y.Node.prototype, 'highlight');

    Y.Node.addMethod('isVisible', isVisible);
    Y.Node.addMethod('scrollIntoView', scrollIntoView);
    Y.Node.addMethod('getMetaData', getMetaData);
    Y.Node.addMethod('setMetaData', setMetaData);

}, '3.3.0', { requires: ['node', 'event-custom'] });

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

YUI.add('toolbar-button-rename', function(Y) {
    function ButtonRename() {
        this._initButtonRename();
    }

    ButtonRename.prototype = {
        _initButtonRename : function() {
            this.rename.parent = this;
            this.rename._init();
        },

        rename : {
            _init : function() {
                this.app = this.parent.get('host');
            },

            _click : function() {
                var tplInput, tpl;
                tpl = this.app.getTemplateById(this.app.current.template);

                if (tplInput = tpl.one('input')) {
                    this.app._validateTemplateInput(tplInput);
                } else {
                    tpl.simulate('dblclick');
                }
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonRename = ButtonRename;
}, '3.3.0', {requires:[]});

YUI.add('toolbar-button-save', function(Y) {
    function ButtonSave() {
        this._initButtonSave();
    }

    ButtonSave.prototype = {
        _initButtonSave : function() {
            this.save.parent = this;
            this.save._init();
        },

        save : {
            _init : function() {
                this.app = this.parent.get('host');
            },

            _click : function() {
                this.app.saveTemplate();
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonSave = ButtonSave;
}, '3.3.0', {requires:[]});

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

                var nodes = Y.Node.create(items.join(''));
                this.instance.bodyNode.append(nodes);

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
                    this.button.addClass(this.parent.CLASSNAMES.BUTTON_ACTIVE);
                    Y.log('list opened', null, 'ButtonMore');
                } else {
                    this.instance.hide();
                    this.button.removeClass(this.parent.CLASSNAMES.BUTTON_ACTIVE);
                    Y.log('list closed', null, 'ButtonMore');
                }
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonMore = ButtonMore;
}, '3.3.0', {requires:['overlay', 'node']});

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
        },

        show : function() {
            this.srcNode.all('.' + this.CLASSNAMES.BUTTON).show();
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
            BUTTON        : 'button',
            BUTTON_ACTIVE : 'active',
        }

    });

    Y.namespace('Toolbar');
    Y.Toolbar.Main = Y.Base.mix(Toolbar, [
        Y.Toolbar.ButtonSave,
        Y.Toolbar.ButtonMore,
        Y.Toolbar.ButtonRename,
        Y.Toolbar.ButtonAddLanguage
    ]);

}, '3.3.0', {requires:[
    'plugin',
    'node',
    'event',
    'toolbar-button-save',
    'toolbar-button-more',
    'toolbar-button-rename',
    'toolbar-button-addlanguage'
]});

YUI.add('template-actions-button-add', function(Y) {
    function ButtonAdd() {
        this._initButtonAdd();
    }

    ButtonAdd.prototype = {
        _initButtonAdd : function() {
            this.add.parent = this;
            this.add._init();
        },

        add : {
            _init : function() {
                this.app = this.parent.get('host');
            },

            _click : function() {
                console.log('click');
            }
        }
    };

    Y.namespace('TemplateActions');
    Y.TemplateActions.ButtonAdd = ButtonAdd;
}, '3.3.0', {requires:[]});

YUI.add('template-actions-button-del', function(Y) {
    function ButtonDel() {
        this._initButtonDel();
    }

    ButtonDel.prototype = {
        _initButtonDel : function() {
            this.del.parent = this;
            this.del._init();
        },

        del : {
            _init : function() {
                this.app = this.parent.get('host');
            },

            _click : function() {
                console.log('click');
            }
        }
    };

    Y.namespace('TemplateActions');
    Y.TemplateActions.ButtonDel = ButtonDel;
}, '3.3.0', {requires:[]});

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
        Y.TemplateActions.ButtonDel
        //Y.TemplateActions.ButtonProperties,
        //Y.TemplateActions.ButtonSwitchLanguage
    ]);

}, '3.3.0', {requires:[
    'plugin',
    'node',
    'event',
    'template-actions-button-add',
    'template-actions-button-del',
    'template-actions-button-properties',
    'template-actions-button-switchlanguage'
]});

YUI.add('top-nav-plugin', function(Y) {
    TopNavigation.NAME = 'top-nav-plugin';
    TopNavigation.NS   = 'topNav';

    TopNavigation.ATTRS = {
        srcNode : {
            value : null,
            writeOnce : true
        }
    };

    const TAB_TEMPLATE         = '<li><h3>Click here to start</h3><h4>&nbsp;</h4><span class="close"></span></li>',
          SERVER_NAME_TEMPLATE = '{name} ({id})',
          MIDDLE_MOUSE = 2; // CONFIG: MIDDLE MOUSE

    function TopNavigation(config) {
        TopNavigation.superclass.constructor.apply(this, arguments);
    }

    Y.extend(TopNavigation, Y.Plugin.Base, {

        currentTab : null,

        initializer : function(cfg) {
            this.srcNode = Y.one(cfg.srcNode);
            this.app = this.get('host');

            this._bindEvents();

            Y.log('initialized', null, 'TopNavigation');
        },

        destructor : function() {
            Y.detach('topNavigation|*');
            Y.detach('topNavigationOverlay|*');
        },

        getCurrentTab : function() {
            return this.currentTab;
        },

        setServer : function(id, name) {
            this.currentTab.setMetaData('server', { id : id, name : name });
        },

        setPage : function(id, name) {
            this.currentTab.setMetaData('page', { id : id, name : name });
        },

        openTab : function(el) {
            var serverId = el.getMetaData('server:id'),
                pageId   = el.getMetaData('page:id'),
                tplId    = el.getMetaData('tpl');

            this.listOverlay.hide();

            this.app.current.server = serverId;
            this.app.current.page = pageId;
            this.app.current.template = tplId;
            this.currentTab = el;

            // actives visually the current tab by adding a class
            this.srcNode.all('li').removeClass(this.CLASSNAMES.TAB_ACTIVE);
            el.addClass(this.CLASSNAMES.TAB_ACTIVE);

            // if the tab is a new one:
            // - show the server overlay on first click
            // - empty the template list
            // - empty the editor
            if (!serverId) {
                this.listOverlay.show(el, 'server');
                this.app.resetLayout();
                return;
            }

            // retrieves server languages
            this.app._setServerLanguages(serverId);

            // if a page is defined, load the page list & the template list for the current page
            if (this.app.current.page) {
                this.app.gateway.emit(Biscuit.Locator.rest.services.page.list, { 'params' : { 'Server__' : serverId }});
                this.app.gateway.emit(Biscuit.Locator.rest.services.template.list, { 'params' : { 'Server__' : serverId, 'Page__' : pageId }});
            }
        },

        newTab : function(active, serverName, serverId, page, tpl) {
            active     = active || false;
            serverName = serverName || null;
            serverId   = serverId || null;
            page       = page || null;
            tpl        = tpl || null;

            var tab = Y.Node.create(TAB_TEMPLATE);
            tab.set('id', Y.guid());

            if (serverName !== null) {
                tab.setMetaData('server', { id : serverId, name : serverName });
            }
            if (page !== null) {
                tab.setMetaData('page', { id : page, name : page });
            }
            if (tpl !== null) {
                tab.setMetaData('tpl', tpl);
            }

            this.srcNode.one('ul').append(tab);

            if (active) {
                this.openTab(tab);
            }

            return tab;
        },

        closeTab : function(tab) {
            // hide list overlay if visible
            this.listOverlay.hide();
            var list = tab.ancestor('ul').get('children');

            // minimum 1 tab
            if (list.size() > 1) {
                this.app.resetLayout();
                tab.remove();
                Y.log('closed tab', null, 'TopNavigation');
            }

        },

        _setMetaData : function(el, k, v) {
            var id = v['id'], name = v['name'];
            switch (k) {
                case 'server':
                    // updates text & metadata
                    el.one('h3').set('text', Y.substitute(SERVER_NAME_TEMPLATE, {id: id, name: name}));
                    el.one('h4').set('innerHTML', '&nbsp;');
                    el.setAttribute('data-server', id);
                    this.app.current.server = id;
                    break;
                case 'page':
                    // updates text & metadata
                    el.one('h4').set('text', name);
                    this.app.current.page = name;
                    break;
            }
        },

        _saveTabState : function() {
            this._addTabState(this.currentTab);
        },

        _getTabState : function(tabs, id) {
            var tab = false;
            if (id in tabs) {
                return tabs[id];
            }
            return tab;
        },

        _addTabState : function(tab) {
            var localStore = this.app.localStore,
                currentTabs = localStore.get(localStore.definitions.CURRENT_TABS),
                tabId = tab.get('id');

            // provide id if none
            if (!tabId) {
                tabId = tab._node.id = Y.guid();
            }

            var ctab = this._getTabState(currentTabs, tabId);
            if (ctab !== false) {
                this._removeTabState(tabId);
            }

            var o = {
                id       : tabId,
                server   : tab.getMetaData('server:id'),
                page     : tab.getMetaData('page:id'),
                template : tab.getMetaData('tpl'),
                active   : tab.hasClass(this.CLASSNAMES.TAB_ACTIVE)
            };

            currentTabs[tabId] = o;
            localStore.set(localStore.definitions.CURRENT_TABS, currentTabs);
        },

        _removeTabState : function(id) {
            var localStore = this.app.localStore,
                currentTabs = localStore.get(localStore.definitions.CURRENT_TABS);

            if (id in currentTabs) {
                delete currentTabs[id];
            }

            localStore.set(localStore.definitions.CURRENT_TABS, currentTabs);
        },

        _clearTabState : function() {
            var localStore = this.app.localStore;
            localStore.set(localStore.definitions.CURRENT_TABS, {});
        },

        _saveNavState : function(e) {
            this._clearTabState();

            this.srcNode.all('li').each(Y.bind(function(tab) {
                if (tab.getMetaData('server:id')) {
                    this._addTabState(tab);
                }
            }, this));
        },

        _syncState : function() {

        },

        _bindEvents : function() {
            this.srcNode.delegate('click', this._onTabClick, 'li:not(.' + this.CLASSNAMES.TAB_ACTIVE + ')', this);
            this.srcNode.delegate('click', this._onCloseClick, 'li .close', this);
            this.srcNode.delegate('click', this._onServerClick, 'li.' + this.CLASSNAMES.TAB_ACTIVE + ' h3', this);
            this.srcNode.delegate('click', this._onPageClick, 'li.' + this.CLASSNAMES.TAB_ACTIVE + ' h4', this);

            this.srcNode.one('.new').on('click', this._onNewClick, this);
            this.srcNode.one('ul').on('dblclick', this._onNavDblClick, this);
            this.srcNode.one('ul').on('mouseup', this._onNavMiddleClick, this);

            Y.on('tab:datachange', Y.bind(this._setMetaData, this));
            Y.on('beforeunload', Y.bind(this._saveNavState, this));
        },

        _onNavMiddleClick : function(e) {
            if (e.which !== MIDDLE_MOUSE) {
                return;
            }

            // disallow the possibility to close by middle click when the tab is active
            // the user has to properly click on the close cross icon
            var tab = e.target.ancestor('li:not(.' + this.CLASSNAMES.TAB_ACTIVE + ')');
            if (!tab) {
                return;
            }

            this.closeTab(tab);
        },

        _onNavDblClick : function(e) {
            var expectedNode = e.currentTarget,
                node = e.target;
            if (node !== expectedNode) {
                return;
            }
            this.newTab(true);
        },

        _onNewClick : function(e) {
            e.stopImmediatePropagation();
            this.newTab(true);
        },

        _onTabClick : function(e) {
            var el = e.currentTarget;

            // stops propagation to not trigger server/page events
            e.stopImmediatePropagation();

            this.openTab(el);
        },

        _onCloseClick : function(e) {
            var el = e.currentTarget.ancestor('li');
            this.closeTab(el);
        },

        _onServerClick : function(e) {
            var tabNode = e.currentTarget.ancestor('li');

            // if page list, then instead of toggle show server list
            if (this.listOverlay.current.type === 'page') {
                this.listOverlay.show(tabNode, 'server');
                return;
            }

            this.listOverlay.toggle(tabNode, 'server');
        },

        _onPageClick : function(e) {
            if (e.currentTarget.get('text').trim() === '') {
                return;
            }
            var tabNode = e.currentTarget.ancestor('li');

            // if server list, then instead of toggle show page list
            if (this.listOverlay.current.type === 'server') {
                this.listOverlay.show(tabNode, 'page');
                return;
            }

            this.listOverlay.toggle(tabNode, 'page');
        },

        CLASSNAMES : {
            TAB_ACTIVE : 'active',
        }

    });

    Y.TopNavigation = Y.Base.mix(TopNavigation, [Y.TopNavigationListOverlay, Y.TopNavigationListOverlaySearch]);
}, '3.3.0', {requires:['plugin', 'node', 'overlay', 'substitute', 'top-nav-overlay', 'top-nav-overlay-search']});

YUI.add('top-nav-overlay-search', function(Y) {
    // TODO: SPLIT METHODS (_onSearchInput)

    const KEY_ENTER = 13, // CONFIG: KEYS
          KEY_UP    = 38,
          KEY_DOWN  = 40,
          KEY_LEFT  = 37,
          KEY_RIGHT = 39,
          KEY_BACKSPACE = 8,
          PAGE_REGEX = /^([\w\d]{2,})\.([\w+]{3,})$/;

    function TopNavigationListOverlaySearch() {
        this._initListOverlaySearch();
    }

    TopNavigationListOverlaySearch.prototype = {
        _initListOverlaySearch : function() {
            this.search.parent = this;
            this.search._init();
        },

        search : {

            nodes : {},

            _init : function() {
                // defines the default state of the search input
                this._syncState();

                // binds search events
                this._bindEvents();
            },

            _bindEvents : function() {
                // keys navigation
                this.nodes.searchField.on(
                    'key',
                    this._onNavigationKeys,
                    'up:' + [KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_ENTER, KEY_BACKSPACE].join(','),
                    this
                );

                // text
                this.nodes.searchField.on('topNavigationOverlay|keyup', this._onSearchInput, this);
            },

            _syncState : function() {
                this.listOverlay = this.parent.listOverlay;

                this.CLASSNAMES = this.listOverlay.CLASSNAMES;
                this.VARS = this.listOverlay.VARS;

                this.current = this.listOverlay.current;
                this.instance = this.listOverlay.instance;

                this.nodes = {
                    searchField : this.instance.footerNode.one('.search input'),
                };
            },

            _onNavigationKeys : function(e) {
                var input = e.currentTarget,
                    value = input.get('value').trim();

                switch (e.keyCode) {

                    case KEY_UP:
                        var previous = Y.one('.' + this.CLASSNAMES.SELECTED_ITEM),
                            nodes = this.current['nodes'];

                        var tmp;
                        if (tmp = this.listOverlay._getSearchResults()) {
                            nodes = tmp;
                        }
                        if (previous) {
                            // already selected before
                            if (!previous.isVisible()) {
                                previous.removeClass(this.CLASSNAMES.SELECTED_ITEM);
                                current = nodes.item(0);
                            } else {
                                current = previous.previous();
                                if (!current) {
                                    return;
                                }
                                if (!current.isVisible()) {
                                    return;
                                }
                                previous.removeClass(this.CLASSNAMES.SELECTED_ITEM);
                            }
                        } else {
                            current = nodes.item(0);
                        }
                        if (current) {
                            current.addClass(this.CLASSNAMES.SELECTED_ITEM);
                        }
                        return;

                    case KEY_DOWN:
                        var previous = Y.one('.' + this.CLASSNAMES.SELECTED_ITEM),
                            nodes = this.current['nodes'];

                        var tmp;
                        if (tmp = this.listOverlay._getSearchResults()) {
                            nodes = tmp;
                        }


                        if (previous) {
                            // already selected before
                            if (
                                !previous.isVisible() ||
                                !this.current['nodes'].get('parentNode').item(0).contains(previous)
                            ) {
                                previous.removeClass(this.CLASSNAMES.SELECTED_ITEM);
                                current = nodes.item(0);
                            } else {
                                current = previous.next();
                                if (!current) {
                                    return;
                                }
                                if (!current.isVisible()) {
                                    return;
                                }
                                previous.removeClass(this.CLASSNAMES.SELECTED_ITEM);
                            }
                        } else {
                            current = nodes.item(0);
                        }
                        if (current) {
                            current.addClass(this.CLASSNAMES.SELECTED_ITEM);
                        }
                        return;

                    case KEY_LEFT:
                        var previous = Y.one('.' + this.CLASSNAMES.SELECTED_ITEM), current, i = 12,
                            nodes = this.current['nodes'];

                        if (!previous) {
                            previous = nodes.item(0);
                        }
                        current = previous.previous(function(el) {
                            if (i === 1) { // rows count per column
                                if (el.isVisible()) {
                                    return el;
                                }
                            }
                            i--;
                        });
                        if (current) {
                            previous.removeClass(this.CLASSNAMES.SELECTED_ITEM);
                            current.addClass(this.CLASSNAMES.SELECTED_ITEM);
                            current.scrollIntoView();
                        }
                        return;

                    case KEY_RIGHT:
                        var previous = Y.one('.' + this.CLASSNAMES.SELECTED_ITEM), current, i = 1,
                            nodes = this.current['nodes'];

                        if (!previous) {
                            previous = nodes.item(0);
                        }
                        current = previous.next(function(el) {
                            // CONFIG: rows count per column
                            if (i === 12) {
                                if (el.isVisible()) {
                                    return el;
                                }
                            }
                            i++;
                        });
                        if (current) {
                            previous.removeClass(this.CLASSNAMES.SELECTED_ITEM);
                            current.addClass(this.CLASSNAMES.SELECTED_ITEM);
                            current.scrollIntoView();
                        }
                        return;

                    case KEY_ENTER:
                        if (value === '') {
                            return;
                        }

                        var node = null, id, name;
                        if (selected = Y.one('.' + this.CLASSNAMES.SELECTED_ITEM)) {
                            node = selected;
                        }
                        if (this.current['count'] === 1) {
                            node = this.current['searchresults'].item(0);
                        }
                        if (node === null) {
                            return;
                        }
                        id   = node.getAttribute('data-id');
                        name = node.getAttribute('data-text');

                        switch (this.current['type']) {
                            case this.VARS.SERVER_LIST:
                                this.listOverlay._setServer(id, name);
                                break;
                            case this.VARS.PAGE_LIST:
                                this.listOverlay._setPage(id, name);
                                break;
                        }
                        Y.log('enter key event detected & processed', null, 'TopNavigationListOverlaySearch');
                        return;

                    case KEY_BACKSPACE:
                        if (value !== '' || this.current['type'] !== this.VARS.PAGE_LIST) {
                            return;
                        }
                        Y.one('.' + this.VARS.SERVER_LIST).simulate('click');
                        Y.log('backspace key event detected & processed', null, 'TopNavigationListOverlaySearch');
                        return;
                }
            },

            _onSearchInput : function(e) {
                var input = e.currentTarget,
                    value = input.get('value').trim();

                if (this.current['type'] === this.VARS.SERVER_LIST) {
                    value = value.toUpperCase();
                }

                if (this.listOverlay._getSearchResults()) {
                    this.current['searchresults'].show();
                }
                // strip html from nodes (bold)
                this.current['nodes'].stripHTML();
                // display all nodes by default
                this.current['nodes'].show();

                // remove no-results classname by default
                this.nodes.searchField.removeClass(this.CLASSNAMES.SEARCH_INPUT_NO_RESULTS);

                if (value === '') {
                    Y.log('empty search query', null, 'TopNavigationListOverlaySearch');
                    return false;
                }
                if (!Y.isYNode(this.current['nodes']) || this.current['nodes'].size() <= 0) {
                    Y.log('could not find any list node', 'warn', 'TopNavigationListOverlaySearch');
                    return false;
                }

                // CONFIG: list overlay search input min char length
                if (value.length >= 3) {
                    Y.log('filtering list for query: ' + value, null, 'TopNavigationListOverlaySearch');
                    var nodeList = this.instance.bodyNode.all('.' + this.current['type'] + '-list > li:not([data-text*="' + value + '"])');
                    nodeList.hide();

                    // stats
                    this.current['count'] = this.current['nodes'].size() - nodeList.size();
                    this.current['searchresults'] = this.instance.bodyNode.all('.' + this.current['type'] + '-list > li[data-text*="' + value + '"]');

                    // highlight search string
                    this.current['searchresults'].highlight(value);

                    if (this.current['count'] === 0) {
                        Y.log('could not find any server for query: ' + value, null, 'TopNavigationListOverlaySearch');
                        this.nodes.searchField.addClass(this.CLASSNAMES.SEARCH_INPUT_NO_RESULTS);
                        // TODO: tooltip do you want to create this page?
                    }
                }
            },
        }
    }

    Y.TopNavigationListOverlaySearch = TopNavigationListOverlaySearch;
}, '3.3.0', {requires:['node++', 'event-key', 'node-event-simulate']});

YUI.add('top-nav-overlay', function(Y) {
    const LIST_TEMPLATE = '<li data-id="{id}" data-text="{textlc}">{text}</li>',
          RECENT_TEMPLATE = '<li data-id="{id}">{text}</li>';

    function TopNavigationListOverlay() {
        this._initListOverlay();
    }

    TopNavigationListOverlay.prototype = {
        _initListOverlay : function() {
            this.listOverlay.parent = this;
            this.listOverlay._init();
        },

        listOverlay : {
            instance : null,

            nodes : {},

            current : {
                'nodes' : {},
                'type'  : null,
                'count' : 0,
                'searchresults' : {}
            },

            _init : function() {
                this.app = this.parent.get('host');
                this._render();
            },

            isVisible : function() {
                return !!this.instance.get('visible');
            },

            toggle : function(tabNode, type) {
                if (!this.isVisible()) {
                    this.show(tabNode, type);
                } else {
                    this.hide();
                }
            },

            show : function(tabNode, type) {
                switch (type) {
                    case this.VARS.SERVER_LIST:
                        this.showServerList();
                        break;
                    case this.VARS.PAGE_LIST:
                        this.showPageList();
                        break;
                }

                tabNode.addClass(this.CLASSNAMES.SELECTION);

                var WidgetPositionAlign = Y.WidgetPositionAlign,
                    points = [WidgetPositionAlign.TL, WidgetPositionAlign.BL];
                if ((this.vars.serverOverlayWidth + tabNode.getX()) > this.vars.viewportWidth) {
                    points = [WidgetPositionAlign.RL, WidgetPositionAlign.RL];
                }
                this.instance.set('align', {node: tabNode, points: points});
                this.instance.show();
                Y.log('list opened', null, 'TopNavigationListOverlay');

                this.nodes.searchField.focus();
            },

            hide : function() {
                if (!this.isVisible()) {
                    return;
                }
                this.instance.hide();
                var node = this.parent.srcNode.one('li.' + this.CLASSNAMES.SELECTION);
                if (node) {
                    node.removeClass(this.CLASSNAMES.SELECTION);
                }
                Y.log('list closed', null, 'TopNavigationListOverlay');
            },

            _render : function() {
                this.instance = new Y.Overlay({
                    srcNode: '#server-overlay',
                    visible: false,
                    shim: false
                });
                this.instance.render();
                Y.log('rendered server list overlay', null, 'TopNavigationListOverlay');

                // defines the default state of the overlay
                this._syncState();

                // bind overlay events
                this._bindEvents();
            },

            _bindEvents : function() {
                var nodes = this.nodes;

                // populate list
                this.app.on('datastore:ready', Y.bind(this._populateServerList, this));

                // page list from server event
                this.app.gateway.listen(Biscuit.Locator.rest.services.page.list, Y.bind(this._populatePageList, this));

                // close icon
                this.instance.headerNode.one('.close').on('topNavigationOverlay|click', Y.bind(this.hide, this));

                // recent items
                this.instance.footerNode.one('.recent .content').delegate('click', Y.bind(this._onRecentItemClick, this), 'li');

                // server breadcrumb
                nodes.serverBc.on('topNavigationOverlay|click', this.showServerList, this);

                // server list item click
                nodes.serverListContainer.delegate('click', Y.bind(this._onServerItemClick, this), 'li');

                // page list item click
                nodes.pageListContainer.delegate('click', Y.bind(this._onPageItemClick, this), 'li');

                // overlay click outside
                this.nodes.serverOverlay.on('topNavigationOverlay|clickoutside',  Y.bind(this._clickOutside, this));
            },

            _syncState : function() {
                // cache often called nodes
                this.nodes = {
                    serverOverlay           : Y.one('#server-overlay'),
                    serverListContainer     : this.instance.bodyNode.one('.server-list'),
                    pageListContainer       : this.instance.bodyNode.one('.page-list'),
                    headerBc                : this.instance.headerNode.one('h6'),
                    serverBc                : this.instance.headerNode.one('h6 .server'),
                    pageBc                  : this.instance.headerNode.one('h6 .page'),
                    searchField             : this.instance.footerNode.one('.search input'),
                    recentContainer         : this.instance.footerNode.one('.recent'),
                    recentContent           : this.instance.footerNode.one('.recent .content')
                };

                this.vars = {
                    serverOverlayWidth : parseInt(this.nodes.serverOverlay.getStyle('width')),
                    viewportWidth      : this.nodes.serverOverlay.get('winWidth')
                };

                // hide page list for now
                this.nodes.pageListContainer.hide();

                // hide breadcrumb
                this.nodes.pageBc.hide();
            },

            _clickOutside : function(e) {
                if (!this.isVisible()) {
                    return;
                }

                var tab = e.target.ancestor('li.active');
                if (tab) {
                    return;
                }

                this.hide();
            },

            _getSearchResults : function() {
                if (Y.isYNode(this.current['searchresults'])) {
                    return this.current['searchresults'];
                }
                return false;
            },

            _cleanListNodes : function() {
                if (!!this.current['nodes'] && Y.isYNode(this.current['nodes'])) {
                    this.current['nodes'].stripHTML();
                    this.current['nodes'].removeClass(this.CLASSNAMES.SELECTED_ITEM);
                }
            },

            _populateServerList : function() {
                var html = [], i, node, servers = this.app.dataStore.data.server.list,
                    serverList = this.nodes.serverListContainer;

                for (i = 0; node = servers[i++];) {
                    html.push(
                        Y.Node.create(Y.substitute(LIST_TEMPLATE, {id: node['Server__'], text: node['Name'], textlc: node['Name']}))
                    );
                }
                serverList.get('children').remove();
                this.nodes.serverList = Y.all(html)
                serverList.append(this.nodes.serverList);

                this.showServerList();

                Y.log('populated server list', null, 'TopNavigationListOverlay');
            },

            _populatePageList : function(e, event, data, error) {
                switch (error) {
                    case 'NO_DATA':
                        alert('no pages for this server tooltip');
                        return;
                }

                var html = [], i, node, pages = data,
                    pageList = this.nodes.pageListContainer;

                for (i = 0; node = pages[i++];) {
                    html.push(
                        Y.Node.create(Y.substitute(LIST_TEMPLATE, {id: node['Page__'], text: node['Page__'], textlc: node['Page__']}))
                    );
                }
                pageList.get('children').remove();
                this.nodes.pageList = Y.all(html);
                pageList.append(this.nodes.pageList);

                this.showPageList();

                Y.log('populated page list', null, 'TopNavigationListOverlay');
            },

            _updateRecent : function(type) {
                var data = [];
                switch (type) {
                    case this.VARS.SERVER_LIST:
                        data = this.getRecentServers();
                        break;
                    case this.VARS.PAGE_LIST:
                        data = this.getRecentPages();
                        break;
                }

                var container = this.nodes.recentContainer;

                if (data && data.length > 0) { // if any
                    var content = this.nodes.recentContent, html = [];
                    container.show();
                    data.forEach(function(val) {
                        html.push(
                            Y.Node.create(Y.substitute(RECENT_TEMPLATE, {id: val['id'], text: val['name'], textlc: val['name']}))
                        );
                    });
                    this.nodes.recentContainer.one('h6').set('text', 'Recent:');
                    content.empty();
                    content.append(Y.all(html));
                } else { // if none
                    container.hide();
                }
            },

            _showActions : function(type) {
                var content = this.nodes.recentContent, html = [];
                switch (type) {
                    case this.VARS.SERVER_LIST:
                        break;
                    case this.VARS.PAGE_LIST:
                        // TODO: put actions somewhere else
                        var actions = [
                            {
                                id   : 'create-new-page',
                                text : 'Create new page'
                            },
                            {
                                id   : 'rename-page',
                                text : 'Rename page'
                            }
                        ];

                        actions.forEach(Y.bind(function(val) {
                            // __common can't be renamed
                            if (this.app.current.page === '__common' && val['id'] === 'rename-page') {
                                return;
                            }

                            html.push(
                                Y.Node.create(Y.substitute(RECENT_TEMPLATE, {id: val['id'], text: val['text'], textlc: val['text']}))
                            );
                        }, this));

                        this.nodes.recentContainer.one('h6').set('text', 'Actions:');
                        content.empty();
                        content.append(Y.all(html));
                        break;
                }
            },

            _onServerItemClick : function(e) {
                var el = e.currentTarget,
                    serverId = el.getAttribute('data-id'),
                    serverName = el.get('textContent');

                this._setServer(serverId, serverName);
            },

            _onPageItemClick : function(e) {
                var el = e.currentTarget,
                    pageId = el.getAttribute('data-id'),
                    pageName = el.get('textContent');

                this._setPage(pageId, pageName);
            },

            _onRecentItemClick : function(e) {
                var el = e.currentTarget,
                    container = this.nodes.recentContainer;
                if (container.hasClass(this.VARS.SERVER_LIST)) {
                    this._onServerItemClick.call(this, e);
                } else if (container.hasClass(this.VARS.PAGE_LIST)) {
                    //this._onPageItemClick.call(this, e);
                    switch (el.getAttribute('data-id')) {
                        case 'create-new-page':
                            var value = this.nodes.searchField.get('value');
                            this.app.newPage(value);
                            break;
                        case 'rename-page':
                            var value = this.nodes.searchField.get('value');
                    }
                }
            },

            _inStore : function(store, name) {
                if (typeof store === 'undefined' || store.length === 0) {
                    return;
                }
                var inStore = false;
                store.forEach(function(o) {
                    if (o['id'] === name) {
                        inStore = true;
                    }
                });
                return inStore;
            },

            _storeServer : function(id, name) {
                var localStore = this.app.localStore,
                    servers = localStore.get(localStore.definitions.RECENT_SERVERS);

                if (this._inStore(servers, id)) {
                    return;
                }

                // config: maximum 5
                if (servers.length === 5) {
                    servers.pop();
                }
                servers.unshift({id : id, name : name});
                localStore.set(localStore.definitions.RECENT_SERVERS, servers);
            },

            _setServer : function(id, name) {
                Y.log('picked server: ' + name, null, 'TopNavigationListOverlay');

                // changes tab server id & text
                this.parent.setServer(id, name);

                // stores locally the server name
                this._storeServer(id, name);

                // ask server for page list
                this.app.gateway.emit(Biscuit.Locator.rest.services.page.list, { 'params' : { 'Server__' : id }});
            },

            _setPage : function(id, name) {
                Y.log('picked page: ' + id, null, 'TopNavigationListOverlay');

                // changes page
                this.parent.setPage(id, name);

                // reset template
                this.app.current.template = 'main';

                // ask server for template list
                this.app.gateway.emit(Biscuit.Locator.rest.services.template.list, { 'params' : { 'Server__' : this.app.current.server, 'Page__' : id }});

                this.hide();
            },

            _setCurrentList : function(type) {
                var nodes = this.nodes;

                switch (type) {
                    case this.VARS.SERVER_LIST:
                        nodes.recentContainer.replaceClass(this.CLASSNAMES.RECENT_PAGE, this.CLASSNAMES.RECENT_SERVER);
                        this._updateRecent(this.VARS.SERVER_LIST);
                        this.current['nodes'] = this.nodes.serverList;
                        this._cleanListNodes();
                        break;
                    case this.VARS.PAGE_LIST:
                        nodes.recentContainer.replaceClass(this.CLASSNAMES.RECENT_SERVER, this.CLASSNAMES.RECENT_PAGE);
                        //this._updateRecent(this.VARS.PAGE_LIST);
                        this._showActions(this.VARS.PAGE_LIST);
                        this.current['nodes'] = this.nodes.pageList;
                        this._cleanListNodes();
                        break;
                }

                this.current['type'] = type;

                if (!!this.current['nodes']) {
                    this.current['nodes'].show();
                }

                this.nodes.searchField.removeClass(this.CLASSNAMES.SEARCH_INPUT_NO_RESULTS);
                this.nodes.searchField.set('value', '');
            },

            getRecentServers : function() {
                var localStore = this.app.localStore;
                return localStore.get(localStore.definitions.RECENT_SERVERS);
            },

            getRecentPages : function() {
                var localStore = this.app.localStore;
                return localStore.get(localStore.definitions.RECENT_PAGES);
            },

            showServerList : function() {
                var nodes = this.nodes;
                this._setCurrentList(this.VARS.SERVER_LIST);

                // if already active, do nothing
                if (nodes.serverBc.hasClass(this.CLASSNAMES.BREADCRUMB_ACTIVE)) {
                    return;
                }

                nodes.pageListContainer.hide();
                nodes.serverBc.addClass(this.CLASSNAMES.BREADCRUMB_ACTIVE);
                nodes.pageBc.removeClass(this.CLASSNAMES.BREADCRUMB_ACTIVE).hide();
                nodes.serverListContainer.show();

                this.nodes.searchField.focus();

                Y.log('displayed server list', null, 'TopNavigationListOverlay');
            },

            showPageList : function() {
                var nodes = this.nodes;
                this._setCurrentList(this.VARS.PAGE_LIST);

                // if already active, do nothing
                if (nodes.pageBc.hasClass(this.CLASSNAMES.BREADCRUMB_ACTIVE)) {
                    return;
                }

                nodes.serverListContainer.hide();
                nodes.serverBc.removeClass(this.CLASSNAMES.BREADCRUMB_ACTIVE);
                nodes.pageListContainer.show();
                nodes.pageBc.addClass(this.CLASSNAMES.BREADCRUMB_ACTIVE).show();

                nodes.searchField.focus();

                Y.log('displayed page list', null, 'TopNavigationListOverlay');
            },

            CLASSNAMES : {
                SELECTION : 'selection',
                BREADCRUMB_ACTIVE : 'active',
                RECENT_SERVER : 'server',
                RECENT_PAGE : 'page',
                SEARCH_INPUT_NO_RESULTS : 'no-results',
                SELECTED_ITEM : 'selected'
            },

            VARS : {
                SERVER_LIST : 'server',
                PAGE_LIST   : 'page'
            }

        }
    };

    Y.TopNavigationListOverlay = TopNavigationListOverlay;
}, '3.3.0', {requires:['event-custom', 'event-key', 'substitute', 'overlay', 'node++']});

YUI.add('localstore-ext', function(Y) {
    function LocalStore() {
        this._initLocalStore();
    }

    LocalStore.prototype = {
        _initLocalStore : function() {
            this.localStore.parent = this;
            this.localStore._init();
        },

        localStore : {
            definitions : {
                RECENT_SERVERS : {
                    'key'   : 'recent_servers',
                    'value' : []
                },
                RECENT_PAGES : {
                    'key'   : 'recent_pages',
                    'value' : []
                },
                CURRENT_TABS : {
                    'key'   : 'current_tabs',
                    'value' : {}
                }
            },

            _init : function() {
                this.app = this.parent.get('host');
                this._setup();
            },

            _setup : function() {
                for (var i in this.definitions) {
                    var definition = this.definitions[i];
                    if (!localStorage[definition['key']]) {
                        localStorage[definition['key']] = JSON.stringify(definition['value']);
                    }
                }
            },

            clear : function() {
                localStorage.clear();
            },

            set : function(key, value) {
                key = key['key'];
                localStorage[key] = JSON.stringify(value);
            },

            get : function(key) {
                key = key['key'];
                try {
                    return JSON.parse(localStorage[key]);
                } catch (e) {
                    return key['value'];
                }
            }
        }
    };

    Y.LocalStore = LocalStore;
}, '3.3.0', {requires:[]});

YUI.add('datastore-ext', function(Y) {
    function DataStore() {
        this._initDataStore();
    }

    DataStore.prototype = {

        _initDataStore : function() {
            this.dataStore.parent = this;
            this.dataStore._init();
        },

        dataStore : {
            data : {},

            _init : function() {
                this.parent.publish('datastore:ready', { preventable: false, broadcast: 1 });

                this.parent.on('socket:connected', function(e) {
                    // preload server list
                    this.gateway.emit(Biscuit.Locator.rest.services.server.list);
                });

                this.parent.gateway.listen(Biscuit.Locator.rest.services.server.list, function(e, event, data) {
                    this.dataStore.data.server = { list : data };
                    Y.log('fetched server list', null, 'DataStore');
                    this.fire('datastore:ready');
                });
            }
        }
    };

    Y.DataStore = DataStore;
}, '3.3.0', {requires:['event-custom']});

YUI.add('gateway-ext', function(Y) {
    function Gateway() {
        this._initGateway();
    }

    const SERVER_EVENT_PREFIX = 'server:';

    Gateway.prototype = {

        _initGateway : function() {
            this.gateway.parent = this;
            this.gateway._init();
        },

        gateway : {
            connectInterval : null,

            socket : null,

            _init : function() {
                this.parent.publish('socket:connected', { preventable: false, broadcast: 1 });
                this.parent.publish('socket:disconnected', { preventable: false, broadcast: 1 });
                this._setupServerConnection();
            },

            getGateway : function() {
                return this.socket;
            },

            emit : function(event, data) {
                data = data || {};
                if (!!event.params) {
                    if (!data.hasOwnProperty('params')) {
                        data['params'] = {};
                    }
                    data.params = this._fillParams(event.params, data.params);
                }
                var request = {
                    'event' : event.name,
                    'data'  : data,
                    'user'  : Biscuit.User
                };
                this.socket.send(JSON.stringify(request));
            },

            listen : function(event, fn) {
                this.parent.on(SERVER_EVENT_PREFIX + event.name, fn);
            },

            _fillParams : function(locatorParams, givenParams) {
                locatorParams.forEach(Y.bind(function(a) {
                    if (!givenParams.hasOwnProperty(a)) {
                        switch (a) {
                            case 'Server__':
                                givenParams[a] = this.parent.current.server;
                                return;
                            case 'Page__':
                                givenParams[a] = this.parent.current.page;
                                return;
                            case 'Template__':
                                givenParams[a] = this.parent.current.template;
                                return;
                            case 'Posix_Language__':
                                givenParams[a] = this.parent.current.language;
                                return;
                            default:
                                Y.log('missing arg: ' + a, 'error', 'Gateway');
                                throw new Error('Missing arg: ' + a);
                        }
                    }
                }, this));
                return givenParams;
            },

            _setupServerConnection : function() {
                this.socket = new io.Socket();
                this.socket.connect();
                this.socket.on('connect', Y.bind(function() {
                    this.fire('socket:connected');
                    Y.log('established connection with server', null, 'Gateway');
                }, this.parent));
                this.socket.on('message', Y.bind(function(data) {
                    data = JSON.parse(data);
                    var event = data['event'],
                        error = data['error'] || null,
                        data = data['data'];

                    Y.log('received event: ' + event, null, 'Gateway');

                    if (error !== null) {
                        Y.log('got error: ' + error, 'warn', 'Gateway');
                    }

                    // throws dynamically a custom event
                    this.publish('server:' + event, { preventable: false, broadcast: 1 });
                    this.fire(SERVER_EVENT_PREFIX + event, event, data, error);
                }, this.parent));
                this.socket.on('disconnect', Y.bind(function() {
                    this.fire('socket:disconnected');
                    Y.log('lost connection with server', 'warn', 'Gateway');
                    this.gateway._connectInterval();
                }, this.parent));
            },

            _connectInterval : function() {
                var _connect = function() {
                    if (this.socket.connected) {
                        clearInterval(this.connectInterval);
                        return;
                    }
                    Y.log('trying to reconnect with server', 'warn', 'Gateway');
                    this.socket.connect();
                };
                this.connectInterval = window.setInterval(Y.bind(_connect, this), 2000);
            }
        }
    };

    Y.Gateway = Gateway;
}, '3.3.0', {requires:['event-custom']});

YUI.add('biscuit', function(Y) {

    const LIST_TEMPLATE                = '<li data-id="{id}" data-languages="{languages}"></li>',
          SELECT_TEMPLATE              = '<select></select>',
          OPTION_TEMPLATE              = '<option value="{value}">{value}</option>',
          TEMPLATE_CURRENT_CLASSNAME   = 'active',
          TEMPLATE_EDITABLE_CLASSNAME  = 'editable';

    var Base = Y.Base.create('Base', Y.Base, [Y.Gateway, Y.DataStore, Y.LocalStore]);

    BiscuitApp.NAME = 'Biscuit';
    function BiscuitApp(config) {
        BiscuitApp.superclass.constructor.apply(this, arguments);
    }

    Y.extend(BiscuitApp, Base, {

        current : {
            server    : null,
            page      : null,
            template  : null,
            language  : null,
            defaultLanguage : null,
            languages : null
        },

        nodes : {
            templateList : null,
            templateListContainer : null,
            templateActions : null
        },

        initializer : function(cfg) {
            // preloaded event
            this.publish('biscuit:preloaded', { preventable: false, broadcast: 1 });

            this._syncState();
            this._bindEvents();

            Y.log('initialized', null, 'Biscuit');
        },

        getServerById : function(id) {
            var serverList = this.dataStore.data.server.list, i, node;
            for (i = 0; server = serverList[i++];) {
                if (server['Server__'] == id) {
                    return server;
                }
            }
        },

        getTemplateById : function(id) {
            return this.nodes.templateListContainer.one('li[data-id="' + id + '"]');
        },

        pickTemplate : function(el) {
            if (el === null) {
                return;
            }
            if (Y.Lang.isString(el)) {
                el = this.getTemplateById(el);
            }
            var templateName = el.getAttribute('data-id');

            this.current.language = this.current.defaultLanguage;

            this.nodes.templateList.removeClass(TEMPLATE_CURRENT_CLASSNAME);
            this.nodes.templateList.removeClass(TEMPLATE_EDITABLE_CLASSNAME);
            el.addClass(TEMPLATE_CURRENT_CLASSNAME);

            var languageButton = this.nodes.templateActions.one('.language');
            if (languageButton) {
                // Build language list, always display the default language
                if (this.current['languages'] && this.current['languages'].length > 1) {
                    //Build options
                    var select = Y.Node.create(SELECT_TEMPLATE);

                    var languages = el.getAttribute('data-languages').split(',');
                    languages.forEach(Y.bind(function(o) {
                        var option = Y.Node.create(Y.substitute(OPTION_TEMPLATE, {
                            'value' : o
                        }));
                        if (o.Posix_Language__ === this.current.language) {
                            option.set('selected', true);
                        }
                        select.appendChild(option);
                    }, this));

                    languageButton.empty().appendChild(select);
                }
            }

            this._setTemplate(templateName, this.current.language);
        },

        buildTemplateList : function(templates) {
            var html = [], i, node,
                templateList = this.nodes.templateListContainer;

            for (i = 0; node = templates[i++];) {
                if (node['Name'].trim() === '') {
                    continue;
                }

                var li = Y.Node.create(Y.substitute(LIST_TEMPLATE, {id: node['Name'], languages: node['Languages']}));

                //Append text
                var span = Y.Node.create('<span>').set('text', node['Name']);

                li.append(span);
                html.push(li);
            }
            this.resetTemplateList();
            this.nodes.templateList = Y.all(html);
            templateList.append(this.nodes.templateList);

            Y.log('populated template list', null, 'TemplateListContainer');
        },

        resetTemplateList : function() {
            this.nodes.templateListContainer.get('children').remove();
        },

        resetLayout : function() {
            // empty the editor
            this.editor.empty();

            // drop the template list
            this.resetTemplateList();

            // hide toolbar
            this.toolbar.hide();

            // set app vars as null
            with (this.current) {
                server   = null;
                page     = null;
                template = null;
                language = null;
            }
        },

        newPage : function(page) {
            if (!this.REGEX.PAGE.test(page)) {
                alert('tooltip bad page name');
                return;
            }
            Y.log('new page: ' + page, null, 'Biscuit');
            this.gateway.emit(Biscuit.Locator.rest.services.page.new, { 'params' : { 'Server__' : this.current.server, 'Page_Name' : page }});
            this.gateway.emit(Biscuit.Locator.rest.services.page.list, { 'params' : { 'Server__' : this.current.server}});
        },

        saveTemplate : function() {
            if (this.current.template === null) {
                Y.log('tried to save an unexisting template', 'error', 'Biscuit');
                return false;
            }

            Y.log('saving current template', 'warn', 'Biscuit');
            this.gateway.emit(Biscuit.Locator.rest.services.template.save, { 'params' : {
                'content' : this.editor.getCode()
            }});
        },

        _setServerLanguages : function(id) {
            // ask server for language list
            this.gateway.emit(Biscuit.Locator.rest.services.server.languages, { 'params' : { 'Server__' : id}});
        },

        _bindEvents : function() {
            // language list from server event
            this.gateway.listen(Biscuit.Locator.rest.services.server.languages, Y.bind(this._buildLanguageList, this));

            // template list from server event
            this.gateway.listen(Biscuit.Locator.rest.services.template.list, Y.bind(this._populateTemplateList, this));

            // template content
            this.gateway.listen(Biscuit.Locator.rest.services.template.content, Y.bind(this._setTemplateContent, this));

            // template list item click
            this.nodes.templateListContainer.delegate('click', this._onTemplateItemClick, 'li:not(.active)', this);

            // template list rename dblclick
            this.nodes.templateListContainer.delegate('dblclick', this._onTemplateRenameClick, 'li.active', this);

            // template list active tpl context menu
            this.nodes.templateListContainer.delegate('contextmenu', this._onTemplateContextMenu, 'li.active', this);

            // template list language select click
            this.nodes.templateActions.delegate('change', this._onTemplateLanguageClick, 'li.language > select', this);

            // template renamed
            this.nodes.templateListContainer.delegate('keyup', this._onTemplateInputValidated, 'li.active > input', this);

            this.on('datastore:ready', Y.bind(this._syncSession, this));
        },

        _syncState : function() {
            // cache often called nodes
            this.nodes = {
                templateListContainer : Y.one('.template-list'),
                templateActions       : Y.one('.template-actions')
            };
        },

        _restoreSession : function(tabs) {
            var serverName, serverId, page, template;
            for (prop in tabs) {

                // sanity check, as we extended the Object prototype
                if (!tabs.hasOwnProperty(prop)) {
                    return;
                }

                var o = tabs[prop];
                if (!o.hasOwnProperty('server')) {
                    return;
                }

                serverName = this.getServerById(o['server'])['Name']; // TODO: OPTIMIZE LOOKUP, mb generate Server__ => {} in worker?
                serverId   = o['server'];
                page       = o['page'];
                template   = o['template'];
                active     = o['active'];

                var tab = this.topNav.newTab(
                    active,
                    serverName,
                    serverId,
                    page,
                    template
                );
            }
        },

        _syncSession : function() {
            var localStore = this.localStore,
                currentTabs = localStore.get(localStore.definitions.CURRENT_TABS),
                history = Y.HistoryManager.get('tabs');

            if (this.topNav.srcNode.one('ul').get('children').size() > 0) {
                Y.log('tabs already found', 'warn', 'Session');
                return;
            }

            // data from history hash
            if (history) {
                try {
                    history = JSON.parse(history);
                    if (history.length === 0) {
                        throw new Error();
                    }
                } catch (e) {
                    history = false;
                }
            }

            if (history) {
                this._restoreSession(this._buildSessionFromArray(history));
                Y.log('restored session from uri hash', 'warn', 'Session');
            } else if (Y.hasProperties(currentTabs)) {
                // tabs found in history
                this._restoreSession(currentTabs);
                Y.log('restored session from local storage', 'warn', 'Session');
            } else {
                // creates one default tab
                this.topNav.newTab();
                Y.log('no session found', 'warn', 'Session');
            }

            if (!this.current.template) {
                this.toolbar.hide();
            }
        },

        _buildSessionFromArray : function(items) {
            var a = [];
            items.forEach(function(item) {
                a.push({
                    server   : item[0],
                    page     : item[1],
                    template : item[2],
                    active   : item[3],
                });
            });
            return a;
        },

        _setInputToValue : function(li, input, defaultValue) {
            defaultValue = defaultValue || false;

            var previousValue = li.getAttribute('data-id'),
                newValue = input.get('value');

            // check format
            value = li.getAttribute('data-id');
            if (this.REGEX.TEMPLATE.test(value) && !defaultValue) {
                value = newValue;

                this.gateway.emit(Biscuit.Locator.rest.services.template.rename, { 'params' : {
                    'Template__'       : previousValue,
                    'Name'             : newValue
                }});
            }

            input.remove();
            li.one('span').set('text', value).show();

            return value;
        },

        _validateTemplateInput : function(input) {
            var li = input.ancestor('li'),
                id = this._setInputToValue(li, input);

            this.current.template = id;
            li.setAttribute('data-id', id);
            this.topNav.currentTab.setMetaData('tpl', id);
        },

        _onTemplateContextMenu : function(e) {
            var tpl = e.currentTarget;
            e.halt();
        },

        _onTemplateItemClick : function(e) {
            var input = this.nodes.templateListContainer.one('input');
            if (input) {
                li = input.ancestor('li');
                this._setInputToValue(li, input, true);
            }
            var tpl = e.currentTarget;
            this.pickTemplate(tpl);
        },

        _onTemplateRenameClick : function(e) {
            var el = e.currentTarget;
            if (el._node.nodeName !== 'LI') {
                return;
            }

            //Hide underlying span
            el.one('span').hide();

            var input = Y.Node.create(this.TEMPLATES.TEXT_INPUT_IN_PLACE);
            input.set('value', el.get('firstChild').get('text'));
            el.addClass('editable');

            //If there's a select box, hide it
            var select = el.one('select');
            if (select) {
                select.hide();
            }

            el.append(input);
            input.focus();
        },

        _onTemplateInputValidated : function(e) {
            if (e.keyCode !== 13) {
                return;
            }

            // refresh app state
            this._validateTemplateInput(e.currentTarget);
        },

        _onTemplateLanguageClick : function(e) {
            var el  = e.currentTarget,
                tpl = this.current.template;

            // visual bug if not blurred
            if (el.get('value') !== this.current.language) {
                this.current.language = el.get('value');
                this._setTemplate(tpl, this.current.language);
            }
        },

        _setTemplate : function(id, language) {
            Y.log('picked template: ' + id + ' (' + language + ')', null, 'TemplateListContainer');

            this.current.template = id;
            this.topNav.currentTab.setMetaData('tpl', id);
            this.toolbar.show();

            // ask server for template content
            this.gateway.emit(Biscuit.Locator.rest.services.template.content, { 'params' : {
                'Posix_Language__' : language,
                'Template__'       : id
            }});

        },

        _setTemplateContent : function(e, event, data, error) {
            switch (error) {
                case 'NO_DATA':
                    alert('no content for this template tooltip');
                    return;
            }

            var content = data[0].content;
            this.editor.setCode(content);

            Y.log('inserted template content', null, 'ContentEditor');
        },

        _populateTemplateList : function(e, event, data, error) {
            switch (error) {
                case 'NO_DATA':
                    alert('no templates for this server tooltip');
                    return;
            }

            this.buildTemplateList(data);

            // switch of editor parser if needed
            switch (this.current.page.split('.')[1]) {
                case 'css':
                    this.editor.setParser('CSSParser');
                    break;
                case 'js':
                case 'json':
                    this.editor.setParser('JSParser');
                    break;
                case 'xml':
                    this.editor.setParser('XMLParser');
                    break;
                default:
                    this.editor.setParser('HTMLMixedParser');
            }

            if (this.current.template) {
                this.pickTemplate(this.current.template);
            }
        },

        _buildLanguageList : function(e, event, data, error) {
            switch (error) {
                case 'NO_DATA':
                    alert('no languages for this server tooltip');
                    return;
            }

            var def = null;
            data.forEach(function(o) {
                if (o.Default === 'Y') {
                    def = o.Posix_Language__;
                    return;
                }
            });

            with (this.current) {
                language  = def;
                languages = data;
                defaultLanguage = def;
            }
        },

        destructor : function() { },

        TEMPLATES : {
            TEXT_INPUT_IN_PLACE : '<input type="text" autocomplete="off" />'
        },

        REGEX : {
            TEMPLATE : /^([a-z0-9_]{3,})$/,
            PAGE     : /^([a-z0-9_]{3,})\.([\w]{2,})$/
        }
    });

    Y.Biscuit = BiscuitApp;
}, '3.3.0', {requires:['base', 'objects-extension', 'gateway-ext', 'datastore-ext', 'localstore-ext']});

YUI.add('biscuit-history', function(Y) {
    Y.HistoryHash.hashPrefix = '!';
    Y.HistoryManager = new Y.HistoryHash();
}, '3.3.0', {requires:['history']});

YUI.add('biscuit-console', function(Y) {
    Y.Console = new Y.Console({
        strings: {
            title : 'Biscuit Logger',
            pause : 'Wait',
            clear : 'Flush',
            collapse : 'Shrink',
            expand : 'Grow'
        },
        width: '350px',
        height: '500px',
        newestOnTop: false,
        visible: true
    })
    .plug(Y.Plugin.ConsoleFilters)
    .plug(Y.Plugin.Drag, {handles: ['.yui3-console-hd', '.yui3-console-ft']})
    .render('#yconsole');

    Y.on('key', function(e) {
        if (this.get('visible')) {
            this.hide();
        } else {
            this.show();
        }
    }, 'body', 'press:178', Y.Console);


    Y.one('body').addClass('yui3-skin-sam');
}, '3.3.0', {requires:['console', 'console-filters', 'dd-plugin', 'event-key']});

var app;

YUI({
    gallery: 'gallery-2010.11.12-20-45'
}).use('biscuit-console', 'biscuit-history', 'biscuit', 'top-nav-plugin', 'toolbar-plugin', 'template-actions-plugin', 'editor-plugin',  'gallery-outside-events', function(Y) {

    app = new Y.Biscuit({
        plugins : [
            {fn: Y.TopNavigation, cfg: {srcNode:'.biscuit-tabs'}},
            {fn: Y.Toolbar.Main, cfg: {srcNode:'.biscuit-toolbar'}},
            {fn: Y.TemplateActions.Main, cfg: {srcNode:'.template-actions'}},
            {fn: Y.Editor, cfg: {srcNode:'.biscuit-editor'}}
        ]
    });
});
