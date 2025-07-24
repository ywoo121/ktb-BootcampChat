const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const auth = require('../../middleware/auth');
const audioService = require('../../services/audioService');

const router = express.Router();

// Configure multer for audio file uploads
const audioStorage = multer.memoryStorage();
const audioUpload = multer({
  storage: audioStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (OpenAI Whisper limit)
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    const allowedMimes = [
      'audio/mpeg',
      'audio/wav',
      'audio/webm',
      'audio/mp4',
      'audio/ogg',
      'audio/flac',
      'audio/x-wav',
      'audio/x-m4a'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type. Supported formats: mp3, wav, webm, m4a, ogg, flac'), false);
    }
  }
});

// Rate limiting for audio APIs
const audioRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    error: 'Too many audio requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const ttsRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Higher limit for TTS as it's less resource intensive
  message: {
    error: 'Too many TTS requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/audio/tts
 * Convert text to speech
 */
router.post('/tts', auth, ttsRateLimit, async (req, res) => {
  try {
    const { text, aiType = 'default', format = 'mp3' } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }

    if (text.length > 4000) {
      return res.status(400).json({ error: 'Text too long. Maximum 4000 characters allowed.' });
    }

    // Generate TTS
    const audioBuffer = await audioService.textToSpeech(text, aiType, format);

    // Set appropriate headers
    res.setHeader('Content-Type', `audio/${format}`);
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    res.send(audioBuffer);

  } catch (error) {
    console.error('[Audio API] TTS Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate speech',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/audio/tts/stream
 * Convert text to speech with streaming
 */
router.post('/tts/stream', auth, ttsRateLimit, async (req, res) => {
  try {
    const { text, aiType = 'default' } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }

    if (text.length > 4000) {
      return res.status(400).json({ error: 'Text too long. Maximum 4000 characters allowed.' });
    }

    // Stream TTS response
    await audioService.streamTextToSpeech(text, aiType, res);

  } catch (error) {
    console.error('[Audio API] Streaming TTS Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to stream speech',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

/**
 * POST /api/audio/stt
 * Convert speech to text
 */
router.post('/stt', auth, audioRateLimit, audioUpload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const { language } = req.body;

    // Transcribe audio
    const transcription = await audioService.speechToText(req.file, language);

    res.json({ 
      transcription,
      confidence: 1.0, // OpenAI doesn't provide confidence scores
      language: language || 'auto-detected'
    });

  } catch (error) {
    console.error('[Audio API] STT Error:', error);
    res.status(500).json({ 
      error: 'Failed to transcribe audio',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/audio/stt/chunk
 * Process audio chunk for real-time transcription
 */
router.post('/stt/chunk', auth, audioRateLimit, audioUpload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio chunk is required' });
    }

    const { sessionId = 'default', sequence = 0 } = req.body;

    // Process audio chunk
    const partialTranscription = await audioService.processAudioChunk(req.file.buffer, sessionId);

    res.json({ 
      transcription: partialTranscription,
      sessionId,
      sequence: parseInt(sequence),
      isPartial: true
    });

  } catch (error) {
    console.error('[Audio API] STT Chunk Error:', error);
    res.status(500).json({ 
      error: 'Failed to process audio chunk',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/audio/voices
 * Get available voices and AI type mapping
 */
router.get('/voices', auth, (req, res) => {
  try {
    const voiceMapping = audioService.getVoiceMapping();
    
    res.json({
      voices: {
        shimmer: { name: 'Shimmer', description: 'Professional and clear' },
        onyx: { name: 'Onyx', description: 'Motivational and energetic' },
        nova: { name: 'Nova', description: 'Warm and friendly' },
        echo: { name: 'Echo', description: 'Neutral and balanced' }
      },
      aiMapping: voiceMapping
    });

  } catch (error) {
    console.error('[Audio API] Voices Error:', error);
    res.status(500).json({ 
      error: 'Failed to get voice information',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Error handler for multer errors
 */
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Audio file too large. Maximum size is 25MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${error.message}` });
  }
  
  if (error.message.includes('Invalid audio file type')) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

module.exports = router;
