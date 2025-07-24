const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Whiteboard = require("../../models/Whiteboard");

// 화이트보드 목록 조회
router.get("/", auth, async (req, res) => {
  try {
    const page = Math.max(0, parseInt(req.query.page) || 0);
    const pageSize = Math.min(
      Math.max(1, parseInt(req.query.pageSize) || 10),
      50
    );
    const skip = page * pageSize;

    const totalCount = await Whiteboard.countDocuments();
    const whiteboards = await Whiteboard.find()
      .populate("creator", "name email")
      .populate("participants", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const safeWhiteboards = whiteboards.map((wb) => ({
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
    }));

    const totalPages = Math.ceil(totalCount / pageSize);
    const hasMore = skip + whiteboards.length < totalCount;

    res.json({
      success: true,
      data: safeWhiteboards,
      metadata: {
        total: totalCount,
        page,
        pageSize,
        totalPages,
        hasMore,
        currentCount: safeWhiteboards.length,
      },
    });
  } catch (error) {
    console.error("Whiteboards fetch error:", error);
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
      },
    });
  } catch (error) {
    console.error("Whiteboard creation error:", error);
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

    res.json({
      success: true,
      data: {
        ...populatedWhiteboard.toObject(),
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Whiteboard join error:", error);
    res.status(500).json({
      success: false,
      message: "화이트보드 입장에 실패했습니다.",
    });
  }
});

module.exports = router;
