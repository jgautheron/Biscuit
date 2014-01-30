YUI.add('icon-push', function(Y) {
    function IconPush() {
        this._initIconPush();
    }

    IconPush.prototype = {
        _initIconPush : function() {
            this.push.parent = this;
            this.push._init();
        },

        push : {
            instance : null,
            interval : null,

            current : {
                queries : {},
                query : null,
                pushed : 0,
                date : 'today'
            },

            nodes : {
                queryListBody : null,
                detailsBox    : null
            },

            _init : function() {
                this.app = this.parent.get('host');
                this.icon = Y.one('.' + this.parent.CLASSNAMES.ICON + '.push');

                this._syncState();
                this._bindEvents();
            },

            _syncState : function() {
                this.instance = new Y.Overlay({
                    srcNode: '#dashboard-push-overlay',
                    visible: false,
                    shim: false
                });
                this.instance.render();
                this.instance.set('centered', true);
                Y.log('rendered IconPush overlay', null, 'IconPush');

                // enable d&d
                var node = this.instance.get('contentBox');
                node.plug(Y.Plugin.Drag);
                node.dd.addHandle('.yui3-widget-hd');

                this.instance.subscribe('visibleChange', function(e) {
                    if (e.newVal) {
                        this.icon.addClass(this.parent.CLASSNAMES.ICON_ACTIVE);
                    } else {
                        this.icon.removeClass(this.parent.CLASSNAMES.ICON_ACTIVE);
                    }
                }, this);

                this.nodes = {
                    queryListBody : Y.one('#queries-list tbody'),
                    detailsBox    : this.instance.get('contentBox').one('.details')
                };
            },

            _bindEvents : function() {
                this.app.on('socket:connected', function(e) {
                    // preload query list
                    this.app.gateway.emit(Biscuit.Locator.rest.services.push.getqueries, { params : {
                        'pushed' : this.current.pushed,
                        'date'   : this.current.date,
                    }});
                }, this);

                this.app.gateway.listen(Biscuit.Locator.rest.services.push.getqueries, Y.bind(function(e, event, data) {
                    if (data === null) {
                        data = [];
                    }

                    this.current.queries = data;
                    Y.log('fetched query list', null, 'IconPush');
                    this._buildQueriesList();
                }, this));

                this.app.gateway.listen(Biscuit.Locator.rest.services.push.cancel, Y.bind(function() {
                    this.resetStatus();
                    this.app.gateway.emit(Biscuit.Locator.rest.services.push.getqueries, { params : {
                        'pushed' : this.current.pushed,
                        'date'   : this.current.date,
                    }});
                }, this));

                this.nodes.queryListBody.delegate('click', this._onRowClick, 'tr:not(.none)', this);
                this.nodes.detailsBox.one('.yes').on('click', this._submitPush, this);
                this.nodes.detailsBox.one('.no').on('click', this._cancelPush, this);
                this.instance.bodyNode.one('.tabs').delegate('click', this._onTabClick, '.tab:not(.' + this.CLASSNAMES.DATE_ACTIVE + ')', this);
                this.instance.bodyNode.one('.filters').delegate('click', this._onFilterClick, 'span[data-filter]', this);
            },

            _cancelPush : function() {
                var pushReason = Y.one('#push-cancel-reason'),
                    pushValue  = pushReason.get('value').trim();

                if (pushValue === '') {
                    pushReason.setStyle('visibility', 'visible');
                    pushReason.setStyle('opacity', 100);
                    return;
                }

                pushReason.setStyle('visibility', 'hidden');
                pushReason.setStyle('opacity', 0);
                pushReason.set('value', '');
                this.app.gateway.emit(Biscuit.Locator.rest.services.push.cancel, { params : {
                    'Push_Query__' : this.current.query.ID
                }});
            },

            _submitPush : function() {
                //alert('yes');
            },

            _setRefresh : function() {
                this.interval = setInterval(Y.bind(function() {

                    var loader = this.instance.bodyNode.one('.loader');
                    loader.setStyle('opacity', 100);
                    setTimeout(function() {
                        loader.setStyle('opacity', 0);
                    }, 1000);
                    this.app.gateway.emit(Biscuit.Locator.rest.services.push.getqueries, { params : {
                        'pushed' : this.current.pushed,
                        'date'   : this.current.date,
                    }});
                }, this), 10000);
            },

            _unsetRefresh : function() {
                clearInterval(this.interval);
            },

            _click : function() {
                this.toggle();
            },

            _buildQueriesList : function() {
                var list = this.current.queries;
                if (list.length === 0) {
                    var empty = Y.Node.create('<tr class="none"><td colspan="6">No push query matched your filters.</td></tr>');
                    this.nodes.queryListBody.all('tr').remove();
                    this.nodes.queryListBody.append(empty);
                    return;
                }

                var rows = [], row, rowColumns;
                list.forEach(Y.bind(function(item) {
                    row = Y.Node.create('<tr data-push-query=' + item['ID'] + '></tr>');
                    if (this.current.query) {
                        if (item['ID'] === this.current.query.ID) {
                            row.addClass(this.CLASSNAMES.ROW_SELECTED);
                        }
                    }
                    rowColumns = Y.all([
                        Y.Node.create('<td>' + item['StampHour'] + '</td>'),
                        Y.Node.create('<td>' + item['Caller'] + '</td>'),
                        Y.Node.create('<td>' + item['Ticket'] + '</td>'),
                        Y.Node.create('<td>' + item['Server_Name'] + '</td>'),
                        Y.Node.create('<td>' + item['Page__'] + '</td>'),
                        Y.Node.create('<td>' + item['Type'] + '</td>')
                    ]);
                    row.append(rowColumns);
                    rows.push(row);
                }, this));

                this.nodes.queryListBody.all('tr').remove();
                this.nodes.queryListBody.append(Y.all(rows));
            },

            _onRowClick : function(e) {
                var row   = e.currentTarget,
                    query = this.getQueryFromID(row.getAttribute('data-push-query'));

                // kept for internal purposes
                this.current.query = query;

                // set row as selected
                this.nodes.queryListBody.all('tr').removeClass(this.CLASSNAMES.ROW_SELECTED);
                row.addClass(this.CLASSNAMES.ROW_SELECTED);

                // set content
                var commentBox = this.nodes.detailsBox.one('.comment');
                if (query.Comment !== '') {
                    commentBox.one('p').set('text', query.Comment);
                    commentBox.show();
                } else {
                    commentBox.hide();
                }

                // set files
                var filesBox = this.nodes.detailsBox.one('.files ul'), html = [], file;
                query.Files.forEach(function(item) {
                    file = Y.Node.create('<li>' + item + '</li>');
                    html.push(file);
                });
                filesBox.get('children').remove();
                filesBox.append(Y.all(html));

                // show details box
                this.nodes.detailsBox.show();
            },

            _onTabClick : function(e) {
                var target = e.currentTarget,
                    date   = target.getAttribute('data-date');

                this.current.date = date;
                this.instance.bodyNode.one('.tabs').all('.tab').removeClass(this.CLASSNAMES.DATE_ACTIVE);
                target.addClass(this.CLASSNAMES.DATE_ACTIVE);
                
                this.app.gateway.emit(Biscuit.Locator.rest.services.push.getqueries, { params : {
                    'pushed' : this.current.pushed,
                    'date'   : this.current.date,
                }});
            },

            _onFilterClick : function(e) {
                var target = e.currentTarget,
                    filter = target.getAttribute('data-filter'),
                    chk    = target.get('previousSibling');

                switch (filter) {
                    case 'pushed':
                        if (chk.get('checked')) {
                            this.current.pushed = 0;
                        } else {
                            this.current.pushed = 1;
                        }

                        this.app.gateway.emit(Biscuit.Locator.rest.services.push.getqueries, { params : {
                            'pushed' : this.current.pushed,
                            'date'   : this.current.date,
                        }});
                        break;
                }
            },

            getQueryFromID : function(id) {
                var queries = this.current.queries, res = null;
                queries.forEach(function(query) {
                    if (query['ID'] === id) {
                        res = query;
                    } 
                });
                return res;
            },

            resetStatus : function() {
                this.nodes.queryListBody.all('tr').removeClass(this.CLASSNAMES.ROW_SELECTED);
                this.instance.get('contentBox').one('.details').hide();
                this.current.query = null;
            },

            toggle : function() {
                if (!this.instance.get('visible')) {
                    this.instance.show();
                    this._setRefresh();
                } else {
                    this.instance.hide();
                    this._unsetRefresh();

                    // reset status
                    this.resetStatus();
                }
            },

            CLASSNAMES : {
                ROW_SELECTED : 'selected',
                DATE_ACTIVE  : 'active'
            }
        }
    };

    Y.namespace('Icons');
    Y.Icons.IconPush = IconPush;
}, '3.3.0', {requires:['overlay', 'event-delegate', 'node', 'dd-plugin']});