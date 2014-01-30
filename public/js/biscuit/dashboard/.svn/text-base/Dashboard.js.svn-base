YUI.add('dashboard', function(Y) {

    var Base = Y.Base.create('Base', Y.Base, [Y.Gateway, Y.DataStore]);

    Dashboard.NAME = 'Dashboard';
    function Dashboard(config) {
        Dashboard.superclass.constructor.apply(this, arguments);
    }

    Y.extend(Dashboard, Base, {
        user : {
            name : '',
            level : 100
        },

        initializer : function(cfg) {
            this._syncState();
            this._bindEvents();

            this.user.name = Biscuit.User;
            this.user.level = Biscuit.UserLevel;

            Y.log('initialized', null, 'Dashboard');
        },

        _syncState : function() {
        },

        _bindEvents : function() {
        },

        destructor : function() { }
    });

    Y.Dashboard = Dashboard;
}, '3.3.0', {requires:['base', 'node', 'event', 'datastore-ext', 'gateway-ext']});
