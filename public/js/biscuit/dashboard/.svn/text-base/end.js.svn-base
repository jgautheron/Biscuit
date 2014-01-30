YUI({
    gallery: 'gallery-2010.11.12-20-45'
}).use(
	'dashboard-console',
	'dashboard',
	'icons-plugin',
	'notifier-plugin',
	'gallery-outside-events',
	function(Y) {

    var app = new Y.Dashboard({
        plugins : [
            {fn: Y.Notifier},
            {fn: Y.Icons.Main, cfg: {srcNode:'.biscuit-dashboard'}}
        ]
    });
});