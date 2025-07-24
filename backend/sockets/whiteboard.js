const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/keys");
const User = require("../models/User");

module.exports = function (io) {
  // 활성 화이트보드와 연결된 사용자들
  const activeWhiteboards = new Map();
  const connectedUsers = new Map();

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
          socket.leave(socket.currentWhiteboard);
          const prevWhiteboard = activeWhiteboards.get(
            socket.currentWhiteboard
          );
          if (prevWhiteboard) {
            prevWhiteboard.users = prevWhiteboard.users.filter(
              (u) => u.socketId !== socket.id
            );
            whiteboardNamespace.to(socket.currentWhiteboard).emit("userLeft", {
              userId: socket.user.id,
              userName: socket.user.name,
            });
          }
        }

        // 새 방 입장
        socket.join(whiteboardId);
        socket.currentWhiteboard = whiteboardId;

        // 화이트보드 데이터 초기화
        if (!activeWhiteboards.has(whiteboardId)) {
          activeWhiteboards.set(whiteboardId, {
            id: whiteboardId,
            drawings: [],
            users: [],
            createdAt: Date.now(),
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

        // 현재 화이트보드 상태 전송
        socket.emit("whiteboardState", {
          whiteboardId,
          drawings: whiteboardData.drawings,
          users: whiteboardData.users,
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

    // 실시간 그리기 이벤트
    socket.on("drawing", (drawingData) => {
      if (!socket.currentWhiteboard) {
        console.warn("⚠️ Drawing event without whiteboard room");
        return;
      }

      const whiteboardData = activeWhiteboards.get(socket.currentWhiteboard);
      if (!whiteboardData) {
        console.warn("⚠️ Drawing event for non-existent whiteboard");
        return;
      }

      // 그리기 데이터에 사용자 정보 추가
      const enrichedDrawingData = {
        ...drawingData,
        userId: socket.user.id,
        userName: socket.user.name,
        timestamp: Date.now(),
        id: `${socket.id}-${Date.now()}`,
      };

      // 메모리에 저장 (선택적)
      if (drawingData.type === "path" || drawingData.type === "line") {
        whiteboardData.drawings.push(enrichedDrawingData);

        // 메모리 관리: 너무 많은 그리기 데이터가 쌓이면 오래된 것 삭제
        if (whiteboardData.drawings.length > 10000) {
          whiteboardData.drawings = whiteboardData.drawings.slice(-5000);
        }
      }

      // 같은 화이트보드의 다른 모든 사용자에게 실시간 전송
      socket.to(socket.currentWhiteboard).emit("drawing", enrichedDrawingData);

      console.log(
        `🎨 Drawing from ${socket.user.name} broadcasted to whiteboard ${socket.currentWhiteboard}`
      );
    });

    // 마우스 움직임 (실시간 커서)
    socket.on("mouseMove", (mouseData) => {
      if (!socket.currentWhiteboard) return;

      socket.to(socket.currentWhiteboard).emit("userMouseMove", {
        userId: socket.user.id,
        userName: socket.user.name,
        x: mouseData.x,
        y: mouseData.y,
        timestamp: Date.now(),
      });
    });

    // 캔버스 지우기
    socket.on("clearCanvas", () => {
      if (!socket.currentWhiteboard) return;

      const whiteboardData = activeWhiteboards.get(socket.currentWhiteboard);
      if (whiteboardData) {
        whiteboardData.drawings = [];
      }

      // 모든 사용자에게 캔버스 지우기 이벤트 전송
      whiteboardNamespace.to(socket.currentWhiteboard).emit("canvasCleared", {
        clearedBy: socket.user.name,
        timestamp: Date.now(),
      });

      console.log(
        `🧹 Canvas cleared by ${socket.user.name} in whiteboard ${socket.currentWhiteboard}`
      );
    });

    // 화이트보드 나가기
    socket.on("leaveWhiteboard", () => {
      if (socket.currentWhiteboard) {
        leaveWhiteboardRoom(socket);
      }
    });

    // 연결 해제
    socket.on("disconnect", (reason) => {
      console.log(
        `🔌 Whiteboard socket disconnected: ${socket.id} - ${reason}`
      );

      if (socket.currentWhiteboard) {
        leaveWhiteboardRoom(socket);
      }

      connectedUsers.delete(socket.id);
    });

    // 화이트보드 방 나가기 공통 로직
    function leaveWhiteboardRoom(socket) {
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

        // 빈 화이트보드 정리 (선택적)
        if (whiteboardData.users.length === 0) {
          // 30분 후에 데이터 삭제 (메모리 절약)
          setTimeout(() => {
            if (activeWhiteboards.has(whiteboardId)) {
              const currentData = activeWhiteboards.get(whiteboardId);
              if (currentData.users.length === 0) {
                activeWhiteboards.delete(whiteboardId);
                console.log(`🗑️ Cleaned up empty whiteboard ${whiteboardId}`);
              }
            }
          }, 30 * 60 * 1000); // 30분
        }
      }

      socket.leave(whiteboardId);
      socket.currentWhiteboard = null;
    }

    // 디버깅용 이벤트
    socket.on("debugInfo", () => {
      socket.emit("debugResponse", {
        socketId: socket.id,
        userId: socket.user.id,
        currentWhiteboard: socket.currentWhiteboard,
        totalWhiteboards: activeWhiteboards.size,
        connectedUsers: connectedUsers.size,
      });
    });
  });

  // 디버깅용 함수
  setInterval(() => {
    const totalUsers = Array.from(activeWhiteboards.values()).reduce(
      (sum, wb) => sum + wb.users.length,
      0
    );
    console.log(
      `📊 Whiteboard Stats - Active boards: ${activeWhiteboards.size}, Total users: ${totalUsers}`
    );
  }, 60000); // 1분마다

  console.log("✅ Whiteboard socket handler initialized");
  return whiteboardNamespace;
};
