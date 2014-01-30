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
            //If it is a root node, expand all nodes at level 1
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

                //Create group
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
                    //Grab tbody
                    var ctx = this.get('rel');

                    //Deploy strategy
                    _toggleGroup.call(rowContainer, Y.one('#' + ctx)); 
                    
                    //Y.one('#' + ctx).toggleClass('expanded');
                });

                //Need to set id as yuid, to comply with the :target property in CSS
                tbody.setAttribute('id', tbody._yuid);

                if (level > 0) {

                    sourceId = baseId + '_' + level + '_' + this._levels[level];
                    //Immediate parent
                    tbody.setAttribute('rel', sourceId);
                    //Flag node as children
                    tbody.setData('root', false);
                    //Set level
                    tbody.setData('level', level);
                    //Set base level
                    tbody.setData('base', baseId);
                    //Hide children
                    tbody.setStyle('display', 'none');
                    //Direct Ancestor
                    tbody.setData('ancestor', groupId);

                    groupId = tbody._yuid;
                    
                } else {
                    
                    sourceId = tbody.get('id');
                    baseId = sourceId;

                    //Flag node as root node
                    tbody.setData('root', true);
                }

                //Increment level
                level++;
                
                //Append link in gutter
                gutter.append(target);

                //Create group heading
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

            //Enable rendering
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

                    //Pick the first item
                    label.set('text', o.value[Y.Object.keys(o.value)[0]]);

                    //Or Match the selected item
                    if ('selected' in o && o.selected in o.value) {
                        selected = o.selected;
                        label.set('text', o.value[o.selected]);
                    }

                    //Create the datalist element
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

                //Fill property name
                prop.property['name'] = propName;
                
                //Add element to lookup
                lookup[prop.guid] = prop.property;

                tr.append(gutter).append(key).append(value);
                rowContainer.append(tr);
            }
        }    
    }

    /** Internals **/
    var _resolveProperty = function(el) {

        var cfg = null;

        /* Determine the type of element */
        switch(el.getAttribute('role')) {

            case 'textbox':
                //Bind events
                var initial  = Y.one(el).one('label');
                
                cfg = {'type' : 'text', 'value' : initial.get('text'), 'ref' : el, 'label' : initial};
                break;

            case 'spinbutton':

                //Bind events
                var initial  = Y.one(el).one('label');
                
                cfg = {'type' : 'spinner', 'value' : initial.get('text'), 'ref' : el, 'label' : initial};
                
                break;

            case 'listbox':

                //Find datalist element
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

                    //Create datastore
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
            //Generate a GUID for the element, so it will be easy to retrieve
            //its value afterwards
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

                //xpath query
                var query = rootNode.all('tr.property');
                
                // Grab results
                if (query) {
                    if (query._nodes) {
                        query._nodes.forEach(function(row) {
                            
                            //Grab key and value
                            var keyValuePair = (Y.one(row).all('td'))._nodes,
                                key   = keyValuePair[0].textContent.trim(),
                                value = (!!keyValuePair[1]) ? keyValuePair[1] : null;

                            //If we cannot get the value, ignore parsing
                            if (!value.getAttribute('role')) return;
                            
                            //Otherwise get the type of value
                            var prop = _resolveProperty(value);

                            if (prop) {

                                if (!_lookup.hasOwnProperty(prop.guid)) {

                                    //Fill property name
                                    prop.property['name'] = key;
                                    
                                    //Add element to lookup
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

                    //Exit if it is not a property
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

            //Avoids to set header again
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
                    
                    //Ignore if property already exists
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

                        //Change the value in the datastore
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

                        //Change the value in the datastore
                        property.value = value;

                        break;

                }
            }
        },

        _onClickHandler : function(e) {
            
            var target = e.currentTarget;

            if (property = this._getPropertyFromElement(target)) {
                //Checkbox doesn't mutate here
                if (property.type === 'checkbox') {

                    if (e.target.get('tagName') !== 'INPUT') {
                        //Fire click event on the checkbox
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
                
                //Substitute content
                this._renderByType(target, property);

            }

            //e.stopImmediatePropagation();
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

                //loop through options
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
