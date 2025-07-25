const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");

// MongoDB 모델들
let Whiteboard = null;
let WhiteboardDrawing = null;
let useDatabase = false;

try {
  Whiteboard = require("../../models/Whiteboard");
  WhiteboardDrawing = require("../../models/WhiteboardDrawing");
  useDatabase = true;
} catch (error) {
  useDatabase = false;
}

// 임시 메모리 저장소
let tempWhiteboards = [];

// 화이트보드 목록 조회
router.get("/", auth, async (req, res) => {
  try {
    const page = Math.max(0, parseInt(req.query.page) || 0);
    const pageSize = Math.min(
      Math.max(1, parseInt(req.query.pageSize) || 10),
      50
    );
    const skip = page * pageSize;

    if (useDatabase) {
      const totalCount = await Whiteboard.countDocuments();
      const whiteboards = await Whiteboard.find()
        .populate("creator", "name email")
        .populate("participants", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean();

      // 각 화이트보드의 드로잉 통계 추가
      const whiteboardsWithStats = await Promise.all(
        whiteboards.map(async (wb) => {
          const stats = await WhiteboardDrawing.getWhiteboardStats(wb._id);
          return {
            _id: wb._id,
            name: wb.name,
            hasPassword: !!wb.hasPassword,
            creator: {
              _id: wb.creator._id,
              name: wb.creator.name,
              email: wb.creator.email,
            },
            participants: wb.participants.map((p) => ({
              _id: p._id,
              name: p.name,
              email: p.email,
            })),
            participantsCount: wb.participants.length,
            createdAt: wb.createdAt,
            isCreator: wb.creator._id.toString() === req.user.id,
            stats: {
              totalPaths: stats.totalPaths,
              totalPoints: stats.totalPoints,
              contributorsCount: stats.contributors.length,
              lastActivity: stats.lastActivity,
            },
          };
        })
      );

      const totalPages = Math.ceil(totalCount / pageSize);
      const hasMore = skip + whiteboards.length < totalCount;

      res.json({
        success: true,
        data: whiteboardsWithStats,
        metadata: {
          total: totalCount,
          page,
          pageSize,
          totalPages,
          hasMore,
          currentCount: whiteboardsWithStats.length,
        },
      });
    } else {
      // 메모리 저장소 사용
      res.json({
        success: true,
        data: tempWhiteboards,
        metadata: {
          total: tempWhiteboards.length,
          page,
          pageSize,
          totalPages: 1,
          hasMore: false,
          currentCount: tempWhiteboards.length,
        },
      });
    }
  } catch (error) {
    console.error("❌ Whiteboards fetch error:", error);
    res.status(500).json({
      success: false,
      message: "화이트보드 목록을 불러오는데 실패했습니다.",
    });
  }
});

// 화이트보드 생성
router.post("/", auth, async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "화이트보드 이름은 필수입니다.",
      });
    }

    if (useDatabase) {
      const newWhiteboard = new Whiteboard({
        name: name.trim(),
        creator: req.user.id,
        participants: [req.user.id],
        password: password,
      });

      const savedWhiteboard = await newWhiteboard.save();
      const populatedWhiteboard = await Whiteboard.findById(savedWhiteboard._id)
        .populate("creator", "name email")
        .populate("participants", "name email");

      res.status(201).json({
        success: true,
        data: {
          ...populatedWhiteboard.toObject(),
          password: undefined,
          stats: {
            totalPaths: 0,
            totalPoints: 0,
            contributorsCount: 0,
            lastActivity: null,
          },
        },
      });
    } else {
      const newWhiteboard = {
        _id: Date.now().toString(),
        name: name.trim(),
        hasPassword: !!password,
        password: password,
        creator: {
          _id: req.user.id,
          name: "현재사용자",
          email: "current@test.com",
        },
        participants: [
          {
            _id: req.user.id,
            name: "현재사용자",
            email: "current@test.com",
          },
        ],
        participantsCount: 1,
        createdAt: new Date().toISOString(),
        isCreator: true,
        stats: {
          totalPaths: 0,
          totalPoints: 0,
          contributorsCount: 0,
          lastActivity: null,
        },
      };

      tempWhiteboards.unshift(newWhiteboard);

      res.status(201).json({
        success: true,
        data: {
          ...newWhiteboard,
          password: undefined,
        },
      });
    }
  } catch (error) {
    console.error("❌ Whiteboard creation error:", error);
    res.status(500).json({
      success: false,
      message: "화이트보드 생성에 실패했습니다.",
    });
  }
});

// 화이트보드 입장
router.post("/:whiteboardId/join", auth, async (req, res) => {
  try {
    const { password } = req.body;

    if (useDatabase) {
      const whiteboard = await Whiteboard.findById(
        req.params.whiteboardId
      ).select("+password");

      if (!whiteboard) {
        return res.status(404).json({
          success: false,
          message: "화이트보드를 찾을 수 없습니다.",
        });
      }

      // 비밀번호 확인
      if (whiteboard.hasPassword) {
        const isPasswordValid = await whiteboard.checkPassword(password);
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: "비밀번호가 일치하지 않습니다.",
          });
        }
      }

      // 참여자 목록에 추가
      if (!whiteboard.participants.includes(req.user.id)) {
        whiteboard.participants.push(req.user.id);
        await whiteboard.save();
      }

      const populatedWhiteboard = await whiteboard.populate(
        "participants",
        "name email"
      );

      // 드로잉 통계 추가
      const stats = await WhiteboardDrawing.getWhiteboardStats(
        req.params.whiteboardId
      );

      res.json({
        success: true,
        data: {
          ...populatedWhiteboard.toObject(),
          password: undefined,
          stats,
        },
      });
    } else {
      const whiteboard = tempWhiteboards.find(
        (wb) => wb._id === req.params.whiteboardId
      );

      if (!whiteboard) {
        return res.status(404).json({
          success: false,
          message: `화이트보드를 찾을 수 없습니다. (ID: ${req.params.whiteboardId})`,
        });
      }

      // 비밀번호 확인
      if (whiteboard.hasPassword && whiteboard.password !== password) {
        return res.status(401).json({
          success: false,
          message: "비밀번호가 일치하지 않습니다.",
        });
      }

      // 참여자 목록에 추가
      const isAlreadyParticipant = whiteboard.participants.some(
        (p) => p._id === req.user.id
      );
      if (!isAlreadyParticipant) {
        whiteboard.participants.push({
          _id: req.user.id,
          name: "현재사용자",
          email: "current@test.com",
        });
        whiteboard.participantsCount = whiteboard.participants.length;
      }

      res.json({
        success: true,
        data: {
          ...whiteboard,
          password: undefined,
        },
      });
    }
  } catch (error) {
    console.error("❌ Whiteboard join error:", error);
    res.status(500).json({
      success: false,
      message: "화이트보드 입장에 실패했습니다.",
    });
  }
});

// 화이트보드 드로잉 조회 (새 엔드포인트)
router.get("/:whiteboardId/drawings", auth, async (req, res) => {
  try {
    if (!useDatabase) {
      return res.json({
        success: true,
        data: [],
        stats: { totalPaths: 0, totalPoints: 0 },
      });
    }

    const whiteboardId = req.params.whiteboardId;
    const { limit = 1000, skip = 0 } = req.query;

    // 화이트보드 접근 권한 확인
    const whiteboard = await Whiteboard.findOne({
      _id: whiteboardId,
      participants: req.user.id,
    });

    if (!whiteboard) {
      return res.status(403).json({
        success: false,
        message: "화이트보드에 접근할 권한이 없습니다.",
      });
    }

    const drawings = await WhiteboardDrawing.getWhiteboardDrawings(
      whiteboardId,
      {
        limit: parseInt(limit),
        skip: parseInt(skip),
        sortBy: "startTime",
        sortOrder: 1,
      }
    );

    const stats = await WhiteboardDrawing.getWhiteboardStats(whiteboardId);

    res.json({
      success: true,
      data: drawings,
      stats,
      metadata: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        total: stats.totalPaths,
      },
    });
  } catch (error) {
    console.error("❌ Drawings fetch error:", error);
    res.status(500).json({
      success: false,
      message: "드로잉 데이터를 불러오는데 실패했습니다.",
    });
  }
});

// 화이트보드 통계 조회 (새 엔드포인트)
router.get("/:whiteboardId/stats", auth, async (req, res) => {
  try {
    if (!useDatabase) {
      return res.json({
        success: true,
        data: {
          contributors: [],
          lastActivity: null,
        },
      });
    }

    const whiteboardId = req.params.whiteboardId;

    // 화이트보드 접근 권한 확인
    const whiteboard = await Whiteboard.findOne({
      _id: whiteboardId,
      participants: req.user.id,
    });

    if (!whiteboard) {
      return res.status(403).json({
        success: false,
        message: "화이트보드에 접근할 권한이 없습니다.",
      });
    }

    const stats = await WhiteboardDrawing.getWhiteboardStats(whiteboardId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Stats fetch error:", error);
    res.status(500).json({
      success: false,
      message: "통계 데이터를 불러오는데 실패했습니다.",
    });
  }
});

// 화이트보드 삭제 (새 엔드포인트)
router.delete("/:whiteboardId", auth, async (req, res) => {
  try {
    if (!useDatabase) {
      const index = tempWhiteboards.findIndex(
        (wb) => wb._id === req.params.whiteboardId
      );
      if (index > -1) {
        tempWhiteboards.splice(index, 1);
      }
      return res.json({
        success: true,
        message: "화이트보드가 삭제되었습니다.",
      });
    }

    const whiteboardId = req.params.whiteboardId;

    // 화이트보드 소유자 확인
    const whiteboard = await Whiteboard.findOne({
      _id: whiteboardId,
      creator: req.user.id,
    });

    if (!whiteboard) {
      return res.status(403).json({
        success: false,
        message: "화이트보드를 삭제할 권한이 없습니다.",
      });
    }

    // 관련 드로잉 데이터도 함께 삭제
    const drawingsResult = await WhiteboardDrawing.deleteMany({
      whiteboard: whiteboardId,
    });
    await whiteboard.deleteOne();

    res.json({
      success: true,
      message: "화이트보드와 모든 드로잉이 삭제되었습니다.",
      deletedDrawings: drawingsResult.deletedCount,
    });
  } catch (error) {
    console.error("❌ Whiteboard delete error:", error);
    res.status(500).json({
      success: false,
      message: "화이트보드 삭제에 실패했습니다.",
    });
  }
});

module.exports = router;
