const fs = require('fs');
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'mini_chat'
});

const sql = fs.readFileSync('c:\\Users\\33821\\Desktop\\mini-chat\\mini-chat-backend\\aql\\minichat.sql', 'utf8');

connection.query(sql, (error, results) => {
  if (error) {
    console.error('Error executing SQL:', error);
    return;
  }
  console.log('SQL executed successfully:', results);
  connection.end();
});