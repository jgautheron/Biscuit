YUI.add('dashboard', function(Y) {

    var Base = Y.Base.create('Base', Y.Base);

    Dashboard.NAME = 'Dashboard';
    function Dashboard(config) {
        Dashboard.superclass.constructor.apply(this, arguments);
    }

    Y.extend(Dashboard, Base, {
        initializer : function(cfg) {
            this._syncState();
            this._bindEvents();

            Y.log('initialized', null, 'Dashboard');
        },

        _syncState : function() {
			var icons = Y.Node.all('.icon');

			// set up d&d
			icons.each(function(v, k) {
			    var dd = new Y.DD.Drag({
			        node: v
			    });
		    });
			Y.DD.DDM.on('drag:start', function(e) {
				var node = e.target.get('node');
				node.addClass('drag');
			});
			Y.DD.DDM.on('drag:end', function(e) {
				var node = e.target.get('node');
				node.removeClass('drag');
			});
        },

        _bindEvents : function() {
        	
        },

        destructor : function() { }
    });

    Y.Dashboard = Dashboard;
}, '3.3.0', {requires:['base', 'node', 'event', 'dd-drag', 'overlay']});