'use strict';

var express    = require('express')
  , sql        = require('./sql_utils')
  , utils      = require('./utils')
  , bcrypt     = require('bcryptjs')
  , router     = express.Router()
  ;
/* For password hash encryption */
const saltRounds    = 10;

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
    bcrypt.hash(req.body.password, saltRounds, function(err, bcryptedPassword) {
      if (err) {
        res.render('register.jade', { error: "Failed to encrypt password." });
      } else {
	    var newuser = {
			user  : req.body.username,
			pass  : bcryptedPassword,
			sid   : req.body.sid,
			fname : req.body.firstname,
			lname : req.body.lastname,
			phone : req.body.phone,
			email : req.body.email
		  };
		
        sql.query('CALL REG ( :user , :pass , :sid , :fname ,:lname , :phone , :email);', {replacements: newuser})
		.spread(function (result, metadata) {
		  utils.createUserSession(req, res, result);
		  res.redirect('/dashboard');
		})
		.catch(function(err){
		  res.render('register.jade', { error: err.message, csrfToken: req.csrfToken() });
		});
	  }
	})
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
    sql.models.users
      .findOne({
        attributes: [['user', 'username'], ['pass', 'password'], 'utype', ['fname', 'firstname'], ['lname', 'lastname']],
        where:{user: req.body.username}
      })
      .then(function(result) {
	    if (result) {
		  var userdata = result.get();
		  if (bcrypt.compareSync(req.body.password, userdata.password)) {
			utils.createUserSession(req, res, userdata);
			res.redirect('/dashboard');
		  } else {
			res.render('login.jade', { error: "Incorrect email / password.", csrfToken: req.csrfToken() });
		  }
		} else {
		  res.render('login.jade', { error: "Incorrect login/password", csrfToken: req.csrfToken() });
		}
      })
      .catch(function (err) {
        res.render('login.jade', { error: err.message, csrfToken: req.csrfToken() });
      });
  });

/**
 * Log a user out of their account, then redirect them to the home page.
 */
router.get('/logout', function (req, res) {
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
  res.render('home.jade');
});

/**
 * Render the dashboard page.
 */
router.get('/dashboard', utils.requireLogin, function(req, res) {
  res.render('dashboard.jade');
});

module.exports = router;