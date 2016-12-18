'use strict';

var mysql       = require('mysql'); // npm install mysql
var env         = process.env.NODE_ENV || 'dev';

/* Create connection pool to database */
var connection  = require('./config')[env];
var pool        = mysql.createPool(connection);

/* For password hash encryption */
var bcrypt          = require('bcryptjs'); // npm install bcryptjs
const saltRounds    = 10;

// Sample User Object
var tempuser = {
    "username"  : "UniqueUsername",
    "password"  : "CleverPassword",
    "sid"       : "0000000",
    "fname"     : "First",
    "lname"     : "Last",
    "phone"     : "8000000911",
    "email"     : "test@gmail.com"
}

function register(newuser, callback) {
    pool.getConnection(function(err, con) {
        if (err) {
            // we're sending this message back to the user
            callback(new Error("Cannot connect to database."));
            con.release();
            return console.error("getConnection: Error connecting to database: " + err);
        } else {
            // Store hash in your password DB.
            bcrypt.hash(newuser.password, saltRounds, function(err, bcryptedPassword) {
                if (err) {
                    callback(new Error("Unexpected error."));
                    con.release();
                    return console.error("hash: Error hashing password: " + err);
                }
                con.query('CALL REG (?,?,?,?,?,?,?)',
                    [newuser.username, bcryptedPassword, newuser.sid,
                     newuser.fname, newuser.lname, newuser.phone, newuser.email], function(err, result) {
                     // Error objects have 2 fields: name and message
                     // In our case, err.name yields 'Error: '
                     // We can omit that when sending it to the user so just use err.message
                    if (err) { // do this first because can't take message field if err is null
                        if (err.message.substring(0,12) == 'ER_DUP_ENTRY') {
                            callback(new Error("Username already exists.")); // account for more cases
                        } else {
                            callback(new Error("Unexpected error.")); // account for more cases
                        }
                        console.error("query: Error querying the database: " + err);
                    } else {
                        callback(null);
                        console.log("Successfully registered %s.", newuser.username);
                    }
                });
                con.release();
            });
        }
    });
};

function validate(login, callback) {
    pool.getConnection(function(err, con) {
        if (err) {
            callback(new Error("Cannot connect to database.")); // Have to handle if nothing is returned!
            console.error("getConnection: Error connecting to database: " + err);
        } else {
            con.query('CALL VAL(?)', [login.username], function(err, result) {
                if (err) {
                    callback(new Error("Unexpected error."));
                    console.error("query: Error querying user in database: " + err);
                } else if (result[0][0] == undefined) {
                    callback(new Error("Invalid username/password combination."));
                    console.log("No matching users in database.");
                } else {
                    // Username is unique so only one row will be returned
                    // first 0 gets the query results rather than query statistic info, second 0 retrieves the first record of query results
                    bcrypt.compare(login.password, result[0][0].pass, function(err, doesMatch) {
                        if (err) {
                            callback(new Error("Unexpected error."));
                            console.error("compare: Error comparing hashes: " + err);
                        } else if (doesMatch) {
                            callback(null, login.username);
                            console.log("Welcome, %s!", login.username);
                        } else {
                            callback(new Error("Invalid username/password combination."));
                            console.log("GTFO");
                        }
                    });
                }
                con.release();
            });
        }
    });
};

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
