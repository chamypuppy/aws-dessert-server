require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST,         // 환경 변수에서 DB_HOST 가져오기
  user: process.env.DB_USER,         // 환경 변수에서 DB_USER 가져오기
  password: process.env.DB_PASSWORD, // 환경 변수에서 DB_PASSWORD 가져오기
  database: process.env.DB_NAME,     // 환경 변수에서 DB_NAME 가져오기
  port: process.env.DB_PORT          // MySQL 포트!

  waitForConnections: true,          // 연결 다 차면 대기
  connectionLimit: 9,                // 동시에 유지할 연결 수
  queueLimit: 0,                     // 대기열 제한 없음
  enableKeepAlive: true,             // 연결이 살아있는지 주기적으로 체크
  keepAliveInitialDelay: 10000       // 10초마다 체크
};

module.exports = dbConfig;
