var User = require('../models/user');
var Post = require('../models/post');
var Helpers = require('../helpers')();

module.exports = function(app) {

    // Authentication ====================================================

    // todo : login
    // todo : signup
    
    // logout
    app.post('/logout', function(req, res) {

        res.clearCookie('username');
        res.clearCookie('password');
        req.session.destroy();
    })

    // User ==============================================================

    // create a new user
    app.post('/users', isLoggedIn, function(req, res) {
        
        // todo : basic validation before adding
        
        var user = new User({
            
            fname: req.body.fname,
            lname: req.body.lname,
            username: req.body.username,
            image: req.body.image,
            about: req.body.about
        });

        // encrypting user token before saving
        user.password = user.generateHash(req.body.password);

        user.save()
            .then(function(response) {
                
                res.json(response);                
            })
            .catch(function() {
                
                res.status(500).json({
                    error: true,
                    reason: 'Unable to create a new user.'
                });
            });
    });


    // edit a user
    app.put('/user', isLoggedIn, function(req, res) {

        var updatedObj = req.body;

        // todo : basic validtion before adding

        User.findByIdAndUpdate(req.session.user._id, { $set: updatedObj }, function (err) {
            
            if (err)

                res.status(500).json({
                    error: true,
                    reason: 'Unable to edit the user.'
                });
            
            else                
                res.end();                
        });

    });

    // delete a user
    app.delete('/user', isLoggedIn, function(req, res) {

        var queryObj = {
            _id: req.session.user._id
        };

        User.remove(queryObj)
            .then(function() {
                
                res.clearCookie('username');
                res.clearCookie('password');
                req.session.destroy();

                res.redirect('/login');                
            })
            .catch(function() {
                
               res.status(500).json({
                    error: true,
                    reason: 'Unable to delete the user.'
                });
            });
    });

    // Post ==============================================================
  	
  	// create a post
    app.post('/posts', isLoggedIn, function(req, res) {
        
        // todo : basic validation before adding
        
        var post = new Post({
            
            userId: req.session.user._id,
            author: req.body.author,
            title: req.body.title,
            content: req.body.content,
            tags: req.body.tags || []
        });

        post.save()
            .then(function(response) {
                
                res.json(response);                
            })
            .catch(function() {
                
                res.status(500).json({
                    error: true,
                    reason: 'Unable to create a new post.'
                });
            });
    });

  	// get a post by id
    app.get('/post/:id', isLoggedIn, function(req, res) {

        Post.findById(req.params.id)
            .then(function(response) {

                res.json(response);                
            })
            .catch(function() {

                res.status(500).json({
                    error: true,
                    reason: 'Unable to fetch the post.'
                });                
            });
    });

    // edit a post
    app.put('/post/:id', isLoggedIn, function(req, res) {

        var updatedObj = { 
            $addToSet: { 
                tags: { $each: req.body.tags || [] }
            },
            $set: Helpers.omit(req.body, ['tags'])
        };

        // todo : basic validtion before adding

        Post.findByIdAndUpdate(req.params.id, updatedObj, function (err) {
            
            if (err)

                res.status(500).json({
                    error: true,
                    reason: 'Unable to edit the post.'
                });
            
            else                
                res.end();                
        });

    });

    // todo : delete a post
    app.delete('/post/:id', isLoggedIn, function(req, res) {

        var queryObj = {
            _id: req.params.id
        };

        Post.remove(queryObj)
            .then(function() {
                
                res.end();
            })
            .catch(function() {
                
               res.status(500).json({
                    error: true,
                    reason: 'Unable to delete the post.'
                });
            });
    });

    // Misc ==============================================================

    // get all posts by user/author/tags [pagination]
    app.get('/user/posts', isLoggedIn, function(req, res) {

        var limit = req.query.count || 10;
        var skip = ((req.query.pagenumber || 1) - 1 ) * limit;        
        var queryObj = { 
            userId: req.session.user._id
        };

        if(req.query.author)
            queryObj.author = req.query.author;

        if(req.query.tags)            
            queryObj.tags = { $in: req.query.tags };

        Post
            .find(queryObj)
            .skip(skip)
            .limit(limit)
            .sort('createdOn')
            .then(function(response) {
                
                res.json(response);
            })
            .catch(function() {
                    
                res.status(500).json({
                    error: true,
                    reason: 'Unable to find posts for this user.'
                });
            });
    });

  	// get all unique authors for a user
    app.get('/user/authors', isLoggedIn, function(req, res) {

        var queryObj = { 
            userId: req.session.user._id
        };

        Post
            .find(queryObj)
            .select({ author: 1, _id: 0 })
            .then(function(response) {
                
                res.json(Helpers.unique(response));
            })
            .catch(function() {
                    
                res.status(500).json({
                    error: true,
                    reason: 'Unable to find authors for this user.'
                });
            });
    });

  	// get all unique tags for a user
    app.get('/user/tags', isLoggedIn, function(req, res) {

        var queryObj = { 
            userId: req.session.user._id
        };

        Post
            .find(queryObj)
            .select({ tags: 1, _id: 0 })
            .then(function(response) {
                
                res.json(Helpers.unique([].concat.apply([], response)));
            })
            .catch(function() {
                    
                res.status(500).json({
                    error: true,
                    reason: 'Unable to find tags for this user.'
                });
            });
    });

	// todo : suggestion api  
	// todo : search a "text" in all posts [pagination]
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {

    // whether user is logged in or not
    if (req.session.user)      
        return next();              
    
    res.redirect('/login');
}