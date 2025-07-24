const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/keys");
const Whiteboard = require("../models/Whiteboard");
const User = require("../models/User");

module.exports = function (io) {
  const activeWhiteboards = new Map();
  const connectedUsers = new Map();

  // Socket.IO 인증 미들웨어
  io.use(async (socket, next) => {
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

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log("화이트보드 사용자 연결됨:", socket.id, socket.user?.name);

    // 화이트보드 입장
    socket.on("joinWhiteboard", async (whiteboardId) => {
      try {
        if (!socket.user) {
          socket.emit("error", { message: "인증되지 않은 사용자입니다." });
          return;
        }

        const whiteboard = await Whiteboard.findOne({
          _id: whiteboardId,
          participants: socket.user.id,
        }).populate("participants", "name email");

        if (!whiteboard) {
          socket.emit("error", {
            message: "화이트보드에 접근할 권한이 없습니다.",
          });
          return;
        }

        socket.join(whiteboardId);
        socket.whiteboardId = whiteboardId;

        // 현재 화이트보드 데이터 전송
        const currentWhiteboardData = activeWhiteboards.get(whiteboardId) || {
          name: whiteboard.name,
          drawings: [],
          messages: [],
          users: [],
        };

        // 사용자 정보 추가
        const userInfo = {
          id: socket.user.id,
          socketId: socket.id,
          name: socket.user.name,
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
          joinedAt: new Date().toISOString(),
        };

        connectedUsers.set(socket.id, userInfo);
        currentWhiteboardData.users = Array.from(
          connectedUsers.values()
        ).filter((user) => {
          const userSocket = io.sockets.sockets.get(user.socketId);
          return userSocket && userSocket.whiteboardId === whiteboardId;
        });

        activeWhiteboards.set(whiteboardId, currentWhiteboardData);

        socket.emit("whiteboardData", currentWhiteboardData);
        socket.to(whiteboardId).emit("userJoined", userInfo);
        io.to(whiteboardId).emit("usersUpdate", currentWhiteboardData.users);

        console.log(
          `사용자 ${socket.user.name}이 화이트보드 ${whiteboardId}에 입장했습니다.`
        );
      } catch (error) {
        console.error("화이트보드 입장 오류:", error);
        socket.emit("error", { message: "화이트보드 입장에 실패했습니다." });
      }
    });

    // 그리기 데이터 처리
    socket.on("draw", (drawData) => {
      if (!socket.whiteboardId) return;

      const whiteboardData = activeWhiteboards.get(socket.whiteboardId);
      if (!whiteboardData) return;

      if (drawData.isDrawing) {
        const drawing = {
          id: Date.now() + "_" + socket.id,
          x: drawData.x,
          y: drawData.y,
          color: drawData.color,
          size: drawData.size,
          userId: socket.user.id,
          userName: socket.user.name,
          timestamp: Date.now(),
        };

        whiteboardData.drawings.push(drawing);

        // 같은 화이트보드의 다른 사용자들에게 전송
        socket.to(socket.whiteboardId).emit("drawUpdate", drawing);
      }
    });

    // 채팅 메시지 처리
    socket.on("chatMessage", (messageData) => {
      if (!socket.whiteboardId || !socket.user) return;

      const message = {
        id: Date.now() + "_" + socket.id,
        content: messageData.content,
        userId: socket.user.id,
        userName: socket.user.name,
        timestamp: Date.now(),
      };

      const whiteboardData = activeWhiteboards.get(socket.whiteboardId);
      if (whiteboardData) {
        whiteboardData.messages.push(message);
        // 최근 100개 메시지만 유지
        if (whiteboardData.messages.length > 100) {
          whiteboardData.messages = whiteboardData.messages.slice(-100);
        }
        activeWhiteboards.set(socket.whiteboardId, whiteboardData);
      }

      io.to(socket.whiteboardId).emit("newMessage", message);
    });

    // 캔버스 지우기
    socket.on("clearCanvas", () => {
      if (!socket.whiteboardId) return;

      const whiteboardData = activeWhiteboards.get(socket.whiteboardId);
      if (whiteboardData) {
        whiteboardData.drawings = [];
        activeWhiteboards.set(socket.whiteboardId, whiteboardData);
      }

      io.to(socket.whiteboardId).emit("canvasCleared");
    });

    // 화이트보드 퇴장
    socket.on("leaveWhiteboard", (whiteboardId) => {
      try {
        if (socket.whiteboardId) {
          socket.leave(socket.whiteboardId);

          const whiteboardData = activeWhiteboards.get(socket.whiteboardId);
          if (whiteboardData) {
            whiteboardData.users = whiteboardData.users.filter(
              (user) => user.socketId !== socket.id
            );
            activeWhiteboards.set(socket.whiteboardId, whiteboardData);

            socket.to(socket.whiteboardId).emit("userLeft", {
              id: socket.user?.id,
              name: socket.user?.name,
            });
            io.to(socket.whiteboardId).emit(
              "usersUpdate",
              whiteboardData.users
            );
          }

          socket.whiteboardId = null;
        }

        connectedUsers.delete(socket.id);
        console.log(
          `사용자 ${socket.user?.name}이 화이트보드에서 퇴장했습니다.`
        );
      } catch (error) {
        console.error("화이트보드 퇴장 오류:", error);
      }
    });

    // 연결 해제 처리
    socket.on("disconnect", () => {
      try {
        if (socket.whiteboardId) {
          const whiteboardData = activeWhiteboards.get(socket.whiteboardId);
          if (whiteboardData) {
            whiteboardData.users = whiteboardData.users.filter(
              (user) => user.socketId !== socket.id
            );
            activeWhiteboards.set(socket.whiteboardId, whiteboardData);

            socket.to(socket.whiteboardId).emit("userLeft", {
              id: socket.user?.id,
              name: socket.user?.name,
            });
            io.to(socket.whiteboardId).emit(
              "usersUpdate",
              whiteboardData.users
            );
          }
        }

        connectedUsers.delete(socket.id);
        console.log("화이트보드 사용자 연결 해제됨:", socket.id);
      } catch (error) {
        console.error("연결 해제 처리 오류:", error);
      }
    });
  });

  return io;
};
