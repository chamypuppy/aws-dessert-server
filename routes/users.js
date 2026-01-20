const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");

const db = require("../config/db");

let SESSION;

router
  .route('/signup/register')
  .post(async (req, res) => {
    const { form_id, form_pwd1, form_pwd2, form_name, form_tel, form_birthday, form_email } = req.body;

    try {
      /* 
      // Signup.jsx에서 잘 막고 있음.

      if(form_pwd1 !== form_pwd2) {
      return res.status(400).json({
        success: false,
        message: "비밀번호가 불일치합니다."
      });
    }; */
    if(form_pwd1.length < 5) {
      // return res.status(403).send("비밀번호는 5글자 이상부터 가능합니다.");
      res.json({
        ok: false,
        alert: "비밀번호는 5글자 이상부터 가능합니다.",
      })
      return;
    };

    const existingUserInfo = 'SELECT * FROM users WHERE users_id = ?';

    db.query(existingUserInfo, [form_id], async (err, results) => {
      console.log(results);

      if (err) {
        console.error("🟡 첫번째 try문(signup): existingUserInfo 사용자 정보 불러오는 중 발생한 오류입니다.");
      }

      DBsameData = 0;
      if(results.length !== DBsameData) {
        console.log("🟡 중복된 아이디입니다. \n 다른 아이디를 입력해 주세요.");
        return res.status(409).send("이미 존재하는 아이디입니다.");
      };

        try {
          const hashPwd = await bcrypt.hash(form_pwd1, 10);
  
          const insertUserInfo = 'INSERT INTO users(users_id, users_pwd, users_name, tel, birthday, email) VALUES(?,?,?,?,?,?)';

          db.query(insertUserInfo, [form_id, hashPwd, form_name, form_tel, form_birthday, form_email], (err, results) => {
            if(err) {
              console.error("🟡 회원가입 중 에러가 발생했습니다.");
              console.error("🟡 응답 상태:", err.response?.status);
              console.error("🟡 응답 데이터:", err.response?.data);
              console.error("🟡 에러 메시지:", err.message);
              return res.status(500).send("🟡 회원가입 userRoutes 서버 오류입니다.");
            } else {
              SESSION = req.session;
              SESSION.USER_PK_ID = results.insertId;  // 세션에 값 저장          

              // res.json(results); // 프론트로 결과값 전송
              return res.json({
                success: true,
                message: "회원가입이 완료되었습니다😄🔅"
              });

            };


          })
        } catch(err) {

        }
      
    });

    console.log(form_id, form_pwd1, form_name, form_tel, form_birthday, form_email);

    } catch(err) {
      console.error("🟡 첫번째 catch문: existingUserInfo 사용자 정보 불러오는 중 발생한 오류입니다.");
      console.log("에러메세지: ", err);
    }

    
  });
router
.route('/login/register')
.post(async (req, res) => {
  const { login_id, login_pwd } = req.body;

  if(!login_id) {
    console.log("🟡 서버에서 로그인 처리 중 아이디 값이 누락되었습니다.");
    return;
  }
  if(!login_pwd) {
    console.log("🟡 서버에서 로그인 처리 중 비밀번호 값이 누락되었습니다.");
    return;
  }
  
  if(login_pwd.length < 5) {
      // return res.status(403).send("비밀번호는 5글자 이상부터 가능합니다.");
      res.json({
        ok: false,
        alert: "🟡 비밀번호는 5글자 이상이어야 합니다.",
      })
      return;
  };

    const existingUserInfo = 'SELECT * FROM users WHERE users_id = ?';

    db.query(existingUserInfo, [login_id], async (err, results) => {
      console.log("결과값:", results);

      if (err) {
        console.error("🟡 첫번째 try문(login): existingUserInfo 사용자 정보 불러오는 중 발생한 오류입니다.");
      }

      const DBsameData = 0;
      if(results.length === DBsameData) {
        console.log("🟡 가입 이력이 없는 아이디입니다.");
        //return res.status(409).send("가입 이력이 없는 아이디입니다. \n 회원가입 후 로그인해 주세요.");
        return res.json({
            noExisting: true,
            failedMessage: "가입 이력이 없는 아이디입니다. \n 회원가입 후 로그인해 주세요."
          });
      };
    

      try {
        const savedUserInfo = results[0];
        console.log("savedUserInfo:", savedUserInfo);
        const savedPwd = savedUserInfo.users_pwd;
        const isSamePwd = await bcrypt.compare(login_pwd, savedPwd); // compare(평문, 해시) : 비교

        console.log("savedPwd:", savedPwd);
        console.log("login_pwd:", login_pwd);
        console.log("isSamePwd:", isSamePwd);

        if(isSamePwd) {
          console.log("비밀번호 일치 확인");
          SESSION = req.session;
          SESSION.USER_PK_ID = results[0].users_pk_id;
          console.log("(isSamePwd) SESSION.USER_PK_ID:",SESSION.USER_PK_ID);
          console.log("(isSamePwd) req.session:",req.session);

          return res.json({
            success: true,
            message: "로그인 되었습니다!😄🔅"
          });
        } else {
          return res.json({
            success: false,
            message: "아이디 또는 비밀번호가 틀렸습니다!"
          });
        }
        

      } catch(err) {
        console.error("🟡 catch문(login): 서버에서 로그인 시도 중 발생한 오류입니다.");
        console.log("에러메세지: ", err);
      }
    });
    
})

  
router
.route('/research/res/ok')
.post(async (req, res) => {
  const { level, habit, find } = req.body;

  SESSION = req.session; // 로그인 된 세션 불러오기
  console.log("req.session:", req.session);
  console.log("level:", level, "habit:", habit, "find:", find);

  const USER_PK_ID = SESSION.USER_PK_ID;

  if(!USER_PK_ID) {
    console.log("🟡 로그인 후 응답해 주세요!");
    return;
  }

  if(!level) {
    console.log("베이킹 숙련도(level) 값이 서버 등록 중 누락되었습니다. \n 다시 등록해 주세요.");
    return;
  }
  if(habit.legnth === 0) {
    console.log("식문화(habit) 값이 서버 등록 중 누락되었습니다. \n 다시 등록해 주세요.");
    return;
  }
  if(find.length === 0) {
    console.log("관심 레시피(find) 값이 서버 등록 중 누락되었습니다. \n 다시 등록해 주세요.");
    console.log("find:", find);
    return;
  }
  
  try {
      const insertUserResearch = "INSERT INTO my_research(users_pk_id, my_level, my_habit, my_find, is_research) VALUES(?,?,?,?,?)";

      for(const h of habit) {
        for(const f of find) {
          db.query(insertUserResearch, [USER_PK_ID, level, h, f, true], (err, results) => {
        if(err){
          console.error("🟡 중첩for문 실행 에러(/research/res/ok, insertUserResearch): 실행 중 오류가 발생했습니다.");
          console.error("🟡 응답 상태:", err.response?.status);
          console.error("🟡 응답 데이터:", err.response?.data);
          console.error("🟡 에러 메시지:", err.message);
          return;
        };
        });
        };
      };

      console.log("리서치 응답이 서버에 저장되었습니다.");
      return res.json({
        success: true,
        message: "리서치 응답이 저장되었습니다!😄🔅",
      });
      
      
    } catch(err) {
      console.error("🟡 catch문: (insertUserResearch) 실행 오류");
      res.status(500).send("🟡 리서치 응답 저장 오류");
      // res.status(500).send("🟡 catch문: 리서치 응답 저장 오류");
      console.error("🟡 응답 상태:", err.response?.status);
      console.error("🟡 응답 데이터:", err.response?.data);
      console.error("🟡 에러 메시지:", err.message);
    }

  
});

router
.route("/research/res/no")
.post((req, res) => {
  const { level, habit, find } = req.body;
  SESSION = req.session;
  const USER_PK_ID = SESSION.USER_PK_ID;

  if(!USER_PK_ID) {
    console.log("🟡 로그인 후 응답해 주세요!");
    return;
  }
  
  try {
    const insertUserResearch = "INSERT INTO my_research(users_pk_id, my_level, my_habit, my_find, is_research) VALUES(?,?,?,?,?)";

    db.query(insertUserResearch, [USER_PK_ID, level, habit, find, false], (err, results) => {
      if(err) {
        console.error("🟡 try문 에러(/research/res/no, insertUserResearch): 실행 중 오류가 발생했습니다.");
        console.error("🟡 응답 상태:", err.response?.status);
        console.error("🟡 응답 데이터:", err.response?.data);
        console.error("🟡 에러 메시지:", err.message);
        return;
      }
      console.log("(/research/res/no) results: ", results);
    })

  } catch(err) {
      console.error("🟡 catch문: (/research/res/no, insertUserResearch) 실행 오류");
      res.status(500).send("🟡 리서치 응답 저장 오류");
      // res.status(500).send("🟡 catch문: 리서치 응답 저장 오류");
      console.error("🟡 응답 상태:", err.response?.status);
      console.error("🟡 응답 데이터:", err.response?.data);
      console.error("🟡 에러 메시지:", err.message);
  }
});

router
.route("/logout")
.post((req, res) => {
  SESSION = req.session;
  
  try {
    SESSION.destroy((err) => {
      if(err) {
        console.error("🟡 세션 삭제 중 오류가 발생했습니다. (일반 로그인)");
        return res.status(500).send("🟡 로그아웃을 위한 세션 삭제 중 에러 발생 (일반 로그인)");
      };
      console.log("🔵 세션이 성공적으로 삭제되었습니다. (일반 로그인)")
      
      return res.status(200).json({success: true, message: "로그아웃 되었습니다!"});
    })

  } catch(err) {

  }
});

router
.route("/username")
.get((req, res) => {
  const author = req.query.author;
  const query = `SELECT users_name FROM users WHERE users_pk_id = ?`;

  db.query(query, [author], (err, results) => {
    if(err) {
      console.error('🟡 author 데이터 가져오기 오류: \n', err);
      // res.status(500).send('author 데이터 불러오기 오류');
    } else {
      res.json(results[0]);
      console.log('🟡🟡🟡:', results[0]);
      // console.log('🟡🟡🟡:', JSON.stringify(req.query));
    }
  });

})

module.exports = router;