'use strict';

var express	= require('express') 
  , app		= express()
  , logger	 = require('morgan') // Express middlware for logging requests and responses
  , path	   = require('path') // Core Node module for working with and handling paths
  , config	 = require('./config') // hides secret configuration info
  , session	= require('client-sessions')
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
app.use(bodyParser.urlencoded({ extended : true }));
app.locals.siteName = 'CU EEIT'; // 'Cooper Union Electrical Engineering Inventory Tracker';

var mysql = require('./mysql_utils'); // Include MySQL connections and functions that interact with the db
//var routes = require('./lib/routes');
//app.use('/', routes);

var port = process.env.PORT || 3000;
var expressServer = app.listen(port, function () {
  console.log('Server listening on http://localhost:' + port);
});

app.get('/', function (req, res) {
  res.render('home.jade');
});
app.get('/login', function (req, res) {
  res.render('login.jade');
});
app.post('/login', function (req, res) {
   // Prepare output in JSON format
   var login = {
	  username : req.body.username,
	  password : req.body.password
   };
   // Check if credentials match
   mysql.validate(login, function(err, doesMatch) {
	  if (doesMatch) {
		res.send("Welcome");
		console.log("Welcome");
	  } else {
		// Go away
		res.send("GTFO");
		console.log("GTFO");
	  }
   });
});
app.get('/register', function (req, res) {
  res.render('register.jade');
});
app.post('/register', function (req, res) {
  //var input = res.json(req.body);
  var userinput = {
	"username" : req.body.username,
	"password" : req.body.password,
	"sid"	  : req.body.sid,
	"fname"	: req.body.firstname,
	"lname"	: req.body.lastname,
	"phone"	: req.body.phone,
	"email"	: req.body.email
  };
  mysql.register(userinput, function(err, result) {
	  if (err) {
		  res.send("Could not register.");
		  return;
	  }
	  else {
		res.send("You have successfully registered!")
		  //res.render('dashboard.jade');
	  }
  });

  // if successful redirect, if not back to register with error passed
  //res.render('register.jade', {error : error});
});
app.get('/dashboard', function (req, res) {
  res.render('dashboard.jade');
});
app.get('/logout', function (req, res) {
  res.redirect('/');
});