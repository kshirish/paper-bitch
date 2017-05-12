var User = require('../models/user');
var Post = require('../models/post');
var Helpers = require('../helpers')();

var base_url = '/api/v1';

module.exports = function(app) {

    // Authentication ====================================================

    function validateLogin(username, password, callback) {
        
        if(!(username && password)) 
            return callback({
                error: true,
                reason: 'Username or password is missing.'
            });

        User.findOne({username: username}, function(err, response) {
            
            if (err)
                callback({
                    error: true,
                    reason: 'Unable to find this username.'
                });                           
            else if(response)
                response.validPassword(password) ? callback(response) : callback({
                    error: true,
                    reason: 'Wrong password.'
                });
            else  
                callback({
                    error: true,
                    reason: 'Wrong username.'
                });
        });
    }

    // login page
    app.get('/login', function(req, res) {
    
        // trying for automatic login
        validateLogin(req.cookies.username, req.cookies.password, function(response) {

            if (response.error)             
            
                res.render('login.ejs', response);            
            
            else {
                
                if (req.body['remember-me']) {
                    
                    res.cookie('username', response.username, { maxAge: 900000 });
                    res.cookie('password', response.password, { maxAge: 900000 });
                }

                req.session.user = response;
                res.redirect('/');
            }                             
        });
    });

    // login api
    app.post(base_url + '/login', function(req, res) {
    
        // trying for automatic login
        validateLogin(req.body.usertoken, function(response) {

            if (response.error)                
            
                res.render('login.ejs', response);            
            
            else {

                req.session.user = response;
                res.redirect('/');
            }            
        });
    });    

    // homepage :: get all posts by user/author/tags [pagination]
    app.get('/', isLoggedIn, function(req, res) {
        
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
                
                res.render('index.ejs', {
                    user: req.session.user,
                    posts: response
                });                
            })
            .catch(function() {

                res.render('500.ejs', {
                    error: true,
                    reason: 'Unable to find posts for this user.'
                });
            });
    });

    // about
    app.get('/about', isLoggedIn, function(req, res) {
        res.render('about.ejs', {user: req.session.user});
    });

    // edit profile
    app.get('/about/edit', isLoggedIn, function(req, res) {
        res.render('edit-profile.ejs', {user: req.session.user});
    });

    // contact
    app.get('/contact', isLoggedIn, function(req, res) {
        res.render('contact.ejs', {user: req.session.user});
    });

    // post
    app.get('/post/:id', isLoggedIn, function(req, res) {

        Post.findById(req.params.id)
            .then(function(response) {

                res.render('post.ejs', {
                    user: req.session.user,
                    post: response
                });              
            })
            .catch(function() {

                res.render('500.ejs', {
                    error: true,
                    reason: 'Unable to fetch the post.'
                });                
            });        
    });

    // edit post
    app.get('/post/:id/edit', isLoggedIn, function(req, res) {
        res.render('edit-post.ejs', {user: req.session.user});
    });

    // logout
    app.post(base_url + '/logout', function(req, res) {

        res.clearCookie('username');
        res.clearCookie('password');
        req.session.destroy();
    })

    // User ==============================================================

    // create a new user
    app.post(base_url + '/users', isLoggedIn, function(req, res) {
        
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
                
                res.redirect('/');                
            })
            .catch(function() {
                
                res.render('500.ejs', {
                    error: true,
                    reason: 'Unable to create a new user.'
                });
            });
    });

    // edit a user
    app.put(base_url + '/user', isLoggedIn, function(req, res) {

        var updatedObj = req.body;

        // todo : basic validtion before adding

        User.findByIdAndUpdate(req.session.user._id, { $set: updatedObj }, function (err) {
            
            if (err)

                res.render('500.ejs', {
                    error: true,
                    reason: 'Unable to edit the user.'
                });
            
            else                
                res.end();                
        });
    });

    // delete a user
    app.delete(base_url + '/user', isLoggedIn, function(req, res) {

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
    app.post(base_url + '/posts', isLoggedIn, function(req, res) {
        
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

    // edit a post
    app.put(base_url + '/post/:id', isLoggedIn, function(req, res) {

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

    // delete a post
    app.delete(base_url + '/post/:id', isLoggedIn, function(req, res) {

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

    // get all unique authors for a user
    app.get(base_url + '/user/authors', isLoggedIn, function(req, res) {

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
    app.get(base_url + '/user/tags', isLoggedIn, function(req, res) {

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