const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/keys');
const SessionService = require('../services/sessionService');
const redisClient = require('../utils/redisClient');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const authController = {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
      }
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ success: false, message: '올바른 이메일 형식이 아닙니다.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: '비밀번호는 6자 이상이어야 합니다.' });
      }
      // Check existing user
      const existingUser = await redisClient.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ success: false, message: '이미 등록된 이메일입니다.' });
      }
      // Create user
      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { id: userId, name, email, password: hashedPassword, profileImage: '' };
      await redisClient.createUser(user);
      // Create session
      const sessionInfo = await SessionService.createSession(userId, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent'],
        createdAt: Date.now()
      });
      if (!sessionInfo || !sessionInfo.sessionId) {
        throw new Error('Session creation failed');
      }
      // Generate token
      const token = jwt.sign(
        { user: { id: userId }, sessionId: sessionInfo.sessionId, iat: Math.floor(Date.now() / 1000) },
        jwtSecret,
        { expiresIn: '24h', algorithm: 'HS256' }
      );
      res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다.',
        token,
        sessionId: sessionInfo.sessionId,
        user: { id: userId, name, email, profileImage: '' }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: '회원가입 처리 중 오류가 발생했습니다.' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' });
      }
      // 사용자 조회
      const user = await redisClient.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
      // 비밀번호 확인
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
      // 새 세션 생성
      const sessionInfo = await SessionService.createSession(user.id, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent'],
        loginAt: Date.now(),
        browser: req.headers['user-agent'],
        platform: req.headers['sec-ch-ua-platform'],
        location: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
      });
      if (!sessionInfo || !sessionInfo.sessionId) {
        throw new Error('Session creation failed');
      }
      // JWT 토큰 생성
      const token = jwt.sign(
        { user: { id: user.id }, sessionId: sessionInfo.sessionId, iat: Math.floor(Date.now() / 1000) },
        jwtSecret,
        { expiresIn: '24h', algorithm: 'HS256' }
      );
      res.set({ 'Authorization': `Bearer ${token}`, 'x-session-id': sessionInfo.sessionId });
      res.json({
        success: true,
        token,
        sessionId: sessionInfo.sessionId,
        user: { id: user.id, name: user.name, email: user.email, profileImage: user.profileImage }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: '로그인 처리 중 오류가 발생했습니다.', code: error.code || 'UNKNOWN_ERROR' });
    }
  },

  async logout(req, res) {
    try {
      const sessionId = req.header('x-session-id');
      if (!sessionId) {
        return res.status(400).json({ success: false, message: '세션 정보가 없습니다.' });
      }
      await SessionService.removeSession(req.user.id, sessionId);
      res.clearCookie('token');
      res.clearCookie('sessionId');
      res.json({ success: true, message: '로그아웃되었습니다.' });
    } catch (error) {
      res.status(500).json({ success: false, message: '로그아웃 처리 중 오류가 발생했습니다.' });
    }
  },

  async verifyToken(req, res) {
    try {
      const token = req.header('x-auth-token');
      const sessionId = req.header('x-session-id');
      if (!token || !sessionId) {
        return res.status(401).json({ success: false, message: '인증 정보가 제공되지 않았습니다.' });
      }
      // JWT 토큰 검증
      const decoded = jwt.verify(token, jwtSecret);
      if (!decoded?.user?.id || !decoded?.sessionId) {
        return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
      }
      if (decoded.sessionId !== sessionId) {
        return res.status(401).json({ success: false, message: '세션 정보가 일치하지 않습니다.' });
      }
      // 사용자 정보 조회
      const user = await redisClient.getUserById(decoded.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }
      // 세션 검증
      const validationResult = await SessionService.validateSession(user.id, sessionId);
      if (!validationResult.isValid) {
        return res.status(401).json({ success: false, code: validationResult.error, message: validationResult.message });
      }
      await SessionService.refreshSession(user.id, sessionId);
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, profileImage: user.profileImage } });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: '토큰이 만료되었습니다.', code: 'TOKEN_EXPIRED' });
      }
      res.status(500).json({ success: false, message: '토큰 검증 중 오류가 발생했습니다.' });
    }
  },

  async refreshToken(req, res) {
    try {
      const oldSessionId = req.header('x-session-id');
      if (!oldSessionId) {
        return res.status(400).json({ success: false, message: '세션 정보가 없습니다.' });
      }
      const user = await redisClient.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }
      await SessionService.removeSession(user.id, oldSessionId);
      const sessionInfo = await SessionService.createSession(user.id, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent'],
        refreshedAt: Date.now()
      });
      if (!sessionInfo || !sessionInfo.sessionId) {
        throw new Error('Failed to create new session');
      }
      const token = jwt.sign(
        { user: { id: user.id }, sessionId: sessionInfo.sessionId, iat: Math.floor(Date.now() / 1000) },
        jwtSecret,
        { expiresIn: '24h', algorithm: 'HS256' }
      );
      res.json({
        success: true,
        message: '토큰이 갱신되었습니다.',
        token,
        sessionId: sessionInfo.sessionId,
        user: { id: user.id, name: user.name, email: user.email, profileImage: user.profileImage }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: '토큰 갱신 중 오류가 발생했습니다.' });
    }
  }
};

module.exports = authController;