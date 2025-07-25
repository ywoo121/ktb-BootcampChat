const mongoose = require("mongoose");

// 개별 드로잉 포인트 스키마
const DrawingPointSchema = new mongoose.Schema({
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["start", "draw", "end"],
    required: true,
  },
  color: {
    type: String,
    default: "#000000",
  },
  size: {
    type: Number,
    default: 3,
    min: 1,
    max: 50,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// 드로잉 패스(선) 스키마
const DrawingPathSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    whiteboard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Whiteboard",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    points: [DrawingPointSchema],
    color: {
      type: String,
      default: "#000000",
    },
    size: {
      type: Number,
      default: 3,
      min: 1,
      max: 50,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    isComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// 복합 인덱스
DrawingPathSchema.index({ whiteboard: 1, startTime: 1 });
DrawingPathSchema.index({ whiteboard: 1, user: 1 });

// 화이트보드별 드로잉 통계 메서드
DrawingPathSchema.statics.getWhiteboardStats = async function (whiteboardId) {
  const stats = await this.aggregate([
    { $match: { whiteboard: new mongoose.Types.ObjectId(whiteboardId) } },
    {
      $group: {
        _id: "$whiteboard",
        totalPaths: { $sum: 1 },
        totalPoints: { $sum: { $size: "$points" } },
        contributors: { $addToSet: "$user" },
        lastActivity: { $max: "$updatedAt" },
        firstActivity: { $min: "$createdAt" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalPaths: 0,
      totalPoints: 0,
      contributors: [],
      lastActivity: null,
      firstActivity: null,
    }
  );
};

// 화이트보드 드로잉 데이터 조회 메서드
DrawingPathSchema.statics.getWhiteboardDrawings = async function (
  whiteboardId,
  options = {}
) {
  const {
    limit = 1000,
    skip = 0,
    sortBy = "startTime",
    sortOrder = 1,
    userId = null,
    fromDate = null,
    toDate = null,
  } = options;

  const query = { whiteboard: whiteboardId, isComplete: true };

  if (userId) {
    query.user = userId;
  }

  if (fromDate || toDate) {
    query.startTime = {};
    if (fromDate) query.startTime.$gte = new Date(fromDate);
    if (toDate) query.startTime.$lte = new Date(toDate);
  }

  return await this.find(query)
    .populate("user", "name email")
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean();
};

// 화이트보드 클리어 시 모든 드로잉 삭제
DrawingPathSchema.statics.clearWhiteboardDrawings = async function (
  whiteboardId,
  clearedBy
) {
  const result = await this.deleteMany({ whiteboard: whiteboardId });

  // 클리어 기록 저장 (선택적)
  const ClearHistory = mongoose.model("WhiteboardClearHistory");
  await ClearHistory.create({
    whiteboard: whiteboardId,
    clearedBy: clearedBy,
    deletedCount: result.deletedCount,
    clearedAt: new Date(),
  });

  return result;
};

module.exports = mongoose.model("WhiteboardDrawing", DrawingPathSchema);

// 화이트보드 클리어 기록 스키마
const ClearHistorySchema = new mongoose.Schema(
  {
    whiteboard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Whiteboard",
      required: true,
    },
    clearedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deletedCount: {
      type: Number,
      required: true,
    },
    clearedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ClearHistorySchema.index({ whiteboard: 1, clearedAt: -1 });

const WhiteboardClearHistory = mongoose.model(
  "WhiteboardClearHistory",
  ClearHistorySchema
);

module.exports.WhiteboardClearHistory = WhiteboardClearHistory;
