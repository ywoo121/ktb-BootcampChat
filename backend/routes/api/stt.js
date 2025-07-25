const express = require('express');
const multer = require('multer');
const sttService = require('../../services/sttService');
const auth = require('../../middleware/auth');

const router = express.Router();

// 메모리에 파일 저장 (임시)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 지원되는 오디오 형식 확인
    if (sttService.isSupportedFormat(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('지원되지 않는 오디오 형식입니다. (mp3, mp4, m4a, wav, webm, ogg, flac만 지원)'), false);
    }
  }
});

// 라우트 확인을 위한 테스트 엔드포인트
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'STT API가 정상적으로 작동 중입니다.',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/stt/transcribe
 * 음성 파일을 텍스트로 변환
 */
router.post('/transcribe', auth, (req, res, next) => {
  console.log('STT transcribe 요청 받음:', {
    method: req.method,
    url: req.url,
    contentType: req.headers['content-type'],
    userId: req.user?.id
  });
  next();
}, upload.single('audio'), async (req, res) => {
  try {
    console.log('파일 업로드 정보:', {
      hasFile: !!req.file,
      filename: req.file?.originalname,
      size: req.file?.size,
      mimetype: req.file?.mimetype
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '음성 파일이 필요합니다.'
      });
    }

    const { language, temperature, prompt } = req.body;
    
    const options = {
      language: language || 'ko',
      temperature: temperature ? parseFloat(temperature) : 0,
      prompt: prompt || '',
      response_format: 'text'
    };

    console.log(`STT 변환 시작 - 사용자: ${req.user.id}, 파일: ${req.file.originalname}, 크기: ${req.file.size}bytes`);

    const transcription = await sttService.transcribeAudio(
      req.file.buffer,
      req.file.originalname,
      options
    );

    console.log(`STT 변환 완료 - 결과 길이: ${transcription.length}자`);

    res.json({
      success: true,
      data: {
        text: transcription,
        filename: req.file.originalname,
        size: req.file.size,
        language: options.language
      }
    });

  } catch (error) {
    console.error('STT API Error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || '음성 변환 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/stt/supported-formats
 * 지원되는 오디오 형식 목록 반환
 */
router.get('/supported-formats', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      formats: ['mp3', 'mp4', 'm4a', 'wav', 'webm', 'ogg', 'flac'],
      maxSize: '25MB',
      maxDuration: '없음 (API 제한에 따름)'
    }
  });
});

// 에러 핸들링 미들웨어
router.use((error, req, res, next) => {
  console.error('STT 라우트 에러:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: '파일 크기가 너무 큽니다. (최대 25MB)'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: error.message || '서버 오류가 발생했습니다.'
  });
});

console.log('STT 라우트가 로드되었습니다.');

module.exports = router;
