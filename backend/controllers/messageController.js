const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redisClient');

// 메시지 전송
exports.sendMessage = async (req, res) => {
  try {
    const { roomId, content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: '메시지를 입력해주세요.' });
    }
    const message = { id: uuidv4(), userId: req.user.id, content, timestamp: Date.now() };
    await redisClient.addMessage(roomId, message);
    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: '메시지 전송 중 오류가 발생했습니다.' });
  }
};

// 메시지 조회
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await redisClient.getMessages(roomId, 0, -1);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: '메시지 조회 중 오류가 발생했습니다.' });
  }
};

module.exports = exports; 