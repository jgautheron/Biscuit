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

            // retrieves the template types list
            this.app.gateway.emit(Biscuit.Locator.rest.services.templatetype.gettypes);

            // defines the default state of the overlay
            this._syncState();

            // bind overlay events
            this._bindEvents();
        },

        _syncState : function() {
            this.selectTplType = this.instance.bodyNode.one('.tpl-type');
        },

        _bindEvents : function() {
            // template type
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
