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