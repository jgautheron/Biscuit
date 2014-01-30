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