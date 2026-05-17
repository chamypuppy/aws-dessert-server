const express = require("express");
const router = express.Router();

const axios = require('axios');
const db = require("../config/db");

/* env에서 카카오 REST API키와 Redirect URI 불러오기 */
require('dotenv').config({ path: './backend/.env' });
const REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
const CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;

let SESSION;


router
  .route('/login') // 카카오 로그인 요청
  .get((req, res) => {
    const moveKakaoLoginUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&scope=profile_nickname`;
    res.redirect(moveKakaoLoginUrl);
  });

router
  .route("/login/getAuth/callback")
  .get(async (req, res) => {
    const get = req.query; 
    const authCode = get.code;

    //console.log("authCode:", req.query.code);

    try {
      if(!authCode) {
        console.error("🟡 카카오 인증코드가 누락되었습니다.");
        return res.status(401).send("🟡 카카오 인증코드 누락, 없음");
      }

      const giveMeToken = await axios.post('https://kauth.kakao.com/oauth/token', null, {
          params: {
          grant_type: 'authorization_code',
          client_id: REST_API_KEY,
          redirect_uri: REDIRECT_URI,
          client_secret:CLIENT_SECRET,
          code: authCode,
        },
      });

      const { access_token: ACCESS_TOKEN } = giveMeToken.data;
      if (!ACCESS_TOKEN) {
        console.error("🟡 카카오 액세스 토큰이 누락되었습니다.");
        return res.status(401).send("🟡 카카오 액세스 토큰 누락, 없음");
      };

      const giveMeUserInfo = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        }
      });

      const userInfo = giveMeUserInfo.data;
      const kakaoId = userInfo.id;
      const nickname = userInfo?.kakao_account?.profile?.nickname || '사용자';
      const email = userInfo?.kakao_account?.email || null;
      const birthday = userInfo?.kakao_account?.birthday || null;
      const users_img = userInfo.kakao_account.profile.profile_image_url || 'http://localhost:3000/imgs/default.png';

      if(!nickname) {
        console.error("🟡 카카오 닉네임 정보가 누락되었습니다.");
        res.status(204).send("🟡 카카오 닉네임 누락, 없음");
      };

      const getUserInfo = 'SELECT * FROM users WHERE users_kakao_id = ?';
      db.query(getUserInfo, [kakaoId], (err, results) => {
        if(err) {
          console.error("🟡 카카오 로그인: users 테이블에서 사용자 정보 불러오기 에러");
          return res.status(500).send("🟡 카카오 getUserInfo 오류, 에러");
        };

        const DBsameData = 0;
        if(results.length > DBsameData) {
          req.session.USER_PK_ID = results[0].users_pk_id;
          req.session.ACCESS_TOKEN = ACCESS_TOKEN;
          return req.session.save((err) => {
            if (err) console.error("🟡 기존 유저 세션 저장 실패:", err);
            else console.log("☀ 기존 유저 세션 저장 성공, ID:", req.sessionID, "USER_PK_ID:", req.session.USER_PK_ID);
            res.redirect(`${process.env.REACT_APP_CLIENT_URL}/`);
          });
        } else {
          const users_name = userInfo?.kakao_account?.name || nickname;
          const newInsertUser = `INSERT INTO users(users_kakao_id, nickname, users_img, users_name) VALUES (?, ?, ?, ?)`;
          db.query(newInsertUser, [kakaoId, nickname, users_img, users_name], (err, results) => {
            if(err) {
              console.error("🟡 카카오 신규 유저 가입 오류입니다. SQL 에러:", err.message);
              console.error("🟡 SQL 상세:", err);
              return res.status(500).send("🟡 카카오 신규 유저 가입 오류");
            }
            console.log("☀ 카카오 신규 유저 가입 성공");
            req.session.USER_PK_ID = results.insertId;
            req.session.ACCESS_TOKEN = ACCESS_TOKEN;
            return req.session.save((err) => {
              if (err) console.error("🟡 신규 유저 세션 저장 실패:", err);
              else console.log("☀ 신규 유저 세션 저장 성공, ID:", req.sessionID, "USER_PK_ID:", req.session.USER_PK_ID);
              res.redirect(`${process.env.REACT_APP_CLIENT_URL}/users/research`);
            });
          });
        };
      });

    } catch (error) {
      console.error("🟡 서버 오류: 카카오 로그인 또는 신규 가입에 실패하였습니다.");
      res.status(500).send("🟡 kakaoLoginRoutes 서버 오류입니다.");
      console.log("에러 메시지:", error.message);
      console.log("에러 응답:", error.response?.data); 
    }

  });

router
.route('/logout')
.post(async(req, res) => {
  SESSION = req.session;
  const ACCESS_TOKEN = SESSION.ACCESS_TOKEN;

  try {
    await axios.post('https://kapi.kakao.com/v1/user/logout', null, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });

    SESSION.destroy((err) => {
      if(err) {
        console.error("🟡 세션 삭제 중 오류가 발생했습니다. (카카오 로그인)");
        return res.status(500).send("🟡 로그아웃을 위한 세션 삭제 중 에러 발생");
      };
      console.log("🔵 세션이 성공적으로 삭제되었습니다.")
      
      res.clearCookie('KAKAO_SESSION');
      return res.status(200).json({message: "로그아웃 되었습니다!"});
    })


  } catch(error) {
    console.log("🟡 서버 오류: 로그아웃에 실패하였습니다.");
    console.log("에러 메시지:", error.message);
    console.log("에러 응답:", error.response?.data); 
    res.status(500).send("🟡 logoutRoutes 서버 오류입니다.");
  };
  
});

  module.exports = router;
