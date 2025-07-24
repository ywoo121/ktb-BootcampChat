const AWS = require('aws-sdk');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

/**
 * S3에 파일 업로드
 * @param {Object} file - multer file 객체
 * @param {String} userId - 사용자 ID
 * @returns {Promise<Object>} 업로드 결과
 */
exports.uploadToS3 = async (file, userId) => {
  try {
    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    const s3Key = `uploads/${userId}/${timestamp}_${randomId}${extension}`;

    // S3 업로드 파라미터
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private', // 비공개 파일
      Metadata: {
        'original-filename': file.originalname,
        'uploaded-by': userId,
        'upload-timestamp': timestamp.toString()
      }
    };

    // S3에 업로드
    const result = await s3.upload(uploadParams).promise();

    return {
      s3Key: s3Key,
      s3Url: result.Location,
      s3Bucket: process.env.AWS_S3_BUCKET,
      etag: result.ETag,
      size: file.size,
      mimetype: file.mimetype,
      originalname: file.originalname
    };

  } catch (error) {
    console.error('S3 업로드 오류:', error);
    throw new Error(`S3 업로드 실패: ${error.message}`);
  }
};

/**
 * 멀티파트 업로드 (대용량 파일용)
 * @param {Object} file - multer file 객체
 * @param {String} userId - 사용자 ID
 * @returns {Promise<Object>} 업로드 결과
 */
exports.multipartUploadToS3 = async (file, userId) => {
  try {
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    const s3Key = `uploads/${userId}/${timestamp}_${randomId}${extension}`;

    // 멀티파트 업로드 시작
    const createParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      ContentType: file.mimetype,
      Metadata: {
        'original-filename': file.originalname,
        'uploaded-by': userId,
        'upload-timestamp': timestamp.toString()
      }
    };

    const multipart = await s3.createMultipartUpload(createParams).promise();
    const uploadId = multipart.UploadId;

    // 파일을 청크로 분할 (5MB씩)
    const chunkSize = 5 * 1024 * 1024; // 5MB
    const chunks = [];
    const buffer = file.buffer;

    for (let i = 0; i < buffer.length; i += chunkSize) {
      chunks.push(buffer.slice(i, i + chunkSize));
    }

    // 각 청크 업로드
    const uploadPromises = chunks.map(async (chunk, index) => {
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
        PartNumber: index + 1,
        UploadId: uploadId,
        Body: chunk
      };

      const result = await s3.uploadPart(uploadParams).promise();
      return {
        ETag: result.ETag,
        PartNumber: index + 1
      };
    });

    const uploadedParts = await Promise.all(uploadPromises);

    // 멀티파트 업로드 완료
    const completeParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: uploadedParts
      }
    };

    const result = await s3.completeMultipartUpload(completeParams).promise();

    return {
      s3Key: s3Key,
      s3Url: result.Location,
      s3Bucket: process.env.AWS_S3_BUCKET,
      etag: result.ETag,
      size: file.size,
      mimetype: file.mimetype,
      originalname: file.originalname
    };

  } catch (error) {
    console.error('멀티파트 업로드 오류:', error);
    throw new Error(`멀티파트 업로드 실패: ${error.message}`);
  }
};

/**
 * S3에서 파일 삭제
 * @param {String} s3Key - S3 키
 * @returns {Promise<Boolean>} 삭제 성공 여부
 */
exports.deleteFromS3 = async (s3Key) => {
  try {
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key
    };

    await s3.deleteObject(deleteParams).promise();
    return true;

  } catch (error) {
    console.error('S3 삭제 오류:', error);
    throw new Error(`S3 삭제 실패: ${error.message}`);
  }
};

/**
 * 서명된 URL 생성 (임시 다운로드 링크)
 * @param {String} s3Key - S3 키
 * @param {Number} expires - 만료 시간(초)
 * @returns {String} 서명된 URL
 */
exports.getSignedUrl = (s3Key, expires = 3600) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: s3Key,
    Expires: expires
  };

  return s3.getSignedUrl('getObject', params);
};

/**
 * 파일 존재 여부 확인
 * @param {String} s3Key - S3 키
 * @returns {Promise<Boolean>} 존재 여부
 */
exports.fileExists = async (s3Key) => {
  try {
    await s3.headObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key
    }).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * Multer 설정 (메모리 저장)
 */
exports.multerConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 허용할 파일 타입 체크
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/avi',
      'application/pdf', 'text/plain', 'application/json',
      'text/csv', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`지원하지 않는 파일 형식: ${file.mimetype}`), false);
    }
  }
});