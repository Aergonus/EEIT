var env        = process.env.NODE_ENV || 'admin';
var config     = require('./config')[env];

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
