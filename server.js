/* 0. 환경변수 설정 */
// require('dotenv').config({ path: './.env' });
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('front ORIGIN:', process.env.REACT_APP_CLIENT_URL);

/* 0. 모듈 설정 */
const express = require('express');
const router = express.Router();
const cors = require('cors');
// const mysql = require('mysql2');
// const dbConfig = require('./config/db.config');
const db = require("./config/db");
const axios = require('axios');
const session = require('express-session');
const { RedisStore } = require('connect-redis');
const Redis = require('ioredis');


/* 0. express 설정 */
const app = express();
const port = process.env.PORT || 5000;

/* 0. 세션 미들웨어 설정 */
const isAWS = process.env.IS_AWS === 'true';
if (isAWS) app.set('trust proxy', 1);

const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: 6379,
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isAWS,
    httpOnly: true,
    sameSite: isAWS ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 3
  },
  name: 'KAKAO_SESSION'
}));

/* 0. cors 미들웨어 설정 */
//app.use(cors());
app.use(cors({
  // origin: process.env.CLOUDTYPE_FRONTEND_URL,
  origin: process.env.REACT_APP_CLIENT_URL,
  credentials: true, // 인증 정보 허용 = 요청에 쿠키 포함
}));


/* 저장된 세션(userPkId)을 반환하는 API */
app.get('/api/users/session', (req, res) => {
  console.log("session:", req.session.USER_PK_ID);

  if (req.session.USER_PK_ID) {
    res.status(200).json({ 
      isLogin: true, 
      USER_PK_ID: req.session.USER_PK_ID,
      ACCESS_TOKEN: req.session.ACCESS_TOKEN    
    });
  } else {
    res.status(401).json({ 
      isLogin: false, 
      USER_PK_ID: null,
      message: '로그인되지 않았습니다.' 
    });
  }
});


/* ✅ DetailPage에 users_intro 가져오기 */
app.get('/api/users_info/:recipePkId', (req, res) => {
  const { recipePkId } = req.params;
  const query = `
    SELECT 
    u.nickname,
    u.users_intro
    FROM recipe r
    LEFT JOIN users u ON r.author_id = u.users_pk_id
    WHERE r.recipe_pk_id = ?;
  `;
    db.query(query, [recipePkId], (err, results) => {

      if(err) {
        console.error('💦users_info API의 DB 쿼리에 에러가 발생했습니다!: \n', err);
      res.status(500).send('users_info API 오류');
      } else {
        if(results.length > 0) {
          res.json({ nickname: results[0].nickname,  // ✅
                     users_intro: results[0].users_intro });
        } else {
          res.status(404).send('해당 레시피에 맞는 유저가 아닙니다.');
        }
      }

    })
    
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/kakao", require("./routes/kakao"));
// app.use('/api/users/logout', require('./routes/logout'));
app.use("/api/users", require("./routes/users"));
app.use("/api/recipe", require("./routes/recipe"));



/* Mypage API: 나의 정보 불러오기 << /username이랑 충돌남 */
app.get('/api/users/:USER_PK_ID', (req, res) => {
  const USER_PK_ID = req.params.USER_PK_ID;
  console.log("USER_PK_ID:", USER_PK_ID);

  const myPageInfo = 'SELECT users_kakao_id, users_id, users_name, nickname, DATE_FORMAT(signup_date, "%Y-%m-%d %H:%i:%s") AS format_signup_date, users_img FROM users WHERE users_pk_id = ?';
  db.query(myPageInfo, [USER_PK_ID], (err, results) => {
    if (err) {
      console.error('🟡 MyPage API 사용자 정보 조회 오류: \n', err);
      console.error("🟡 응답 상태:", err.response?.status);
      console.error("🟡 응답 데이터:", err.response?.data);
      console.error("🟡 에러 메시지:", err.message);
      return res.status(500).send('Mypage 사용자 정보 조회 오류');
    }

    /* if (results.length > 0) { //userPkId가 users 테이블에 존재하는지 유무 확인
      res.json(results[0]);
    } else {
      res.status(404).send('Mypage API 오류: 사용자 정보 없음');
    } */
   console.log("디버깅중results: ", results);
   console.log("디버깅중results[0]: ", results[0]);
    if (results.length === 0) { //userPkId가 users 테이블에 존재하는지 유무 확인
      // res.status(404).send('Mypage API 오류: 사용자 정보 없음');
      console.error("userInfoResults.length === 0 오류");
      return res.status(404).send('🟡 Mypage API 오류: 사용자 정보가 없어서 불러오지 못하였습니다.');
    }
    const userInfoResults = results[0];


    const researchInfo = "SELECT my_level, my_habit, my_find FROM my_research WHERE is_research = 1 AND users_pk_id = ? GROUP BY users_pk_id, my_level, my_habit, my_find";
    db.query(researchInfo, [USER_PK_ID], (err, researchInfoResults) => {
      if(err) {
        console.error("🟡 researchInfo 쿼리 불러오기 오류");
        console.error("🟡 응답 상태:", err.response?.status);
        console.error("🟡 응답 데이터:", err.response?.data);
        console.error("🟡 에러 메시지:", err.message);
      };

      res.status(200).json({
        userInfo: results[0],
        researchInfo: researchInfoResults
      });

      console.log("디디디디디버깅userInfo:", results[0]);
      console.log("researchResults:", researchInfoResults);

    })


  });
});


  // 서버 시작
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port}에서 실행 중입니다.`);
});
