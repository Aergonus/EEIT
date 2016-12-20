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
router.route(['/search', '/kits/catalog'])
	.get(function(req, res) {
		res.render('search.jade', { csrfToken: req.csrfToken() });
	})
	.post(function(req, res) {
		// Call function to query db
		var searchInput = {
			"gensearch"		: req.body.gensearch,
			"lsearch"       : req.body.lname || req.body.lroom || req.body.ldesc,
			"lname"			: req.body.lname,
			"lroom"			: req.body.lroom,
			"ldesc"			: req.body.ldesc,
			"etsearch"      : req.body.etname || req.body.etcat || req.body.etdesc,
			"etname"		: req.body.etname,
			"etcat"			: req.body.etcat,
			"etdesc"		: req.body.etdesc,
			"esearch"       : req.body.ename || req.body.edesc,
			"ename"			: req.body.ename,
			"edesc"			: req.body.edesc
		};
		if (searchInput.gensearch) {
		    // Was not advanced query search, search everywhere
            sql.query('SELECT T.name, L.room, L.desc as ldesc, T.desc as etdesc, T.datasheet, E.ino ' +
                'FROM Equipment AS E, EquipmentTypes AS T, Locations AS L ' +
                'WHERE E.etid = T.etid AND E.lid = L.lid ' +
                'AND ( ' +
                    //'MATCH(T.name) AGAINST(?) ' +
                    //'OR MATCH(T.cat) AGAINST(?) ' + // this is integer
                    'MATCH(T.desc) AGAINST(?) ' + 
                    //'OR MATCH(L.name) AGAINST(?) ' + // do MATCH for long entries, multiples words
                    //'OR MATCH(L.room) AGAINST(?) ' + // LIKE for shorter entries (one word)
                    'OR MATCH(L.desc) AGAINST(?) ' +
                    'OR T.name LIKE ? ' +
                    'OR T.cat LIKE ? ' +  
                    //'OR T.desc LIKE ? ' + 
                    'OR L.name LIKE ? ' + 
                    'OR L.room LIKE ? ' +
                    // Flip the pancake over, doesn't work
                    /*
                    'OR MATCH(?) AGAINST(T.desc) ' +
                    'OR MATCH(?) AGAINST(L.desc) ' +
                    'OR ? LIKE %T.name% ' + 
                    'OR ? LIKE %L.name% ' + 
                    'OR ? LIKE %L.room% ' +
                    */
                    ')',
                { replacements: [
                    searchInput.gensearch,
                    searchInput.gensearch,
                    '%'+searchInput.gensearch+'%',
                    '%'+searchInput.gensearch+'%',
                    '%'+searchInput.gensearch+'%',
                    '%'+searchInput.gensearch+'%',
                    ],
                type: sql.QueryTypes.SELECT })
            .then(function(result) {
                res.render('results.jade', { catalog: result });
            })
            .catch(function(err) {
                res.render('search.jade', { error: err.message, csrfToken: req.csrfToken() });
            });
	    } else {
			if (searchInput.lsearch && !searchInput.etsearch) {
				// Must have a location search. Compile lids to search Equipment IN
                sql.query('SELECT T.name, L.room, L.desc as ldesc, T.desc as etdesc, T.datasheet, E.ino ' +
                    'FROM Equipment AS E, EquipmentTypes AS T, Locations AS L ' +
                    'WHERE E.etid = T.etid AND E.lid = L.lid ' +
                    'AND ( MATCH(T.name) AGAINST(?) ' +
                        'OR MATCH(T.cat) AGAINST(?) ' + // this is integer
                        'OR MATCH(T.desc) AGAINST(?) ' +
                    ')',
                    { replacements: [
                        searchInput.etname,
                        //searchInput.etcat,
                        searchInput.etdesc,
                        ],
                    type: sql.QueryTypes.SELECT })
                .then(function(result) {
                    res.render('results.jade', { catalog: result });
                })
                .catch(function(err) {
                    res.render('search.jade', { error: err.message, csrfToken: req.csrfToken() });
                });
			}
            else if (searchInput.etsearch && !searchInput.etsearch) {
				// Must have a equip type search. Compile lids to search Equipment IN
                sql.query('SELECT T.name, L.room, L.desc as ldesc, T.desc as etdesc, T.datasheet, E.ino ' +
                    'FROM Equipment AS E, EquipmentTypes AS T, Locations AS L ' +
                    'WHERE E.etid = T.etid AND E.lid = L.lid ' +
                    'AND ( MATCH(L.name) AGAINST(?) ' +
                        'OR MATCH(L.room) AGAINST(?) ' +
                        'OR MATCH(L.desc) AGAINST(?) ' +
                    ')',
                    { replacements: [
                        searchInput.lname,
                        searchInput.lroom,
                        searchInput.ldesc
                        ],
                    type: sql.QueryTypes.SELECT })
                .then(function(result) {
                    res.render('results.jade', { catalog: result });
                })
                .catch(function(err) {
                    res.render('search.jade', { error: err.message, csrfToken: req.csrfToken() });
                });
			}
            else if (searchInput.lsearch && searchInput.etsearch) {
                // Must have a location search. Compile lids to search Equipment IN
                sql.query('SELECT T.name, L.room, L.desc as ldesc, T.desc as etdesc, T.datasheet, E.ino ' +
                    'FROM Equipment AS E, EquipmentTypes AS T, Locations AS L ' +
                    'WHERE E.etid = T.etid AND E.lid = L.lid ' +
                    'AND ( MATCH(T.name) AGAINST(?) ' +
                        'OR MATCH(T.cat) AGAINST(?) ' + // this is integer
                        'OR MATCH(T.desc) AGAINST(?) ' +
                        'OR MATCH(L.name) AGAINST(?) ' +
                        'OR MATCH(L.room) AGAINST(?) ' +
                        'OR MATCH(L.desc) AGAINST(?) ' +
                    ')',
                    { replacements: [
                        searchInput.etname,
                        //searchInput.etcat,
                        searchInput.etdesc,
                        searchInput.lname,
                        searchInput.lroom,
                        searchInput.ldesc
                        ],
                    type: sql.QueryTypes.SELECT })
                .then(function(result) {
                    res.render('results.jade', { catalog: result });
                })
                .catch(function(err) {
                    res.render('search.jade', { error: err.message, csrfToken: req.csrfToken() });
                });
            }
            else {
                res.render('search.jade', { error: "No query specified.", csrfToken: req.csrfToken() });
            }
			// Build and exec query
		}

		/*
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
		*/
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
                // BE SURE NOT TO OPEN MULTIPLE TABS OR UID IS NULL
                // need to store this globally or the 2nd query won't be able to get it
                req.session.userid = result[0].uid; 
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
 * KITS BABY
 */
router.route('/kits')
    // Load kits that you've already made
    .get(function(req, res) {
        /* TEST
        var kits = [
            { kitid: 1, kitname: 'Kit 1', description: 'Hello!' },
            { kitid: 2, kitname: 'Kit 2', description: 'Yo!' },
            { kitid: 3, kitname: 'Kit 3', description: 'Bonjour!' }
        ];
        */
        console.log('HELLO?')
        // Get current kits
        sql.query('SELECT K.kid as kitid, K.name, K.desc ' + //'SELECT R.rdate, R.rflag, R.rtitle, R.rdata ' +
                'FROM Kits K, Users U ' +
                'WHERE K.uid = U.uid and U.user = ?',
                { replacements: [req.session.user.username], // req.session.user gives error val.replace
                type: sql.QueryTypes.SELECT })              // also be careful if you get logged out this will break
            .then(function(result) {
                console.log("Successfully queried from database.");
                console.log(result);
                res.render('kits.jade', { kits: result, csrfToken: req.csrfToken() }); // do we need token here?
            })
            .catch(function(err) {
                res.render('kits.jade', { error: err.message, csrfToken: req.csrfToken() });
            }); 
    })
    // Handle deletion of kits on the same page
    .post(function(req, res) {
        console.log("I AM HERE")
        // var data = JSON.parse(req.body); // returns error cuz ITS ALREADY AN OBJECT SO WHY CANT I ITERATE
        console.log(req.body)
        console.log("IS DELETE: " + req.body.delete)
        //var result = "";
        /*
        var obj = req.body;
        for (var p in obj) {
            if( obj.hasOwnProperty(p) ) {
                console.log(p)
                console.log(obj[p])
              result += p + " , " + obj[p] + "\n";
            } 
            console.log(result)
        }
        */
        // If the delete button was pressed
        if (req.body.delete != undefined) {
            console.log("DELETE BUTTON PRESSED");
            // need to go through kits and check if they're checked/
            // ignore last one cuz it's the csrf (WHY DOES IT SHOW UP)
            var isDeletion = false; // reload webpage only if deletion happened
            var deleteList = req.body;
            for (var key in deleteList) {
                /*
                if (deleteList.hasOwnProperty(key)) {
                    console.log(key)
                    var item = req.body[key];
                    console.log(item);
                }
                */
                if (deleteList.hasOwnProperty(key)) {
                    console.log(key)
                    console.log(req.body[key])
                    if (req.body[key] == 'on') {
                        isDeletion = true;
                        console.log("DELETING");
                        // DELETE DAT SHIIIIEEEEEZ
                        // Convert key from string to value so you can query with it
                        console.log(key)
                        sql.query('DELETE FROM Kits WHERE kid = ?',
                            { replacements: [key],
                            type: sql.QueryTypes.DELETE })
                        .catch(function(err) {
                            return res.render('kits.jade', { error: err.message, csrfToken: req.csrfToken() });
                        });
                    }
                }
            }
            if (isDeletion) {
                res.redirect('/kits');
            } else {
                res.render('kitnodelete.jade', { csrfToken: req.csrfToken() });
            }
        } else {
            console.log("VIEW BUTTON PRESSED");
            for (key in req.body) { // only 1 key anyway
                if (req.body[key] == 'View Kit') {
                    if (req.body.hasOwnProperty(key)) {
                        console.log(key); // key gets you the kit id
                        req.session.kitid = parseInt(key); // store kitid and redirect
                    } 
                }
            }
            // Get the kit name too
            sql.query('SELECT K.name AS kitname FROM Kits K WHERE K.kid = ?',
                { replacements: [req.session.kitid], // the query won't work with a string
                type: sql.QueryTypes.SELECT })
            .then(function(result) {
                console.log(result[0])
                console.log(result[0].kitname)
                req.session.kitname = result[0].kitname;
                res.redirect('/kits/content');
            })
            .catch(function(err) {
                return res.render('kits.jade', { error: err.message, csrfToken: req.csrfToken() });
            });
        }
    });

router.route('/kits/new')
    // Loads kit creation form
    .get(function(req, res) {
        res.render('newkit.jade', { csrfToken: req.csrfToken() });
    })
    // Processes kit form and returns success or failure
    .post(function(req, res) {
        var kitInput = {
            "kitname"      : req.body.kitname,
            "kitdesc"      : req.body.kitdesc,
        };
        console.log("CHECKPOINT")
        // Add kit to database
        sql.query('SELECT U.uid FROM Users U WHERE U.user = ?',
                { replacements: [req.session.user.username],
                type: sql.QueryTypes.SELECT })
            .then(function(result) {
                // BE SURE NOT TO OPEN MULTIPLE TABS OR UID IS NULL
                // need to store this globally or the 2nd query won't be able to get it
                req.session.userid = result[0].uid; 
            })
            .catch(function(err) {
                res.render('newkit.jade', { error: err.message, csrfToken: req.csrfToken() });
            });
        sql.query('INSERT INTO Kits (uid, name, `desc`) ' + // add datetime NOW()
            'VALUES(?, ?, ?)',
            { replacements: [req.session.userid, kitInput.kitname, kitInput.kitdesc],
            type: sql.QueryTypes.INSERT })
        .then(function() {
            res.redirect('/kits/success');
        })
        .catch(function(err) {
            res.render('newkit.jade', { error: err.message, csrfToken: req.csrfToken() });
        });
    });

router.route('/kits/success')
    // Kit creation success
    .get(function(req, res) {
        res.render('kitsuccess.jade', { csrfToken: req.csrfToken() });
    });

// Change link based on different kit names?
router.route('/kits/content')
    // See what items are in the kit
    .get(function(req, res) {
        /* TEST
        var kitentries = [
            { kitid: 1, etid: 1, quantity: 1 },
            { kitid: 2, etid: 2, quantity: 2 },
            { kitid: 3, etid: 3, quantity: 3 }
        ];
        */
        // Get current kit entries
        sql.query('SELECT ET.etid, ET.name, ET.desc, KE.quantity ' + //'SELECT R.rdate, R.rflag, R.rtitle, R.rdata ' +
                'FROM Kits K, KitEntries KE, EquipmentTypes ET ' +
                'WHERE KE.kid = K.kid and KE.etid = ET.etid ' +
                'AND K.kid = ?',
                { replacements: [req.session.kitid],
                type: sql.QueryTypes.SELECT })
            .then(function(result) {
                console.log("I AM HERE")
                console.log(result[0]);
                res.render('kitcontents.jade', { kitname: req.session.kitname, 
                    kitentries: result, csrfToken: req.csrfToken() }); // do we need token here?
            })
            .catch(function(err) {
                res.render('kitcontents.jade', { error: err.message, csrfToken: req.csrfToken() });
            }); 
    });

/*
router.route('/kits/catalog')
    // Kit catalog to add items to kit
    .get(function(req, res) {
        res.render('search.jade', {csrfToken: req.csrfToken()} )
        //res.redirect('/search')
    });
    */


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
router.get('/', utils.checkAuth, function(req, res) {
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
