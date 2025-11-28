const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'mini_chat'
});

connection.query('SHOW CREATE TABLE friend', (error, results) => {
  if (error) {
    console.error('Error executing query:', error);
    return;
  }
  console.log('Table structure:', results);
  connection.end();
});