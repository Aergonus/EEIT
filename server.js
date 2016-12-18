'use strict';

/* Middleware */
var express		= require('express') // npm install express
	, app		= express()
	, logger	= require('morgan') // Express middlware for logging requests and responses
	, path		= require('path') // Core Node module for working with and handling paths
	, config	= require('./config') // hides secret configuration info
	, session	= require('client-sessions') // session lib by mozilla 
	, bodyParser = require('body-parser'); // Express middleware that adds body object to request allowing access to POST params

/* For Express application */
app.use(logger('dev')); // logs requests to console, dev flag includes extensive info e.g. method, status code, response time
app.use(express.static(path.join(__dirname, "public"))); // tells app to use public directory which stores public images, stylesheets, and scripts
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : true })); // for parsing application/x-www-form-urlencoded
// if you don't use the parser you're gonna get undefined for your http body (?)

/* Set-up Jade for front-end */
app.set('view engine', 'jade'); // tells Express to use the Jade templating engine
app.set('views', path.join(__dirname, 'lib', 'views')); // or ./lib/views

/* Sessions */
app.use(session({
	cookieName: 'session',
	secret: config.secret_session, // seal the cookie in a tight jar
	duration: 30 * 60 * 1000, // duration of session in ms
	activeDuration: 5 * 60 * 1000, // used to lengthen session through interaction with site
	httpOnly: true,
	secure: true,
	ephemeral: true
}));

app.locals.siteName = 'CU EEIT'; // 'Cooper Union Electrical Engineering Inventory Tracker';
app.locals.pretty = true; // Send pretty code

var router = express.Router();
app.use(router);

/* To interface with MySQL */
var mysql = require('./mysql_utils'); // Include MySQL connections and functions that interact with the db
//var routes = require('./lib/routes');
//app.use('/', routes);

/* Listen for connections */
var port = process.env.PORT || 3000;
var expressServer = app.listen(port, function () {
	console.log('Server listening on http://localhost:%d...', expressServer.address().port);
});

/* Handle HTTP messages */

/**
 * Render the home page.
 */
router.get('/', function (req, res) {
	res.render('home.jade');
});

/**
 * Render the registration page.
 */
router.get('/register', function (req, res) {
	res.render('register.jade');
	//res.render('register.jade', { csrfToken: req.csrfToken() });
});

/**
 * Render the login page.
 */
router.get('/login', function (req, res) {
	res.render('login.jade');
	//res.render('login.jade', { csrfToken: req.csrfToken() });
});

/**
 * Create a new user account.
 *
 * Once a user is logged in, they will be sent to the dashboard page.
 */
router.post('/register', function (req, res) {
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
	// if successful, redirect; if not, display error on same pageåå
	mysql.register(userinput, function(err) {
		if (err) {
			//var error = 'Registration failed. Please try again.';
			// Check error code from mysql, ex duplicate email already taken
			/* 
			if (err.code === 11000) {
			error = 'That email is already taken, please try another.';
			}
			*/
			res.render('register.jade', { error: err.message });
		} else {
			//res.send('Welcome ' + req.body.username + '!');
			//utils.createUserSession(req, res, user);
			req.session.user = userinput.username;
			res.redirect('/dashboard');
		}
	});
});

/**
 * Log a user into their account.
 * Once a user is logged in, they will be sent to the dashboard page.
 * The login also triggers a session start.
 */
router.post('/login', function(req, res) {
	// Prepare input in JSON format
	var login = {
		"username" : req.body.username,
		"password" : req.body.password
	};
	// Check if credentials match
	mysql.validate(login, function(err, username) {
		if (err) {
			//res.render('login.jade', { error: "Incorrect email / password.", csrfToken: req.csrfToken() });
			res.render('login.jade', { error: err.message });
		// Successful login
		} else {
			// Set cookie with user's login info
			// The session has begun
			req.session.user = login.username;
			res.redirect('/dashboard');
			//res.render('dashboard.jade', { user: login.username });
			//res.send('Welcome, ' + username + '! What would you like to do?');
			//utils.createUserSession(req, res, user);
		}
	});
});

/**
 * The main session middleware function
 * Runs for all requests to the router
 * Allows it so you don't have to rewrite the session logic for every route
 */
router.use(function(req, res, next) {
	// Check if the session still exists
	//console.log("HELLO");
	console.log(req.session);
	console.log(req.session.user);
	// Check this to see if session still exists
	if (req.session && req.session.user) {
		console.log("SESSION STATUS: ");
		console.log(req.session.user);
		//delete req.session.user.password; // delete the password from the session
        res.locals.user = req.session.user; // What's this for?
    }
    // Finishing processing the middleware and run the route
    next();
});

/**
 * Another middleware function that checks is session is still active
 * Allows it so you don't have to rewrite the session logic for every route
 */
function checkSession (req, res, next) {
	if (!req.session.user) {
		res.redirect('/login');
	} else {
		next();
	}
};

/**
 * Render the dashboard page after authentication (depends on user).
 * Need to check if session is still active using middleware function, or it will go back to login
 */
router.get('/dashboard', checkSession, function(req, res) {
	res.render('dashboard.jade', { user: req.session.user });
});

/**
 * Log a user out of their account, then redirect them to the home page.
 */
router.post('/logout', function(req, res) {
	// Clears session if user logs out
	req.session.reset();
	console.log("SESSION STATUS: ");
	console.log(req.session);
	res.redirect('/');
});