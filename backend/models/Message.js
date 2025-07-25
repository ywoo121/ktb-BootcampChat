const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  room: { 
    type: String, 
    required: [true, '채팅방 ID는 필수입니다.'],
    index: true
  },
  content: { 
    type: String,
    required: function() {
      return this.type !== 'file';
    },
    trim: true,
    maxlength: [10000, '메시지는 10000자를 초과할 수 없습니다.']
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true 
  },
  type: { 
    type: String, 
    enum: ['text', 'system', 'ai', 'file'], 
    default: 'text',
    index: true
  },
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: function() {
      return this.type === 'file';
    }
  },
  aiType: {
    type: String,
    enum: ['wayneAI', 'consultingAI', 'summaryAI', 'kocoAI'], 
    required: function() { 
      return this.type === 'ai'; 
    }
  },
  mentions: [{ 
    type: String,
    trim: true
  }],
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  readers: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: { 
      type: Date,
      default: Date.now,
      required: true
    }
  }],
  reactions: {
    type: Map,
    of: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: new Map()
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    getters: true 
  },
  toObject: { 
    virtuals: true,
    getters: true 
  }
});

// 🚀 MongoDB 인덱스 최적화
// 메시지 조회 최적화 인덱스
MessageSchema.index({ room: 1, timestamp: -1 }); // 채팅방별 시간순 조회
MessageSchema.index({ room: 1, isDeleted: 1, timestamp: -1 }); // 삭제되지 않은 메시지 조회
MessageSchema.index({ room: 1, type: 1, timestamp: -1 }); // 타입별 메시지 조회

// 사용자별 메시지 조회 인덱스
MessageSchema.index({ sender: 1, timestamp: -1 }); // 사용자가 보낸 메시지
MessageSchema.index({ sender: 1, room: 1 }); // 특정 채팅방에서 사용자 메시지
MessageSchema.index({ 'readers.userId': 1 }); // 읽음 상태 조회

// 검색 최적화 인덱스
MessageSchema.index({ content: 'text' }); // 메시지 내용 텍스트 검색
MessageSchema.index({ 
  room: 1, 
  content: 'text' 
}, { 
  background: true,
  name: 'message_search_idx'
}); // 채팅방별 메시지 검색

// 파일 메시지 조회 인덱스
MessageSchema.index({ room: 1, file: 1 }); // 채팅방별 파일 메시지
MessageSchema.index({ file: 1 }, { sparse: true }); // 파일별 메시지

// 성능 최적화 인덱스
MessageSchema.index({ 
  timestamp: -1 
}, { 
  partialFilterExpression: { isDeleted: false },
  name: 'active_messages_idx'
}); // 삭제되지 않은 메시지만

MessageSchema.index({
  room: 1,
  createdAt: -1
}, {
  background: true,
  name: 'room_messages_idx'
}); // 채팅방별 최신 메시지

// AI 메시지 조회 인덱스
MessageSchema.index({ 
  type: 1, 
  aiType: 1, 
  timestamp: -1 
}, { 
  sparse: true,
  name: 'ai_messages_idx'
}); // AI 메시지 타입별 조회

// 읽음 상태 최적화 인덱스
MessageSchema.index({
  room: 1,
  'readers.userId': 1,
  timestamp: -1
}, {
  background: true,
  name: 'message_read_status_idx'
});

// 기존 인덱스들도 유지
MessageSchema.index({ room: 1, isDeleted: 1 });
MessageSchema.index({ type: 1 });
MessageSchema.index({ 'reactions.userId': 1 }); // 리액션 관련 인덱스

// 읽음 처리
MessageSchema.statics.markAsRead = async function(messageIds, userId) {
  if (!messageIds?.length || !userId) return;

  const bulkOps = messageIds.map(messageId => ({
    updateOne: {
      filter: {
        _id: messageId,
        isDeleted: false,
        'readers.userId': { $ne: userId }
      },
      update: {
        $push: {
          readers: {
            userId: new mongoose.Types.ObjectId(userId),
            readAt: new Date()
          }
        }
      }
    }
  }));

  try {
    const result = await this.bulkWrite(bulkOps, { ordered: false });
    return result.modifiedCount;
  } catch (error) {
    console.error('Mark as read error:', {
      error,
      messageIds,
      userId
    });
    throw error;
  }
};

// 리액션
MessageSchema.methods.addReaction = async function(emoji, userId) {
  try {
    if (!this.reactions) {
      this.reactions = new Map();
    }

    const userReactions = this.reactions.get(emoji) || [];
    if (!userReactions.includes(userId)) {
      userReactions.push(userId);
      this.reactions.set(emoji, userReactions);
      await this.save();
    }
    
    return this.reactions.get(emoji);
  } catch (error) {
    console.error('Add reaction error:', {
      error,
      messageId: this.id,
      emoji,
      userId
    });
    throw error;
  }
};

MessageSchema.methods.removeReaction = async function(emoji, userId) {
  try {
    if (!this.reactions || !this.reactions.has(emoji)) return;

    const userReactions = this.reactions.get(emoji) || [];
    const updatedReactions = userReactions.filter(id => 
      id.toString() !== userId.toString()
    );
    
    if (updatedReactions.length === 0) {
      this.reactions.delete(emoji);
    } else {
      this.reactions.set(emoji, updatedReactions);
    }
    
    await this.save();
    return this.reactions.get(emoji);
  } catch (error) {
    console.error('Remove reaction error:', {
      error,
      messageId: this.id,
      emoji,
      userId
    });
    throw error;
  }
};

// soft delete
MessageSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  await this.save();
};

// 파일 삭제 후크
MessageSchema.pre('remove', async function(next) {
  try {
    if (this.type === 'file' && this.file) {
      const File = mongoose.model('File');
      await File.findByIdAndDelete(this.file);
    }
    next();
  } catch (error) {
    console.error('Message pre-remove error:', {
      error,
      messageId: this.id,
      type: this.type
    });
    next(error);
  }
});

// 저장 전 처리
MessageSchema.pre('save', function(next) {
  try {
    if (this.content && this.type !== 'file') {
      this.content = this.content.trim();
    }

    if (this.mentions?.length) {
      this.mentions = [...new Set(this.mentions)];
    }

    next();
  } catch (error) {
    console.error('Message pre-save error:', {
      error,
      messageId: this.id
    });
    next(error);
  }
});

// toJSON 개선
MessageSchema.methods.toJSON = function() {
  try {
    const obj = this.toObject();
    delete obj.__v;
    delete obj.updatedAt;
    delete obj.isDeleted;

    if (obj.reactions) {
      obj.reactions = Object.fromEntries(obj.reactions);
    }

    return obj;
  } catch (error) {
    console.error('Message toJSON error:', {
      error,
      messageId: this.id
    });
    return {};
  }
};

const Message = mongoose.model('Message', MessageSchema);
module.exports = Message;