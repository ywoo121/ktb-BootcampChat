import React, { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { Button, Card, Text, Badge } from "@vapor-ui/core";
import { Flex, Box } from "../components/ui/Layout";
import { withAuth } from "../middleware/withAuth";
import { io } from "socket.io-client";
import authService from "../services/authService";

function WhiteboardPage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  const [currentUser] = useState(authService.getCurrentUser());
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [whiteboardName, setWhiteboardName] = useState("화이트보드");

  // Socket.IO 연결
  const initializeSocket = useCallback(async () => {
    if (!router.query.room || !currentUser) return;

    try {
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000";

      console.log("🔌 Connecting to whiteboard socket:", socketUrl);

      // 화이트보드 전용 네임스페이스로 연결
      socketRef.current = io(`${socketUrl}/whiteboard`, {
        auth: {
          token: currentUser.token,
          sessionId: currentUser.sessionId,
        },
        transports: ["websocket", "polling"],
        forceNew: true,
      });

      // 연결 이벤트
      socketRef.current.on("connect", () => {
        console.log("✅ Whiteboard socket connected:", socketRef.current.id);
        setConnected(true);

        // 화이트보드 방 입장
        socketRef.current.emit("joinWhiteboard", router.query.room);
      });

      // 화이트보드 상태 수신
      socketRef.current.on("whiteboardState", (data) => {
        console.log("📋 Received whiteboard state:", data);
        setUsers(data.users);

        // 기존 그리기 데이터 복원
        if (data.drawings && data.drawings.length > 0) {
          redrawCanvas(data.drawings);
        }
      });

      // 실시간 그리기 수신
      socketRef.current.on("drawing", (drawingData) => {
        console.log("🎨 Received drawing:", drawingData);
        drawOnCanvas(drawingData);
      });

      // 사용자 입장/퇴장
      socketRef.current.on("userJoined", (userInfo) => {
        console.log("👋 User joined:", userInfo.userName);
      });

      socketRef.current.on("userLeft", (userInfo) => {
        console.log("👋 User left:", userInfo.userName);
      });

      socketRef.current.on("usersUpdate", (usersList) => {
        setUsers(usersList);
      });

      // 캔버스 지우기
      socketRef.current.on("canvasCleared", (data) => {
        console.log("🧹 Canvas cleared by:", data.clearedBy);
        clearCanvas();
      });

      // 에러 처리
      socketRef.current.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        setConnected(false);
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("🔌 Socket disconnected:", reason);
        setConnected(false);
      });
    } catch (error) {
      console.error("❌ Socket initialization error:", error);
    }
  }, [router.query.room, currentUser]);

  // 캔버스에 그리기
  const drawOnCanvas = useCallback((drawingData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (drawingData.type === "start") {
      ctx.beginPath();
      ctx.moveTo(drawingData.x, drawingData.y);
    } else if (drawingData.type === "draw") {
      ctx.lineTo(drawingData.x, drawingData.y);
      ctx.strokeStyle = drawingData.color || "#000000";
      ctx.lineWidth = drawingData.size || 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    } else if (drawingData.type === "end") {
      ctx.beginPath();
    }
  }, []);

  // 기존 그리기 데이터 복원
  const redrawCanvas = useCallback(
    (drawings) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawings.forEach((drawing) => {
        drawOnCanvas(drawing);
      });
    },
    [drawOnCanvas]
  );

  // 캔버스 지우기
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // 마우스 이벤트 핸들러
  const getMousePos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback(
    (e) => {
      if (!socketRef.current || !connected) return;

      isDrawingRef.current = true;
      const pos = getMousePos(e);
      lastPointRef.current = pos;

      // 로컬 캔버스에 그리기
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);

      // 서버로 그리기 시작 이벤트 전송
      socketRef.current.emit("drawing", {
        type: "start",
        x: pos.x,
        y: pos.y,
        color: brushColor,
        size: brushSize,
      });
    },
    [connected, getMousePos, brushColor, brushSize]
  );

  const draw = useCallback(
    (e) => {
      if (!isDrawingRef.current || !socketRef.current || !connected) return;

      const pos = getMousePos(e);

      // 로컬 캔버스에 그리기
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // 서버로 그리기 이벤트 전송
      socketRef.current.emit("drawing", {
        type: "draw",
        x: pos.x,
        y: pos.y,
        color: brushColor,
        size: brushSize,
      });

      lastPointRef.current = pos;
    },
    [connected, getMousePos, brushColor, brushSize]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;

    if (socketRef.current && connected) {
      socketRef.current.emit("drawing", {
        type: "end",
      });
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
  }, [connected]);

  // 캔버스 지우기 핸들러
  const handleClearCanvas = useCallback(() => {
    if (socketRef.current && connected) {
      socketRef.current.emit("clearCanvas");
    } else {
      clearCanvas();
    }
  }, [connected, clearCanvas]);

  // 컴포넌트 마운트
  useEffect(() => {
    if (router.query.room && currentUser) {
      initializeSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leaveWhiteboard");
        socketRef.current.disconnect();
      }
    };
  }, [router.query.room, currentUser, initializeSocket]);

  if (!router.query.room) {
    return (
      <div className="auth-container">
        <Card.Root>
          <Card.Body style={{ textAlign: "center" }}>
            <Text typography="heading4">화이트보드 정보가 없습니다.</Text>
          </Card.Body>
        </Card.Root>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <Card.Root className="chat-room-card">
        <Card.Header className="chat-room-header">
          <Flex justify="space-between" align="center">
            <Text typography="heading4">{whiteboardName}</Text>
            <Flex align="center" gap="200">
              <Badge color={connected ? "success" : "danger"}>
                {connected ? "연결됨" : "연결 끊김"}
              </Badge>
              <Badge color="primary">👥 {users.length}명 참여 중</Badge>
            </Flex>
          </Flex>
        </Card.Header>

        <Card.Body
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--vapor-space-200)",
          }}
        >
          {/* 도구 모음 */}
          <Flex
            gap="200"
            align="center"
            style={{
              padding: "10px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <Text typography="body2">색상:</Text>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              style={{
                width: "40px",
                height: "30px",
                border: "none",
                borderRadius: "4px",
              }}
            />

            <Text typography="body2">크기:</Text>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              style={{ width: "100px" }}
            />
            <Text typography="body2">{brushSize}px</Text>

            <Button
              variant="outline"
              onClick={handleClearCanvas}
              disabled={!connected}
            >
              🧹 캔버스 지우기
            </Button>
          </Flex>

          {/* 연결된 사용자 목록 */}
          {users.length > 0 && (
            <Box
              style={{
                padding: "10px",
                backgroundColor: "#f0f8ff",
                borderRadius: "8px",
              }}
            >
              <Text typography="body2" style={{ marginBottom: "5px" }}>
                참여자:
              </Text>
              <Flex gap="100" wrap="wrap">
                {users.map((user, index) => (
                  <Badge
                    key={user.socketId || index}
                    color="primary"
                    style={{ fontSize: "12px" }}
                  >
                    {user.userName}
                  </Badge>
                ))}
              </Flex>
            </Box>
          )}

          {/* 캔버스 */}
          <Box
            style={{
              flex: 1,
              border: "2px solid #ddd",
              borderRadius: "8px",
              backgroundColor: "white",
            }}
          >
            <canvas
              ref={canvasRef}
              width={1200}
              height={600}
              style={{
                width: "100%",
                height: "100%",
                cursor: "crosshair",
                display: "block",
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </Box>

          {/* 연결 상태 디버깅 */}
          {process.env.NODE_ENV === "development" && (
            <Box
              style={{
                padding: "10px",
                backgroundColor: "#f5f5f5",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              <Text typography="body3">
                디버그: Socket ID: {socketRef.current?.id || "N/A"} | 연결됨:{" "}
                {connected ? "Yes" : "No"} | 방 ID: {router.query.room}
              </Text>
            </Box>
          )}
        </Card.Body>
      </Card.Root>
    </div>
  );
}

export default withAuth(WhiteboardPage);
