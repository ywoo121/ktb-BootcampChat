const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Voice mapping for AI personas
const AI_VOICE_MAP = {
  wayneAI: 'shimmer',      // Professional, clear voice for Wayne AI
  consultingAI: 'onyx',    // Motivational, energetic voice for Consulting AI
  default: 'echo'          // Neutral voice for default responses
};

class AudioService {
  /**
   * Convert text to speech using OpenAI TTS API
   * @param {string} text - Text to convert to speech
   * @param {string} aiType - Type of AI (wayneAI, consultingAI, etc.)
   * @param {string} format - Audio format (mp3, opus, aac, flac)
   * @returns {Promise<Buffer>} Audio buffer
   */
  async textToSpeech(text, aiType = 'default', format = 'mp3') {
    try {
      console.log(`[AudioService] TTS Request: ${text.substring(0, 50)}...`);
      
      const voice = AI_VOICE_MAP[aiType] || AI_VOICE_MAP.default;
      
      const response = await openai.audio.speech.create({
        model: 'tts-1',  // Use tts-1 for lower latency, tts-1-hd for higher quality
        voice: voice,
        input: text,
        response_format: format,
        speed: 1.0  // Normal speed
      });

      // Convert response to buffer
      const buffer = Buffer.from(await response.arrayBuffer());
      
      console.log(`[AudioService] TTS Generated: ${buffer.length} bytes, voice: ${voice}`);
      return buffer;
      
    } catch (error) {
      console.error('[AudioService] TTS Error:', error);
      throw new Error(`TTS generation failed: ${error.message}`);
    }
  }

  /**
   * Convert text to speech with streaming support
   * @param {string} text - Text to convert to speech
   * @param {string} aiType - Type of AI (wayneAI, consultingAI, etc.)
   * @param {Object} response - Express response object for streaming
   */
  async streamTextToSpeech(text, aiType = 'default', response) {
    try {
      console.log(`[AudioService] Streaming TTS Request: ${text.substring(0, 50)}...`);
      
      const voice = AI_VOICE_MAP[aiType] || AI_VOICE_MAP.default;
      
      const stream = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
        response_format: 'mp3',
        speed: 1.0
      });

      // Set appropriate headers for audio streaming
      response.setHeader('Content-Type', 'audio/mpeg');
      response.setHeader('Cache-Control', 'no-cache');
      response.setHeader('Connection', 'keep-alive');

      // Stream the audio data
      const buffer = Buffer.from(await stream.arrayBuffer());
      response.end(buffer);
      
      console.log(`[AudioService] Streaming TTS Complete: voice: ${voice}`);
      
    } catch (error) {
      console.error('[AudioService] Streaming TTS Error:', error);
      response.status(500).json({ error: `TTS streaming failed: ${error.message}` });
    }
  }

  /**
   * Convert speech to text using OpenAI Whisper API
   * @param {Buffer|string} audioFile - Audio file buffer or path
   * @param {string} language - Language code (optional)
   * @returns {Promise<string>} Transcribed text
   */
  async speechToText(audioFile, language = null) {
    try {
      console.log('[AudioService] STT Request received');
      
      let audioBuffer;
      let filename = 'audio.webm';

      // Handle different input types
      if (Buffer.isBuffer(audioFile)) {
        audioBuffer = audioFile;
      } else if (typeof audioFile === 'string') {
        audioBuffer = fs.readFileSync(audioFile);
        filename = path.basename(audioFile);
      } else if (audioFile.buffer) {
        // Multer file object
        audioBuffer = audioFile.buffer;
        filename = audioFile.originalname || 'audio.webm';
      } else {
        throw new Error('Invalid audio file input');
      }

      // Create a File-like object for OpenAI API
      const file = new File([audioBuffer], filename, {
        type: this.getAudioMimeType(filename)
      });

      const transcriptionOptions = {
        file: file,
        model: 'whisper-1',
        response_format: 'text',
        temperature: 0.1  // Lower temperature for more consistent results
      };

      // Add language if specified
      if (language) {
        transcriptionOptions.language = language;
      }

      const transcription = await openai.audio.transcriptions.create(transcriptionOptions);
      
      console.log(`[AudioService] STT Complete: ${transcription.substring(0, 100)}...`);
      return transcription.trim();
      
    } catch (error) {
      console.error('[AudioService] STT Error:', error);
      throw new Error(`Speech recognition failed: ${error.message}`);
    }
  }

  /**
   * Process audio chunks for real-time transcription
   * @param {Buffer} audioChunk - Audio chunk buffer
   * @param {string} sessionId - Session ID for tracking chunks
   * @returns {Promise<string>} Partial transcription
   */
  async processAudioChunk(audioChunk, sessionId) {
    try {
      // For real-time processing, we'll transcribe each chunk
      // In production, you might want to buffer chunks and process larger segments
      const transcription = await this.speechToText(audioChunk);
      
      console.log(`[AudioService] Chunk processed for session ${sessionId}: ${transcription.substring(0, 50)}...`);
      return transcription;
      
    } catch (error) {
      console.error(`[AudioService] Chunk processing error for session ${sessionId}:`, error);
      return ''; // Return empty string for failed chunks
    }
  }

  /**
   * Get appropriate MIME type based on file extension
   * @param {string} filename - Audio filename
   * @returns {string} MIME type
   */
  getAudioMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.webm': 'audio/webm',
      '.m4a': 'audio/mp4',
      '.ogg': 'audio/ogg',
      '.flac': 'audio/flac'
    };
    return mimeTypes[ext] || 'audio/webm';
  }

  /**
   * Get available voices for different AI types
   * @returns {Object} Voice mapping
   */
  getVoiceMapping() {
    return AI_VOICE_MAP;
  }

  /**
   * Get voice for specific AI type
   * @param {string} aiType - AI type
   * @returns {string} Voice name
   */
  getVoiceForAI(aiType) {
    return AI_VOICE_MAP[aiType] || AI_VOICE_MAP.default;
  }
}

module.exports = new AudioService();
