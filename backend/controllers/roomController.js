const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redisClient');

// 방 생성
exports.createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: '방 이름을 입력해주세요.' });
    }
    const roomId = uuidv4();
    const room = { id: roomId, name, participants: [req.user.id] };
    await redisClient.createRoom(room);
    res.status(201).json({ success: true, room });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ success: false, message: '방 생성 중 오류가 발생했습니다.' });
  }
};

// 방 목록
exports.getRooms = async (req, res) => {
  try {
    const rooms = await redisClient.listRooms();
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ success: false, message: '방 목록 조회 중 오류가 발생했습니다.' });
  }
};

// 방 상세 조회
exports.getRoom = async (req, res) => {
  try {
    const room = await redisClient.getRoom(req.params.roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: '방을 찾을 수 없습니다.' });
    }
    res.json({ success: true, room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ success: false, message: '방 정보 조회 중 오류가 발생했습니다.' });
  }
};

module.exports = exports; 