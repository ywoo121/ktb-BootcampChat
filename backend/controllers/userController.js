const bcrypt = require('bcryptjs');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redisClient');

// 회원가입
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 입력값 검증
    const validationErrors = [];
    if (!name || name.trim().length === 0) {
      validationErrors.push({ field: 'name', message: '이름을 입력해주세요.' });
    } else if (name.length < 2) {
      validationErrors.push({ field: 'name', message: '이름은 2자 이상이어야 합니다.' });
    }
    if (!email) {
      validationErrors.push({ field: 'email', message: '이메일을 입력해주세요.' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push({ field: 'email', message: '올바른 이메일 형식이 아닙니다.' });
    }
    if (!password) {
      validationErrors.push({ field: 'password', message: '비밀번호를 입력해주세요.' });
    } else if (password.length < 6) {
      validationErrors.push({ field: 'password', message: '비밀번호는 6자 이상이어야 합니다.' });
    }
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, errors: validationErrors });
    }

    // Redis에서 이메일 중복 확인
    const existing = await redisClient.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: '이미 가입된 이메일입니다.' });
    }
    const userId = uuidv4();
    const user = { id: userId, name, email, password: await bcrypt.hash(password, 10), profileImage: '' };
    await redisClient.createUser(user);
    res.status(201).json({ success: true, user: { id: userId, name, email, profileImage: '' } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: '회원가입 처리 중 오류가 발생했습니다.' });
  }
};

// 프로필 조회
exports.getProfile = async (req, res) => {
  try {
    const user = await redisClient.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, profileImage: user.profileImage } });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: '프로필 조회 중 오류가 발생했습니다.' });
  }
};

// 프로필 업데이트
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: '이름을 입력해주세요.' });
    }
    const user = await redisClient.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    user.name = name.trim();
    await redisClient.createUser(user); // 덮어쓰기
    res.json({ success: true, message: '프로필이 업데이트되었습니다.', user: { id: user.id, name: user.name, email: user.email, profileImage: user.profileImage } });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: '프로필 업데이트 중 오류가 발생했습니다.' });
  }
};

// 프로필 이미지 업로드 (로컬 파일만, S3로 바꾸려면 별도 구현 필요)
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '이미지가 제공되지 않았습니다.' });
    }
    const fileSize = req.file.size;
    const fileType = req.file.mimetype;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileSize > maxSize) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ success: false, message: '파일 크기는 5MB를 초과할 수 없습니다.' });
    }
    if (!fileType.startsWith('image/')) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ success: false, message: '이미지 파일만 업로드할 수 있습니다.' });
    }
    const user = await redisClient.getUserById(req.user.id);
    if (!user) {
      await fs.unlink(req.file.path);
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    user.profileImage = imageUrl;
    await redisClient.createUser(user);
    res.json({ success: true, message: '프로필 이미지가 업데이트되었습니다.', imageUrl });
  } catch (error) {
    console.error('Profile image upload error:', error);
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch (unlinkError) { console.error('File delete error:', unlinkError); }
    }
    res.status(500).json({ success: false, message: '이미지 업로드 중 오류가 발생했습니다.' });
  }
};

// 프로필 이미지 삭제
exports.deleteProfileImage = async (req, res) => {
  try {
    const user = await redisClient.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    user.profileImage = '';
    await redisClient.createUser(user);
    res.json({ success: true, message: '프로필 이미지가 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete profile image error:', error);
    res.status(500).json({ success: false, message: '프로필 이미지 삭제 중 오류가 발생했습니다.' });
  }
};

// 회원 탈퇴
exports.deleteAccount = async (req, res) => {
  try {
    const user = await redisClient.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    await redisClient.del(`user:${user.id}`);
    await redisClient.del(`email:${user.email}`);
    res.json({ success: true, message: '회원 탈퇴가 완료되었습니다.' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: '회원 탈퇴 처리 중 오류가 발생했습니다.' });
  }
};

module.exports = exports;