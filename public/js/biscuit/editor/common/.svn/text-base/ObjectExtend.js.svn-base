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