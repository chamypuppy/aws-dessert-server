const express = require("express");
const router = express.Router();

const axios = require('axios');

let SESSION;

/* router
  .route('/')
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
          console.error("🟡 세션 삭제 중 오류가 발생했습니다.");
          return res.status(500).send("🟡 로그아웃을 위한 세션 삭제 중 에러 발생");
        };
        console.log("🔵 세션이 성공적으로 삭제되었습니다.")
        
        res.clearCookie('KAKAO_SESSION');
        return res.status(200).json({message: "🔵 쿠키 삭제 성공!"});
      })


    } catch(error) {
      console.log("🟡 서버 오류: 로그아웃에 실패하였습니다.");
      console.log("에러 메시지:", error.message);
      console.log("에러 응답:", error.response?.data); 
      res.status(500).send("🟡 logoutRoutes 서버 오류입니다.");
    };
    
  }); */

  module.exports = router;