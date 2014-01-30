var Usage = {
    username : { type: ObjectId, index: true },

    server   : Number,
    page     : String,
    template : String,

    date : {
        start : { type: Date, default: Date.now },
        end   : Date,
        index : true
    }
};

module.exports = Usage;
