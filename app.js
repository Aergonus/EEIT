'use strict';

var mysql = require('./mysql_interface'); // Include MySQL connections and functions that interact with the db

//var routes = require('./lib/routes');

var express    = require('express') 
  , app        = express()
  , logger     = require('morgan') // Express middlware for logging requests and responses
  , path       = require('path') // Core Node module for working with and handling paths
  , config     = require('./config') // hides secret configuration info
  , session    = require('client-sessions')
  , bodyParser = require('body-parser'); // Express middleware that adds body object to request allowing access to POST params

app.use(logger('dev')); // logs requests to console, dev flag includes extensive info e.g. method, status code, response time
app.use(express.static(path.join(__dirname, "public"))); // tells app to use public directiory which stores public images, stylesheets, and scripts
app.set('view engine', 'jade'); // tells Express to use the Jade templating engine
app.set('views', path.join(__dirname, 'lib', 'views'); // or ./lib/views
app.use(session({
  cookieName: 'session',
  secret: config.secret_session,
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  httpOnly: true,
  secure: true,
  ephemeral: true
}));
app.use(bodyParser.urlencoded({ extended : true }));
app.locals.siteName = 'CU EEIT'; // 'Cooper Union Electrical Engineering Inventory Tracker';





//app.use('/', routes);
var port = process.env.PORT || 3000;
var expressServer = app.listen(port, function () {
  console.log('Server listening on http://localhost:' + port);
});

var tempuser = {
	"username":"UniqueUsername",
	"password":"CleverPassword",
	"sid":"0000000",
	"fname":"First",
	"lname":"Last",
	"phone":"8000000911",
	"email":"temp@gmail.com"
}

//mysql.register(tempuser);
mysql.validate(tempuser);

app.get('/', function (req, res) {
  res.render('home.jade');
});
app.get('/login', function (req, res) {
  res.render('login.jade');
});
app.get('/register', function (req, res) {
  res.render('register.jade');
});
app.post('/register', function (req, res) {
  //var input = res.json(req.body);
  var userinput = {
	"username" : req.body.username,
	"password" : req.body.password,
	"sid"      : req.body.sid,
	"fname"    : req.body.firstname,
	"lname"    : req.body.lastname,
	"phone"    : req.body.phone,
	"email"    : req.body.email
  };
  console.log(userinput);
  mysql.register(userinput);
  //res.render('dashboard.jade');
  // if successful redirect, if not back to register with error passed
  //res.render('register.jade', {error : error});
});
app.get('/dashboard', function (req, res) {
  res.render('dashboard.jade');
});
app.get('/logout', function (req, res) {
  res.redirect('/');
});
/*
app.post('/login', function(req, res) {
	mysql.validate( req.body, function(req, ) {
		console.log(res);
	});
});
*/
/*
app.post('/login', function(req, res) {
	mysql.validate( {
		
	{"username":req.body.username, , function(err, res);


  User.findOne({ email: req.body.email }, function(err, user) {
    if (!user) {
      res.render('login.jade', { error: 'Invalid email or password.' });
    } else {
      if (req.body.password === user.password) {
        // sets a cookie with the user's info
        req.session.user = user;
        res.redirect('/dashboard');
      } else {
        res.render('login.jade', { error: 'Invalid email or password.' });
      }
    }
  });
});

app.get('/dashboard', function(req, res) {
  if (req.session && req.session.user) { // Check if session exists
    // lookup the user in the DB by pulling their email from the session
    User.findOne({ email: req.session.user.email }, function (err, user) {
      if (!user) {
        // if the user isn't found in the DB, reset the session info and
        // redirect the user to the login page
        req.session.reset();
        res.redirect('/login');
      } else {
        // expose the user to the template
        res.locals.user = user;
 
        // render the dashboard page
        res.render('dashboard.jade');
      }
    });
  } else {
    res.redirect('/login');
  }
});

app.use(function(req, res, next) {
  if (req.session && req.session.user) {
    User.findOne({ email: req.session.user.email }, function(err, user) {
      if (user) {
        req.user = user;
        delete req.user.password; // delete the password from the session
        req.session.user = user;  //refresh the session value
        res.locals.user = user;
      }
      // finishing processing the middleware and run the route
      next();
    });
  } else {
    next();
  }
});

function requireLogin (req, res, next) {
  if (!req.user) {
    res.redirect('/login');
  } else {
    next();
  }
};

app.get('/logout', function(req, res) {
  req.session.reset();
  res.redirect('/');
});
*/