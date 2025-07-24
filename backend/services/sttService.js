const axios = require('axios');
const FormData = require('form-data');
const { openaiApiKey } = require('../config/keys');
const KoreanSTTOptimizer = require('../utils/koreanSTTOptimizer');

class STTService {
  constructor() {
    this.openaiClient = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      }
    });
  }

  /**
   * 음성 파일을 텍스트로 변환
   * @param {Buffer} audioBuffer - 음성 파일 버퍼
   * @param {string} filename - 파일명 (확장자 포함)
   * @param {Object} options - 추가 옵션
   * @returns {Promise<string>} 변환된 텍스트
   */
  async transcribeAudio(audioBuffer, filename, options = {}) {
    try {
      const formData = new FormData();
      
      // 음성 파일 첨부
      formData.append('file', audioBuffer, {
        filename: filename,
        contentType: this.getContentType(filename)
      });
      
      // Whisper 모델 설정
      formData.append('model', 'whisper-1');
      
      // 파일 정보를 바탕으로 최적 설정 계산
      const optimalSettings = KoreanSTTOptimizer.getOptimalSettings(
        audioBuffer.length, 
        this.getContentType(filename)
      );
      
      // 언어 설정 (한국어 우선)
      const language = options.language || optimalSettings.language;
      formData.append('language', language);
      
      // 응답 형식 설정
      formData.append('response_format', options.response_format || optimalSettings.response_format);
      
      // 온도 설정 (최적화된 값 사용)
      const temperature = options.temperature !== undefined ? options.temperature : optimalSettings.temperature;
      formData.append('temperature', temperature.toString());
      
      // 한국어 채팅에 최적화된 프롬프트 생성
      let prompt = '';
      if (language === 'ko') {
        prompt = KoreanSTTOptimizer.generateChatPrompt(options.prompt);
      } else if (options.prompt) {
        prompt = options.prompt;
      }
      
      if (prompt) {
        formData.append('prompt', prompt);
      }

      console.log('STT 요청 설정:', {
        filename,
        fileSize: audioBuffer.length,
        language,
        temperature,
        promptLength: prompt.length
      });

      const response = await this.openaiClient.post('/audio/transcriptions', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: 25 * 1024 * 1024, // 25MB
        maxBodyLength: 25 * 1024 * 1024,
        timeout: 30000 // 30초 타임아웃
      });

      let result = response.data;
      
      // 한국어인 경우 후처리 적용
      if (language === 'ko' && typeof result === 'string') {
        result = KoreanSTTOptimizer.postProcess(result);
      }

      console.log('STT 변환 결과:', {
        originalLength: response.data.length,
        processedLength: result.length,
        result: result.substring(0, 100) + (result.length > 100 ? '...' : '')
      });

      return result;

    } catch (error) {
      console.error('STT transcription error:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        switch (error.response.status) {
          case 400:
            throw new Error('잘못된 음성 파일 형식이거나 파일이 너무 큽니다.');
          case 401:
            throw new Error('OpenAI API 인증에 실패했습니다.');
          case 413:
            throw new Error('파일 크기가 너무 큽니다. (최대 25MB)');
          case 429:
            throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
          default:
            throw new Error('음성 변환 중 오류가 발생했습니다.');
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('음성 변환 요청이 시간 초과되었습니다.');
      } else {
        throw new Error('음성 변환 서비스에 연결할 수 없습니다.');
      }
    }
  }

  /**
   * 파일 확장자에 따른 Content-Type 반환
   * @param {string} filename - 파일명
   * @returns {string} Content-Type
   */
  getContentType(filename) {
    const extension = filename.toLowerCase().split('.').pop();
    
    const mimeTypes = {
      'mp3': 'audio/mpeg',
      'mp4': 'audio/mp4',
      'm4a': 'audio/mp4',
      'wav': 'audio/wav',
      'webm': 'audio/webm',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac'
    };

    return mimeTypes[extension] || 'audio/mpeg';
  }

  /**
   * 지원되는 오디오 형식인지 확인
   * @param {string} filename - 파일명
   * @returns {boolean} 지원 여부
   */
  isSupportedFormat(filename) {
    const extension = filename.toLowerCase().split('.').pop();
    const supportedFormats = ['mp3', 'mp4', 'm4a', 'wav', 'webm', 'ogg', 'flac'];
    return supportedFormats.includes(extension);
  }

  /**
   * 실시간 음성 변환 (스트리밍은 현재 Whisper API에서 지원하지 않음)
   * 향후 지원될 때를 대비한 placeholder
   */
  async transcribeStream() {
    throw new Error('실시간 음성 변환은 현재 지원되지 않습니다.');
  }
}

module.exports = new STTService();
