const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hasPassword: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    select: false
  },
  // 익명 채팅방 여부
  isAnonymous: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// 비밀번호 해싱 미들웨어
RoomSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.hasPassword = true;
  }
  if (!this.password) {
    this.hasPassword = false;
  }
  next();
});

// 비밀번호 확인 메서드
RoomSchema.methods.checkPassword = async function(password) {
  if (!this.hasPassword) return true;
  const room = await this.constructor.findById(this._id).select('+password');
  return await bcrypt.compare(password, room.password);
};

// 기본 인덱스
RoomSchema.index({ createdAt: -1 });
RoomSchema.index({ creator: 1 });
RoomSchema.index({ participants: 1 });

// 검색 및 필터링 인덱스
RoomSchema.index({ name: 'text' });
RoomSchema.index({ name: 1, createdAt: -1 }, { background: true });
RoomSchema.index({ hasPassword: 1, createdAt: -1 }, { background: true });

module.exports = mongoose.model('Room', RoomSchema);