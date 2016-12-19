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
						sql.query('UPDATE Users SET '
									+ ' fname = COALESCE(?, fname),'
									+ ' lname = COALESCE(?, lname)'
									+ ' WHERE `user` = ?', 
									{ replacements: [
										req.body.firstname,
										req.body.lastname,
										req.session.user.username],
									type: sql.QueryTypes.UPDATE })
						// Update Session info
						req.session.user.firstname = req.body.firstname || req.session.user.firstname;
						req.session.user.lastname = req.body.lastname || req.session.user.lastname;
						utils.createUserSession(req, res, req.session.user);
                        res.render('profile.jade', { success: "Profile updated.", csrfToken: req.csrfToken() });
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
		sql.query('SELECT T.name, L.room, L.desc as ldesc, T.desc as etdesc, T.datasheet, E.ino ' +
				'FROM Equipment AS E, EquipmentTypes AS T, Locations AS L ' +
				'WHERE E.etid = T.etid AND E.lid = L.lid ' +
				'AND ( MATCH(T.name) AGAINST(?) ' +
					'OR MATCH(T.desc) AGAINST(?) )' +
					//'OR T.name LIKE ? )' + // using like is kinda jank cuz empty string so leave out for now
				'AND (T.name IS NULL OR T.name IS NOT NULL) ' +
				'AND (L.room IS NULL OR L.room IS NOT NULL) ' +
				'AND (L.desc IS NULL OR L.desc IS NOT NULL) ' +
				'AND (T.desc IS NULL OR T.desc IS NOT NULL) ' +
				'AND (T.datasheet IS NULL OR T.datasheet IS NOT NULL) ' +
				'AND (E.ino IS NULL OR E.ino IS NOT NULL)',
				{ replacements: [
					searchInput.partname,
					searchInput.description,
					'%'+searchInput.partname+'%'],
				type: sql.QueryTypes.SELECT })
			.then(function(result) {
				//res.send("Searching for parts..."); // placeholder
				//res.send('Searching for parts...\n' + JSON.stringify(result));
				//var ob = { action:"date +%s", result:"1367263074"};
				//res.render('results.jade', { packet: result });
				console.log("Successfully queried from database.");
                console.log(result);
                //console.log(result[0]);
				res.render('results.jade', { table: result });
			})
			.catch(function(err) {
				res.render('search.jade', { error: err.message, csrfToken: req.csrfToken() });
			});
	});


/** 
 * Define a route for requests
 * Main request page to list requests for user
 * New request page
 * Successful request page
 */
router.route('/requests')
	.get(function(req, res) {
		console.log('HEY')
		console.log(req.user);
		console.log(req.session.user);
		sql.query('SELECT R.rflag, R.rdata ' + //'SELECT R.rdate, R.rflag, R.rtitle, R.rdata ' +
				'FROM Requests R, Users U ' +
				'WHERE R.uid = U.uid and U.user = ?',
				{ replacements: [req.session.user.username], // req.session.user gives error val.replace
				type: sql.QueryTypes.SELECT })				// also be careful if you get logged out this will break
			.then(function(result) {
				console.log("Successfully queried from database.");
                console.log(result);
                console.log(result[0]);
				res.render('requests.jade', { requests: result, csrfToken: req.csrfToken() }); // do we need token here?
			})
			.catch(function(err) {
				res.render('requests.jade', { error: err.message, csrfToken: req.csrfToken() });
			});
	});

router.route('/requests/new')
	.get(function(req, res) {
		res.render('newrequest.jade', { csrfToken: req.csrfToken() });
	})
    .post(function(req, res) {
        var requestInput = {
            "reqtitle"      : req.body.reqtitle,
            "reqdata"       : req.body.reqdata,
        };
        console.log("WHAT")
        //console.log(req.user);
        console.log(req.session.user);
        console.log(req.session.user.username);
        sql.query('SELECT U.uid FROM Users U WHERE U.user = ?',
                { replacements: [req.session.user.username],
                type: sql.QueryTypes.SELECT })
            .then(function(result) {
                //console.log(result)
                //console.log(result[0].uid)
                req.session.userid = result[0].uid; // need to store this globally or the 2nd query won't be able to get it
            })
            .catch(function(err) {
                res.render('newrequest.jade', { error: err.message, csrfToken: req.csrfToken() });
            });
        sql.query('INSERT INTO Requests (uid, rflag, rdata) ' + // add datetime NOW()
            'VALUES(?, ?, ?)',
            { replacements: [req.session.userid, 'pending', requestInput.reqdata],
            type: sql.QueryTypes.INSERT })
        .then(function() {
            res.redirect('/requests/success');
        })
        .catch(function(err) {
            res.render('newrequest.jade', { error: err.message, csrfToken: req.csrfToken() });
        });
    });

router.route('/requests/success')
    .get(function(req, res) {
        res.render('requestsuccess.jade');
    });

/**
 * Log a user out of their account, then redirect them to the home page.
 */
router.get('/logout', function(req, res) {
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
	// Display username in welcome screen
    res.render('dashboard.jade', { username : req.user.username });
});


module.exports = router;
