var History = {
    username : { type: ObjectId, index: true },

    event : String,
    data  : String,

    date : {
        start : { type: Date, default: Date.now },
        end   : Date,
        index : true
    }
};

module.exports = History;
