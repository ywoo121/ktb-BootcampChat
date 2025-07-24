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
    // 페이지네이션 및 정렬 파라미터 처리 (기본값 적용)
    const page = Math.max(0, parseInt(req.query.page) || 0);
    const pageSize = Math.min(Math.max(1, parseInt(req.query.pageSize) || 10), 50);
    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    let rooms = await redisClient.listRooms();
    const totalCount = rooms.length;

    // 정렬 (createdAt 필드가 없으면 id 기준)
    rooms = rooms.sort((a, b) => {
      if (sortField === 'createdAt') {
        return sortOrder === 'asc'
          ? new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
          : new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      } else if (sortField === 'name') {
        return sortOrder === 'asc'
          ? (a.name || '').localeCompare(b.name || '')
          : (b.name || '').localeCompare(a.name || '');
      } else {
        return 0;
      }
    });

    // 페이지네이션
    const start = page * pageSize;
    const end = start + pageSize;
    const pagedRooms = rooms.slice(start, end);
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasMore = end < totalCount;

    res.json({
      success: true,
      data: pagedRooms,
      metadata: {
        total: totalCount,
        page,
        pageSize,
        totalPages,
        hasMore,
        currentCount: pagedRooms.length,
        sort: { field: sortField, order: sortOrder }
      }
    });
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