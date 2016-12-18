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

/* For REGISTER, need to error check the following cases:
 *
 * SYSTEM ERRORS (not the user's fault):
 *      1: Connection to DB failed
 *      2: Hashing password failed
 *      3: Querying failed (though this may be user's fault)
 *
 * USER ERRORS
 *      1: User registered with existing username (this results in a querying error)
 *      
 */
function register(newuser, callback) {
    pool.getConnection(function(err, con) {
        // SYSTEM ERROR 1
        if (err) {
            // We're sending this message back to the user
            callback(new Error("Cannot connect to database."));
            con.release();
            return console.error("getConnection: Error connecting to database: " + err);
        } else {
            // Store hash in your password DB.
            bcrypt.hash(newuser.password, saltRounds, function(err, bcryptedPassword) {
                // SYSTEM ERROR 2
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
                     // SYSTEM ERROR 3
                    if (err) { // do this first because can't take message field if err is null
                        // USER ERROR 1: Registered with existing username
                        if (err.message.substring(0,12) == 'ER_DUP_ENTRY') {
                            callback(new Error("Username/e-mail already exists.")); // account for more cases
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

/* For VALIDATE, need to error check the following cases:
 *
 * SYSTEM ERRORS (not the user's fault, just display an unexpected error message):
 *      1: Connection to DB failed
 *      2: Hashing compare failed
 *      3: Querying failed (though this may be user's fault)
 *
 * USER ERRORS
 *      1: User entered invalid username
 *      2: User entered invalid password (1&2 should not be differentiated for security purposes)
 *      3. User entered nothing (accounted for on front end)
 *      
 */
function validate(login, callback) {
    pool.getConnection(function(err, con) {
        // SYSTEM ERROR 1
        if (err) {
            callback(new Error("Cannot connect to database.")); // Have to handle if nothing is returned!
            console.error("getConnection: Error connecting to database: " + err);
        } else {
            con.query('CALL VAL(?)', [login.username], function(err, result) {
                //console.log(result);
                //console.log(result[0]);
                //console.log(result[0][0]);
                // SYSTEM ERROR 2
                if (err) {
                    callback(new Error("Unexpected error."));
                    console.error("query: Error querying user in database: " + err);
                // USER ERROR 1: Invalid username, no results from query so first entry of result stack result[0] is empty array
                // The sole element of that entry, result[0][0], hence, is undefined
                } else if (result[0][0] == undefined) {
                    callback(new Error("Invalid username/password combination."));
                    console.log("No matching users in database.");
                } else {
                    // Username is unique so only one row will be returned
                    // first 0 gets the query results rather than query statistic info, second 0 retrieves the first record of query results
                    bcrypt.compare(login.password, result[0][0].pass, function(err, doesMatch) {
                        // SYSTEM ERROR 3
                        if (err) {
                            callback(new Error("Unexpected error."));
                            console.error("compare: Error comparing hashes: " + err);
                        } else if (doesMatch) {
                            callback(null, login.username);
                            console.log("Welcome, %s!", login.username);
                        // USER ERROR 2: Valid username, invalid password
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
