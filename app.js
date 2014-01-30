// resources folder
var pub = __dirname + '/public';

var express = require('express'),
    sys = require('util'),
    app = module.exports = express.createServer(),
    io = require('socket.io'),
    userAgent = require('useragent');

var locator = require('./app/services/locator'),
    Response = require('./app/rest/Response');

// configuration
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.compiler({ src: pub, enable: ['less'] }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({secret : 'biscuitr'}));
    app.use(app.router);
    app.use(express.static(pub));
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(express.logger());
});

app.configure('production', function() {
    app.use(express.errorHandler());
    app.use(express.logger());
});

var checkBrowser = function(req, res, next) {
    var isWebkit = userAgent.browser(req.headers['user-agent']).webkit;
    if (!isWebkit) {
        res.redirect('/webkit-only');
        return;
    }
    next();
};

var checkAuth = function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/auth');
        return;
        //req.session.user = 'jgautheron';
        //req.session.rights = { level : 20 };
    }
    next();
};

// routes
app.get('/', checkBrowser, checkAuth, function(req, res) {
    res.render('editor', {
        locals: {
            locator   : JSON.stringify(locator),
            user      : req.session.user,
            userlevel : req.session.rights.level
        }
    });
});
app.get('/auth', checkBrowser, function(req, res) {
    res.render('auth');
});
app.post('/auth', function(req, res) {
    var user     = req.body.user,
        password = req.body.password;

    var resp = new Response();
    resp.proxy(locator.rest.services.user.authenticate, {params: req.body});
    resp.once('response', function(o) {
        if (o.success) {
            req.session.user = user;
            req.session.rights = {};

            // get user rights
            var rights = new Response();
            rights.proxy(locator.rest.services.user.rights, {params: {user : user}});
            rights.once('response', function(o) {
                if (o.error) {
                    res.render('auth', {
                        locals: {
                            error : o.error
                        }
                    });
                    return;
                }

                rights = o.data[0];
                for (var i in rights) {
                    if (i.substr(0, 6) === 'Level_') {
                        req.session.rights.level = parseInt(i.split('_')[1]);
                    }
                }
                res.redirect('/dashboard');
            });
        } else {
            res.render('auth', {
                locals: {
                    error : o.error
                }
            });
        }
        resp = null;
    });
});

app.get('/dashboard', checkBrowser, checkAuth, function(req, res) {
    res.render('dashboard', {
        locals: {
            locator   : JSON.stringify(locator),
            user      : req.session.user,
            userlevel : req.session.rights.level
        }
    });
});

app.get('/webkit-only', function(req, res) {
    res.render('webkit');
});

app.get('/([a-z]+)', function(req, res) {
    res.render('404');
});

// Only listen on $ node app.js
if (!module.parent) {
    app.listen(80);

    var socket = io.listen(app);
    socket.on('connection', function(client) {
        client.on('message', function(data) {
            data = JSON.parse(data);
            var event = data['event'], ev = event.split('.'),
                data = data['data'], service = locator.rest.services[ev[0]][ev[1]];

            var resp = new Response();
            resp.setSocket(client);
            resp.proxy(service, data);
            resp.once('response', function(o) {
                this.send(o['event'], o['data'], o['error']);
                resp = null;
            });
        });
        client.on('disconnect', function() {
        });
    });
    socket.on('message', function(data) {});
    socket.on('disconnect', function() {});
}
