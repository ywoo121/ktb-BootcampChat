import axios from './axios';

class STTService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.stream = null;
  }

  /**
   * 음성 녹음 시작
   * @param {Object} options - 녹음 설정
   * @returns {Promise<void>}
   */
  async startRecording(options = {}) {
    try {
      if (this.isRecording) {
        throw new Error('이미 녹음 중입니다.');
      }

      // 마이크 권한 요청 - 한국어 음성 인식에 최적화된 설정
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: options.sampleRate || 44100, // 높은 샘플레이트로 품질 향상
          channelCount: options.channelCount || 1, // 모노로 설정 (용량 절약)
          echoCancellation: true, // 에코 제거
          noiseSuppression: true, // 노이즈 억제
          autoGainControl: true,  // 자동 볼륨 조절
          // 추가 최적화 설정
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true
        }
      });

      this.audioChunks = [];
      
      // 브라우저별 지원 형식 확인
      const mimeType = this.getSupportedMimeType();
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType,
        audioBitsPerSecond: options.audioBitsPerSecond || 128000
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        this.isRecording = true;
        console.log('음성 녹음 시작');
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        console.log('음성 녹음 종료');
      };

      // 녹음 시작
      this.mediaRecorder.start(options.timeslice || 1000);

    } catch (error) {
      console.error('녹음 시작 오류:', error);
      
      if (error.name === 'NotAllowedError') {
        throw new Error('마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('이 브라우저에서는 음성 녹음이 지원되지 않습니다.');
      } else {
        throw new Error(error.message || '음성 녹음을 시작할 수 없습니다.');
      }
    }
  }

  /**
   * 음성 녹음 중지 및 파일 반환
   * @returns {Promise<Blob>}
   */
  async stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.isRecording || !this.mediaRecorder) {
        reject(new Error('녹음 중이 아닙니다.'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        // 스트림 정리
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }

        // 오디오 블롭 생성
        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder.mimeType
        });

        this.isRecording = false;
        this.audioChunks = [];
        
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * 오디오 파일을 텍스트로 변환
   * @param {Blob|File} audioFile - 오디오 파일
   * @param {Object} options - 변환 옵션
   * @returns {Promise<string>}
   */
  async transcribeAudio(audioFile, options = {}) {
    try {
      console.log('STT 변환 시작:', {
        fileSize: audioFile.size,
        fileType: audioFile.type,
        options
      });

      // API 엔드포인트 확인을 위한 테스트 요청
      try {
        const testResponse = await axios.get('/api/stt/test');
        console.log('STT API 테스트 성공:', testResponse.data);
      } catch (testError) {
        console.error('STT API 테스트 실패:', testError);
        throw new Error('STT API 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      }

      const formData = new FormData();
      
      // 파일명 생성
      const filename = audioFile.name || `recording_${Date.now()}.${this.getFileExtension(audioFile.type)}`;
      formData.append('audio', audioFile, filename);
      
      if (options.language) {
        formData.append('language', options.language);
      }
      
      if (options.temperature !== undefined) {
        formData.append('temperature', options.temperature.toString());
      }
      
      if (options.prompt) {
        formData.append('prompt', options.prompt);
      }

      console.log('FormData 내용:', {
        filename,
        language: options.language,
        temperature: options.temperature
      });

      const response = await axios.post('/api/stt/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30초 타임아웃
      });

      console.log('STT 변환 응답:', response.data);

      if (response.data.success) {
        return response.data.data.text;
      } else {
        throw new Error(response.data.message || '음성 변환에 실패했습니다.');
      }

    } catch (error) {
      console.error('STT 변환 오류:', error);
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || '서버에서 음성 변환에 실패했습니다.';
        
        console.error('서버 응답 에러:', {
          status,
          message,
          data: error.response.data
        });
        
        if (status === 404) {
          throw new Error('STT API 엔드포인트를 찾을 수 없습니다. 서버 설정을 확인해주세요.');
        } else if (status === 401) {
          throw new Error('인증이 필요합니다. 로그인 후 다시 시도해주세요.');
        } else if (status === 413) {
          throw new Error('파일 크기가 너무 큽니다. (최대 25MB)');
        } else {
          throw new Error(message);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('음성 변환 요청이 시간 초과되었습니다.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('네트워크 연결을 확인해주세요.');
      } else {
        throw new Error(error.message || '음성 변환 중 오류가 발생했습니다.');
      }
    }
  }

  /**
   * 지원되는 MIME 타입 반환
   * @returns {string}
   */
  getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // 기본값
  }

  /**
   * MIME 타입에서 파일 확장자 반환
   * @param {string} mimeType
   * @returns {string}
   */
  getFileExtension(mimeType) {
    const extensions = {
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'audio/mpeg': 'mp3'
    };

    return extensions[mimeType] || 'webm';
  }

  /**
   * 지원되는 오디오 형식 목록 가져오기
   * @returns {Promise<Object>}
   */
  async getSupportedFormats() {
    try {
      const response = await axios.get('/api/stt/supported-formats');
      return response.data.data;
    } catch (error) {
      console.error('지원 형식 조회 오류:', error);
      return {
        formats: ['mp3', 'mp4', 'm4a', 'wav', 'webm', 'ogg'],
        maxSize: '25MB'
      };
    }
  }

  /**
   * 녹음 상태 확인
   * @returns {boolean}
   */
  isCurrentlyRecording() {
    return this.isRecording;
  }

  /**
   * 녹음 취소
   */
  cancelRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      
      this.audioChunks = [];
      this.isRecording = false;
    }
  }
}

export default new STTService();
