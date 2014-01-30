YUI.add('notifier-plugin', function(Y) {

    Notifier.NAME = 'notifier-plugin';
    Notifier.NS   = 'notifier';

    function Notifier(config) {
        Notifier.superclass.constructor.apply(this, arguments);
    }

    Y.extend(Notifier, Y.Plugin.Base, {

        initializer : function(cfg) {
            this.app = this.get('host');
            this._syncState();
            Y.log('initialized', null, 'Notifier');
        },

        _syncState : function() {
        },

        show : function(hd, bd, timeout) {
            timeout = timeout || 3000;
        	if (window.webkitNotifications.checkPermission() === 1) {
    			return;
        	}
            var n = window.webkitNotifications.createNotification(
	            document.location + '/images/logo.png', hd, bd
	        );
            n.show();
            if (timeout > 0) {
                setTimeout(function() {
                    n.cancel();
                }, timeout);
            }
        },

        destructor : function() {},

        TYPES : {
        	FORBIDDEN : 'Forbidden',
        	WARNING   : 'Warning',
        	NOTICE    : 'Notice',
        	ERROR     : 'Error'
        }
    });

    Y.Notifier = Notifier;

}, '3.3.0', {requires:[]});
