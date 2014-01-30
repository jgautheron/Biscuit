YUI.add('biscuit-history', function(Y) {
    Y.HistoryHash.hashPrefix = '!';
    Y.HistoryManager = new Y.HistoryHash();
}, '3.3.0', {requires:['history']});