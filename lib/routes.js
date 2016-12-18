'use strict';

var express    = require('express')
  , models     = require('../models')
  , utils      = require('../utils')
  , mysql      = require('./mysql_utils'); // Include MySQL connections and functions that interact with the db
  , router     = express.Router()
  ;

router.all('/', function (req, res, next) {  
  console.log('Someone made a request!');
  next();
});

/**
 * Authentication Routes:
 *
 * /register
 * /login
 * /logout
 */

/**
 * Define a route for Registration
 * 
 * Once a user is logged in, they will be sent to the dashboard page.
 */

router.route('/register')
  .get(function(req, res) {
    res.render('register.jade', { csrfToken: req.csrfToken() });
  })
  .post(function(req, res) {
	// Prepare input in User Model format
    var userinput = new models.User({
		"username" : req.body.username,
		"password" : req.body.password,
		"sid"      : req.body.sid,
		"fname"    : req.body.firstname,
		"lname"    : req.body.lastname,
		"phone"    : req.body.phone,
		"email"    : req.body.email
    });
	/*
      firstName:  req.body.firstName,
      lastName:   req.body.lastName,
      email:      req.body.email,
      password:   hash,
	*/
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
			utils.createUserSession(req, res, user);
			res.redirect('/dashboard');
		}
	});
  });

/**
 * Define a route for Login
 * 
 * Once a user is logged in, they will be sent to the dashboard page.
 */
router.route('/login')
  .get(function(req, res) {
    res.render('login.jade', { csrfToken: req.csrfToken() });
  })
  .post(function(req, res) {
	// Prepare input in JSON format
	var login = {
		"username" : req.body.username,
		"password" : req.body.password
	};
	// Check if credentials match
	mysql.validate(login, function(err, doesMatch) {
		if (err) {
			res.render('login.jade', { error: err.message, csrfToken: req.csrfToken() });
		} else {
			//utils.createUserSession(req, res, user);
			res.redirect('/dashboard');
		}
	});
	/*
    models.User.findOne({ email: req.body.email }, 'firstName lastName email password data', function(err, user) {
      if (!user) {
        res.render('login.jade', { error: "Incorrect email / password.", csrfToken: req.csrfToken() });
      } else {
        if (bcrypt.compareSync(req.body.password, user.password)) {
          utils.createUserSession(req, res, user);
          res.redirect('/dashboard');
        } else {
          res.render('login.jade', { error: "Incorrect email / password.", csrfToken: req.csrfToken() });
        }
      }
    });
	*/
  });

/**
 * Log a user out of their account, then redirect them to the home page.
 */
app.get('/logout', function (req, res) {
	if (req.session) {
		req.session.reset();
	}
	res.redirect('/');
});

/**
 * General Routes
 *
 * /
 * /dashboard
 */


/**
 * Render the home page.
 */
router.get('/', function(req, res) {
//router.get('/', stormpath.getUser, function(req, res) { !!!!!! if user exists, forward away?
  res.render('index.jade');
});

/**
 * Render the dashboard page.
 */
router.get('/dashboard', utils.requireLogin, function(req, res) {
  res.render('dashboard.jade');
});









module.exports = router;









