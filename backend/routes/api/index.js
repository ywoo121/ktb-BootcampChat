const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const roomRoutes = require('./rooms');
const fileRoutes = require('./files');
const sttRoutes = require('./stt');
const whiteboardRoutes = require('./whiteboard');

// API documentation route
router.get('/', (req, res) => {
  res.json({
    name: 'Chat App API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        base: '/auth',
        routes: {
          register: { method: 'POST', path: '/register' },
          login: { method: 'POST', path: '/login' },
          logout: { method: 'POST', path: '/logout' },
          verifyToken: { method: 'GET', path: '/verify-token' },
          refreshToken: { method: 'POST', path: '/refresh-token' }
        }
      },
      users: '/users',
      rooms: '/rooms',
      files: '/files',
      stt: {
        base: '/stt',
        routes: {
          transcribe: { method: 'POST', path: '/transcribe' },
          supportedFormats: { method: 'GET', path: '/supported-formats' }
        }
      },
      whiteboard: {
        base: '/whiteboard',
        routes: {
          get: { method: 'GET', path: '/:roomId' },
          update: { method: 'PUT', path: '/:roomId' },
          clear: { method: 'DELETE', path: '/:roomId' }
        }
      }
    }
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rooms', roomRoutes);
router.use('/files', fileRoutes);
router.use('/stt', sttRoutes);
router.use('/whiteboard', whiteboardRoutes);

// 라우트 확인을 위한 로깅
console.log('API 라우트가 등록되었습니다:');
console.log('- /api/auth');
console.log('- /api/users');
console.log('- /api/rooms');
console.log('- /api/files');
console.log('- /api/stt');
console.log('- /api/whiteboard');

module.exports = router;
