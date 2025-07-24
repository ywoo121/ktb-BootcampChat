const express = require('express');
const router = express.Router();
const s3UploadService = require('../../services/s3UploadService');
const File = require('../../models/File');
const path = require('path');
const auth = require('../../middleware/auth');
const mongoose = require('mongoose');

/**
 * 파일 업로드
 */
router.post('/upload', auth, s3UploadService.multerConfig.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '파일이 없습니다.' });
    if (!req.user || !req.user.id) return res.status(401).json({ error: '인증이 필요합니다.' });

    const s3Result = await s3UploadService.uploadToS3(req.file, req.user.id);
    const filename = path.basename(s3Result.s3Key);

    const fileDocument = await File.create({
      filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      user: req.user.id,
      s3Key: s3Result.s3Key,
      s3Bucket: s3Result.s3Bucket,
      s3Url: s3Result.s3Url,
      etag: s3Result.etag
    });

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
        previewable: fileDocument.isPreviewable()
      }
    });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    res.status(500).json({ error: '파일 업로드 실패', message: error.message });
  }
});

/**
 * 대용량 파일 업로드
 */
router.post('/upload/large', auth, s3UploadService.multerConfig.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '파일이 없습니다.' });
    if (!req.user || !req.user.id) return res.status(401).json({ error: '인증이 필요합니다.' });

    const threshold = 50 * 1024 * 1024;
    const useMultipart = req.file.size >= threshold;

    const s3Result = useMultipart
        ? await s3UploadService.multipartUploadToS3(req.file, req.user.id)
        : await s3UploadService.uploadToS3(req.file, req.user.id);

    const filename = path.basename(s3Result.s3Key);

    const fileDocument = await File.create({
      filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      user: req.user.id,
      s3Key: s3Result.s3Key,
      s3Bucket: s3Result.s3Bucket,
      s3Url: s3Result.s3Url,
      etag: s3Result.etag
    });

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
        multipartUsed: useMultipart
      }
    });
  } catch (error) {
    console.error('대용량 파일 업로드 오류:', error);
    res.status(500).json({ error: '대용량 파일 업로드 실패', message: error.message });
  }
});

/**
 * 파일 보기 - 파일 ID 또는 filename 모두 허용
 */
router.get('/view/:identifier', auth, async (req, res) => {
  try {
    const { identifier } = req.params;

    let fileDocument;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      fileDocument = await File.findById(identifier);
    } else {
      fileDocument = await File.findOne({ filename: identifier, user: req.user.id });
    }

    if (!fileDocument) return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    if (fileDocument.user.toString() !== req.user.id) return res.status(403).json({ error: '파일 조회 권한이 없습니다.' });

    const viewUrl = s3UploadService.getSignedUrl(fileDocument.s3Key, 3600);

    res.json({
      success: true,
      viewUrl,
      filename: fileDocument.originalname,
      mimetype: fileDocument.mimetype,
      size: fileDocument.size,
      expires: '1시간'
    });
  } catch (error) {
    console.error('파일 조회 오류:', error);
    res.status(500).json({ error: '파일 조회 실패', message: error.message });
  }
});

/**
 * 파일 다운로드
 */
router.get('/download/:identifier', auth, async (req, res) => {
  try {
    const { identifier } = req.params;

    let fileDocument;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      fileDocument = await File.findById(identifier);
    } else {
      fileDocument = await File.findOne({ filename: identifier, user: req.user.id });
    }

    if (!fileDocument) return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    if (fileDocument.user.toString() !== req.user.id) return res.status(403).json({ error: '다운로드 권한이 없습니다.' });

    const downloadUrl = s3UploadService.getSignedUrl(fileDocument.s3Key, 3600);

    res.json({
      success: true,
      downloadUrl,
      filename: fileDocument.originalname,
      size: fileDocument.size,
      expires: '1시간'
    });
  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    res.status(500).json({ error: '파일 다운로드 실패', message: error.message });
  }
});

/**
 * 파일 삭제
 */
router.delete('/:fileId', auth, async (req, res) => {
  try {
    const fileDocument = await File.findById(req.params.fileId);

    if (!fileDocument) return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    if (fileDocument.user.toString() !== req.user.id) return res.status(403).json({ error: '삭제 권한이 없습니다.' });

    await s3UploadService.deleteFromS3(fileDocument.s3Key);
    await File.findByIdAndDelete(req.params.fileId);

    res.json({ success: true, message: '파일이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    res.status(500).json({ error: '파일 삭제 실패', message: error.message });
  }
});

/**
 * 사용자 파일 목록 조회
 */
router.get('/list', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      File.find({ user: req.user.id })
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit)
      .select('filename originalname mimetype size uploadDate s3Key'),
      File.countDocuments({ user: req.user.id })
    ]);

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
    res.status(500).json({ error: '파일 목록 조회 실패', message: error.message });
  }
});

module.exports = router;