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
            // preloaded event
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

                // invalid current language
                if (languages.indexOf(this.current.defaultLanguage) === -1) {
                    this.current.language = languages.split(',')[0];
                }
            }

            this.nodes.templateList.removeClass(this.CLASSNAMES.TEMPLATE_CURRENT);
            this.nodes.templateList.removeClass(this.CLASSNAMES.TEMPLATE_EDITABLE);
            el.addClass(this.CLASSNAMES.TEMPLATE_CURRENT);

            var languageButton = this.nodes.templateActions.one('.language');
            if (languageButton) {
                // Build language list, always display the default language
                if (this.current['languages']) {
                    if (this.current['languages'].length > 1) {
                        //Build options
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
            
            // hide settings overlay
            this.toolbar.setActiveEditorMode();
            this.settings.hide();

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

            this.nodes.templateVersionSelect.set('value', '-1');
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

            // lock system
            this.gateway.listen(Biscuit.Locator.rest.services.lock.get, Y.bind(this._getUserLock, this));

            // template versions
            this.gateway.listen(Biscuit.Locator.rest.services.version.template, Y.bind(this._getTemplateVersions, this));

            // template type versions
            this.gateway.listen(Biscuit.Locator.rest.services.version.templatetype, Y.bind(this._getTemplateTypeVersions, this));

            // template content
            this.gateway.listen(Biscuit.Locator.rest.services.template.content, Y.bind(this._setTemplateContent, this));

            // template type
            this.gateway.listen(Biscuit.Locator.rest.services.templatetype.getproperties, Y.bind(this._setTemplateType, this));

            // when a property is set, call the new properties
            this.gateway.listen(Biscuit.Locator.rest.services.templatetype.setproperty, Y.bind(function() {
                this.gateway.emit(Biscuit.Locator.rest.services.templatetype.getproperties);
                //this.gateway.emit(Biscuit.Locator.rest.services.version.templatetype);
            }, this));

            this.gateway.listen(Biscuit.Locator.rest.services.templatetype.setproperties, Y.bind(function() {
                this.gateway.emit(Biscuit.Locator.rest.services.templatetype.getproperties);
                //this.gateway.emit(Biscuit.Locator.rest.services.version.templatetype);
            }, this));

            // template list item click
            this.nodes.templateListContainer.delegate('click', this._onTemplateItemClick, 'li:not(.active)', this);

            // template list rename dblclick
            this.nodes.templateListContainer.delegate('dblclick', this._onTemplateRenameClick, 'li.active', this);

            // template list active tpl context menu
            this.nodes.templateListContainer.delegate('contextmenu', this._onTemplateContextMenu, 'li', this);

            // template renamed
            this.nodes.templateListContainer.delegate('keyup', this._onTemplateInputValidated, 'li.active > input', this);

            // template version changed
            this.nodes.templateVersionSelect.on('change', this._onTemplateVersionChanged, this);

            // template type version changed
            this.nodes.templateTypeVersionSelect.on('change', this._onTemplateTypeVersionChanged, this);

            // CTRL + s
            Y.on('key', Y.bind(function(e) {
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.saveTemplate();
                }
            }, this), document, 'down:83');

            this.on('datastore:ready', Y.bind(this._syncSession, this));
        },

        _syncState : function() {
            // cache often called nodes
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
                this.notifier.show(this.notifier.TYPES.NOTICE, "Session restored from URI hash.");
                Y.log('restored session from uri hash', 'warn', 'Session');
            } else if (Y.hasProperties(currentTabs)) {
                // tabs found in history
                this._restoreSession(currentTabs);
                this.notifier.show(this.notifier.TYPES.NOTICE, "Your previous session has been restored.");
                Y.log('restored session from local storage', 'warn', 'Session');
            } else {
                // creates one default tab
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

            // check format
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

            // hide underlying span
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

            // checks if the template is locked
            this.gateway.emit(Biscuit.Locator.rest.services.lock.get, { 'params' : {
                'Page__'     : this.current.page,
                'Template__' : this.current.template
            }});

            // get template versions
            this.gateway.emit(Biscuit.Locator.rest.services.version.template);

            // get template type versions
            this.gateway.emit(Biscuit.Locator.rest.services.version.templatetype);

            // ask server for template content
            //this.getTemplateById(id).addClass(this.CLASSNAMES.TEMPLATE_LOADING);
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
                    // reset ui state
                    this.propgrid.getGridPanel().hide();
                    this.propgrid.set('data', {});
                    this.settings.selectTplType.set('value', '');
                    return;
            }

            // old school template types
            if (data === 'SUCCESS') {
                this.propgrid.getGridPanel().hide();
                this.propgrid.set('data', {});
                this.settings.selectTplType.set('value', this.current.templateType);
                return;
            }

            var fields = data[0],
                values = data[1];

            // reorders into a comprehensive array the template type informations
            // and tries to define parentality by data type/order...
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
                // more than one item, create a group
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

            // the current session is locked
            data = data[0];
            if (!data.hasOwnProperty('UserLevel')) {
                // if none, defaults to 100
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

                // sorts data by block
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

            // default
            option = Y.Node.create(Y.substitute(this.TEMPLATES.OPTION, {
                'id'    : -1,
                'value' : 'Current'
            }));
            option.set('selected', true);
            html.push(option);

            // remove & then append all
            el.get('children').remove();
            html = Y.all(html);
            el.append(html);

            // attach data to node
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

            // insert again picked record & reload
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