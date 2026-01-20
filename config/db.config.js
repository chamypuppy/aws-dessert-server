require('dotenv').config(); // .env 파일 로드

const dbConfig = {
  host: process.env.DB_HOST,       // 환경 변수에서 DB_HOST 가져오기
  user: process.env.DB_USER,       // 환경 변수에서 DB_USER 가져오기
  password: process.env.DB_PASSWORD, // 환경 변수에서 DB_PASSWORD 가져오기
  database: process.env.DB_NAME,    // 환경 변수에서 DB_NAME 가져오기
  port: process.env.DB_PORT        // 클타 MySQL 포트!
};

module.exports = dbConfig;