require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const {router: roomsRouter, initializeSocket} = require('./routes/api/rooms');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

// trust proxy 설정 추가
app.set("trust proxy", 1);

// CORS 설정
const corsOptions = {
  origin: [
    'https://bootcampchat-fe.run.goorm.site',
    'https://bootcampchat-hgxbv.dev-k8s.arkain.io',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://localhost:3000',
    'https://localhost:3001',
    'https://localhost:3002',
    'http://43.202.159.206:3000',
    'http://0.0.0.0:3000',
    'https://0.0.0.0:3000',
    'https://chat.goorm-ktb-006.goorm.team',
    'http://chat.goorm-ktb-006.goorm.team',
    'https://api.chat.goorm-ktb-006.goorm.team',
    'http://api.chat.goorm-ktb-006.goorm.team'
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-auth-token',
    'x-session-id',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ["x-auth-token", "x-session-id"],
};

// 기본 미들웨어
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// OPTIONS 요청에 대한 처리
app.options("*", cors(corsOptions));

// 정적 파일 제공
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 요청 로깅
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
    );
    next();
  });
}

// 기본 상태 체크
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// API 라우트 마운트
console.log('Mounting API routes...');
app.use('/api', routes);
console.log('API routes mounted successfully');

// Socket.IO 설정
const io = socketIo(server, { cors: corsOptions });
require('./sockets/chat')(io);
require("./sockets/whiteboard")(io); // 화이트보드 소켓 추가

// Socket.IO 객체 전달
initializeSocket(io);

// 404 에러 핸들러
app.use((req, res) => {
  console.log("404 Error:", req.originalUrl);
  res.status(404).json({
    success: false,
    message: "요청하신 리소스를 찾을 수 없습니다.",
    path: req.originalUrl,
  });
});

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '서버 에러가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
  });
});

// 서버 시작
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB Connected');
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('API Base URL:', `http://0.0.0.0:${PORT}/api`);
  });
})
.catch(err => {
  console.error('Server startup error:', err);
  process.exit(1);
});

module.exports = {app, server};