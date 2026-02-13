const mysql = require('mysql2');
const dbConfig = require('./db.config');
// const db = mysql.createConnection(dbConfig);

const db = mysql.createPool(dbConfig);

db.getConnection((err, connection) => {
  if (err) {
    console.error('⚡: MySQL 커넥션 풀 연결에 실패하였습니다!\n', err);
  } else {
    console.log('😄: MySQL Connection Pool이 설정되었습니다.');
    connection.release();
  }
});

module.exports = db;
