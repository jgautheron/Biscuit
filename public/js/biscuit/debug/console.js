YUI.add('biscuit-console', function(Y) {
    var basic = new Y.Console({
        width: '350px'
    })
    .plug(Y.Plugin.Drag, {handles: ['.yui3-console-hd']})
    .render('#yconsole');

    Y.one('body').addClass('yui3-skin-sam');

    Y.Console = basic;
}, '3.2.0', {requires:['console', 'dd-plugin']});
