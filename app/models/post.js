var mongoose = require('mongoose');

// define the schema for our post model
var postSchema = mongoose.Schema({

    createdOn: {type: Date, default: Date.now},    
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    author: String,
    text: String,
    tags: [String]
});

// create the model for posts and expose it to our app
module.exports = mongoose.model('Post', postSchema);