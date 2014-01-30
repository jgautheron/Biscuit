var mongoose = require('mongoose'),
    Mongoose = mongoose.Mongoose,
    Schema   = mongoose.Schema;

console.log(new Schema(), Mongoose);
return;
// connect to mongo
Mongo.connect('mongodb://localhost/biscuit');

// register tables
Mongo.model('User', new Schema(require('../models/User.js')));
Mongo.model('Usage', new Schema(require('../models/Usage.js')));
