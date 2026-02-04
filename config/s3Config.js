const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
require("dotenv").config(); // .env 파일을 읽어옵니다.

// 1. S3 클라이언트 설정
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 2. multer를 이용한 업로드 설정
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: "public-read", // 누구나 읽을 수 있게 설정 (필요에 따라 변경)
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      // 파일 이름을 '현재시간-파일명'으로 저장해서 중복 방지
      cb(null, `uploads/${Date.now()}_${file.originalname}`);
    },
  }),
});

module.exports = upload;