const File = require('../models/File');
const Message = require('../models/Message');
const Room = require('../models/Room');
const s3UploadService = require('../services/s3UploadService');
const path = require('path');
const crypto = require('crypto');

const generateSafeFilename = (originalFilename) => {
  const ext = path.extname(originalFilename || '').toLowerCase();
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  return `${timestamp}_${randomBytes}${ext}`;
};

// 파일 정보 조회 및 권한 확인 함수
const getFileFromRequest = async (req) => {
  try {
    const filename = req.params.filename;
    
    if (!filename) {
      throw new Error('Invalid filename');
    }

    console.log('Looking for file:', filename);

    // 파일 정보 조회
    const file = await File.findOne({ filename: filename })
      .select('_id filename originalname mimetype size user uploadDate s3Key s3Bucket')
      .lean();
      
    if (!file) {
      console.log('File not found in database:', filename);
      throw new Error('File not found in database');
    }

    console.log('Found file:', file);

    // 메시지를 통한 채팅방 권한 확인
    const message = await Message.findOne({ file: file._id })
      .select('room')
      .lean();
      
    if (!message) {
      console.log('File message not found for file:', file._id);
      throw new Error('File message not found');
    }

    // 사용자가 해당 채팅방의 참가자인지 확인
    const room = await Room.findOne({
      _id: message.room,
      participants: req.user.id
    })
    .select('_id')
    .lean();

    if (!room) {
      console.log('Unauthorized access - user not in room:', req.user.id);
      throw new Error('Unauthorized access');
    }

    return { file };
  } catch (error) {
    console.error('getFileFromRequest error:', {
      filename: req.params.filename,
      userId: req.user?.id,
      error: error.message
    });
    throw error;
  }
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '파일이 선택되지 않았습니다.'
      });
    }

    console.log('Starting file upload for user:', req.user.id);
    console.log('File info:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // S3에 파일 업로드
    const s3Result = await s3UploadService.uploadToS3(req.file, req.user.id);
    const safeFilename = path.basename(s3Result.s3Key);

    console.log('S3 upload result:', s3Result);

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

    console.log('File saved to database:', file._id);

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
};

exports.downloadFile = async (req, res) => {
  try {
    console.log('Download request for:', req.params.filename);
    const { file } = await getFileFromRequest(req);
    
    console.log('Using stored S3 URL:', file.s3Url);

    // MongoDB에 저장된 S3 URL 그대로 사용 (public 버킷이므로 직접 접근 가능)
    res.json({
      success: true,
      downloadUrl: file.s3Url, // MongoDB에 저장된 URL 직접 사용
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

  } catch (error) {
    handleFileError(error, res);
  }
};

exports.viewFile = async (req, res) => {
  try {
    console.log('View request for:', req.params.filename);
    const { file } = await getFileFromRequest(req);

    // 미리보기 가능한 파일 타입 체크
    const previewableTypes = ['image/', 'video/', 'audio/', 'application/pdf', 'text/'];
    const isPreviewable = previewableTypes.some(type => file.mimetype.startsWith(type));
    
    if (!isPreviewable) {
      console.log('Not previewable file type:', file.mimetype);
      return res.status(415).json({
        success: false,
        message: '미리보기를 지원하지 않는 파일 형식입니다.'
      });
    }

    console.log('Using stored S3 URL for view:', file.s3Url);

    // MongoDB에 저장된 S3 URL 그대로 사용 (public 버킷이므로 직접 접근 가능)
    res.json({
      success: true,
      viewUrl: file.s3Url, // MongoDB에 저장된 URL 직접 사용
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

  } catch (error) {
    handleFileError(error, res);
  }
};

exports.deleteFile = async (req, res) => {
  try {
    console.log('Delete request for file ID:', req.params.id);

    // 삭제 권한 확인을 위해 파일 정보 조회
    const fileInfo = await File.findById(req.params.id)
      .select('_id filename user s3Key')
      .lean();
    
    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: '파일을 찾을 수 없습니다.'
      });
    }

    if (fileInfo.user.toString() !== req.user.id) {
      console.log('Unauthorized delete attempt:', req.user.id, 'vs', fileInfo.user);
      return res.status(403).json({
        success: false,
        message: '파일을 삭제할 권한이 없습니다.'
      });
    }

    console.log('Deleting file from S3:', fileInfo.s3Key);

    // S3에서 파일 삭제
    try {
      await s3UploadService.deleteFromS3(fileInfo.s3Key);
      console.log('File deleted from S3:', fileInfo.s3Key);
    } catch (s3Error) {
      console.error('S3 deletion error:', s3Error);
      // S3 삭제 실패해도 DB에서는 삭제 진행
    }

    // 데이터베이스에서 파일 정보 삭제
    await File.findByIdAndDelete(req.params.id);
    console.log('File deleted from database:', req.params.id);

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
};

// 사용자 파일 목록 조회
exports.getUserFiles = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    console.log('Getting user files for:', req.user.id);

    const files = await File.find({ user: req.user.id })
      .select('_id filename originalname mimetype size uploadDate')
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalCount = await File.countDocuments({ user: req.user.id });

    console.log(`Found ${files.length} files out of ${totalCount} total`);

    res.json({
      success: true,
      files: files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        hasMore: skip + files.length < totalCount
      }
    });

  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({
      success: false,
      message: '파일 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

// 에러 처리 함수
const handleFileError = (error, res) => {
  console.error('File operation error:', {
    message: error.message,
    stack: error.stack
  });

  // 에러 상태 코드 및 메시지 매핑
  const errorResponses = {
    'Invalid filename': { status: 400, message: '잘못된 파일명입니다.' },
    'Authentication required': { status: 401, message: '인증이 필요합니다.' },
    'File not found in database': { status: 404, message: '파일을 찾을 수 없습니다.' },
    'File message not found': { status: 404, message: '파일 메시지를 찾을 수 없습니다.' },
    'Unauthorized access': { status: 403, message: '파일에 접근할 권한이 없습니다.' }
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