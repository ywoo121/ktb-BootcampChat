const express = require('express');
const router = express.Router();
const s3UploadService = require('../../services/s3UploadService');
const ragService = require('../../services/ragService');
const File = require('../../models/File');
const path = require('path');

/**
 * 파일 업로드 라우터
 */
router.post('/upload', s3UploadService.multerConfig.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다.' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    console.log('파일 업로드 시작:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      userId: req.user.id
    });

    // 1. S3에 파일 업로드
    const s3Result = await s3UploadService.uploadToS3(req.file, req.user.id);
    console.log('S3 업로드 완료:', s3Result.s3Key);

    // 2. S3 키에서 filename 추출 (일관성 유지)
    const filename = path.basename(s3Result.s3Key);

    // 3. MongoDB에 파일 정보 저장
    const fileDocument = await File.create({
      filename: filename, // S3 키에서 추출한 파일명 사용
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      user: req.user.id,
      s3Key: s3Result.s3Key,
      s3Bucket: s3Result.s3Bucket,
      s3Url: s3Result.s3Url,
      etag: s3Result.etag
    });

    console.log('DB 저장 완료:', fileDocument._id);

    // 4. RAG 처리 (텍스트 파일인 경우만)
    let ragProcessed = false;
    const textTypes = [
      'text/plain', 'application/pdf', 'application/json',
      'text/csv', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (textTypes.includes(req.file.mimetype)) {
      try {
        console.log('RAG 처리 시작...');
        await ragService.processS3FileForRAG(fileDocument);
        ragProcessed = true;
        console.log('RAG 처리 완료');
      } catch (ragError) {
        console.error('RAG 처리 실패:', ragError);
        // RAG 실패해도 파일 업로드는 성공으로 처리
      }
    }

    // 5. 응답
    res.json({
      success: true,
      message: '파일 업로드 완료',
      file: {
        id: fileDocument._id,
        filename: fileDocument.filename,
        originalname: fileDocument.originalname,
        mimetype: fileDocument.mimetype,
        size: fileDocument.size,
        uploadDate: fileDocument.uploadDate,
        s3Key: fileDocument.s3Key,
        ragProcessed: ragProcessed,
        previewable: fileDocument.isPreviewable()
      }
    });

  } catch (error) {
    console.error('파일 업로드 오류:', error);
    res.status(500).json({
      error: '파일 업로드 실패',
      message: error.message
    });
  }
});

/**
 * 대용량 파일 업로드 (멀티파트)
 */
router.post('/upload/large', s3UploadService.multerConfig.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다.' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    // 파일 크기 체크 (50MB 이상만 멀티파트 사용)
    const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50MB
    
    let s3Result;
    if (req.file.size >= MULTIPART_THRESHOLD) {
      console.log('멀티파트 업로드 시작:', req.file.originalname);
      s3Result = await s3UploadService.multipartUploadToS3(req.file, req.user.id);
    } else {
      console.log('일반 업로드 사용:', req.file.originalname);
      s3Result = await s3UploadService.uploadToS3(req.file, req.user.id);
    }

    // filename 생성
    const filename = path.basename(s3Result.s3Key);

    // DB 저장
    const fileDocument = await File.create({
      filename: filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      user: req.user.id,
      s3Key: s3Result.s3Key,
      s3Bucket: s3Result.s3Bucket,
      s3Url: s3Result.s3Url,
      etag: s3Result.etag
    });

    // 대용량 파일 RAG 처리
    let ragProcessed = false;
    const textTypes = ['text/plain', 'application/pdf'];

    if (textTypes.includes(req.file.mimetype)) {
      try {
        console.log('대용량 파일 RAG 처리 시작...');
        await ragService.processLargeS3FileForRAG(fileDocument);
        ragProcessed = true;
        console.log('대용량 파일 RAG 처리 완료');
      } catch (ragError) {
        console.error('RAG 처리 실패:', ragError);
      }
    }

    res.json({
      success: true,
      message: '대용량 파일 업로드 완료',
      file: {
        id: fileDocument._id,
        filename: fileDocument.filename,
        originalname: fileDocument.originalname,
        mimetype: fileDocument.mimetype,
        size: fileDocument.size,
        uploadDate: fileDocument.uploadDate,
        s3Key: fileDocument.s3Key,
        ragProcessed: ragProcessed,
        multipartUsed: req.file.size >= MULTIPART_THRESHOLD
      }
    });

  } catch (error) {
    console.error('대용량 파일 업로드 오류:', error);
    res.status(500).json({
      error: '대용량 파일 업로드 실패',
      message: error.message
    });
  }
});

/**
 * 파일 다운로드 (서명된 URL)
 */
router.get('/download/:fileId', async (req, res) => {
  try {
    const fileDocument = await File.findById(req.params.fileId);
    
    if (!fileDocument) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    // 권한 체크 (파일 소유자만 다운로드 가능)
    if (fileDocument.user.toString() !== req.user.id) {
      return res.status(403).json({ error: '다운로드 권한이 없습니다.' });
    }

    // 서명된 URL 생성 (1시간 유효)
    const downloadUrl = fileDocument.getDownloadUrl(3600);

    res.json({
      success: true,
      downloadUrl: downloadUrl,
      filename: fileDocument.originalname,
      size: fileDocument.size,
      expires: '1시간'
    });

  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    res.status(500).json({
      error: '파일 다운로드 실패',
      message: error.message
    });
  }
});

/**
 * 파일 삭제
 */
router.delete('/:fileId', async (req, res) => {
  try {
    const fileDocument = await File.findById(req.params.fileId);
    
    if (!fileDocument) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    // 권한 체크
    if (fileDocument.user.toString() !== req.user.id) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.' });
    }

    // S3에서 파일 삭제
    await s3UploadService.deleteFromS3(fileDocument.s3Key);
    console.log('S3 파일 삭제 완료:', fileDocument.s3Key);

    // DB에서 파일 정보 삭제
    await File.findByIdAndDelete(req.params.fileId);
    console.log('DB 파일 정보 삭제 완료:', req.params.fileId);

    res.json({
      success: true,
      message: '파일이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('파일 삭제 오류:', error);
    res.status(500).json({
      error: '파일 삭제 실패',
      message: error.message
    });
  }
});

/**
 * 사용자 파일 목록 조회
 */
router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const files = await File.find({ user: req.user.id })
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit)
      .select('filename originalname mimetype size uploadDate s3Key');

    const total = await File.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      files: files.map(file => ({
        id: file._id,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        uploadDate: file.uploadDate,
        previewable: file.isPreviewable()
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    res.status(500).json({
      error: '파일 목록 조회 실패',
      message: error.message
    });
  }
});

module.exports = router;