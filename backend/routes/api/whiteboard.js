const express = require('express');
const router = express.Router();
const Whiteboard = require('../../models/Whiteboard');
const Room = require('../../models/Room');
const auth = require('../../middleware/auth');

// 화이트보드 데이터 가져오기
router.get('/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    // 방 접근 권한 확인
    const room = await Room.findOne({
      _id: roomId,
      participants: req.user.id
    });

    if (!room) {
      return res.status(403).json({ 
        message: '화이트보드에 접근할 권한이 없습니다.' 
      });
    }

    // 화이트보드 데이터 조회
    let whiteboard = await Whiteboard.findOne({ room: roomId })
      .populate('lastModifiedBy', 'name email');

    if (!whiteboard) {
      // 화이트보드가 없으면 새로 생성
      whiteboard = new Whiteboard({
        room: roomId,
        data: { objects: [], background: '#ffffff' },
        lastModifiedBy: req.user.id
      });
      await whiteboard.save();
    }

    res.json({
      success: true,
      data: whiteboard
    });

  } catch (error) {
    console.error('Get whiteboard error:', error);
    res.status(500).json({ 
      success: false,
      message: '화이트보드 데이터를 불러오는 중 오류가 발생했습니다.' 
    });
  }
});

// 화이트보드 데이터 저장
router.put('/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { data } = req.body;

    // 방 접근 권한 확인
    const room = await Room.findOne({
      _id: roomId,
      participants: req.user.id
    });

    if (!room) {
      return res.status(403).json({ 
        message: '화이트보드에 접근할 권한이 없습니다.' 
      });
    }

    // 화이트보드 데이터 업데이트
    const whiteboard = await Whiteboard.findOneAndUpdate(
      { room: roomId },
      {
        data: data,
        lastModified: new Date(),
        lastModifiedBy: req.user.id
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    ).populate('lastModifiedBy', 'name email');

    res.json({
      success: true,
      data: whiteboard
    });

  } catch (error) {
    console.error('Save whiteboard error:', error);
    res.status(500).json({ 
      success: false,
      message: '화이트보드 데이터를 저장하는 중 오류가 발생했습니다.' 
    });
  }
});

// 화이트보드 초기화
router.delete('/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    // 방 접근 권한 확인
    const room = await Room.findOne({
      _id: roomId,
      participants: req.user.id
    });

    if (!room) {
      return res.status(403).json({ 
        message: '화이트보드에 접근할 권한이 없습니다.' 
      });
    }

    // 화이트보드 데이터 초기화
    const whiteboard = await Whiteboard.findOneAndUpdate(
      { room: roomId },
      {
        data: { objects: [], background: '#ffffff' },
        lastModified: new Date(),
        lastModifiedBy: req.user.id
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    ).populate('lastModifiedBy', 'name email');

    res.json({
      success: true,
      data: whiteboard
    });

  } catch (error) {
    console.error('Clear whiteboard error:', error);
    res.status(500).json({ 
      success: false,
      message: '화이트보드를 초기화하는 중 오류가 발생했습니다.' 
    });
  }
});

module.exports = router;