var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var MongoStore   = require('connect-mongo')(session);
var configDB     = require('./config.json');

// configuration
mongoose.connect(configDB[process.env.NODE_ENV || 'local'].url); // connect to our database

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
    secret: '1234567890!@#$%^&*()', // session secret
    proxy: true,
	resave: true,
	saveUninitialized: true,
	store: new MongoStore({ url: configDB[process.env.NODE_ENV || 'local'].url })
}));

// static files
app.use(express.static(`${__dirname}/assets`));

// routes 
require('./app/routes.js')(app); // load our routes and pass in app

// launch 
app.listen(port);
console.log('The magic happens on port ' + port);