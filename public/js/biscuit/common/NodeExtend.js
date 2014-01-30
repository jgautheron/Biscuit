YUI.add('node++', function (Y) {
    // not "this" till YUI 3.3.0 scope bugfix (#2529356)
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
