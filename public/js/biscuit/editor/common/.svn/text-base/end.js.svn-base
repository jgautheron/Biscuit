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