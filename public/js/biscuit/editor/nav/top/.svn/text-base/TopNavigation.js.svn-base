YUI.add('top-nav-plugin', function(Y) {
    TopNavigation.NAME = 'top-nav-plugin';
    TopNavigation.NS   = 'topNav';

    TopNavigation.ATTRS = {
        srcNode : {
            value : null,
            writeOnce : true
        }
    };

    function TopNavigation(config) {
        TopNavigation.superclass.constructor.apply(this, arguments);
    }

    const TAB_TEMPLATE         = '<li><h3>Click here to start</h3><h4>&nbsp;</h4><span class="close"></span></li>',
          SERVER_NAME_TEMPLATE = '{name} ({id})',
          MIDDLE_MOUSE         = 2; // CONFIG: MIDDLE MOUSE

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
                    if (this.getCurrentTab() === el) {
                        this.app.current.server = id;
                    }
                    break;
                case 'page':
                    // updates text & metadata
                    el.one('h4').set('text', name);
                    if (this.getCurrentTab() === el) {
                        this.app.current.page = name;
                    }
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