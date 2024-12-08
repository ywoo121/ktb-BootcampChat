const express = require('express');
const router = express.Router();
const aiController = require('../../controllers/aiController');
const auth = require('../../middleware/auth');

// AI 프로필 설정
router.post('/profile', auth, aiController.setAIProfile);

// AI 프로필 가져오기
router.get('/profile', auth, aiController.getAIProfile);

module.exports = router;