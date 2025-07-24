const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/keys");
const User = require("../models/User");
const WhiteboardDrawing = require("../models/WhiteboardDrawing");

module.exports = function (io) {
  // 활성 화이트보드와 연결된 사용자들 (메모리에서만 관리)
  const activeWhiteboards = new Map();
  const connectedUsers = new Map();
  const activePaths = new Map(); // 현재 그리고 있는 패스들

  // 화이트보드 네임스페이스 생성
  const whiteboardNamespace = io.of("/whiteboard");

  // 인증 미들웨어
  whiteboardNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const sessionId = socket.handshake.auth.sessionId;

      if (!token || !sessionId) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, jwtSecret);
      if (!decoded?.user?.id) {
        return next(new Error("Invalid token"));
      }

      const user = await User.findById(decoded.user.id);
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        sessionId: sessionId,
      };

      console.log("🎨 Whiteboard user authenticated:", socket.user.name);
      next();
    } catch (error) {
      console.error("❌ Whiteboard authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  whiteboardNamespace.on("connection", (socket) => {
    console.log(
      "🎨 Whiteboard socket connected:",
      socket.id,
      socket.user?.name
    );

    // 화이트보드 방 입장
    socket.on("joinWhiteboard", async (whiteboardId) => {
      try {
        console.log(
          `🚪 User ${socket.user.name} joining whiteboard ${whiteboardId}`
        );

        // 기존 방에서 나가기
        if (socket.currentWhiteboard) {
          await leaveWhiteboardRoom(socket);
        }

        // 새 방 입장
        socket.join(whiteboardId);
        socket.currentWhiteboard = whiteboardId;

        // 메모리에서 화이트보드 데이터 초기화
        if (!activeWhiteboards.has(whiteboardId)) {
          activeWhiteboards.set(whiteboardId, {
            id: whiteboardId,
            users: [],
            lastActivity: Date.now(),
          });
        }

        const whiteboardData = activeWhiteboards.get(whiteboardId);

        // 사용자 정보 추가
        const userInfo = {
          socketId: socket.id,
          userId: socket.user.id,
          userName: socket.user.name,
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
          joinedAt: Date.now(),
        };

        // 기존 사용자 제거 후 새로 추가
        whiteboardData.users = whiteboardData.users.filter(
          (u) => u.userId !== socket.user.id
        );
        whiteboardData.users.push(userInfo);
        connectedUsers.set(socket.id, userInfo);

        // 데이터베이스에서 저장된 드로잉 데이터 로드
        const savedDrawings = await WhiteboardDrawing.getWhiteboardDrawings(
          whiteboardId,
          {
            limit: 1000,
            sortBy: "startTime",
            sortOrder: 1,
          }
        );

        console.log(
          `📚 Loaded ${savedDrawings.length} saved drawings for whiteboard ${whiteboardId}`
        );

        // 현재 화이트보드 상태 전송 (저장된 데이터 포함)
        socket.emit("whiteboardState", {
          whiteboardId,
          drawings: savedDrawings,
          users: whiteboardData.users,
          stats: await WhiteboardDrawing.getWhiteboardStats(whiteboardId),
        });

        // 다른 사용자들에게 새 사용자 입장 알림
        socket.to(whiteboardId).emit("userJoined", userInfo);

        // 모든 사용자에게 업데이트된 사용자 목록 전송
        whiteboardNamespace
          .to(whiteboardId)
          .emit("usersUpdate", whiteboardData.users);

        console.log(
          `✅ User ${socket.user.name} joined whiteboard ${whiteboardId}. Total users: ${whiteboardData.users.length}`
        );
      } catch (error) {
        console.error("❌ Join whiteboard error:", error);
        socket.emit("error", { message: "화이트보드 입장에 실패했습니다." });
      }
    });

    // 실시간 그리기 이벤트 - 데이터베이스 저장
    socket.on("drawing", async (drawingData) => {
      if (!socket.currentWhiteboard) {
        console.warn("⚠️ Drawing event without whiteboard room");
        return;
      }

      try {
        const whiteboardId = socket.currentWhiteboard;
        const pathId = drawingData.pathId || `${socket.id}-${Date.now()}`;

        // 그리기 데이터에 사용자 정보 추가
        const enrichedDrawingData = {
          ...drawingData,
          pathId,
          userId: socket.user.id,
          userName: socket.user.name,
          timestamp: Date.now(),
        };

        // 데이터베이스에 저장
        if (drawingData.type === "start") {
          // 새로운 패스 시작
          const newPath = new WhiteboardDrawing({
            id: pathId,
            whiteboard: whiteboardId,
            user: socket.user.id,
            userName: socket.user.name,
            points: [
              {
                x: drawingData.x,
                y: drawingData.y,
                type: "start",
                color: drawingData.color,
                size: drawingData.size,
                timestamp: new Date(),
              },
            ],
            color: drawingData.color,
            size: drawingData.size,
            startTime: new Date(),
            isComplete: false,
          });

          await newPath.save();
          activePaths.set(pathId, newPath);

          console.log(
            `🎨 Started new path ${pathId} for user ${socket.user.name}`
          );
        } else if (drawingData.type === "draw") {
          // 기존 패스에 포인트 추가
          const activePath = activePaths.get(pathId);
          if (activePath) {
            activePath.points.push({
              x: drawingData.x,
              y: drawingData.y,
              type: "draw",
              color: drawingData.color,
              size: drawingData.size,
              timestamp: new Date(),
            });

            // 주기적으로 저장 (매 10개 포인트마다)
            if (activePath.points.length % 10 === 0) {
              await activePath.save();
            }
          }
        } else if (drawingData.type === "end") {
          // 패스 완료
          const activePath = activePaths.get(pathId);
          if (activePath) {
            activePath.points.push({
              x:
                drawingData.x ||
                activePath.points[activePath.points.length - 1]?.x,
              y:
                drawingData.y ||
                activePath.points[activePath.points.length - 1]?.y,
              type: "end",
              timestamp: new Date(),
            });
            activePath.endTime = new Date();
            activePath.isComplete = true;

            await activePath.save();
            activePaths.delete(pathId);

            console.log(
              `✅ Completed path ${pathId} with ${activePath.points.length} points`
            );
          }
        }

        // 같은 화이트보드의 다른 모든 사용자에게 실시간 전송
        socket.to(whiteboardId).emit("drawing", enrichedDrawingData);

        // 화이트보드 활동 시간 업데이트
        const whiteboardData = activeWhiteboards.get(whiteboardId);
        if (whiteboardData) {
          whiteboardData.lastActivity = Date.now();
        }
      } catch (error) {
        console.error("❌ Drawing save error:", error);
        socket.emit("error", { message: "그리기 저장에 실패했습니다." });
      }
    });

    // 캔버스 지우기 - 데이터베이스에서도 삭제
    socket.on("clearCanvas", async () => {
      if (!socket.currentWhiteboard) return;

      try {
        const whiteboardId = socket.currentWhiteboard;

        // 데이터베이스에서 모든 드로잉 삭제
        const result = await WhiteboardDrawing.clearWhiteboardDrawings(
          whiteboardId,
          socket.user.id
        );

        // 활성 패스도 정리
        for (const [pathId, path] of activePaths.entries()) {
          if (path.whiteboard.toString() === whiteboardId) {
            activePaths.delete(pathId);
          }
        }

        // 모든 사용자에게 캔버스 지우기 이벤트 전송
        whiteboardNamespace.to(whiteboardId).emit("canvasCleared", {
          clearedBy: socket.user.name,
          timestamp: Date.now(),
          deletedCount: result.deletedCount,
        });

        console.log(
          `🧹 Canvas cleared by ${socket.user.name} in whiteboard ${whiteboardId}. Deleted ${result.deletedCount} paths`
        );
      } catch (error) {
        console.error("❌ Clear canvas error:", error);
        socket.emit("error", { message: "캔버스 지우기에 실패했습니다." });
      }
    });

    // 화이트보드 통계 요청
    socket.on("getStats", async () => {
      if (!socket.currentWhiteboard) return;

      try {
        const stats = await WhiteboardDrawing.getWhiteboardStats(
          socket.currentWhiteboard
        );
        socket.emit("statsUpdate", stats);
      } catch (error) {
        console.error("❌ Stats fetch error:", error);
      }
    });

    // 화이트보드 나가기
    socket.on("leaveWhiteboard", async () => {
      if (socket.currentWhiteboard) {
        await leaveWhiteboardRoom(socket);
      }
    });

    // 연결 해제
    socket.on("disconnect", async (reason) => {
      console.log(
        `🔌 Whiteboard socket disconnected: ${socket.id} - ${reason}`
      );

      if (socket.currentWhiteboard) {
        await leaveWhiteboardRoom(socket);
      }

      connectedUsers.delete(socket.id);

      // 미완성 패스 정리
      for (const [pathId, path] of activePaths.entries()) {
        if (pathId.startsWith(socket.id)) {
          try {
            // 미완성 패스를 완료 상태로 저장
            if (path.points.length > 0) {
              path.isComplete = true;
              path.endTime = new Date();
              await path.save();
              console.log(`💾 Auto-saved incomplete path ${pathId}`);
            }
          } catch (error) {
            console.error("❌ Auto-save path error:", error);
          }
          activePaths.delete(pathId);
        }
      }
    });

    // 화이트보드 방 나가기 공통 로직
    async function leaveWhiteboardRoom(socket) {
      const whiteboardId = socket.currentWhiteboard;
      const whiteboardData = activeWhiteboards.get(whiteboardId);

      if (whiteboardData) {
        // 사용자 목록에서 제거
        whiteboardData.users = whiteboardData.users.filter(
          (u) => u.socketId !== socket.id
        );

        // 다른 사용자들에게 퇴장 알림
        socket.to(whiteboardId).emit("userLeft", {
          userId: socket.user.id,
          userName: socket.user.name,
        });

        // 업데이트된 사용자 목록 전송
        whiteboardNamespace
          .to(whiteboardId)
          .emit("usersUpdate", whiteboardData.users);

        console.log(
          `👋 User ${socket.user.name} left whiteboard ${whiteboardId}. Remaining users: ${whiteboardData.users.length}`
        );

        // 빈 화이트보드 메모리 정리 (데이터는 DB에 영구 저장됨)
        if (whiteboardData.users.length === 0) {
          setTimeout(() => {
            if (activeWhiteboards.has(whiteboardId)) {
              const currentData = activeWhiteboards.get(whiteboardId);
              if (currentData.users.length === 0) {
                activeWhiteboards.delete(whiteboardId);
                console.log(
                  `🗑️ Cleaned up empty whiteboard memory ${whiteboardId}`
                );
              }
            }
          }, 10 * 60 * 1000); // 10분 후 메모리 정리
        }
      }

      socket.leave(whiteboardId);
      socket.currentWhiteboard = null;
    }

    // 디버깅용 이벤트
    socket.on("debugInfo", async () => {
      const stats = socket.currentWhiteboard
        ? await WhiteboardDrawing.getWhiteboardStats(socket.currentWhiteboard)
        : null;

      socket.emit("debugResponse", {
        socketId: socket.id,
        userId: socket.user.id,
        currentWhiteboard: socket.currentWhiteboard,
        totalWhiteboards: activeWhiteboards.size,
        connectedUsers: connectedUsers.size,
        activePaths: activePaths.size,
        dbStats: stats,
      });
    });
  });

  // 주기적으로 미완성 패스 저장 (1분마다)
  setInterval(async () => {
    for (const [pathId, path] of activePaths.entries()) {
      try {
        if (path.points.length > 0 && path.isModified()) {
          await path.save();
        }
      } catch (error) {
        console.error("❌ Periodic save error for path", pathId, error);
      }
    }
  }, 60000); // 1분마다

  // 통계 로깅 (5분마다)
  setInterval(async () => {
    const totalUsers = Array.from(activeWhiteboards.values()).reduce(
      (sum, wb) => sum + wb.users.length,
      0
    );
    const totalPaths = await WhiteboardDrawing.countDocuments();
    console.log(
      `📊 Whiteboard Stats - Active boards: ${activeWhiteboards.size}, Users: ${totalUsers}, Total paths in DB: ${totalPaths}, Active paths: ${activePaths.size}`
    );
  }, 5 * 60000); // 5분마다

  console.log("✅ Persistent Whiteboard socket handler initialized");
  return whiteboardNamespace;
};
