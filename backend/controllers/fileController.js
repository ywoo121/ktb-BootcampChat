const { processFileForRAG } = require('../services/fileService');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const crypto = require('crypto');
const { uploadDir } = require('../middleware/upload');
const redisClient = require('../utils/redisClient');
const { uploadFileToS3 } = require('../services/s3Service');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Bucket, s3Region, s3AccessKeyId, s3SecretAccessKey } = require('../config/keys');
const { v4: uuidv4 } = require('uuid');

const fsPromises = {
  writeFile: promisify(fs.writeFile),
  unlink: promisify(fs.unlink),
  access: promisify(fs.access),
  mkdir: promisify(fs.mkdir),
  rename: promisify(fs.rename)
};

const isPathSafe = (filepath, directory) => {
  const resolvedPath = path.resolve(filepath);
  const resolvedDirectory = path.resolve(directory);
  return resolvedPath.startsWith(resolvedDirectory);
};

const generateSafeFilename = (originalFilename) => {
  const ext = path.extname(originalFilename || '').toLowerCase();
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  return `${timestamp}_${randomBytes}${ext}`;
};

// 개선된 파일 정보 조회 함수
const getFileFromRequest = async (req) => {
  try {
    const filename = req.params.filename;
    const token = req.headers['x-auth-token'] || req.query.token;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    
    if (!filename) {
      throw new Error('Invalid filename');
    }

    if (!token || !sessionId) {
      throw new Error('Authentication required');
    }

    const filePath = path.join(uploadDir, filename);
    if (!isPathSafe(filePath, uploadDir)) {
      throw new Error('Invalid file path');
    }

    await fsPromises.access(filePath, fs.constants.R_OK);

    const fileMeta = await redisClient.get(`file:${filename}`);
    if (!fileMeta) {
      throw new Error('File not found in database');
    }

    return { fileMeta, filePath };
  } catch (error) {
    console.error('getFileFromRequest error:', {
      filename: req.params.filename,
      error: error.message
    });
    throw error;
  }
};

async function streamS3Object(s3Key, res, mimetype, disposition, size) {
  const command = new GetObjectCommand({ Bucket: s3Bucket, Key: s3Key });
  const s3Response = await s3.send(command);
  res.set({
    'Content-Type': mimetype,
    'Content-Disposition': disposition,
    'Content-Length': size,
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  s3Response.Body.pipe(res);
}

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '파일이 선택되지 않았습니다.'
      });
    }

    const safeFilename = generateSafeFilename(req.file.originalname);
    const currentPath = req.file.path;
    const s3Key = `uploads/${safeFilename}`;

    // 1. S3 업로드
    const s3Url = await uploadFileToS3(currentPath, s3Key, req.file.mimetype);

    // 2. 임시 파일 삭제
    await fsPromises.unlink(currentPath);

    // 3. 메타데이터 Redis 저장
    const fileId = uuidv4();
    const fileMeta = {
      id: fileId,
      filename: safeFilename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      user: req.user.id,
      s3Url,
      uploadDate: new Date().toISOString()
    };
    await redisClient.set(`file:${safeFilename}`, fileMeta);

    res.status(200).json({
      success: true,
      message: '파일 업로드 성공',
      file: fileMeta
    });
  } catch (error) {
    console.error('File upload error:', error);
    if (req.file?.path) {
      try {
        await fsPromises.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete uploaded file:', unlinkError);
      }
    }
    res.status(500).json({
      success: false,
      message: '파일 업로드 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    const fileMeta = await redisClient.get(`file:${filename}`);
    if (!fileMeta) {
      return res.status(404).json({ success: false, message: '파일을 찾을 수 없습니다.' });
    }
    const disposition = `attachment; filename="${encodeURIComponent(fileMeta.originalname)}"`;
    await streamS3Object(`uploads/${filename}`, res, fileMeta.mimetype, disposition, fileMeta.size);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ success: false, message: '파일 다운로드 중 오류가 발생했습니다.' });
  }
};

exports.viewFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    const fileMeta = await redisClient.get(`file:${filename}`);
    if (!fileMeta) {
      return res.status(404).json({ success: false, message: '파일을 찾을 수 없습니다.' });
    }
    // 미리보기 지원 파일만 허용 (간단히 mimetype으로 체크)
    const previewableTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm',
      'audio/mpeg', 'audio/wav',
      'application/pdf'
    ];
    if (!previewableTypes.includes(fileMeta.mimetype)) {
      return res.status(415).json({ success: false, message: '미리보기를 지원하지 않는 파일 형식입니다.' });
    }
    const disposition = `inline; filename="${encodeURIComponent(fileMeta.originalname)}"`;
    await streamS3Object(`uploads/${filename}`, res, fileMeta.mimetype, disposition, fileMeta.size);
  } catch (error) {
    console.error('File view error:', error);
    res.status(500).json({ success: false, message: '파일 미리보기 중 오류가 발생했습니다.' });
  }
};

const handleFileStream = (fileStream, res) => {
  fileStream.on('error', (error) => {
    console.error('File streaming error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '파일 스트리밍 중 오류가 발생했습니다.'
      });
    }
  });

  fileStream.pipe(res);
};

const handleFileError = (error, res) => {
  console.error('File operation error:', {
    message: error.message,
    stack: error.stack
  });

  // 에러 상태 코드 및 메시지 매핑
  const errorResponses = {
    'Invalid filename': { status: 400, message: '잘못된 파일명입니다.' },
    'Authentication required': { status: 401, message: '인증이 필요합니다.' },
    'Invalid file path': { status: 400, message: '잘못된 파일 경로입니다.' },
    'File not found in database': { status: 404, message: '파일을 찾을 수 없습니다.' },
    'File message not found': { status: 404, message: '파일 메시지를 찾을 수 없습니다.' },
    'Unauthorized access': { status: 403, message: '파일에 접근할 권한이 없습니다.' },
    'ENOENT': { status: 404, message: '파일을 찾을 수 없습니다.' }
  };

  const errorResponse = errorResponses[error.message] || {
    status: 500,
    message: '파일 처리 중 오류가 발생했습니다.'
  };

  res.status(errorResponse.status).json({
    success: false,
    message: errorResponse.message
  });
};

exports.deleteFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    const fileMeta = await redisClient.get(`file:${filename}`);
    if (!fileMeta) {
      return res.status(404).json({ success: false, message: '파일을 찾을 수 없습니다.' });
    }
    // 권한 체크 (업로더만 삭제 가능)
    if (fileMeta.user !== req.user.id) {
      return res.status(403).json({ success: false, message: '파일을 삭제할 권한이 없습니다.' });
    }
    // S3에서 삭제
    const command = new DeleteObjectCommand({ Bucket: s3Bucket, Key: `uploads/${filename}` });
    await s3.send(command);
    // Redis에서 메타데이터 삭제
    await redisClient.del(`file:${filename}`);
    res.json({ success: true, message: '파일이 삭제되었습니다.' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ success: false, message: '파일 삭제 중 오류가 발생했습니다.' });
  }
};