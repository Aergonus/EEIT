'use strict';

var express		= require('express')
	, sql 		= require('./sql_utils')
    , utils 	= require('./utils')
    , bcrypt 	= require('bcryptjs')
    , router 	= express.Router();

/* For password hash encryption */
const saltRounds = 10;

router.all('/', function(req, res, next) {
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
                    user: req.body.username,
                    pass: bcryptedPassword,
                    sid: req.body.sid,
                    fname: req.body.firstname,
                    lname: req.body.lastname,
                    phone: req.body.phone,
                    email: req.body.email
                };
                sql.query('CALL REG ( :user , :pass , :sid , :fname ,:lname , :phone , :email);', { replacements: newuser })
                    .spread(function(result, metadata) {
                        utils.createUserSession(req, res, result);
                        res.redirect('/dashboard');
                    })
                    .catch(function(err) {
                    	if (err.parent.code == 'ER_DUP_ENTRY') {
                    		res.render('register.jade', { error: "Username/e-mail already exists.", csrfToken: req.csrfToken() });
                        } else {
	                        res.render('register.jade', { error: err.message, csrfToken: req.csrfToken() });
	                    }
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
            "username": req.body.username,
            "password": req.body.password
        };
        // Check if credentials match
        sql.models.Users
            .findOne({
                attributes: [
                    ['user', 'username'],
                    ['pass', 'password'], 'utype', ['fname', 'firstname'],
                    ['lname', 'lastname']
                ],
                where: { user: req.body.username }
            })
            .then(function(result) {
                if (result) {
                    var userdata = result.get();
                    if (bcrypt.compareSync(req.body.password, userdata.password)) {
                        utils.createUserSession(req, res, userdata);
                        res.redirect('/dashboard');
                    } else {
                        res.render('login.jade', { error: "Incorrect e-mail/password.", csrfToken: req.csrfToken() });
                    }
                } else {
                    res.render('login.jade', { error: "Incorrect login/password", csrfToken: req.csrfToken() });
                }
            })
            .catch(function(err) {
                res.render('login.jade', { error: err.message, csrfToken: req.csrfToken() });
            });
    });
/** 
 * Define a route for Profile
 */
router.route('/profile')
	.get(utils.requireLogin, function(req, res) {
		res.render('profile.jade', { csrfToken: req.csrfToken() });
	})
	.post(utils.requireLogin, function(req, res) {
        sql.models.Users
            .findOne({
                attributes: [
                    ['user', 'username'],
                    ['pass', 'password'], 'utype', ['fname', 'firstname'],
                    ['lname', 'lastname']
                ],
                where: { user: req.session.user.username }
            })
            .then(function(result) {
                if (result) {
                    var userdata = result.get();
                    if (bcrypt.compareSync(req.body.password, userdata.password)) {
						//sql.query('UPDATE Users SET fname... req.body.blah
						// Have to take care of empty fields
						// Update Session info
						// utils.createUserSession(req, res, userdata);
                        res.render('profile.jade', { success: "Profile Updated.", csrfToken: req.csrfToken() });
                    } else {
                        res.render('profile.jade', { error: "Incorrect password.", csrfToken: req.csrfToken() });
                    }
                } else {
                    res.render('profile.jade', { error: "Incorrect password.", csrfToken: req.csrfToken() });
                }
            })
			.catch(function(err) {
                res.render('profile.jade', { error: err.message, csrfToken: req.csrfToken() });
            });
    });
/** 
 * Define a route for Searching
 *
 * Once a logged in user clicks the Search button,
 * they will be redirected to the search form.
 *
 */
router.route('/search')
	.get(function(req, res) {
		res.render('search.jade', { csrfToken: req.csrfToken() });
	})
	.post(function(req, res) {
		// Call function to query db
		var searchInput = {
			"partname"		: req.body.partname,
			"partno"		: req.body.partno,
			//"category"		: req.body.category,
			"description"	: req.body.description
		};
		sql.query('SELECT T.name, L.room, L.desc, T.desc, T.datasheet, E.ino ' +
				'FROM Equipment AS E, EquipmentTypes AS T, Locations AS L ' +
				'WHERE E.etid = T.etid AND E.lid = L.lid ' +
				'AND ( MATCH(T.name) AGAINST(?) ' +
					'OR MATCH(T.name) AGAINST(?) ' +
					'OR MATCH(T.desc) AGAINST(?) )',
				{ replacements: [
					searchInput.partname,
					searchInput.partno,
					searchInput.description],
				type: sql.QueryTypes.SELECT })
			.then(function(result) {
				//res.send("Searching for parts..."); // placeholder
				//res.send('Searching for parts...\n' + JSON.stringify(result));
				//var ob = { action:"date +%s", result:"1367263074"};
				//res.render('results.jade', { packet: result });
				console.log("Successfully queried from database.");
                console.log(result);
                console.log(result[0]);
				res.render('results.jade', { table: result });
			})
			.catch(function(err) {
				res.render('search.jade', { error: err.message, csrfToken: req.csrfToken() });
			});
	});

/**
 * Log a user out of their account, then redirect them to the home page.
 */
router.get('/logout', function(req, res) {
	console.log("LOGGING OUT")
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
