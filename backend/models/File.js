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
        const sanitizedName = name.replace(/[\/\\]/g, '');
        return sanitizedName.normalize('NFC');
      } catch (error) {
        console.error('Filename sanitization error:', error);
        return name;
      }
    },
    get: function(name) {
      try {
        if (!name) return '';
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
  // S3 관련 필드들
  s3Key: {
    type: String,
    required: true,
    index: true
  },
  s3Bucket: {
    type: String,
    required: true,
    default: process.env.AWS_S3_BUCKET
  },
  s3Url: {
    type: String,
    required: true
  },
  // 로컬 path는 제거하거나 optional로 변경
  path: {
    type: String,
    required: false // S3 사용시 필요없음
  },
  uploadDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  // 추가 S3 메타데이터
  etag: {
    type: String
  },
  contentEncoding: {
    type: String
  },
  cacheControl: {
    type: String,
    default: 'max-age=31536000' // 1년
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// 기존 인덱스들 유지
FileSchema.index({ filename: 1 }, { unique: true });
FileSchema.index({ filename: 1, user: 1 });
FileSchema.index({ user: 1, uploadDate: -1 });
FileSchema.index({ user: 1, mimetype: 1 });
FileSchema.index({ user: 1, size: -1 });
FileSchema.index({ originalname: 'text' });

// S3 관련 인덱스 추가
FileSchema.index({ s3Key: 1 }, { unique: true });
FileSchema.index({ s3Bucket: 1, s3Key: 1 });

// 파일 삭제 전 S3에서도 삭제
FileSchema.pre('remove', async function(next) {
  try {
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3();

    // S3에서 파일 삭제
    if (this.s3Key && this.s3Bucket) {
      await s3.deleteObject({
        Bucket: this.s3Bucket,
        Key: this.s3Key
      }).promise();
    }

    // 로컬 파일도 있다면 삭제
    if (this.path) {
      const fs = require('fs').promises;
      await fs.unlink(this.path);
    }

    next();
  } catch (error) {
    console.error('File removal error:', error);
    next(error);
  }
});

// S3 URL 생성 메서드
FileSchema.methods.getS3Url = function(expires = 3600) {
  const AWS = require('aws-sdk');
  const s3 = new AWS.S3();

  return s3.getSignedUrl('getObject', {
    Bucket: this.s3Bucket,
    Key: this.s3Key,
    Expires: expires
  });
};

// 다운로드용 S3 URL
FileSchema.methods.getDownloadUrl = function(expires = 3600) {
  const AWS = require('aws-sdk');
  const s3 = new AWS.S3();

  const { legacy, encoded } = this.getEncodedFilename();

  return s3.getSignedUrl('getObject', {
    Bucket: this.s3Bucket,
    Key: this.s3Key,
    Expires: expires,
    ResponseContentDisposition: `attachment; filename="${legacy}"; filename*=${encoded}`
  });
};

// 기존 메서드들 유지
FileSchema.methods.getSafeFilename = function() {
  return this.filename;
};

FileSchema.methods.getEncodedFilename = function() {
  try {
    const filename = this.originalname;
    if (!filename) return '';

    const encodedFilename = encodeURIComponent(filename)
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");

    return {
      legacy: filename.replace(/[^\x20-\x7E]/g, ''),
      encoded: `UTF-8''${encodedFilename}`
    };
  } catch (error) {
    console.error('Filename encoding error:', error);
    return {
      legacy: this.filename,
      encoded: this.filename
    };
  }
};

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