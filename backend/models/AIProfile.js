const mongoose = require('mongoose');

const AIProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  personality: { type: String, default: '친절하고 도움이 되는 어시스턴트' },
});

module.exports = mongoose.model('AIProfile', AIProfileSchema);