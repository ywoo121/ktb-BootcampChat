import axios, { isCancel, CancelToken } from 'axios';
import authService from './authService';
import { Toast } from '../components/Toast';

class FileService {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL;
    this.uploadLimit = 50 * 1024 * 1024; // 50MB
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.activeUploads = new Map();

    this.allowedTypes = {
      image: {
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxSize: 10 * 1024 * 1024,
        name: '이미지'
      },
      video: {
        extensions: ['.mp4', '.webm', '.mov'],
        mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
        maxSize: 50 * 1024 * 1024,
        name: '동영상'
      },
      audio: {
        extensions: ['.mp3', '.wav', '.ogg'],
        mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
        maxSize: 20 * 1024 * 1024,
        name: '오디오'
      },
      document: {
        extensions: ['.pdf', '.doc', '.docx', '.txt'],
        mimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ],
        maxSize: 20 * 1024 * 1024,
        name: '문서'
      },
      archive: {
        extensions: ['.zip', '.rar', '.7z'],
        mimeTypes: [
          'application/zip',
          'application/x-rar-compressed',
          'application/x-7z-compressed'
        ],
        maxSize: 50 * 1024 * 1024,
        name: '압축파일'
      }
    };
  }

  async validateFile(file) {
    if (!file) {
      const message = '파일이 선택되지 않았습니다.';
      Toast.error(message);
      return { success: false, message };
    }

    if (file.size > this.uploadLimit) {
      const message = `파일 크기는 ${this.formatFileSize(this.uploadLimit)}를 초과할 수 없습니다.`;
      Toast.error(message);
      return { success: false, message };
    }

    let isAllowedType = false;
    let maxTypeSize = 0;
    let typeConfig = null;

    for (const config of Object.values(this.allowedTypes)) {
      if (config.mimeTypes.includes(file.type)) {
        isAllowedType = true;
        maxTypeSize = config.maxSize;
        typeConfig = config;
        break;
      }
    }

    if (!isAllowedType) {
      const message = '지원하지 않는 파일 형식입니다.';
      Toast.error(message);
      return { success: false, message };
    }

    if (file.size > maxTypeSize) {
      const message = `${typeConfig.name} 파일은 ${this.formatFileSize(maxTypeSize)}를 초과할 수 없습니다.`;
      Toast.error(message);
      return { success: false, message };
    }

    const ext = this.getFileExtension(file.name);
    if (!typeConfig.extensions.includes(ext.toLowerCase())) {
      const message = '파일 확장자가 올바르지 않습니다.';
      Toast.error(message);
      return { success: false, message };
    }

    return { success: true };
  }

  async uploadFile(file, onProgress) {
    const validationResult = await this.validateFile(file);
    if (!validationResult.success) return validationResult;
  
    try {
      const user = authService.getCurrentUser();
      if (!user?.token || !user?.sessionId) {
        return { success: false, message: '인증 정보가 없습니다.' };
      }
  
      // STEP 1: presigned URL 요청
      const { data: presignedData } = await axios.post(`${this.baseUrl}/api/files/presigned-upload`, {
        originalname: file.name,
        mimetype: file.type,
        size: file.size
      }, {
        headers: this.getHeaders()
      });
  
      const { uploadUrl, fileKey, fileUrl } = presignedData;
  
      // STEP 2: S3에 직접 업로드
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        }
      });
  
      // STEP 3: 메타데이터 등록 요청
      const { data: uploadResponse } = await axios.post(`${this.baseUrl}/api/files/upload`, {
        filename: fileKey.split('/').pop(),
        originalname: file.name,
        mimetype: file.type,
        size: file.size,
        path: fileKey,
        url: fileUrl
      }, {
        headers: this.getHeaders()
      });
  
      if (!uploadResponse.success) {
        return {
          success: false,
          message: uploadResponse.message || '파일 업로드 실패'
        };
      }
  
      return {
        success: true,
        data: {
          ...uploadResponse,
          file: {
            ...uploadResponse.file,
            url: fileUrl // 미리보기 URL 바로 사용 가능
          }
        }
      };
  
    } catch (error) {
      return this.handleUploadError(error);
    }
  }

  async downloadFile(filename, originalname) {
    try {
      const user = authService.getCurrentUser();
      if (!user?.token || !user?.sessionId) {
        return {
          success: false,
          message: '인증 정보가 없습니다.'
        };
      }

      console.log('Requesting download for:', filename);

      // API에서 다운로드 URL 가져오기
      const response = await axios.get(
        `${this.baseUrl || ''}/api/files/download/${filename}`,
        {
          headers: {
            'x-auth-token': user.token,
            'x-session-id': user.sessionId
          },
          withCredentials: true
        }
      );

      if (!response.data?.success || !response.data?.downloadUrl) {
        return {
          success: false,
          message: response.data?.message || '다운로드 URL을 가져올 수 없습니다.'
        };
      }

      console.log('Got download URL:', response.data.downloadUrl);

      // S3 public URL이므로 브라우저에서 직접 다운로드
      const finalFilename = originalname || response.data.filename || filename;
      
      const link = document.createElement('a');
      link.href = response.data.downloadUrl;
      link.download = finalFilename;
      link.target = '_blank'; // 새 탭에서 열기
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true };

    } catch (error) {
      if (error.response?.status === 401) {
        try {
          const refreshed = await authService.refreshToken();
          if (refreshed) {
            return this.downloadFile(filename, originalname);
          }
          return {
            success: false,
            message: '인증이 만료되었습니다. 다시 로그인해주세요.'
          };
        } catch (refreshError) {
          return {
            success: false,
            message: '인증이 만료되었습니다. 다시 로그인해주세요.'
          };
        }
      }

      return this.handleDownloadError(error);
    }
  }

  getFileUrl(filename, forPreview = false) {
    if (!filename) return '';

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const endpoint = forPreview ? 'view' : 'download';
    return `${baseUrl}/api/files/${endpoint}/${filename}`;
  }

  async getPreviewUrl(file) {
    if (!file?.filename) return '';

    try {
      const user = authService.getCurrentUser();
      if (!user?.token || !user?.sessionId) {
        console.error('No auth info for preview');
        return '';
      }

      // API를 통해 S3 URL 가져오기
      const response = await axios.get(
        `${this.baseUrl || ''}/api/files/view/${file.filename}`,
        {
          headers: {
            'x-auth-token': user.token,
            'x-session-id': user.sessionId
          },
          withCredentials: true
        }
      );

      if (response.data?.success && response.data?.viewUrl) {
        console.log('Got preview URL:', response.data.viewUrl);
        return response.data.viewUrl; // 이제 MongoDB에서 가져온 S3 public URL
      }

      console.error('Failed to get preview URL:', response.data);
      return '';
    } catch (error) {
      console.error('Preview URL error:', error);
      return '';
    }
  }

  getFileType(filename) {
    if (!filename) return 'unknown';
    const ext = this.getFileExtension(filename).toLowerCase();
    for (const [type, config] of Object.entries(this.allowedTypes)) {
      if (config.extensions.includes(ext)) {
        return type;
      }
    }
    return 'unknown';
  }

  getFileExtension(filename) {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts.pop().toLowerCase()}` : '';
  }

  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${units[i]}`;
  }

  getHeaders() {
    const user = authService.getCurrentUser();
    if (!user?.token || !user?.sessionId) {
      return {};
    }
    return {
      'x-auth-token': user.token,
      'x-session-id': user.sessionId,
      'Accept': 'application/json, */*'
    };
  }

  handleUploadError(error) {
    console.error('Upload error:', error);

    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: '파일 업로드 시간이 초과되었습니다.'
      };
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      switch (status) {
        case 400:
          return {
            success: false,
            message: message || '잘못된 요청입니다.'
          };
        case 401:
          return {
            success: false,
            message: '인증이 필요합니다.'
          };
        case 413:
          return {
            success: false,
            message: '파일이 너무 큽니다.'
          };
        case 415:
          return {
            success: false,
            message: '지원하지 않는 파일 형식입니다.'
          };
        case 500:
          return {
            success: false,
            message: '서버 오류가 발생했습니다.'
          };
        default:
          return {
            success: false,
            message: message || '파일 업로드에 실패했습니다.'
          };
      }
    }

    return {
      success: false,
      message: error.message || '알 수 없는 오류가 발생했습니다.',
      error
    };
  }

  handleDownloadError(error) {
    console.error('Download error:', error);

    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: '파일 다운로드 시간이 초과되었습니다.'};
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      switch (status) {
        case 404:
          return {
            success: false,
            message: '파일을 찾을 수 없습니다.'
          };
        case 403:
          return {
            success: false,
            message: '파일에 접근할 권한이 없습니다.'
          };
        case 400:
          return {
            success: false,
            message: message || '잘못된 요청입니다.'
          };
        case 500:
          return {
            success: false,
            message: '서버 오류가 발생했습니다.'
          };
        default:
          return {
            success: false,
            message: message || '파일 다운로드에 실패했습니다.'
          };
      }
    }

    return {
      success: false,
      message: error.message || '알 수 없는 오류가 발생했습니다.',
      error
    };
  }

  cancelUpload(filename) {
    const source = this.activeUploads.get(filename);
    if (source) {
      source.cancel('Upload canceled by user');
      this.activeUploads.delete(filename);
      return {
        success: true,
        message: '업로드가 취소되었습니다.'
      };
    }
    return {
      success: false,
      message: '취소할 업로드를 찾을 수 없습니다.'
    };
  }

  cancelAllUploads() {
    let canceledCount = 0;
    for (const [filename, source] of this.activeUploads) {
      source.cancel('All uploads canceled');
      this.activeUploads.delete(filename);
      canceledCount++;
    }
    
    return {
      success: true,
      message: `${canceledCount}개의 업로드가 취소되었습니다.`,
      canceledCount
    };
  }

  getErrorMessage(status) {
    switch (status) {
      case 400:
        return '잘못된 요청입니다.';
      case 401:
        return '인증이 필요합니다.';
      case 403:
        return '파일에 접근할 권한이 없습니다.';
      case 404:
        return '파일을 찾을 수 없습니다.';
      case 413:
        return '파일이 너무 큽니다.';
      case 415:
        return '지원하지 않는 파일 형식입니다.';
      case 500:
        return '서버 오류가 발생했습니다.';
      case 503:
        return '서비스를 일시적으로 사용할 수 없습니다.';
      default:
        return '알 수 없는 오류가 발생했습니다.';
    }
  }

  isRetryableError(error) {
    if (!error.response) {
      return true; // 네트워크 오류는 재시도 가능
    }

    const status = error.response.status;
    return [408, 429, 500, 502, 503, 504].includes(status);
  }
}

export default new FileService();
