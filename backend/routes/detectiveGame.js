const express = require('express');
const router = express.Router();
const detectiveGameService = require('../services/detectiveGameService');
const { authMiddleware } = require('../middleware/auth');

// 게임 시작
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { roomId, persona, mode } = req.body;
    const userId = req.user.id;

    if (!roomId || !persona || !mode) {
      return res.status(400).json({
        success: false,
        message: '필수 파라미터가 누락되었습니다.'
      });
    }

    const result = detectiveGameService.startGame(roomId, persona, mode, userId);
    res.json(result);
  } catch (error) {
    console.error('Detective game start error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '게임 시작 중 오류가 발생했습니다.'
    });
  }
});

// 게임 참가
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: '방 ID가 필요합니다.'
      });
    }

    const result = detectiveGameService.joinGame(roomId, userId);
    res.json(result);
  } catch (error) {
    console.error('Detective game join error:', error);
    res.status(500).json({
      success: false,
      message: '게임 참가 중 오류가 발생했습니다.'
    });
  }
});

// 단서 요청
router.post('/clue', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: '방 ID가 필요합니다.'
      });
    }

    const result = detectiveGameService.getClue(roomId, userId);
    res.json(result);
  } catch (error) {
    console.error('Detective game clue error:', error);
    res.status(500).json({
      success: false,
      message: '단서 요청 중 오류가 발생했습니다.'
    });
  }
});

// 추리 제출
router.post('/guess', authMiddleware, async (req, res) => {
  try {
    const { roomId, guess } = req.body;
    const userId = req.user.id;

    if (!roomId || !guess) {
      return res.status(400).json({
        success: false,
        message: '방 ID와 추리 내용이 필요합니다.'
      });
    }

    const result = detectiveGameService.submitGuess(roomId, userId, guess);
    res.json(result);
  } catch (error) {
    console.error('Detective game guess error:', error);
    res.status(500).json({
      success: false,
      message: '추리 제출 중 오류가 발생했습니다.'
    });
  }
});

// 게임 종료
router.post('/end', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: '방 ID가 필요합니다.'
      });
    }

    const result = detectiveGameService.endGame(roomId);
    res.json(result);
  } catch (error) {
    console.error('Detective game end error:', error);
    res.status(500).json({
      success: false,
      message: '게임 종료 중 오류가 발생했습니다.'
    });
  }
});

// 게임 상태 조회
router.get('/status/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const gameState = detectiveGameService.getGameState(roomId);

    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: '진행 중인 게임이 없습니다.'
      });
    }

    res.json({
      success: true,
      game: gameState
    });
  } catch (error) {
    console.error('Detective game status error:', error);
    res.status(500).json({
      success: false,
      message: '게임 상태 조회 중 오류가 발생했습니다.'
    });
  }
});

// 사용 가능한 페르소나 목록
router.get('/personas', async (req, res) => {
  try {
    const personas = detectiveGameService.getAvailablePersonas();
    res.json({
      success: true,
      personas
    });
  } catch (error) {
    console.error('Get personas error:', error);
    res.status(500).json({
      success: false,
      message: '페르소나 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 사용 가능한 게임 모드 목록
router.get('/modes', async (req, res) => {
  try {
    const modes = detectiveGameService.getAvailableModes();
    res.json({
      success: true,
      modes
    });
  } catch (error) {
    console.error('Get modes error:', error);
    res.status(500).json({
      success: false,
      message: '게임 모드 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;