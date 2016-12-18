'use strict';

var express		= require('express') 
	, app		= express()
	, logger	= require('morgan') // Express middlware for logging requests and responses
	, path		= require('path') // Core Node module for working with and handling paths
	, config	= require('./config') // hides secret configuration info
	, session	= require('client-sessions') // session lib by mozilla 
	, bodyParser = require('body-parser'); // Express middleware that adds body object to request allowing access to POST params

app.use(logger('dev')); // logs requests to console, dev flag includes extensive info e.g. method, status code, response time
app.use(express.static(path.join(__dirname, "public"))); // tells app to use public directiory which stores public images, stylesheets, and scripts
app.set('view engine', 'jade'); // tells Express to use the Jade templating engine
app.set('views', path.join(__dirname, 'lib', 'views')); // or ./lib/views
app.use(session({
	cookieName: 'session',
	secret: config.secret_session,
	duration: 30 * 60 * 1000,
	activeDuration: 5 * 60 * 1000,
	httpOnly: true,
	secure: true,
	ephemeral: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : true }));
app.locals.siteName = 'CU EEIT'; // 'Cooper Union Electrical Engineering Inventory Tracker';
app.locals.pretty = true; // Send pretty code

var router = express.Router();
app.use(router);

var mysql = require('./mysql_utils'); // Include MySQL connections and functions that interact with the db
//var routes = require('./lib/routes');
//app.use('/', routes);

var port = process.env.PORT || 3000;
var expressServer = app.listen(port, function () {
	console.log('Server listening on http://localhost:' + port);
});




/**
 * Render the home page.
 */
app.get('/', function (req, res) {
	res.render('home.jade');
});

/**
 * Render the dashboard page.
 */
app.get('/dashboard', function (req, res) {
	res.render('dashboard.jade');
});
/*
router.get('/dashboard', utils.requireLogin, function(req, res) {
	res.render('dashboard.jade');
});
*/

/**
 * Render the registration page.
 */
app.get('/register', function (req, res) {
	res.render('register.jade');
	//res.render('register.jade', { csrfToken: req.csrfToken() });
});

/**
 * Create a new user account.
 *
 * Once a user is logged in, they will be sent to the dashboard page.
 */
app.post('/register', function (req, res) {
	// Prepare input in JSON format
	var userinput = {
		"username"	: req.body.username,
		"password"	: req.body.password,
		"sid"		: req.body.sid,
		"fname"		: req.body.firstname,
		"lname"		: req.body.lastname,
		"phone"		: req.body.phone,
		"email"		: req.body.email
	};
	mysql.register(userinput, function(err, result) {
		if (err) {
			var error = 'Registration failed. Please try again.';
			// Check error code from mysql, ex duplicate email already taken
			/* 
			if (err.code === 11000) {
			error = 'That email is already taken, please try another.';
			}
			*/
			res.render('register.jade', { error: error });
		}
		else {
			//utils.createUserSession(req, res, user);
			res.redirect('/dashboard');
		}
	});
});

/**
 * Render the login page.
 */
app.get('/login', function (req, res) {
	res.render('login.jade');
	//res.render('login.jade', { csrfToken: req.csrfToken() });
});

/**
 * Log a user into their account.
 *
 * Once a user is logged in, they will be sent to the dashboard page.
 */
app.post('/login', function (req, res) {
	// Prepare input in JSON format
	var login = {
		"username" : req.body.username,
		"password" : req.body.password
	};
	// Check if credentials match
	mysql.validate(login, function(err, doesMatch) {
		if (err) {
			//res.render('login.jade', { error: "Incorrect email / password.", csrfToken: req.csrfToken() });
			res.render('login.jade', { error: err.message });
		} else {
			//utils.createUserSession(req, res, user);
			res.redirect('/dashboard');
		}
	});
});

/**
 * Log a user out of their account, then redirect them to the home page.
 */
app.get('/logout', function (req, res) {
/*
	if (req.session) {
		req.session.reset();
	}
*/
	res.redirect('/');
});