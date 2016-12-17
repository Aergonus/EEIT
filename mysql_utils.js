'use strict';

var mysql      = require('mysql');
var env        = process.env.NODE_ENV || 'dev';
var connection = require('./config')[env];
var pool       = mysql.createPool(connection);

var bcrypt     = require('bcryptjs');
const saltRounds = 10;

// Sample User Object
var tempuser = {
	"username":"UniqueUsername",
	"password":"CleverPassword",
	"sid":"0000000",
	"fname":"First",
	"lname":"Last",
	"phone":"8000000911",
	"email":"test@gmail.com"
}

// Remember to release connection.release()
var getConnection = function(callback) {
    pool.getConnection(function(err, connection) {
        callback(err, connection);
    });
};

function register(newuser, callback){
	bcrypt.hash(newuser.password, saltRounds, function( err, bcryptedPassword) {
		// Store hash in your password DB.
		pool.getConnection(function(err, con) {
			con.query('CALL REG (?,?,?,?,?,?,?)',
				[newuser.username, bcryptedPassword, newuser.sid,
				 newuser.fname, newuser.lname, newuser.phone, newuser.email], function(err,result){
				 callback(err, result);
			});
			con.release();
		});
	});
};

function validate(login, callback){
	pool.getConnection(function(err, con) {
		con.query('CALL VAL(?)',[login.username],function(err,result){
			if (err) {
				//throw err; // Have to handle if nothing is returned!
				console.log("Error querying user in database.");
				con.release();
				return;
			}
			if (result[0][0] == undefined) {
				console.log("No matching users in database.");
				con.release();
				return;
			}
			if (result == '') {
				console.log("Incorrect credentials.");
				con.release();
				return;
			}
			// Username is unique so only one row will be returned
			// db_hash = res[0][0].pass; 
			// first 0 gets the query results rather than query statistic info, second 0 retrieves the first record of query results
			
			bcrypt.compare(login.password, result[0][0].pass, function(err, doesMatch){
				callback(err, doesMatch);
			});
			con.release();
		});
	});
};
	
module.exports.getCon = getConnection;
module.exports.register = register;
module.exports.validate = validate;

/* Example useage
var tempuser = {
	"username":"UniqueUsername",
	"password":"CleverPassword",
	"sid":"0000000",
	"fname":"First",
	"lname":"Last",
	"phone":"8000000911",
	"email":"temp@gmail.com"
}

mysql.register(tempuser);
mysql.validate(tempuser);
*/