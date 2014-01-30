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