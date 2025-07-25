const axios = require('axios');
const { openaiApiKey } = require('../config/keys');

class TranslationService {
  constructor() {
    this.openaiClient = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Supported languages
    this.supportedLanguages = {
      'ko': '한국어',
      'en': 'English',
      'ja': '日本語',
      'zh': '中文',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'ru': 'Русский',
      'pt': 'Português',
      'it': 'Italiano'
    };

    // Translation cache
    this.translationCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10분 캐시
  }

  // Detect language of given text
  async detectLanguage(text) {
    try {
      if (!text || text.trim().length === 0) {
        return 'unknown';
      }

      const response = await this.openaiClient.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a language detection system. Respond with only the ISO 639-1 language code (e.g., 'ko', 'en', 'ja', 'zh', 'es', 'fr', 'de', 'ru', 'pt', 'it') for the detected language. If you cannot detect the language, respond with 'unknown'.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 10,
        temperature: 0
      });

      const detectedLang = response.data.choices[0]?.message?.content?.trim().toLowerCase();
      return this.supportedLanguages[detectedLang] ? detectedLang : 'unknown';
    } catch (error) {
      console.error('Language detection error:', error);
      return 'unknown';
    }
  }

  // Translate text to target language
  async translateText(text, targetLang = 'en', sourceLang = null) {
    try {
      if (!text || text.trim().length === 0) {
        return { success: false, error: 'Empty text provided' };
      }

      if (!this.supportedLanguages[targetLang]) {
        return { success: false, error: 'Unsupported target language' };
      }

      // Check cache first
      const cacheKey = `${text}:${sourceLang || 'auto'}:${targetLang}`;
      if (this.translationCache.has(cacheKey)) {
        const cached = this.translationCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return { success: true, ...cached.data };
        }
      }

      // Detect source language if not provided
      if (!sourceLang) {
        sourceLang = await this.detectLanguage(text);
      }

      // Skip translation if source and target are the same
      if (sourceLang === targetLang) {
        return {
          success: true,
          originalText: text,
          translatedText: text,
          sourceLang,
          targetLang,
          cached: false
        };
      }

      const targetLangName = this.supportedLanguages[targetLang];
      const sourceLangName = this.supportedLanguages[sourceLang] || 'auto-detected language';

      const response = await this.openaiClient.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text from ${sourceLangName} to ${targetLangName}. Maintain the original tone, context, and meaning. If the text contains emojis, keep them unchanged. Only respond with the translated text, no explanations.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const translatedText = response.data.choices[0]?.message?.content?.trim();

      if (!translatedText) {
        return { success: false, error: 'Translation failed' };
      }

      const result = {
        success: true,
        originalText: text,
        translatedText,
        sourceLang,
        targetLang,
        cached: false
      };

      // Cache the result
      this.translationCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Translation error:', error);
      return { 
        success: false, 
        error: error.message || 'Translation service error' 
      };
    }
  }

  // Translate message with streaming support
  async translateMessageStream(text, targetLang, callbacks) {
    try {
      if (!text || text.trim().length === 0) {
        callbacks.onError?.('Empty text provided');
        return;
      }

      if (!this.supportedLanguages[targetLang]) {
        callbacks.onError?.('Unsupported target language');
        return;
      }

      callbacks.onStart?.();

      // Detect source language
      const sourceLang = await this.detectLanguage(text);
      
      // Skip translation if same language
      if (sourceLang === targetLang) {
        callbacks.onComplete?.({
          originalText: text,
          translatedText: text,
          sourceLang,
          targetLang
        });
        return;
      }

      const targetLangName = this.supportedLanguages[targetLang];
      const sourceLangName = this.supportedLanguages[sourceLang] || 'auto-detected language';

      const response = await this.openaiClient.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text from ${sourceLangName} to ${targetLangName}. Maintain the original tone, context, and meaning. If the text contains emojis, keep them unchanged. Only respond with the translated text, no explanations.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
        stream: true
      }, {
        responseType: 'stream'
      });

      let fullTranslation = '';
      let buffer = '';

      return new Promise((resolve, reject) => {
        response.data.on('data', async (chunk) => {
          try {
            buffer += chunk.toString();
            while (true) {
              const newlineIndex = buffer.indexOf('\n');
              if (newlineIndex === -1) break;
              const line = buffer.slice(0, newlineIndex).trim();
              buffer = buffer.slice(newlineIndex + 1);
              if (line === '') continue;
              if (line === 'data: [DONE]') {
                callbacks.onComplete?.({
                  originalText: text,
                  translatedText: fullTranslation.trim(),
                  sourceLang,
                  targetLang
                });
                resolve(fullTranslation.trim());
                return;
              }
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  const content = data.choices[0]?.delta?.content;
                  if (content) {
                    await callbacks.onChunk?.({ currentChunk: content });
                    fullTranslation += content;
                  }
                } catch (err) {
                  console.error('JSON parsing error:', err);
                }
              }
            }
          } catch (error) {
            console.error('Stream processing error:', error);
            callbacks.onError?.(error);
            reject(error);
          }
        });

        response.data.on('error', (error) => {
          console.error('Stream error:', error);
          callbacks.onError?.(error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Translation stream error:', error);
      callbacks.onError?.(error);
      throw error;
    }
  }

  // Get supported languages
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Clear translation cache
  clearCache() {
    this.translationCache.clear();
  }

  // Get cache size
  getCacheSize() {
    return this.translationCache.size;
  }
}

module.exports = new TranslationService();