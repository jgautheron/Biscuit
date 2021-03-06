YUI.add('node++', function (Y) {
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
/*
Copyright (c) 2010, Nexway All rights reserved.
@author Christophe Eble <ceble@nexway.com>
*/
YUI.add('propertyeditor', function(Y) {

    const
        HTML_SELECT_ELEMENT             = '<select>',
        HTML_OPTION_ELEMENT             = '<option value="{value}">{text}</option>',
        HTML_SPINNER_ELEMENT            = '<input type="number" min="{min}" max="{max}" step="{step}" value="{value}">',
        HTML_CHECKBOX_ELEMENT           = '<input type="checkbox" value="{value}" checked="{checked}">',
        HTML_CHECKBOX_EMPTY_ELEMENT     = '<input type="checkbox" />',
        HTML_TEXT_ELEMENT               = '<input type="text" value="{value}">',
        HTML_LABEL_ELEMENT              = '<label>',
        HTML_TR_ELEMENT                 = '<tr>',
        HTML_TD_ELEMENT                 = '<td>',
        HTML_TH_ELEMENT                 = '<tr><th style="width:20px"></th><th s>{name}</th><th>{value}</th></tr>',
        HTML_DATALIST_ELEMENT           = '<datalist>',
        HTML_THEAD_ELEMENT              = '<thead>';

    Y.hasProps = function (obj) {
        var m, has = false;
        for (m in obj){
            if (Object.prototype.hasOwnProperty.call(obj, m)) {
                has = true;
                break;
             }
        }
        return has;
    }

    var _toggleGroup = function(src)
    {
        if (src.hasClass('collapsed')) {
            if (src.getData('root')) {
                this.all('tbody[rel^="' + src.get('id') + '_1"]').show();
                src.replaceClass('collapsed', 'expanded');
            } else {
                Y.each(this.all('tbody[rel^="' + src.getData('base') + '_' + (src.getData('level')+1) + '"]'), function(node) {
                    if (src.get('id') === node.getData('ancestor')) {
                        node.show();
                    }
                });
                src.replaceClass('collapsed', 'expanded');
            }
        } else {
            if (src.getData('root')) {
                this.all('tbody[rel^="' + src.get('id') + '"]').hide();
                src.replaceClass('expanded', 'collapsed');
            } else {
                this.all('tbody[rel^="' + src.getData('base') + '_' + (src.getData('level')+1) + '"]').hide();
                src.replaceClass('expanded', 'collapsed');
            }
        }
    }

    var _createGroup = function(o, propName, lookup, level, baseId, groupId)
    {
        var rowContainer    = Y.one(PropertyEditor.GRID_CLASS),
            that            = this,
            sourceId        = '';

        if (Y.Lang.isArray(o)) {

            if(o.length) {

                var tbody  = Y.Node.create('<tbody class="yui3-propertyeditor-group level-' + (level) + ' collapsed">'),
                    gutter = Y.Node.create(HTML_TD_ELEMENT),
                    target = Y.Node.create(Y.substitute('<a rel="{prop}"></a>', {
                        'prop' : tbody._yuid
                    }));

                if (typeof this._levels[level] !== 'undefined') {
                    ++this._levels[level];
                } else {
                    this._levels[level] = 1;
                }

                target.on('propertyeditor|click', function(e) {
                    e.preventDefault();
                    var ctx = this.get('rel');

                    _toggleGroup.call(rowContainer, Y.one('#' + ctx));

                });

                tbody.setAttribute('id', tbody._yuid);

                if (level > 0) {

                    sourceId = baseId + '_' + level + '_' + this._levels[level];
                    tbody.setAttribute('rel', sourceId);
                    tbody.setData('root', false);
                    tbody.setData('level', level);
                    tbody.setData('base', baseId);
                    tbody.setStyle('display', 'none');
                    tbody.setData('ancestor', groupId);

                    groupId = tbody._yuid;

                } else {

                    sourceId = tbody.get('id');
                    baseId = sourceId;

                    tbody.setData('root', true);
                }

                level++;

                gutter.append(target);

                var heading = Y.Node.create(HTML_TD_ELEMENT);
                heading.setAttribute('colspan', 2);
                heading.set('text', propName);

                tbody.append(gutter).append(heading);
                rowContainer.append(tbody);

                o.forEach(function(item) {
                    var keys = Y.Object.keys(item);
                    if (keys.length) {
                        keys.forEach(function(key, idx) {
                            if (Y.Lang.isArray(item[key])) {
                                _createGroup.call(that, item[key], key, lookup, level, baseId, groupId);
                            } else {
                                _preprocessProperty(key, item[key], tbody, lookup);
                            }
                        })
                    }
                });
            }

        } else {
            _preprocessProperty(propName, o, rowContainer, lookup);
        }
    }

    var _preprocessProperty = function(propName, o, rowContainer, lookup)
    {
        if (o.hasOwnProperty('role')) {

            var tr      = Y.Node.create(HTML_TR_ELEMENT),
                gutter  = Y.Node.create(HTML_TD_ELEMENT),
                key     = Y.Node.create(HTML_TD_ELEMENT),
                value   = Y.Node.create(HTML_TD_ELEMENT);

            if (o.hasOwnProperty('label')) {
                key.set('text', o.label);
            } else {
                key.set('text', propName);
            }

            value.set('role', o.role);

            tr.addClass('property');

            switch(o.role) {

                case 'spinbutton':
                case 'textbox':

                    var label = Y.Node.create(HTML_LABEL_ELEMENT);
                    label.set('text', o.value);

                    value.append(label);
                    var prop = _resolveProperty(value);

                    break;

                case 'checkbox':

                    var cb = Y.Node.create(HTML_CHECKBOX_EMPTY_ELEMENT);

                    if ('value' in o) {
                        cb.set('value', o.value);
                    }
                    if ('checked' in o && o['checked']) {
                        cb.setAttribute('checked', 'checked');
                    }

                    value.append(cb);
                    var prop = _resolveProperty(value);

                    break;

                case 'listbox':

                    var label = Y.Node.create(HTML_LABEL_ELEMENT), selected = null;

                    label.set('text', o.value[Y.Object.keys(o.value)[0]]);

                    if ('selected' in o && o.selected in o.value) {
                        selected = o.selected;
                        label.set('text', o.value[o.selected]);
                    }

                    var dl = Y.Node.create(HTML_DATALIST_ELEMENT);

                    Y.each(o.value, function(val, key) {
                        var opt = Y.Node.create(Y.substitute(HTML_OPTION_ELEMENT, {
                            value : key,
                            text  : val
                        }));

                        if (selected && opt.get('value') === selected) {
                            opt.setAttribute('selected', 'selected');
                        }

                        dl.append(opt);
                    });

                    value.append(label).append(dl);

                    var prop = _resolveProperty(value);

                    break;
            }

            if (!!prop && !lookup.hasOwnProperty(prop.guid)) {

                if (o.hasOwnProperty('id')) {
                    Y.one(prop.property['ref']).set('id', o.id);
                }

                prop.property['name'] = propName;

                lookup[prop.guid] = prop.property;

                tr.append(gutter).append(key).append(value);
                rowContainer.append(tr);
            }
        }
    }

    var _resolveProperty = function(el) {

        var cfg = null;

        /* Determine the type of element */
        switch(el.getAttribute('role')) {

            case 'textbox':
                var initial  = Y.one(el).one('label');

                cfg = {'type' : 'text', 'value' : initial.get('text'), 'ref' : el, 'label' : initial};
                break;

            case 'spinbutton':

                var initial  = Y.one(el).one('label');

                cfg = {'type' : 'spinner', 'value' : initial.get('text'), 'ref' : el, 'label' : initial};

                break;

            case 'listbox':

                var datalist = Y.one(el).one('datalist');
                var initial  = Y.one(el).one('label');

                if ('children' in datalist._node && datalist._node.children.length) {

                    var collection = {}, first, i = 0, selected = null;

                    Array.prototype.slice.call(datalist._node.children).forEach(function(o) {
                        if (i === 0) {
                            first = o.getAttribute('value');
                        }

                        if (o.getAttribute('selected')) {
                            selected = o.getAttribute('value');
                        }

                        collection[o.getAttribute('value')] = o.textContent;
                        i++;
                    });

                    cfg = {'type' : 'list', 'value' : (selected) ? selected : first, 'data' : collection, 'ref' : el, 'label' : initial};
                }

                break;

            case 'checkbox':

                var checkbox = Y.one(el).one('input[type=checkbox]');
                if (checkbox) {

                    cfg = {'type' : 'checkbox', 'ref' : el, 'checkbox' : checkbox, 'checked' : checkbox.get('checked')};

                    if(checkbox.getAttribute('checked')) {
                        cfg.checked = 'checked';
                    }

                    checkbox.parent = el;
                    cfg.value = (checkbox.get('checked')) ? checkbox.get('value') : false;
                }

                break;

        }

        if (cfg) {
            var guid = Y.stamp(el);

            return {
                'guid'     : guid,
                'property' : cfg
            };
        }

        return false;

    }, _lookup = {};

    /**
     * @constructor
    */
    function PropertyEditor(config) {
        PropertyEditor.superclass.constructor.apply(this, arguments);
    }

    PropertyEditor.NAME = 'propertyEditor';
    PropertyEditor.NS   = 'propgrid';

    /**
    * @const
    */
    PropertyEditor.PANEL_CLASS = 'div.yui3-propertyeditor-panel';
    PropertyEditor.GRID_CLASS  = '.yui3-propertyeditor-table';

    /**
     * Static property used to define the default attribute
     * configuration for the Property Editor.
     *
     * @property PropertyEditor.ATTRS
     * @type Object
     * @static
     */
    PropertyEditor.ATTRS = {

        gridPanel : {
            value : null
        },
        /**
        * @attribute datasource
        * @description The datasource of the property editor
        * @type Y.DataSource
        */
        datasource : {
            value  : new Y.DataSource.Local(),
            getter : '_getDataSource'
        },

        data : {
            getter : 'getData',
            setter : '_setData'
        },

        header : {
            setter: '_setHeader'
        }

    };

    /**
     * Progressive enhancement configuration
     *
     * @property PropertyEditor.HTML_PARSER
     * @type Object
     * @static
     */
    PropertyEditor.HTML_PARSER = {

        values : function(contentBox) {

            var rootNode  = Y.one(PropertyEditor.GRID_CLASS),
                container = Y.one(PropertyEditor.PANEL_CLASS);

            if (rootNode) {

                /* Register events */
                Y.delegate('click', Y.bind(this._onClickHandler, this), rootNode, 'td');

                Y.on('click', Y.bind(this._onEscape, this), document);
                Y.on('click', Y.bind(function(e) {
                    e.stopPropagation();
                }, this), container);

                Y.delegate('change', Y.bind(this._onChangeHandler, this), rootNode, '*');
                Y.on('key', Y.bind(this._onEscape, this), document, 'up:27');

                var query = rootNode.all('tr.property');

                if (query) {
                    if (query._nodes) {
                        query._nodes.forEach(function(row) {

                            var keyValuePair = (Y.one(row).all('td'))._nodes,
                                key   = keyValuePair[0].textContent.trim(),
                                value = (!!keyValuePair[1]) ? keyValuePair[1] : null;

                            if (!value.getAttribute('role')) return;

                            var prop = _resolveProperty(value);

                            if (prop) {

                                if (!_lookup.hasOwnProperty(prop.guid)) {

                                    prop.property['name'] = key;

                                    _lookup[prop.guid] = prop.property;
                                }
                            }

                        });
                    }
                }
            }
        }

    };

    /**
     * The PropertyEditor module
     *
     * @module propertyeditor
     * Provides a property editor widget interface
     * @param config {Object} Object literal specifying property editor configuration properties.
     *
     * @class PropertyEditor
     * @extends Widget
     */
    Y.extend(PropertyEditor, Y.Widget, {

        _levels : {},
        _head   : null,

        bindUI : function() {

        },

        renderUI : function() {

        },

        initializer : function() {
            /* Get datasource */
            var ds = this.get('datasource');

            /* Register events */
            this.publish('propertyeditor:change', { preventable: false, broadcast: 1 });
            this.publish('propertyeditor:beforechange', { preventable: false, broadcast: 1 });

            this.subscribe('propertyeditor:beforechange', this._beforeCellChange);

            /* Retrieve lookup and build datasource */
            if (Y.hasProps(_lookup)) {
                ds.setAttrs(_lookup);
            }
        },

        propertyExists : function(prop) {
            var props = this.getProperties();
            return (props.hasOwnProperty(prop));
        },

        clear : function() {
            Y.one(PropertyEditor.GRID_CLASS).empty();
            this.get('datasource')._state.data = {};
            Y.one(PropertyEditor.GRID_CLASS).append(this._head);
        },

        getGridPanel : function() {
            return Y.one(PropertyEditor.GRID_CLASS);
        },

        getProperty : function(prop) {
            var props = this.getProperties();
            return (props.hasOwnProperty(prop)) ? props[prop] : false;
        },

        getProperties : function() {
            var ds = this.get('datasource'), output = {};
            if (ds && typeof ds._state.data.value !== 'undefined') {
                Y.each(ds._state.data.value, function(o) {

                    if (!o || !o.hasOwnProperty('name')) {
                        return;
                    }

                    output[(o.hasOwnProperty('id')) ? o['id'] : o['name']] = o.value;
                })
            }

            return output;
        },

        _setData : function(ds) {
            this.clear();
            this.addData(ds);
        },

        _setHeader : function(header) {

            var rootNode  = Y.one(PropertyEditor.GRID_CLASS);
            var thead = Y.Node.create(HTML_THEAD_ELEMENT);

            thead.addClass('yui3-propertyeditor-header');

            var th = Y.Node.create(Y.substitute(HTML_TH_ELEMENT, header));
            thead.append(th);

            this._head = thead;

            Y.one(PropertyEditor.GRID_CLASS).append(thead);
        },

        addData : function(ds) {

            var rootNode     = Y.one(PropertyEditor.GRID_CLASS),
                lookup       = {};

            if (!rootNode) {
                return;
            }

            if (Y.hasProps(ds)) {
                Y.each(ds, Y.bind(function(o, propName) {

                    if (this.propertyExists(propName)) {
                        return;
                    }

                    _createGroup.call(this, o, propName, lookup, 0, '');

                }, this));

                /* Retrieve lookup and build datasource */
                if (Y.hasProps(lookup)) {
                    this.get('datasource').setAttrs(lookup);
                }
            }
        },

        getData : function() {
            var state = this.getProperties();
            return Y.JSON.stringify(state);
        },

        /*
            Private methods
        */

        _beforeCellChange : function() {
            this._onPropertyChange(this._currentEditor.element, this._currentEditor.property);
        },

        _getDataSource : function(ds, propName) {
            return ds;
        },

        _getPropertyFromElement : function(el) {
            if (el && '_yuid' in el) {
                var prop = this.get('datasource').get(el._yuid);
                if (prop) {
                    return prop;
                }
            }

            return false;
        },

        _onChangeHandler : function(e) {

            var target = e.currentTarget;

            if (property = this._getPropertyFromElement(target.parent)) {

                switch(property.type) {

                    case 'text':
                    case 'spinner':
                    case 'list':

                        this.fire('propertyeditor:change', {
                            'property' : property.name,
                            'before'   : property.value,
                            'after'    : target.get('value')
                        });

                        property.value = target.get('value');

                        break;

                    case 'checkbox':

                        var value = target.get('checked') ? (target.get('value') !== 'on') ? target.get('value')  : true : false;

                        this.fire('propertyeditor:change', {
                            'property' : property.name,
                            'before'   : property.value,
                            'after'    : value,
                            'checked'  : target.get('checked')
                        });

                        property.value = value;

                        break;

                }
            }
        },

        _onClickHandler : function(e) {

            var target = e.currentTarget;

            if (property = this._getPropertyFromElement(target)) {
                if (property.type === 'checkbox') {

                    if (e.target.get('tagName') !== 'INPUT') {
                        if (!property.checkbox.get('checked')) {
                            property.checkbox.set('checked', true);
                        } else {
                            property.checkbox.set('checked', false);
                        }

                        e.currentTarget = property.checkbox;
                    }

                    this._onChangeHandler(e);
                }

                if (this._currentEditor && this._currentEditor.element === target) {
                    return;
                }

                if (this._currentEditor) {
                    this.fire('propertyeditor:beforechange', {'current' : target});
                }

                this._currentEditor = {'element' : target, 'property' : property};

                this._renderByType(target, property);

            }

        },

        _onEscape : function(e) {
            if(this._currentEditor) {
                this._beforeCellChange();
                this._currentEditor = null;
            }
        },

        _onPropertyChange : function(el, property) {

            switch(property.type) {

                case 'list':

                    var select = el.one('select');
                    var textSelected = '';

                    select.get('options').each(function() {
                        if(this.get('selected')) {
                            textSelected = this.get('text');
                            return;
                        }
                    });

                    property.label.set('text', textSelected);

                    el.removeClass('active');
                    el.removeClass('rendered');

                    el.replaceChild(property.label, select);

                    break;

                case 'text':
                case 'spinner':
                    var input = el.one('input');
                    if (input) {
                        property.label.set('text', input.get('value'));

                        el.removeClass('active');
                        el.removeClass('rendered');

                        el.replaceChild(property.label, input);
                    }

                    break;

            }

        },

        _renderByType : function(el, property) {

            var src    = Y.one(el);
            if(src.hasClass('rendered')) return;

            switch(property.type) {
                case 'text':
                    this._renderText(src, property);
                    break;

                case 'list':
                    this._renderList(src, property);
                    break;

                case 'spinner':
                    this._renderSpinner(src, property);
                    break;
            }
        },

        _renderText : function(src, property) {

            var input = Y.Node.create(Y.substitute(HTML_TEXT_ELEMENT, {
                value : property.value
            }));

            input.parent = src;
            src.addClass('active rendered');

            src.replaceChild(input, property.label);
        },

        _renderList : function(src, property) {

            if (Y.hasProps(property.data)) {

                var select = Y.Node.create(HTML_SELECT_ELEMENT);

                for (key in property.data) {
                    var opt = Y.Node.create(Y.substitute(HTML_OPTION_ELEMENT, {
                        value : key,
                        text  : property.data[key]
                    }));

                    if (property.value === key) {
                        opt.setAttribute('selected', 'selected');
                    }

                    src.addClass('active rendered');

                    select.parent = src;
                    select.appendChild(opt);
                }

                src.replaceChild(select, src.one('label'));
            }

        },

        _renderSpinner : function(src, property) {

            var input = Y.Node.create(Y.substitute(HTML_SPINNER_ELEMENT, {
                min   : 0,
                max   : 99,
                step  : 1,
                value : property.value
            }));

            input.parent = src;
            src.addClass('active rendered');

            src.replaceChild(input, property.label);
        }

    });

    Y.PropertyEditor = PropertyEditor;

}, '3.2.0' ,{requires:['node', 'json-stringify', 'node-event-simulate', 'event-delegate', 'event-key', 'substitute', 'widget', 'datasource']});
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
        },

        queryStringToObject : function(qs) {
            if (qs === null) {
                return null;
            }
            var amp = qs.split('&'), kv, tmp = {};
            amp.forEach(function(i) {
                kv = i.split('=');
                tmp[kv[0]] = kv[1];
            });
            return tmp;
        }
    };

    Y.mix(Y, objectsExtension);
});
YUI.add('biscuit-history', function(Y) {
    Y.HistoryHash.hashPrefix = '!';
    Y.HistoryManager = new Y.HistoryHash();
}, '3.3.0', {requires:['history']});
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
                    'user'  : this.parent.user.name
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
                            case 'Template_Type__':
                                givenParams[a] = this.parent.current.templateType;
                                return;
                            case 'Posix_Language__':
                                givenParams[a] = this.parent.current.language;
                                return;
                            default:
                                Y.log('missing arg: ' + a, 'error', 'Gateway');
                                throw new Error('missing arg: ' + a);
                        }
                    }
                }, this));

                if (!givenParams.hasOwnProperty('user')) {
                    givenParams['user'] = this.parent.user.name;
                }

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
YUI.add('notifier-plugin', function(Y) {

    Notifier.NAME = 'notifier-plugin';
    Notifier.NS   = 'notifier';

    function Notifier(config) {
        Notifier.superclass.constructor.apply(this, arguments);
    }

    Y.extend(Notifier, Y.Plugin.Base, {

        initializer : function(cfg) {
            this.app = this.get('host');
            this._syncState();
            Y.log('initialized', null, 'Notifier');
        },

        _syncState : function() {
        },

        show : function(hd, bd, timeout) {
            timeout = timeout || 3000;
        	if (window.webkitNotifications.checkPermission() === 1) {
    			return;
        	}
            var n = window.webkitNotifications.createNotification(
	            document.location + '/images/logo.png', hd, bd
	        );
            n.show();
            if (timeout > 0) {
                setTimeout(function() {
                    n.cancel();
                }, timeout);
            }
        },

        destructor : function() {},

        TYPES : {
        	FORBIDDEN : 'Forbidden',
        	WARNING   : 'Warning',
        	NOTICE    : 'Notice',
        	ERROR     : 'Error'
        }
    });

    Y.Notifier = Notifier;

}, '3.3.0', {requires:[]});
YUI.add('editor-plugin', function(Y) {

    /* Private Static variables */
    var
        _cdm = null; // Holds the CodeMirror Instance

    Editor.NAME = 'editor-plugin';
    Editor.NS   = 'editor';

    /**
     * Static property used to define the default attribute
     * configuration for the Editor.
     *
     * @property Editor.ATTRS
     * @type Object
     * @static
     */
    Editor.ATTRS = {
        /**
         * @attribute srcNode
         * @description The outermost DOM node used for hosting the editor
         * @writeOnce
         * @type Node
         */
        srcNode : {
            value : null,
            writeOnce : true
        },
        /**
         * @attribute indentMode
         * @description Determines what the effect of pressing tab is.<br />
         * <ul>
         *    <li>indent Causes tab to adjust the indentation of the selection or current line using the parser's rules.</li>
         *    <li>spaces [Default] Pressing tab simply inserts four spaces</li>
         *    <li>default Leaves the behavior of the tab key to the web browser</li>
         *    <li>shift Pressing tab indents the current line (or selection) one indentUnit deeper, pressing shift-tab, un-indents it</li>
         * </ul>
         *
         * @type String
        */
        indentMode : {
            value : 'spaces',
            writeOnce : false
        },
        /**
         * @attribute indentNewLine
         * @description Determines how indentation is handled when a user inserts a new line.<br />
         * <ul>
         *    <li>indent Causes the new line to be intented by the rules of the parser.</li>
         *    <li>keep [Default] Keeps the indentation of the previous line.</li>
         *    <li>flat Never indents new lines.</li>
         * </ul>
         *
         * @type String
        */
        indentNewLine : {
            value : 'keep',
            writeOnce : false
        },
        /**
         * @attribute indentLength
         * @description An integer that specifies the amount of spaces one 'level' of indentation should add.
         *
         * @type Integer
        */
        indentLength : {
            value : 4,
            writeOnce : false
        }
    };

    function Editor(config) {
        Editor.superclass.constructor.apply(this, arguments);
    }

    Y.extend(Editor, Y.Plugin.Base, {

        /* Api Land */
        setCode : function(code, focus) {
            if (typeof focus === "undefined") {
                focus = true;
            }
            if (code === null) {
                this.empty();
            } else {
                _cdm.setCode(code);
            }
            if (focus) {
                _cdm.focus();
            }
        },

        getCode : function() {
            return _cdm.getCode();
        },

        empty : function() {
            _cdm.setCode('');
        },

        reindent : function() {
            _cdm.reindent();
        },

        setParser : function(parser) {
            _cdm.setParser(parser);
        },

        /* Private land */

        _syncState : function() {

            _cdm = new CodeMirror(this.srcNode, {
                parserfile : ['parsexml.js', 'parsecss.js', 'tokenizejavascript.js', 'parsejavascript.js', 'parsehtmlmixed.js'],
                stylesheet : ['/css/codemirror/xmlcolors.css', '/css/codemirror/jscolors.css', '/css/codemirror/csscolors.css'],
                path       : '/js/3rdparty/codemirror/',
                tabMode    : this.get('indentMode'),
                indentUnit : this.get('indentLength'),
                enterMode  : this.get('indentNewLine'),
                height     : 'auto',

                syntax: 'html',
                profile: 'xhtml',
                onLoad: Y.bind(function(editor) {
                    zen_editor.bind(editor);
                    editor.grabKeys(keyDown, Y.bind(keyDownFilter, this));
                }, this)
            });

            var keyDown = function(event) {
            };

            var keyDownFilter = function(keyCode, event) {

                if (event.ctrlKey) {
                    switch (keyCode) {

                        case 68:
                            event.preventDefault();
                            event.stopPropagation();
                            event.stop();

                            var handle = _cdm.cursorLine(),
                                text = _cdm.lineContent(handle);

                            _cdm.insertIntoLine(handle, 'end', "\n" + text);
                            break;

                        case 76:
                            event.preventDefault();
                            event.stopPropagation();
                            event.stop();

                            var handle = _cdm.cursorLine(),
                                nextLine = _cdm.prevLine(handle);
                            _cdm.removeLine(handle);
                            _cdm.jumpToLine(nextLine);
                            break;

                        case 83:
                            event.preventDefault();
                            event.stopPropagation();
                            event.stop();

                            this.app.saveTemplate();
                            break;
                    }
                }

                return false;
            };
        },

        /* Internals */

        initializer : function(cfg) {

            this.srcNode = Y.one(cfg.srcNode);
            this.app    = this.get('host');

            this._syncState();

            Y.log('initialized', null, 'Editor');
        },

        destructor : function() {
            Y.detach('editor|*');
        }

    });

    Y.Editor = Editor;

}, '3.2.0', {requires:['event-custom']});
YUI.add('settings-plugin', function(Y) {

    Settings.NAME = 'settings-plugin';
    Settings.NS   = 'settings';

    Settings.ATTRS = {
        container : {
            value : null,
            writeOnce : true
        }
    };

    function Settings(config) {
        Settings.superclass.constructor.apply(this, arguments);
    }

    Y.extend(Settings, Y.Plugin.Base, {

        instance : null,

        initializer : function(cfg) {
            this.container = Y.one(cfg.container);
            this.app       = this.get('host');

            this._render();

            Y.log('initialized', null, 'Settings');
        },

        _render : function() {
            this.instance = new Y.Overlay({
                srcNode: '#settings-overlay',
                visible: false,
                shim: false
            });
            this.instance.render();
            Y.log('rendered overlay', null, 'Settings');

            this.instance.subscribe('visibleChange', function(e) {
                if (e.newVal) {
                    this.app.toolbar.setActiveEditorMode(this.app.toolbar.settings.button);
                    this.app.nodes.templateVersionSelect.hide();
                    this.app.nodes.templateTypeVersionSelect.show();
                } else {
                    this.app.toolbar.setActiveEditorMode();
                    this.app.nodes.templateVersionSelect.show();
                    this.app.nodes.templateTypeVersionSelect.hide();
                }
            }, this);

            this.app.gateway.emit(Biscuit.Locator.rest.services.templatetype.gettypes);

            this._syncState();

            this._bindEvents();
        },

        _syncState : function() {
            this.selectTplType = this.instance.bodyNode.one('.tpl-type');
        },

        _bindEvents : function() {
            this.app.gateway.listen(Biscuit.Locator.rest.services.templatetype.gettypes, Y.bind(this._setTemplateTypeList, this));
            this.selectTplType.on('change', function(e) {
                var el = e.currentTarget;
                this.app.current.templateType = el.get('value');
                this.app.gateway.emit(Biscuit.Locator.rest.services.templatetype.setproperties, { 'params' : {
                    'Template_Type__' : this.app.current.templateType,
                    'Options'         : ''
                }});
                this.app.gateway.emit(Biscuit.Locator.rest.services.templatetype.getproperties);
            }, this);
        },

        hide : function() {
            this.instance.hide();
        },

        show : function() {
            var WidgetPositionAlign = Y.WidgetPositionAlign;
            this.instance.bodyNode.get('parentNode').setStyle('width', this.container.get('offsetWidth'));
            this.instance.bodyNode.get('parentNode').setStyle('height', this.container.get('offsetHeight'));
            this.instance.set('align', {
                node: this.container,
                points: [WidgetPositionAlign.TL, WidgetPositionAlign.TL]
            });
            this.instance.show();
        },

        destructor : function() {
            Y.detach('Settings|*');
        },

        _setTemplateTypeList : function(e, event, data, error) {
            switch (error) {
                case 'NO_DATA':
                    Y.log('empty template types list', 'error', 'Settings');
                    return;
            }
            var html = [];
            html.push(Y.Node.create('<option value="">None</option>'));
            data.forEach(function(o) {
                html.push(Y.Node.create(Y.substitute('<option value="{value}">{value}</option>', {
                    'value' : o['Template_Type__']
                })));
            });
            html = Y.all(html);
            this.selectTplType.append(html);
        }

    });

    Y.Settings = Settings;

}, '3.2.0', {requires:['overlay', 'node', 'substitute']});
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

                this._syncState();

                this._bindEvents();
            },

            _bindEvents : function() {
                var nodes = this.nodes;

                this.app.on('datastore:ready', Y.bind(this._populateServerList, this));

                this.app.gateway.listen(Biscuit.Locator.rest.services.page.list, Y.bind(this._populatePageList, this));

                this.instance.headerNode.one('.close').on('topNavigationOverlay|click', Y.bind(this.hide, this));

                this.instance.footerNode.one('.recent .content').delegate('click', Y.bind(this._onRecentItemClick, this), 'li');

                nodes.serverBc.on('topNavigationOverlay|click', this.showServerList, this);

                nodes.serverListContainer.delegate('click', Y.bind(this._onServerItemClick, this), 'li');

                nodes.pageListContainer.delegate('click', Y.bind(this._onPageItemClick, this), 'li');

                this.nodes.serverOverlay.on('topNavigationOverlay|clickoutside',  Y.bind(this._clickOutside, this));
            },

            _syncState : function() {
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

                this.nodes.pageListContainer.hide();

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

                if (servers.length === 5) {
                    servers.pop();
                }
                servers.unshift({id : id, name : name});
                localStore.set(localStore.definitions.RECENT_SERVERS, servers);
            },

            _setServer : function(id, name) {
                Y.log('picked server: ' + name, null, 'TopNavigationListOverlay');

                this.parent.setServer(id, name);

                this._storeServer(id, name);

                this.app.gateway.emit(Biscuit.Locator.rest.services.page.list, { 'params' : { 'Server__' : id }});
            },

            _setPage : function(id, name) {
                Y.log('picked page: ' + id, null, 'TopNavigationListOverlay');

                this.parent.setPage(id, name);

                this.app.current.template = 'main';

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
YUI.add('top-nav-overlay-search', function(Y) {

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
                this._syncState();

                this._bindEvents();
            },

            _bindEvents : function() {
                this.nodes.searchField.on(
                    'key',
                    this._onNavigationKeys,
                    'up:' + [KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_ENTER, KEY_BACKSPACE].join(','),
                    this
                );

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
                this.current['nodes'].stripHTML();
                this.current['nodes'].show();

                this.nodes.searchField.removeClass(this.CLASSNAMES.SEARCH_INPUT_NO_RESULTS);

                if (value === '') {
                    Y.log('empty search query', null, 'TopNavigationListOverlaySearch');
                    return false;
                }
                if (!Y.isYNode(this.current['nodes']) || this.current['nodes'].size() <= 0) {
                    Y.log('could not find any list node', 'warn', 'TopNavigationListOverlaySearch');
                    return false;
                }

                if (value.length >= 3) {
                    Y.log('filtering list for query: ' + value, null, 'TopNavigationListOverlaySearch');
                    var nodeList = this.instance.bodyNode.all('.' + this.current['type'] + '-list > li:not([data-text*="' + value + '"])');
                    nodeList.hide();

                    this.current['count'] = this.current['nodes'].size() - nodeList.size();
                    this.current['searchresults'] = this.instance.bodyNode.all('.' + this.current['type'] + '-list > li[data-text*="' + value + '"]');

                    this.current['searchresults'].highlight(value);

                    if (this.current['count'] === 0) {
                        Y.log('could not find any server for query: ' + value, null, 'TopNavigationListOverlaySearch');
                        this.nodes.searchField.addClass(this.CLASSNAMES.SEARCH_INPUT_NO_RESULTS);
                    }
                }
            },
        }
    }

    Y.TopNavigationListOverlaySearch = TopNavigationListOverlaySearch;
}, '3.3.0', {requires:['node++', 'event-key', 'node-event-simulate']});
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

            this.srcNode.all('li').removeClass(this.CLASSNAMES.TAB_ACTIVE);
            el.addClass(this.CLASSNAMES.TAB_ACTIVE);

            if (!serverId) {
                this.listOverlay.show(el, 'server');
                this.app.resetLayout();
                return;
            }

            this.app._setServerLanguages(serverId);

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
            this.listOverlay.hide();
            var list = tab.ancestor('ul').get('children');

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
                    el.one('h3').set('text', Y.substitute(SERVER_NAME_TEMPLATE, {id: id, name: name}));
                    el.one('h4').set('innerHTML', '&nbsp;');
                    el.setAttribute('data-server', id);
                    if (this.getCurrentTab() === el) {
                        this.app.current.server = id;
                    }
                    break;
                case 'page':
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

            e.stopImmediatePropagation();

            this.openTab(el);
        },

        _onCloseClick : function(e) {
            var el = e.currentTarget.ancestor('li');
            this.closeTab(el);
        },

        _onServerClick : function(e) {
            var tabNode = e.currentTarget.ancestor('li');

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
YUI.add('toolbar-button-compile', function(Y) {
    const BUTTON_COMPILING = 'compiling',
          BUTTON_HIDE      = 'hide';

    function ButtonCompile() {
        this._initButtonCompile();
    }

    ButtonCompile.prototype = {
        _initButtonCompile : function() {
            this.compile.parent = this;
            this.compile._init();
        },

        compile : {
            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.compile');

                this._bindEvents();
            },

            _click : function() {
                this.app.gateway.emit(Biscuit.Locator.rest.services.page.compile);
                this.button.addClass(BUTTON_COMPILING);
            },

            _bindEvents : function() {
                this.app.gateway.listen(Biscuit.Locator.rest.services.page.compile, Y.bind(function() {
                    this.button.removeClass(BUTTON_COMPILING);
                    this.button.addClass(this.parent.CLASSNAMES.BUTTON_HIGHLIGHT);
                    this.app.notifier.show(this.app.notifier.TYPES.NOTICE, "The compilation has been processed.");
                    setTimeout(Y.bind(function() {
                        this.button.removeClass(this.parent.CLASSNAMES.BUTTON_HIGHLIGHT);
                    }, this), 1200);
                }, this));

                this.app.gateway.listen(Biscuit.Locator.rest.services.template.list, Y.bind(function() {
                    if (this.app.current.page === '__common') {
                        this.button.removeClass(BUTTON_HIDE);
                        this.button.show();
                    } else {
                        this.button.addClass(BUTTON_HIDE);
                        this.button.hide();
                    }
                }, this));
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonCompile = ButtonCompile;
}, '3.3.0', {requires:[]});
YUI.add('toolbar-button-contents', function(Y) {
    function ButtonContents() {
        this._initButtonContents();
    }

    ButtonContents.prototype = {
        _initButtonContents : function() {
            this.contents.parent = this;
            this.contents._init();
        },

        contents : {
            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.button.contents');

                this._syncState();
            },

            _syncState : function() {
                this.app.nodes.templateVersionSelect.show();
            },

            _click : function() {
                this.toggle();
            },

            toggle : function() {
                if (!this.button.hasClass(this.parent.CLASSNAMES.BUTTON_ACTIVE)) {
                    this.app.settings.hide();
                    this.parent.setActiveEditorMode(this.button);
                }
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonContents = ButtonContents;
}, '3.3.0', {requires:[]});
YUI.add('toolbar-button-lock', function(Y) {
    function ButtonLock() {
        this._initButtonLock();
    }

    ButtonLock.prototype = {
        _initButtonLock : function() {
            this.lock.parent = this;
            this.lock._init();
        },

        lock : {
            overlay : {},

            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.button.lock');
                this.container = this.app.editor.srcNode;

                this._render();
                this._bindEvents();
            },

            _render : function() {
                this.overlay.transparent = new Y.Overlay({
                    srcNode: '#transparent-overlay',
                    visible: false,
                    shim: false
                });
                this.overlay.transparent.render();
                Y.log('rendered transparent overlay', null, 'ButtonLock');

                this.overlay.prompt = new Y.Overlay({
                    srcNode: '#lock-overlay',
                    visible: false,
                    shim: false,
                    plugins : [{fn:Y.AnimSlidePlugin}]
                });
                this.overlay.prompt.render();
                Y.log('rendered prompt overlay', null, 'ButtonLock');

                this.overlay.prompt.get('boundingBox').setStyle('width', '100%');

                this.app.registeredOverlay.push(this.overlay.transparent);
                this.app.registeredOverlay.push(this.overlay.prompt);
            },

            _bindEvents : function() {
                this.app.gateway.listen(Biscuit.Locator.rest.services.lock.unset, Y.bind(this.unbind, this));
                this.app.gateway.listen(Biscuit.Locator.rest.services.lock.set, Y.bind(function() {
                    this.overlay.prompt.hide();
                    this.app.current.isLocked = true;
                    this.button.addClass(this.parent.CLASSNAMES.BUTTON_ACTIVE);
                }, this));

                Y.one('#lock_cancel').on('click', function() {
                    this.overlay.prompt.hide();
                }, this);

                Y.one('#lock_submit').on('click', function() {
                    var getLockType = function() {
                        var t = [Y.one('#lock_type_1'), Y.one('#lock_type_2'), Y.one('#lock_type_3')], lockType;
                        t.forEach(function(el) {
                            if (el.get('checked')) {
                                lockType = el.get('value');
                            }
                        });
                        return lockType;
                    };
                    var lockType = getLockType(),
                        lockMessage = Y.one('#lock_msg').get('value');

                    if (!lockType) {
                        Y.log('no lock type defined', 'warn', 'ButtonLock');
                        return;
                    }

                    var params = {};
                    switch (lockType) {
                        case '3':
                            params['Template__'] = this.app.current.template;
                        case '2':
                            params['Page__'] = this.app.current.page;
                            break;
                    }

                    if (lockMessage) {
                        params['comment'] = lockMessage;
                    }

                    this.app.gateway.emit(Biscuit.Locator.rest.services.lock.set, { 'params' : params});
                }, this);
            },

            _click : function() {
                this.toggle();
            },

            unbind : function() {
                this.app.current.isLocked = false;
                this.app.current.lockData = {};
                this.button.removeClass(this.parent.CLASSNAMES.BUTTON_ACTIVE);
                this.overlay.transparent.hide();
                Y.one('.context-template').show();
            },

            bind : function(data) {
                this.app.current.isLocked = true;
                this.app.current.lockData = data;
                this.button.addClass(this.parent.CLASSNAMES.BUTTON_ACTIVE);

                if (this.app.user.name === data['User']) {
                    this.overlay.transparent.hide();
                    return;
                }

                Y.one('.context-template').hide();

                var notice = this.overlay.transparent.bodyNode.one('.notice');
                if (notice) {
                    notice.get('children').remove();
                } else {
                    notice = Y.Node.create('<div class="notice"></div>');
                }
                var message = [
                    '<h3>Template locked by <span>' + data['User'] + '</span></h3>',
                    '<br />',
                    '<em>' + data['StampWords'] + '</em>',
                    '<p class="spaced">The content of this template has been locked and is therefore not writable.</p>'
                ];

                data['Comment'] = data['Comment'] === '' ? null : data['Comment'];
                if (data['Comment'] !== null) {
                    message.push('<h4>Reason stated</h4><p class="comment">' + data['Comment'] + '</p>');
                } else {
                    message.push('<h4>No reason stated</h4>');
                }

                message.push('<h4>Locked on the ' + data['LockLevel'] + ' level</h4>');

                if (data['UserLevel'] < this.app.user.level) {
                    message.push('<p>You don\'t have the required rights to unlock this level.</p>');
                }

                var message = Y.Node.create(message.join(''));
                notice.appendChild(message);
                this.overlay.transparent.bodyNode.appendChild(notice);

                var WidgetPositionAlign = Y.WidgetPositionAlign;
                this.overlay.transparent.bodyNode.get('parentNode').setStyle('width', this.container.get('offsetWidth'));
                this.overlay.transparent.bodyNode.get('parentNode').setStyle('height', this.container.get('offsetHeight'));
                this.overlay.transparent.set('align', {
                    node: this.container,
                    points: [WidgetPositionAlign.TL, WidgetPositionAlign.TL]
                });
                this.overlay.transparent.show();
            },

            toggle : function() {
                if (this.button.hasClass(this.parent.CLASSNAMES.BUTTON_ACTIVE)) {
                    if (this.app.current.isLocked) {
                        if (this.app.current.lockData['UserLevel'] < this.app.user.level) {
                            Y.log('tried to unlock without the matching rights', 'warn', 'ButtonLock');
                            this.app.notifier.show(this.app.notifier.TYPES.FORBIDDEN, "You don't have the required rights to unlock this template.");
                            return;
                        }

                        var lockLevel = this.app.current.lockData['LockLevel'], params = {};
                        switch (lockLevel) {
                            case 'template':
                                params['Template__'] = this.app.current.template;
                            case 'page':
                                params['Page__'] = this.app.current.page;
                                break;
                        }
                        this.app.gateway.emit(Biscuit.Locator.rest.services.lock.unset, { 'params' : params });
                    } else {
                        Y.log('tried to unlock the unlocked', 'error', 'ButtonLock');
                    }
                } else {
                    this.overlay.prompt.show();
                    Y.one('#lock_msg').focus();
                }
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonLock = ButtonLock;
}, '3.3.0', {requires:['node', 'overlay', 'overlay-fx-slide-plugin']});
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
YUI.add('toolbar-button-push', function(Y) {
    const REGEX_DATETIME = /^[\d]{2}\-[\d]{2}\-[\d]{4} [\d]{2}\:[\d]{2}\:[\d]{2}$/;
    const BUTTON_LOADING_CLASSNAME = 'loading';

    function ButtonPush() {
        this._initButtonPush();
    }

    ButtonPush.prototype = {
        _initButtonPush : function() {
            this.push.parent = this;
            this.push._init();
        },

        push : {
            overlay : {},

            step : 1,

            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.button.push');
                this.container = this.app.editor.srcNode;

                this._render();
                this._bindEvents();
            },

            _render : function() {
                this.overlay.prompt = new Y.Overlay({
                    srcNode: '#push-overlay',
                    visible: false,
                    shim: false,
                    plugins : [{fn:Y.AnimSlidePlugin}]
                });
                this.overlay.prompt.render();
                Y.log('rendered prompt overlay', null, 'ButtonPush');

                this.overlay.prompt.get('boundingBox').setStyle('width', '100%');

                this.contentBox = this.overlay.prompt.get('contentBox');
                this.app.registeredOverlay.push(this.overlay.prompt);
            },

            switchToStep : function(step) {
                switch (step) {
                    case 1:
                        this.contentBox.one('.step-2').hide();
                        Y.one('#push_submit span').set('text', 'Next');
                        Y.one('#push_previous').hide();
                        this.contentBox.one('.step-1').show();
                        this.step = 1;
                        break;
                    case 2:
                        this.contentBox.one('.step-1').hide()
                        Y.one('#push_submit span').set('text', 'Submit');
                        Y.one('#push_previous').show();
                        this.contentBox.one('.step-2').show();
                        this.step = 2;
                        break;
                }
            },

            _bindEvents : function() {
                this.app.gateway.listen(Biscuit.Locator.rest.services.push.getfiles, Y.bind(this._onSecondStep, this));
                this.app.gateway.listen(Biscuit.Locator.rest.services.push.new, Y.bind(this._onSubmit, this));

                Y.one('#push_previous').on('click', function(e) {
                    e.halt();
                    this.switchToStep(1);
                }, this);

                Y.one('#push_cancel').on('click', function(e) {
                    e.halt();
                    this.overlay.prompt.hide();
                }, this);

                Y.one('#push_folder').on('click', function(e) {
                    if (this.get('checked')) {
                        Y.one('#push_folder_group_container').show();
                    } else {
                        Y.one('#push_folder_group_container').hide();
                    }
                });

                Y.one('#push_submit').on('click', this._onSubmitButtonClick, this);
            },

            _click : function() {
                this.toggle();
            },

            _onSubmitButtonClick : function(e) {
                var ticket          = Y.one('#push_ticket').get('value'),
                    datetime        = Y.one('#push_datetime').get('value'),
                    comment         = Y.one('#push_msg').get('value'),
                    pushPages       = Y.one('#push_pages').get('checked'),
                    pushFolder      = Y.one('#push_folder').get('checked'),
                    pushFolderGroup = Y.one('#push_folder_group').get('checked');

                var button = e.currentTarget;
                switch (this.step) {
                    case 1:
                        if (
                            !isNaN(parseInt(ticket))
                            && REGEX_DATETIME.test(datetime)
                            && (pushPages || pushFolder)
                        ) {
                            e.halt();
                            button.set('disabled', true).addClass(BUTTON_LOADING_CLASSNAME);

                            this.app.gateway.emit(Biscuit.Locator.rest.services.push.getfiles, { 'params' : {
                                'pushPages'       : pushPages ? 1 : 0,
                                'pushFolder'      : pushFolder ? 1 : 0,
                                'pushFolderGroup' : pushFolderGroup ? 1 : 0,
                            }});
                        } else {
                            return;
                        }
                    break;
                    case 2:
                        e.halt();

                        var files = this.contentBox.all('.step-2 .list input[type=checkbox]'), pushFiles = [];
                        files.each(function(file) {
                            if (file.get('checked')) {
                                pushFiles.push(file.getAttribute('data-filename'));
                            }
                        });

                        if (pushFiles.length === 0) {
                            Y.log("user didn't pick any file", null, 'ButtonPush');
                            return;
                        }

                        var type = null;
                        if (pushPages && pushFolder && pushFolderGroup) {
                            type = 'ALL_GROUP';
                        } else if (pushPages && pushFolder) {
                            type = 'ALL';
                        } else if (pushPages) {
                            type = 'PAGE';
                        } else if (pushFolder && pushFolderGroup) {
                            type = 'FOLDER';
                        } else if (pushFolder) {
                            type = 'FOLDER_GROUP';
                        }

                        Y.one('#push_submit').set('disabled', true).addClass(BUTTON_LOADING_CLASSNAME);
                        this.app.gateway.emit(Biscuit.Locator.rest.services.push.new, { 'params' : {
                            'date'    : datetime,
                            'type'    : type,
                            'ticket'  : ticket,
                            'comment' : comment ? comment : null,
                            'files'   : pushFiles.join('#')
                        }});
                        break;
                }
            },

            _onSecondStep : function(e, event, data, error) {
                Y.one('#push_submit').set('disabled', false).removeClass(BUTTON_LOADING_CLASSNAME);

                switch (error) {
                    case 'NO_DATA':
                        Y.log('nothing to deliver', null, 'ButtonPush');
                        this.app.notifier.show(this.app.notifier.TYPES.NOTICE, "This website is already synchronized.");
                        return;
                }
                data = data[0];

                var list = this.contentBox.one('.step-2 .list'), html = [], i = 0;
                for (var file in data) {
                    html.push(Y.Node.create('<li><input type="checkbox" id="push-filename-' + i + '" data-filename="' + file + '" /><label for="push-filename-' + i + '">' + data[file] + '</label></li>'));
                    i++;
                }
                list.get('children').remove();
                list.append(Y.all(html));

                this.switchToStep(2);
            },

            _onSubmit : function(e, event, data, error) {
                Y.one('#push_submit').set('disabled', false).removeClass(BUTTON_LOADING_CLASSNAME);

                switch (error) {
                    case 'NO_DATA':
                        return;
                }

                this.app.notifier.show(this.app.notifier.TYPES.NOTICE, "Your push query has been submitted successfully.");
                this.overlay.prompt.hide();
            },

            toggle : function() {
                if (this.overlay.prompt.get('visible')) {
                    this.overlay.prompt.hide();
                } else {
                    this.overlay.prompt.show();

                    this.switchToStep(1);

                    var date = Y.DataType.Date.format(new Date(), {format:'%d-%m-%Y %T'});
                    Y.one('#push_datetime').set('value', date);

                    Y.one('#push_ticket').focus();
                }
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonPush = ButtonPush;
}, '3.3.0', {requires:['node', 'overlay', 'datatype-date', 'overlay-fx-slide-plugin']});
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
                this.button = Y.one('.save');

                this._bindEvents();
            },

            _bindEvents : function() {
                this.app.gateway.listen(Biscuit.Locator.rest.services.template.save, Y.bind(function() {
                    this.button.addClass(this.parent.CLASSNAMES.BUTTON_HIGHLIGHT);
                    setTimeout(Y.bind(function() {
                        this.button.removeClass(this.parent.CLASSNAMES.BUTTON_HIGHLIGHT);
                    }, this), 1200);
                }, this));
            },

            _click : function() {
                this.app.saveTemplate();
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonSave = ButtonSave;
}, '3.3.0', {requires:[]});
YUI.add('toolbar-button-settings', function(Y) {
    function ButtonSettings() {
        this._initButtonSettings();
    }

    ButtonSettings.prototype = {
        _initButtonSettings : function() {
            this.settings.parent = this;
            this.settings._init();
        },

        settings : {
            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.button.settings');
            },

            _click : function() {
                this.toggle();
            },

            toggle : function() {
                if (this.button.hasClass(this.parent.CLASSNAMES.BUTTON_ACTIVE)) {
                    this.app.settings.hide();
                } else {
                    this.app.settings.show();
                }
            }
        }
    };

    Y.namespace('Toolbar');
    Y.Toolbar.ButtonSettings = ButtonSettings;
}, '3.3.0', {requires:[]});
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
            this.srcNode.one('.version').hide();
        },

        show : function() {
            this.srcNode.all('.' + this.CLASSNAMES.BUTTON + ':not(.hide)').show();
            this.srcNode.one('.version').show();
        },

        setActiveEditorMode : function(button) {
            button = button || this.srcNode.one('li:first-child');
            this.srcNode.one('.context-editor').get('children').removeClass(this.CLASSNAMES.BUTTON_ACTIVE);
            button.addClass(this.CLASSNAMES.BUTTON_ACTIVE);
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
            BUTTON           : 'button',
            BUTTON_ACTIVE    : 'active',
            BUTTON_HIGHLIGHT : 'highlight'
        }

    });

    Y.namespace('Toolbar');
    Y.Toolbar.Main = Y.Base.mix(Toolbar, [
        Y.Toolbar.ButtonContents,
        Y.Toolbar.ButtonSettings,
        Y.Toolbar.ButtonSave,
        Y.Toolbar.ButtonMore,
        Y.Toolbar.ButtonRename,
        Y.Toolbar.ButtonLock,
        Y.Toolbar.ButtonCompile,
        Y.Toolbar.ButtonPush
    ]);

}, '3.3.0', {requires:[
    'plugin',
    'node',
    'event',
    'toolbar-button-contents',
    'toolbar-button-settings',
    'toolbar-button-save',
    'toolbar-button-more',
    'toolbar-button-rename',
    'toolbar-button-lock',
    'toolbar-button-compile',
    'toolbar-button-push'
]});
YUI.add('template-actions-button-add', function(Y) {
    function ButtonAdd() {
        this._initButtonAdd();
    }

    ButtonAdd.prototype = {
        _initButtonAdd : function() {
            this.add.parent = this;
            this.add.app = this.app;
            this.add._init();
        },

        add : {
            _init : function() {
                this.app = this.parent.get('host');
            },

            _click : function() {
                if (this.app.nodes.templateListContainer.one('input')) {
                    return;
                }

                var li    = Y.Node.create(Y.substitute(this.app.TEMPLATES.LIST, {id: 0, languages: this.app.current.defaultLanguage})),
                    label = Y.Node.create(this.app.TEMPLATES.LABEL),
                    input = Y.Node.create(this.app.TEMPLATES.TEXT_INPUT_IN_PLACE);

                label.setStyle('display', 'none');
                input.set('value', 'template name');

                this.app.nodes.templateList.removeClass(this.app.CLASSNAMES.TEMPLATE_CURRENT);
                li.addClass(this.app.CLASSNAMES.TEMPLATE_CURRENT);
                li.addClass(this.app.CLASSNAMES.TEMPLATE_EDITABLE);
                li.addClass(this.app.CLASSNAMES.TEMPLATE_NEW);
                li.append(label);
                li.append(input);

                this.app.editor.empty();

                this.app.nodes.templateListContainer.prepend(li);
                this.app.nodes.templateList._nodes = this.app.nodes.templateList._nodes.concat(li);
                input.focus();
                input.select();
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
            this.del.app = this.app;
            this.del._init();
        },

        del : {
            _init : function() {
                this.app = this.parent.get('host');
                this.button = Y.one('.template-actions .del');
                this._bindEvents();
            },

            _bindEvents : function() {
                this.button.on('mouseout', this._clickOutside, this);

                this.app.gateway.listen(Biscuit.Locator.rest.services.template.delete, Y.bind(function() {
                    var li = this.app.getTemplateById(this.app.current.template);
                    li.remove();
                    this.app.editor.empty();
                    this.button.removeClass(this.CLASSNAMES.SURE);

                    this.app.notifier.show(this.app.notifier.TYPES.NOTICE, "Template " + this.app.current.template + " successfully deleted.");

                    this.app.current.template = null;
                }, this));
            },

            _click : function() {
                if (!this.button.hasClass(this.CLASSNAMES.SURE)) {
                    this.button.addClass(this.CLASSNAMES.SURE);
                    return;
                }

                this.app.gateway.emit(Biscuit.Locator.rest.services.template.delete, { 'params' : {
                    'Template__' : this.app.current.template
                }});
            },

            _clickOutside : function() {
                if (this.button.hasClass(this.CLASSNAMES.SURE)) {
                    this.button.removeClass(this.CLASSNAMES.SURE);
                }
            },

            CLASSNAMES : {
                SURE : 'sure'
            }
        }
    };

    Y.namespace('TemplateActions');
    Y.TemplateActions.ButtonDel = ButtonDel;
}, '3.3.0', {requires:['anim']});
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
YUI.add('template-actions-button-properties', function(Y) {
    function ButtonProperties() {
        this._initButtonProperties();
    }

    ButtonProperties.prototype = {
        _initButtonProperties : function() {
            this.properties.parent = this;
            this.properties._init();
        },

        properties : {
            _init : function() {
                this.app = this.parent.get('host');
            },

            _click : function() {
                console.log('click');
            }
        }
    };

    Y.namespace('TemplateActions');
    Y.TemplateActions.ButtonProperties = ButtonProperties;
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
        Y.TemplateActions.ButtonDel,
        Y.TemplateActions.ButtonLanguage
    ]);

}, '3.3.0', {requires:[
    'plugin',
    'node',
    'event',
    'template-actions-button-add',
    'template-actions-button-del',
    'template-actions-button-properties',
    'template-actions-button-language'
]});
YUI.add('biscuit', function(Y) {

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
            templateType : null,

            isLocked : false,
            lockData : {},

            language  : null,
            languages : null,
            defaultLanguage : null
        },

        registeredOverlay : [],

        user : {
            level : null,
            name  : null
        },

        nodes : {
            templateList : null,
            templateListContainer : null,
            templateActions : null,
            templateActionsLanguageSelect : null,
            versionSelect : null
        },

        initializer : function(cfg) {
            this.publish('biscuit:preloaded', { preventable: false, broadcast: 1 });

            this._syncState();
            this._bindEvents();

            Y.log('initialized', null, 'Biscuit');
        },

        hideLoadingLayer : function() {
            var anim = new Y.Anim({
                node: '.biscuit-loading',
                to: { opacity: 0 }
            });
            anim.on('end', function() {
                this._node.hide();
            });

            setTimeout(Y.bind(function() {
                anim.run();
            }, this), 500);
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
                if (el === null) {
                    return;
                }
            }

            var templateName = el.getAttribute('data-id');
            var languages = el.getAttribute('data-languages');
            if (!this.current.language || languages.indexOf(this.current.language) === -1) {
                this.current.language = this.current.defaultLanguage;

                if (languages.indexOf(this.current.defaultLanguage) === -1) {
                    this.current.language = languages.split(',')[0];
                }
            }

            this.nodes.templateList.removeClass(this.CLASSNAMES.TEMPLATE_CURRENT);
            this.nodes.templateList.removeClass(this.CLASSNAMES.TEMPLATE_EDITABLE);
            el.addClass(this.CLASSNAMES.TEMPLATE_CURRENT);

            var languageButton = this.nodes.templateActions.one('.language');
            if (languageButton) {
                if (this.current['languages']) {
                    if (this.current['languages'].length > 1) {
                        var select = Y.Node.create('<select>'), option;

                        languages = languages.split(',');
                        languages.forEach(Y.bind(function(o) {
                            option = Y.Node.create(Y.substitute(this.TEMPLATES.OPTION, {
                                'id'    : o,
                                'value' : o
                            }));
                            if (o === this.current.language) {
                                option.set('selected', true);
                            }
                            select.appendChild(option);
                        }, this));

                        var span = Y.Node.create('<span class="addlanguage">››</span><span class="deletelanguage">X</span>');
                        languageButton.empty().appendChild(select);
                        languageButton.appendChild(span);
                        this.nodes.templateActionsLanguageSelect = select;
                    } else {
                        languageButton.empty();
                    }
                }
            }

            this._setTemplate(templateName, this.current.language);
            return el;
        },

        buildTemplateList : function(templates) {
            var html = [], i, node,
                templateList = this.nodes.templateListContainer;

            for (i = 0; node = templates[i++];) {
                if (node['Name'].trim() === '') {
                    continue;
                }

                var li = Y.Node.create(Y.substitute(this.TEMPLATES.LIST, {id: node['Name'], languages: node['Languages']}));

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
            this.editor.empty();

            this.resetTemplateList();

            this.toolbar.hide();

            this.toolbar.setActiveEditorMode();
            this.settings.hide();

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

            this.nodes.templateVersionSelect.set('value', '-1');
        },

        _setServerLanguages : function(id) {
            this.gateway.emit(Biscuit.Locator.rest.services.server.languages, { 'params' : { 'Server__' : id}});
        },

        _bindEvents : function() {
            this.gateway.listen(Biscuit.Locator.rest.services.server.languages, Y.bind(this._buildLanguageList, this));

            this.gateway.listen(Biscuit.Locator.rest.services.template.list, Y.bind(this._populateTemplateList, this));

            this.gateway.listen(Biscuit.Locator.rest.services.lock.get, Y.bind(this._getUserLock, this));

            this.gateway.listen(Biscuit.Locator.rest.services.version.template, Y.bind(this._getTemplateVersions, this));

            this.gateway.listen(Biscuit.Locator.rest.services.version.templatetype, Y.bind(this._getTemplateTypeVersions, this));

            this.gateway.listen(Biscuit.Locator.rest.services.template.content, Y.bind(this._setTemplateContent, this));

            this.gateway.listen(Biscuit.Locator.rest.services.templatetype.getproperties, Y.bind(this._setTemplateType, this));

            this.gateway.listen(Biscuit.Locator.rest.services.templatetype.setproperty, Y.bind(function() {
                this.gateway.emit(Biscuit.Locator.rest.services.templatetype.getproperties);
            }, this));

            this.gateway.listen(Biscuit.Locator.rest.services.templatetype.setproperties, Y.bind(function() {
                this.gateway.emit(Biscuit.Locator.rest.services.templatetype.getproperties);
            }, this));

            this.nodes.templateListContainer.delegate('click', this._onTemplateItemClick, 'li:not(.active)', this);

            this.nodes.templateListContainer.delegate('dblclick', this._onTemplateRenameClick, 'li.active', this);

            this.nodes.templateListContainer.delegate('contextmenu', this._onTemplateContextMenu, 'li', this);

            this.nodes.templateListContainer.delegate('keyup', this._onTemplateInputValidated, 'li.active > input', this);

            this.nodes.templateVersionSelect.on('change', this._onTemplateVersionChanged, this);

            this.nodes.templateTypeVersionSelect.on('change', this._onTemplateTypeVersionChanged, this);

            Y.on('key', Y.bind(function(e) {
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.saveTemplate();
                }
            }, this), document, 'down:83');

            this.on('datastore:ready', Y.bind(this._syncSession, this));
        },

        _syncState : function() {
            this.nodes = {
                templateListContainer : Y.one('.template-list'),
                templateActions       : Y.one('.template-actions'),

                templateVersionSelect     : Y.one('.version .template'),
                templateTypeVersionSelect : Y.one('.version .templatetype')
            };

            this.user.name  = Biscuit.User;
            this.user.level = Biscuit.UserLevel;

            this.propgrid = new Y.PropertyEditor();
            this.propgrid.set('header', {name: 'Name', value: 'Value'});
            this.propgrid.subscribe('propertyeditor:change', Y.bind(this._setTemplateTypeProperty, this));
        },

        _restoreSession : function(tabs) {
            var serverName, serverId, page, template;
            for (prop in tabs) {

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
                this.notifier.show(this.notifier.TYPES.NOTICE, "Session restored from URI hash.");
                Y.log('restored session from uri hash', 'warn', 'Session');
            } else if (Y.hasProperties(currentTabs)) {
                this._restoreSession(currentTabs);
                this.notifier.show(this.notifier.TYPES.NOTICE, "Your previous session has been restored.");
                Y.log('restored session from local storage', 'warn', 'Session');
            } else {
                this.topNav.newTab();
                Y.log('no session found', 'warn', 'Session');
            }

            if (!this.current.template) {
                this.toolbar.hide();
            }

            this.hideLoadingLayer();
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
                newValue = input.get('value'),
                isNew = li.hasClass(this.CLASSNAMES.TEMPLATE_NEW);

            value = li.getAttribute('data-id');
            if (this.REGEX.TEMPLATE.test(value) && !defaultValue) {
                value = newValue;
                this.gateway.emit(Biscuit.Locator.rest.services.template.rename, { 'params' : {
                    'Template__' : previousValue,
                    'Name'       : newValue
                }});
            } else if (isNew) {
                if (this.REGEX.TEMPLATE.test(newValue)) {
                    value = newValue;
                    li.removeClass(this.CLASSNAMES.TEMPLATE_NEW);
                    this.gateway.emit(Biscuit.Locator.rest.services.template.new, { 'params' : {
                        'Template__' : newValue
                    }});
                } else {
                    li.remove();
                    return null;
                }
            }

            input.remove();
            li.removeClass(this.CLASSNAMES.TEMPLATE_EDITABLE);
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
            e.halt();
            var el = e.currentTarget;
            if (!el.hasClass(this.CLASSNAMES.TEMPLATE_CURRENT)) {
                return;
            }

            var tpl = this.current.template,
                languages = el.getAttribute('data-languages').split(','),
                nextLanguage = null,
                currentLanguage = this.current.language;

            if (languages.length === 1) {
                return;
            }

            languages.forEach(function(Posix_Language__, i) {
                if (Posix_Language__ === currentLanguage) {
                    if (i < languages.length-1) {
                        nextLanguage = languages[i+1];
                    } else {
                        nextLanguage = languages[0];
                    }
                }
            });

            this.current.language = nextLanguage;
            this._setTemplate(tpl, this.current.language);
            this.nodes.templateActionsLanguageSelect.set('value', this.current.language);
        },

        _onTemplateItemClick : function(e) {
            e.stopImmediatePropagation();
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
            if (el._node.nodeName !== 'LI' || el.one('input') !== null) {
                return;
            }

            el.one('span').hide();

            var input = Y.Node.create(this.TEMPLATES.TEXT_INPUT_IN_PLACE);
            input.set('value', el.get('firstChild').get('text'));
            el.addClass('editable');

            el.append(input);
            input.focus();
        },

        _onTemplateInputValidated : function(e) {
            if (e.keyCode !== 13) {
                return;
            }

            this._validateTemplateInput(e.currentTarget);
        },

        _onTemplateLanguageClick : function(e) {
            var el  = e.currentTarget,
                tpl = this.current.template;

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

            this.gateway.emit(Biscuit.Locator.rest.services.lock.get, { 'params' : {
                'Page__'     : this.current.page,
                'Template__' : this.current.template
            }});

            this.gateway.emit(Biscuit.Locator.rest.services.version.template);

            this.gateway.emit(Biscuit.Locator.rest.services.version.templatetype);

            this.gateway.emit(Biscuit.Locator.rest.services.template.content, { 'params' : {
                'Posix_Language__' : language
            }});
        },

        _setTemplateContent : function(e, event, data, error) {
            switch (error) {
                case 'NO_DATA':
                    alert('no content for this template tooltip');
                    return;
            }

            this.current.templateType = data[0].properties.Template_Type__ ? data[0].properties.Template_Type__ : null;
            if (this.current.templateType !== null) {
                this.gateway.emit(Biscuit.Locator.rest.services.templatetype.getproperties);
            } else {
                this.propgrid.getGridPanel().hide();
                this.propgrid.set('data', {});
                this.settings.selectTplType.set('value', '');
            }

            var content = data[0].content, focus = true;
            if (this.current.isLocked) {
                focus = false;
            }
            this.editor.setCode(content, focus);
            this.getTemplateById(this.current.template).removeClass(this.CLASSNAMES.TEMPLATE_LOADING);

            Y.log('inserted template content', null, 'ContentEditor');
        },

        _setTemplateType : function(e, event, data, error) {
            switch (error) {
                case 'NO_DATA':
                    this.propgrid.getGridPanel().hide();
                    this.propgrid.set('data', {});
                    this.settings.selectTplType.set('value', '');
                    return;
            }

            if (data === 'SUCCESS') {
                this.propgrid.getGridPanel().hide();
                this.propgrid.set('data', {});
                this.settings.selectTplType.set('value', this.current.templateType);
                return;
            }

            var fields = data[0],
                values = data[1];

            var currentCaption = null, formattedData = {}, aData = [];
            fields.forEach(function(o) {
                switch (o['type']) {
                    case 'caption':
                        currentCaption = o['params'];
                        formattedData[currentCaption] = [];
                        aData.push({ caption : currentCaption, items : formattedData[currentCaption]});
                        break;
                    case 'string':
                    case 'select':
                        if (formattedData.hasOwnProperty(currentCaption)) {
                            formattedData[currentCaption].push(o);
                        }
                        break;
                    case 'checkbox':
                        aData.push({ caption : o['params']['caption'], items : [o]});
                        break;
                }
            });

            var setRole = function(o, caption) {
                caption = caption || '';
                var row = {};
                switch (o['type']) {
                    case 'string':
                        row = {
                            'role'  : 'textbox',
                            'value' : o['name'] in values ? values[o['name']] : '',
                            'label' : caption
                        };
                        break;
                    case 'checkbox':
                        row = {
                            'role'    : 'checkbox',
                            'checked' : o['name'] in values && values[o['name']] === "1",
                            'label'   : o['params']['caption']
                        };
                        break;
                    case 'select':
                        row = {
                            'role'  : 'listbox',
                            'selected' : o['name'] in values ? values[o['name']] : '',
                            'value' : o['params']['choices'],
                            'label' : caption
                        };
                        break;
                }
                return row;
            };

            var data = {};
            aData.forEach(function(o) {
                var rows = {};
                if (o['items'].length > 1) {
                    data[o['caption']] = [];
                    o['items'].forEach(function(item) {
                        rows[item['name']] = setRole(item);
                    });
                    data[o['caption']].push(rows);
                } else if (o['items'].length === 1) {
                    var item = o.items[0];
                    data[item['name']] = setRole(item, o['caption']);
                }
            });

            this.propgrid.set('data', data);
            this.settings.selectTplType.set('value', this.current.templateType);
            this.propgrid.getGridPanel().show();
        },

        _setTemplateTypeProperty : function(e) {
            var value = ('checked' in e) ? (e.checked ? '1' : '0') : e.after;
            this.gateway.emit(Biscuit.Locator.rest.services.templatetype.setproperty, { 'params' : {
                'Key'   : '_' + e.property,
                'Value' : value
            }});
        },

        _populateTemplateList : function(e, event, data, error) {
            switch (error) {
                case 'NO_DATA':
                    alert('no templates for this server tooltip');
                    return;
            }
            this.buildTemplateList(data);

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
                var tpl = this.pickTemplate(this.current.template);
                tpl.scrollIntoView(true);
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

        _getUserLock : function(e, event, data, error) {
            switch (error) {
                case 'NO_DATA':
                    this.toolbar.lock.unbind();
                    Y.log('no lock found', null, 'Biscuit');
                    return;
            }

            data = data[0];
            if (!data.hasOwnProperty('UserLevel')) {
                data['UserLevel'] = 100;
            }
            this.toolbar.lock.bind(data);
        },

        _getTemplateVersions : function(e, event, data, error) {
            switch (error) {
                case 'NO_DATA':
                    Y.log('no template version found', null, 'Biscuit');
                    data = [];
            }

            this._buildVersionBox(this.nodes.templateVersionSelect, data);
        },

        _getTemplateTypeVersions : function(e, event, data, error) {
            switch (error) {
                case 'NO_DATA':
                    Y.log('no template type version found', null, 'Biscuit');
                    data = [];
            }

            this._buildVersionBox(this.nodes.templateTypeVersionSelect, data);
        },

        _buildVersionBox : function(el, data) {
            var html = [], option;

            var generateOptions = function(o, stamp) {
                stamp = stamp || 'StampWords';
                var tmp = [], value = '', hasTemplateType = false;
                o.forEach(Y.bind(function(o) {
                    value = o['User'] + ' - ' + o[stamp];

                    hasTemplateType = o.hasOwnProperty('Template_Type__') && o.Template_Type__ !== null;
                    if (hasTemplateType) {
                        value += ' / ' + o.Template_Type__;
                    }
                    option = Y.Node.create(Y.substitute(this.TEMPLATES.OPTION, {
                        'id'    : o['ID'],
                        'value' : value
                    }));
                    tmp.push(option);
                }, this));
                return tmp;
            };

            if (data.length > 0) {
                var formattedData = {}, i, item, optgroup;

                data.forEach(function(o) {
                    if (!formattedData.hasOwnProperty(o['StampWords'])) {
                        formattedData[o['StampWords']] = [];
                    }
                    formattedData[o['StampWords']].push(o);
                });

                for (i in formattedData) {
                    item = formattedData[i];
                    if (item.length > 1) {
                        optgroup = Y.Node.create('<optgroup label="' + i + '">');
                        optgroup.append(Y.all(generateOptions.call(this, item, 'StampHour')));
                        html.push(optgroup);
                    } else {
                        html = html.concat(generateOptions.call(this, item));
                    }
                }
            }

            option = Y.Node.create(Y.substitute(this.TEMPLATES.OPTION, {
                'id'    : -1,
                'value' : 'Current'
            }));
            option.set('selected', true);
            html.push(option);

            el.get('children').remove();
            html = Y.all(html);
            el.append(html);

            var formattedData = {};
            data.forEach(function(o) {
                formattedData[o['ID']] = o;
            });
            el.setData('versions', formattedData);
        },

        _onTemplateVersionChanged : function(e) {
            var el       = e.currentTarget,
                value    = el.get('value'),
                versions = el.getData('versions');

            if (!versions.hasOwnProperty(value)) {
                Y.log('could not resolve the template version', 'error', 'Biscuit');
                return;
            }

            var version = el.getData('versions')[value];
            this.editor.setCode(version.Content, false);
        },

        _onTemplateTypeVersionChanged : function(e) {
            var el       = e.currentTarget,
                value    = el.get('value'),
                versions = el.getData('versions');

            if (!versions.hasOwnProperty(value)) {
                Y.log('could not resolve the template type version', 'error', 'Biscuit');
                return;
            }

            var version = versions[value];
            this.gateway.emit(Biscuit.Locator.rest.services.templatetype.setproperties, { 'params' : {
                'Template_Type__' : version.Template_Type__,
                'Options'         : version.Options
            }});
        },

        destructor : function() { },

        TEMPLATES : {
            TEXT_INPUT_IN_PLACE : '<input type="text" autocomplete="off" />',
            LIST                : '<li data-id="{id}" data-languages="{languages}"></li>',
            OPTION              : '<option value="{id}">{value}</option>',
            LABEL               : '<span></span>'
        },

        CLASSNAMES : {
            TEMPLATE_LOADING  : 'loading',
            TEMPLATE_CURRENT  : 'active',
            TEMPLATE_EDITABLE : 'editable',
            TEMPLATE_NEW      : 'new'
        },

        REGEX : {
            TEMPLATE : /^([a-z0-9_]{3,})$/,
            PAGE     : /^([a-z0-9_]{3,})\.([\w]{2,})$/
        }
    });

    Y.Biscuit = BiscuitApp;
}, '3.3.0', {requires:['base', 'event-key', 'objects-extension', 'gateway-ext', 'datastore-ext', 'localstore-ext', 'propertyeditor']});
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
        visible: false
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
YUI({
    gallery: 'gallery-2010.11.12-20-45'
}).use(
	'biscuit-console',
	'biscuit-history',
	'biscuit',
	'top-nav-plugin',
	'toolbar-plugin',
	'template-actions-plugin',
	'editor-plugin',
	'settings-plugin',
	'notifier-plugin',
	'gallery-outside-events',
	function(Y) {

    var app = new Y.Biscuit({
        plugins : [
            {fn: Y.Notifier},
            {fn: Y.TopNavigation, cfg: {srcNode:'.biscuit-tabs'}},
            {fn: Y.Editor, cfg: {srcNode:'.biscuit-editor'}},
            {fn: Y.Toolbar.Main, cfg: {srcNode:'.biscuit-toolbar'}},
            {fn: Y.TemplateActions.Main, cfg: {srcNode:'.template-actions'}},
            {fn: Y.Settings, cfg: {container:'.biscuit-editor'}}
        ]
    });
});
