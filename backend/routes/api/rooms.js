const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roomController = require('../../controllers/roomController');

// 방 목록
router.get('/', auth, roomController.getRooms);
// 방 생성
router.post('/', auth, roomController.createRoom);
// 방 상세 조회
router.get('/:roomId', auth, roomController.getRoom);

module.exports = router;