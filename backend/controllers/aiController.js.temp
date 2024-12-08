const AIProfile = require('../models/AIProfile');

exports.setAIProfile = async (req, res) => {
  const { personality } = req.body;
  const userId = req.user.id;

  const aiProfile = await AIProfile.findOneAndUpdate(
    { user: userId },
    { personality },
    { upsert: true, new: true }
  );

  res.json({ msg: 'AI 프로필이 업데이트되었습니다.', aiProfile });
};

exports.getAIProfile = async (req, res) => {
  const userId = req.user.id;

  const aiProfile = await AIProfile.findOne({ user: userId });

  res.json({ aiProfile });
};