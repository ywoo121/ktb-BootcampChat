const mongoose = require('mongoose');

const WhiteboardSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// 인덱스 추가
WhiteboardSchema.index({ room: 1 });
WhiteboardSchema.index({ lastModified: -1 });

module.exports = mongoose.model('Whiteboard', WhiteboardSchema);