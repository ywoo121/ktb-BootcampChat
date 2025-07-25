import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class TranslationService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: `${API_BASE_URL}/api/translation`,
      timeout: 30000,
    });

    // Request interceptor to add auth token
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/?error=session_expired';
        }
        return Promise.reject(error);
      }
    );
  }

  // Get supported languages
  async getSupportedLanguages() {
    try {
      const response = await this.apiClient.get('/languages');
      return {
        success: true,
        languages: response.data.languages
      };
    } catch (error) {
      console.error('Get supported languages error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get supported languages'
      };
    }
  }

  // Detect language of text
  async detectLanguage(text) {
    try {
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: 'Text is required'
        };
      }

      const response = await this.apiClient.post('/detect', { text });
      return {
        success: true,
        detectedLanguage: response.data.detectedLanguage,
        languageName: response.data.languageName,
        text: response.data.text
      };
    } catch (error) {
      console.error('Language detection error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Language detection failed'
      };
    }
  }

  // Translate text
  async translateText(text, targetLang, sourceLang = null) {
    try {
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: 'Text is required'
        };
      }

      if (!targetLang) {
        return {
          success: false,
          error: 'Target language is required'
        };
      }

      const response = await this.apiClient.post('/translate', {
        text,
        targetLang,
        sourceLang
      });

      return {
        success: true,
        originalText: response.data.originalText,
        translatedText: response.data.translatedText,
        sourceLang: response.data.sourceLang,
        targetLang: response.data.targetLang,
        cached: response.data.cached
      };
    } catch (error) {
      console.error('Translation error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Translation failed'
      };
    }
  }

  // Get cache statistics (admin only)
  async getCacheStats() {
    try {
      const response = await this.apiClient.get('/cache/stats');
      return {
        success: true,
        cacheSize: response.data.cacheSize,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      console.error('Get cache stats error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get cache statistics'
      };
    }
  }

  // Clear translation cache (admin only)
  async clearCache() {
    try {
      const response = await this.apiClient.delete('/cache');
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Clear cache error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to clear cache'
      };
    }
  }
}

export default new TranslationService();