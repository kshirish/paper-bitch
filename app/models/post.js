var mongoose = require('mongoose');

// define the schema for our post model
var postSchema = mongoose.Schema({

    createdOn: {
    	type: Number, 
    	default: function() { return new Date().getTime(); }
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    author: String,
    title: String,
    content: String,
    tags: [String]
});

// create the model for posts and expose it to our app
module.exports = mongoose.model('Post', postSchema);