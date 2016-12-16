var env = process.env.NODE_ENV || 'admin';
var config = require('./config')[env];

/* Development command line prompt
var prompt     = require('prompt'); 
var schema     = {
	properties: {
		user: {
			pattern: /^[a-zA-Z\s\-]+$/,
			description: 'Username for Database Access',
			message: 'Only different for Administrative Access',
			default: 'user',
			required: true
		},
		password: {
			description: 'Enter generic EE student password',
			type: 'string', 
			pattern: /^[\w!?]+$/, 
			hidden: true,
			replace: '*', 
			required: true
		}
	}
};
prompt.start();
prompt.get(schema, function (err, result) {
	connectionparams.user = result.user;
	connectionparams.password = result.password;
});
*/

var mysql      = require('mysql');
var connection = mysql.createConnection(config);

connection.connect(function(err) {
  if (err) throw err
  console.log('You are now connected...');
});

connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
  if (err) throw err;

  console.log('The solution is: ', rows[0].solution);
});

connection.end();
