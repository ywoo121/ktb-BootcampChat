const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/keys');
const redisClient = require('../utils/redisClient');
const { v4: uuidv4 } = require('uuid');

module.exports = function(io) {
  const connectedUsers = new Map();
  const userRooms = new Map();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, jwtSecret);
      if (!decoded?.user?.id) return next(new Error('Invalid token'));
      const user = await redisClient.getUserById(decoded.user.id);
      if (!user) return next(new Error('User not found'));
      socket.user = { id: user.id, name: user.name, email: user.email };
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.user) {
      connectedUsers.set(socket.user.id, socket.id);
    }

    socket.on('joinRoom', async (roomId) => {
      const room = await redisClient.getRoom(roomId);
      if (!room) return socket.emit('joinRoomError', { message: '방을 찾을 수 없습니다.' });
      if (!room.participants.includes(socket.user.id)) {
        room.participants.push(socket.user.id);
        await redisClient.createRoom(room);
      }
      socket.join(roomId);
      userRooms.set(socket.user.id, roomId);
      socket.emit('joinRoomSuccess', { roomId });
    });

    socket.on('chatMessage', async (data) => {
      try {
        if (!socket.user) throw new Error('Unauthorized');
        if (!data || !data.room || !data.content) throw new Error('메시지 데이터가 없습니다.');
        const room = await redisClient.getRoom(data.room);
        if (!room || !room.participants.includes(socket.user.id)) throw new Error('채팅방 접근 권한이 없습니다.');
        const message = { id: uuidv4(), userId: socket.user.id, content: data.content, timestamp: Date.now() };
        await redisClient.addMessage(data.room, message);
        io.to(data.room).emit('message', message);
      } catch (error) {
        socket.emit('error', { code: 'MESSAGE_ERROR', message: error.message });
      }
    });

    socket.on('fetchMessages', async (roomId) => {
      const messages = await redisClient.getMessages(roomId, 0, -1);
      socket.emit('messages', messages);
    });

    socket.on('disconnect', () => {
      if (socket.user) {
        connectedUsers.delete(socket.user.id);
        userRooms.delete(socket.user.id);
      }
    });
  });

  return io;
};