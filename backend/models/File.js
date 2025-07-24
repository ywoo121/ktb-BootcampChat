const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  filename: { 
    type: String, 
    required: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^[0-9]+_[a-f0-9]+\.[a-z0-9]+$/.test(v);
      },
      message: '올바르지 않은 파일명 형식입니다.'
    }
  },
  originalname: { 
    type: String,
    required: true,
    set: function(name) {
      try {
        if (!name) return '';
        
        // 파일명에서 경로 구분자 제거
        const sanitizedName = name.replace(/[\/\\]/g, '');
        
        // 유니코드 정규화 (NFC)
        return sanitizedName.normalize('NFC');
      } catch (error) {
        console.error('Filename sanitization error:', error);
        return name;
      }
    },
    get: function(name) {
      try {
        if (!name) return '';
        
        // 유니코드 정규화된 형태로 반환
        return name.normalize('NFC');
      } catch (error) {
        console.error('Filename retrieval error:', error);
        return name;
      }
    }
  },
  mimetype: { 
    type: String,
    required: true
  },
  size: { 
    type: Number,
    required: true,
    min: 0
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  path: { 
    type: String,
    required: true
  },
  uploadDate: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// 🚀 MongoDB 인덱스 최적화
// 파일 고유성 보장 인덱스
FileSchema.index({ filename: 1 }, { unique: true }); // 파일명 고유성
FileSchema.index({ filename: 1, user: 1 }); // 사용자별 파일명

// 사용자별 파일 조회 인덱스
FileSchema.index({ user: 1, uploadDate: -1 }); // 사용자별 최신 파일부터
FileSchema.index({ user: 1, mimetype: 1 }); // 사용자별 파일 타입
FileSchema.index({ user: 1, size: -1 }); // 사용자별 파일 크기순

// 파일 검색 최적화 인덱스
FileSchema.index({ originalname: 'text' }); // 원본 파일명 텍스트 검색
FileSchema.index({ 
  user: 1, 
  originalname: 'text' 
}, { 
  background: true,
  name: 'user_file_search_idx'
}); // 사용자별 파일 검색

// 파일 타입별 조회 인덱스
FileSchema.index({ mimetype: 1, uploadDate: -1 }); // 타입별 최신 파일
FileSchema.index({ 
  mimetype: 1, 
  size: -1 
}, { 
  background: true,
  name: 'file_type_size_idx'
}); // 타입별 크기순

// 성능 최적화 인덱스
FileSchema.index({ 
  uploadDate: -1 
}, { 
  name: 'recent_files_idx'
}); // 전체 최신 파일

FileSchema.index({
  user: 1,
  createdAt: -1
}, {
  background: true,
  name: 'user_files_idx'
}); // 사용자별 파일 생성일순

// 파일 크기별 조회 인덱스 (관리용)
FileSchema.index({ 
  size: -1, 
  uploadDate: -1 
}, { 
  background: true,
  name: 'large_files_idx'
}); // 큰 파일부터

// 이미지 파일 전용 인덱스
FileSchema.index({
  mimetype: 1,
  uploadDate: -1
}, {
  partialFilterExpression: { 
    mimetype: { $regex: '^image/' } 
  },
  name: 'image_files_idx'
}); // 이미지 파일만

// 동영상 파일 전용 인덱스
FileSchema.index({
  mimetype: 1,
  size: -1
}, {
  partialFilterExpression: { 
    mimetype: { $regex: '^video/' } 
  },
  name: 'video_files_idx'
}); // 동영상 파일만

// 파일 삭제 전 처리
FileSchema.pre('remove', async function(next) {
  try {
    const fs = require('fs').promises;
    if (this.path) {
      await fs.unlink(this.path);
    }
    next();
  } catch (error) {
    console.error('File removal error:', error);
    next(error);
  }
});

// URL 안전한 파일명 생성을 위한 유틸리티 메서드
FileSchema.methods.getSafeFilename = function() {
  return this.filename;
};

// Content-Disposition 헤더를 위한 파일명 인코딩 메서드
FileSchema.methods.getEncodedFilename = function() {
  try {
    const filename = this.originalname;
    if (!filename) return '';

    // RFC 5987에 따른 인코딩
    const encodedFilename = encodeURIComponent(filename)
      .replace(/'/g, "%27")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
      .replace(/\*/g, "%2A");

    return {
      legacy: filename.replace(/[^\x20-\x7E]/g, ''), // ASCII only for legacy clients
      encoded: `UTF-8''${encodedFilename}` // RFC 5987 format
    };
  } catch (error) {
    console.error('Filename encoding error:', error);
    return {
      legacy: this.filename,
      encoded: this.filename
    };
  }
};

// 파일 URL 생성을 위한 유틸리티 메서드
FileSchema.methods.getFileUrl = function(type = 'download') {
  return `/api/files/${type}/${encodeURIComponent(this.filename)}`;
};

// 다운로드용 Content-Disposition 헤더 생성 메서드
FileSchema.methods.getContentDisposition = function(type = 'attachment') {
  const { legacy, encoded } = this.getEncodedFilename();
  return `${type}; filename="${legacy}"; filename*=${encoded}`;
};

// 파일 MIME 타입 검증 메서드
FileSchema.methods.isPreviewable = function() {
  const previewableTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav',
    'application/pdf'
  ];
  return previewableTypes.includes(this.mimetype);
};

module.exports = mongoose.model('File', FileSchema);