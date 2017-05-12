var User = require('../models/user');

module.exports = function(app) {

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

    // login
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

    app.post('/login', function(req, res) {
    
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

    // homepage
    app.get('/', isLoggedIn, function(req, res) {
        res.render('index.ejs', {user: req.session.user});
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
        res.render('post.ejs', {user: req.session.user});
    });

    // edit post
    app.get('/post/:id/edit', isLoggedIn, function(req, res) {
        res.render('edit-post.ejs', {user: req.session.user});
    });

    // 404 
    app.get('*', function(req, res) { 
        res.render('404', {}); 
    });
    
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {

    // whether user is logged in or not
    if (req.session.user)      
        return next();              
    
    res.redirect('/login');
}