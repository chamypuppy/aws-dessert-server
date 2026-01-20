const mysql = require('mysql2');
const dbConfig = require('./db.config');
const db = mysql.createConnection(dbConfig);

db.connect(err => {
  if (err) {
    console.error('💦MySQL 연결에 실패하였습니다!: \n', err);
    process.exit(1);
  } else {
    console.log('MySQL에 연결되었습니다.');
  }
});

module.exports = db;