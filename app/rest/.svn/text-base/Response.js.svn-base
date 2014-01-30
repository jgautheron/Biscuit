var restler  = require('restler'),
    manifest = require('../services/locator.js'),
    events   = require('events');

var BASE_URI = manifest.rest.BASE_URI;

// custom event
module.exports = Response;
function Response() {
    events.EventEmitter.call(this);
    this.socket = null;
    return this;
}

// inherit events.EventEmitter
Response.super_ = events.EventEmitter;
Response.prototype = Object.create(events.EventEmitter.prototype, {
    constructor: {
        value: Response,
        enumerable: false
    }
});

Response.prototype.proxy = function(service, data) {
    var self    = this;
    self.uri    = BASE_URI + service.route;
    self.method = service.method;
    self.res    = {};

    // check arguments if any
    if ('params' in data) {
        var i, value;
        for (i in data['params']) {
            if (service.method === 'get') {
                self.uri += '/' + i + '/' + data['params'][i];
            }
        }
    }

    self.req = restler[self.method](self.uri, {
        data   : data['params'],
        parser : null,
    }).on('complete', function (body, res) {
        var error = null;
        if (body !== '') {
            //console.log(service.name, "'" + body.toString() + "'");
            try {
                var res = JSON.parse(body);
                data = ('data' in res && res['data'].length > 0) ? res['data'] : null;
                if (data === null) {
                    error = 'NO_DATA';
                }
                if (res['error']) {
                    error = res['error'];
                }
            } catch (e) {
                error = 'INVALID_RESPONSE';
            }
        } else {
            error = 'EMPTY_RESPONSE';
            data = body;
        }

        self.res = {
            success : data === 'SUCCESS',
            event  : service.name,
            data   : data || null,
            error  : error || null
        };
        self.emit('response', self.res);
    }).on('error', function (body, res) {

    });

    return self;
};

Response.prototype.setSocket = function(socket) {
    this.socket = socket;
    return this;
};

Response.prototype.format = function(event, data, error) {
    var response = {
        'event' : event,
        'error' : error || '', // e.g. 400
        'data'  : data
    };
    return response;
};

Response.prototype.send = function(event, data, error) {
    var response = this.format(event, data, error);
    this.socket.send(JSON.stringify(response));
    return this;
};
