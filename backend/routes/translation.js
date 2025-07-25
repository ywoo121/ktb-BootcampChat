const express = require('express');
const router = express.Router();
const translationService = require('../services/translationService');
const { authenticateToken } = require('../middleware/auth');

// GET /api/translation/languages - Get supported languages
router.get('/languages', authenticateToken, (req, res) => {
  try {
    const languages = translationService.getSupportedLanguages();
    res.json({
      success: true,
      languages
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supported languages'
    });
  }
});

// POST /api/translation/detect - Detect language of text
router.post('/detect', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const detectedLang = await translationService.detectLanguage(text);
    const languages = translationService.getSupportedLanguages();

    res.json({
      success: true,
      detectedLanguage: detectedLang,
      languageName: languages[detectedLang] || 'Unknown',
      text
    });
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Language detection failed'
    });
  }
});

// POST /api/translation/translate - Translate text
router.post('/translate', authenticateToken, async (req, res) => {
  try {
    const { text, targetLang, sourceLang } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    if (!targetLang) {
      return res.status(400).json({
        success: false,
        message: 'Target language is required'
      });
    }

    const result = await translationService.translateText(text, targetLang, sourceLang);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Translation failed'
    });
  }
});

// GET /api/translation/cache/stats - Get cache statistics (admin only)
router.get('/cache/stats', authenticateToken, (req, res) => {
  try {
    const cacheSize = translationService.getCacheSize();
    res.json({
      success: true,
      cacheSize,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics'
    });
  }
});

// DELETE /api/translation/cache - Clear translation cache (admin only)
router.delete('/cache', authenticateToken, (req, res) => {
  try {
    translationService.clearCache();
    res.json({
      success: true,
      message: 'Translation cache cleared'
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
});

module.exports = router;