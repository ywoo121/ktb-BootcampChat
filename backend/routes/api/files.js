const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const s3UploadService = require('../../services/s3UploadService');
const File = require('../../models/File');
const path = require('path');

// 파일 업로드
router.post('/upload', auth, s3UploadService.multerConfig.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '파일이 선택되지 않았습니다.'
      });
    }

    console.log('Starting file upload for user:', req.user.id);

    // S3에 파일 업로드
    const s3Result = await s3UploadService.uploadToS3(req.file, req.user.id);
    const safeFilename = path.basename(s3Result.s3Key);

    // 데이터베이스에 파일 정보 저장
    const file = new File({
      filename: safeFilename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      user: req.user.id,
      s3Key: s3Result.s3Key,
      s3Bucket: s3Result.s3Bucket,
      s3Url: s3Result.s3Url,
      etag: s3Result.etag
    });

    await file.save();

    res.status(200).json({
      success: true,
      message: '파일 업로드 성공',
      file: {
        _id: file._id,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        uploadDate: file.uploadDate
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: '파일 업로드 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 파일 다운로드
router.get('/download/:filename', auth, async (req, res) => {
  try {
    const filename = req.params.filename;
    console.log('Download request for:', filename);

    // 파일 정보 조회
    const file = await File.findOne({ filename: filename, user: req.user.id })
      .select('filename originalname mimetype size s3Url')
      .lean();

    if (!file) {
      return res.status(404).json({
        success: false,
        message: '파일을 찾을 수 없습니다.'
      });
    }

    console.log('Using stored S3 URL for download:', file.s3Url);

    // MongoDB에 저장된 S3 public URL 반환
    res.json({
      success: true,
      downloadUrl: file.s3Url,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: '파일 다운로드 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 파일 보기 (미리보기용)
router.get('/view/:filename', auth, async (req, res) => {
  try {
    const filename = req.params.filename;
    console.log('View request for:', filename);

    // 파일 정보 조회
    const file = await File.findOne({ filename: filename, user: req.user.id })
      .select('filename originalname mimetype size s3Url')
      .lean();

    if (!file) {
      return res.status(404).json({
        success: false,
        message: '파일을 찾을 수 없습니다.'
      });
    }

    // 미리보기 가능한 파일 타입 체크
    const previewableTypes = ['image/', 'video/', 'audio/', 'application/pdf', 'text/'];
    const isPreviewable = previewableTypes.some(type => file.mimetype.startsWith(type));
    
    if (!isPreviewable) {
      return res.status(415).json({
        success: false,
        message: '미리보기를 지원하지 않는 파일 형식입니다.'
      });
    }

    console.log('Using stored S3 URL for view:', file.s3Url);

    // MongoDB에 저장된 S3 public URL 반환
    res.json({
      success: true,
      viewUrl: file.s3Url,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({
      success: false,
      message: '파일 미리보기 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 파일 삭제
router.delete('/:id', auth, async (req, res) => {
  try {
    const fileId = req.params.id;
    console.log('Delete request for file ID:', fileId);

    // 파일 정보 조회
    const file = await File.findById(fileId)
      .select('_id filename user s3Key')
      .lean();
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '파일을 찾을 수 없습니다.'
      });
    }

    // 권한 확인
    if (file.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '파일을 삭제할 권한이 없습니다.'
      });
    }

    // S3에서 파일 삭제
    try {
      await s3UploadService.deleteFromS3(file.s3Key);
      console.log('File deleted from S3:', file.s3Key);
    } catch (s3Error) {
      console.error('S3 deletion error:', s3Error);
      // S3 삭제 실패해도 DB에서는 삭제 진행
    }

    // 데이터베이스에서 파일 정보 삭제
    await File.findByIdAndDelete(fileId);
    console.log('File deleted from database:', fileId);

    res.json({
      success: true,
      message: '파일이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: '파일 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;