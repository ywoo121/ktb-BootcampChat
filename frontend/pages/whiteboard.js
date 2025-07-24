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
  const currentPathRef = useRef(null);
  const pathIdRef = useRef(null);

  const [currentUser] = useState(authService.getCurrentUser());
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [whiteboardName, setWhiteboardName] = useState("화이트보드");
  const [stats, setStats] = useState({
    totalPaths: 0,
    totalPoints: 0,
    contributors: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Socket.IO 연결
  const initializeSocket = useCallback(async () => {
    if (!router.query.room || !currentUser) return;

    try {
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000";

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
        setConnected(true);
        setIsLoading(true);

        // 화이트보드 방 입장
        socketRef.current.emit("joinWhiteboard", router.query.room);
      });

      // 화이트보드 상태 수신 (저장된 데이터 포함)
      socketRef.current.on("whiteboardState", (data) => {
        setUsers(data.users);
        setStats(
          data.stats || { totalPaths: 0, totalPoints: 0, contributors: [] }
        );

        // 저장된 그리기 데이터 복원
        if (data.drawings && data.drawings.length > 0) {
          restoreDrawings(data.drawings);
        }

        setIsLoading(false);
      });

      // 실시간 그리기 수신
      socketRef.current.on("drawing", (drawingData) => {
        drawOnCanvas(drawingData);
      });

      // 사용자 관련 이벤트
      socketRef.current.on("userJoined", (userInfo) => {});

      socketRef.current.on("userLeft", (userInfo) => {});

      socketRef.current.on("usersUpdate", (usersList) => {
        setUsers(usersList);
      });

      // 캔버스 지우기
      socketRef.current.on("canvasCleared", (data) => {
        clearCanvas();
        setStats({ totalPaths: 0, totalPoints: 0, contributors: [] });
      });

      // 통계 업데이트
      socketRef.current.on("statsUpdate", (newStats) => {
        setStats(newStats);
      });

      // 에러 처리
      socketRef.current.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        setConnected(false);
      });

      socketRef.current.on("disconnect", (reason) => {
        setConnected(false);
      });

      socketRef.current.on("error", (error) => {
        console.error("❌ Socket error:", error);
        alert(error.message || "오류가 발생했습니다.");
      });
    } catch (error) {
      console.error("❌ Socket initialization error:", error);
      setIsLoading(false);
    }
  }, [router.query.room, currentUser]);

  // 저장된 드로잉 데이터 복원
  const restoreDrawings = useCallback((savedDrawings) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    savedDrawings.forEach((drawingPath) => {
      if (drawingPath.points && drawingPath.points.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = drawingPath.color || "#000000";
        ctx.lineWidth = drawingPath.size || 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        drawingPath.points.forEach((point, index) => {
          if (point.type === "start" || index === 0) {
            ctx.moveTo(point.x, point.y);
          } else if (point.type === "draw") {
            ctx.lineTo(point.x, point.y);
          }
        });

        ctx.stroke();
      }
    });
  }, []);

  // 실시간 캔버스에 그리기
  const drawOnCanvas = useCallback((drawingData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (drawingData.type === "start") {
      ctx.beginPath();
      ctx.moveTo(drawingData.x, drawingData.y);
      ctx.strokeStyle = drawingData.color || "#000000";
      ctx.lineWidth = drawingData.size || 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    } else if (drawingData.type === "draw") {
      ctx.lineTo(drawingData.x, drawingData.y);
      ctx.stroke();
    } else if (drawingData.type === "end") {
      ctx.beginPath();
    }
  }, []);

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
      pathIdRef.current = `${socketRef.current.id}-${Date.now()}`;

      // 로컬 캔버스에 그리기 시작
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // 서버로 그리기 시작 이벤트 전송
      socketRef.current.emit("drawing", {
        type: "start",
        pathId: pathIdRef.current,
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
      ctx.stroke();

      // 서버로 그리기 이벤트 전송
      socketRef.current.emit("drawing", {
        type: "draw",
        pathId: pathIdRef.current,
        x: pos.x,
        y: pos.y,
        color: brushColor,
        size: brushSize,
      });
    },
    [connected, getMousePos, brushColor, brushSize]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;

    if (socketRef.current && connected && pathIdRef.current) {
      socketRef.current.emit("drawing", {
        type: "end",
        pathId: pathIdRef.current,
      });
    }

    // 통계 업데이트 요청
    if (socketRef.current && connected) {
      socketRef.current.emit("getStats");
    }

    pathIdRef.current = null;
  }, [connected]);

  // 캔버스 지우기 핸들러
  const handleClearCanvas = useCallback(() => {
    if (!connected) {
      alert("서버에 연결되지 않았습니다.");
      return;
    }

    if (confirm("모든 그림을 지우시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      socketRef.current.emit("clearCanvas");
    }
  }, [connected]);

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
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: "10px",
              justifyContent: "end",
            }}
            align="right"
            gap="200"
          >
            {stats.contributors.length > 0 && (
              <Text typography="body3">
                👨‍🎨 {stats.contributors.length}명 기여
              </Text>
            )}
            {stats.lastActivity && (
              <Text typography="body3" style={{ color: "#666" }}>
                마지막 활동: {new Date(stats.lastActivity).toLocaleTimeString()}
              </Text>
            )}
          </div>
        </Card.Header>

        <Card.Body
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--vapor-space-200)",
          }}
        >
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
                현재 참여자:
              </Text>
              <Flex gap="100" wrap="wrap">
                {users.map((user, index) => (
                  <Badge
                    key={user.socketId || index}
                    color="primary"
                    style={{
                      fontSize: "12px",
                      backgroundColor: user.color || "#4A90E2",
                      color: "white",
                    }}
                  >
                    {user.userName}
                  </Badge>
                ))}
              </Flex>
            </Box>
          )}

          {/* 캔버스 with 플로팅 툴바 */}
          <Box
            style={{
              flex: 1,
              border: "3px solid #ddd",
              borderRadius: "12px",
              backgroundColor: "white",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* 플로팅 도구 모음 */}
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: "16px",
                padding: "12px 20px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                maxWidth: "90%",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Text
                  typography="body2"
                  style={{ fontSize: "12px", color: "#666" }}
                >
                  색상:
                </Text>
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  style={{
                    width: "32px",
                    height: "32px",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                />
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Text
                  typography="body2"
                  style={{ fontSize: "12px", color: "#666" }}
                >
                  크기:
                </Text>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  style={{
                    width: "80px",
                    height: "4px",
                    borderRadius: "2px",
                    background: "#ddd",
                    outline: "none",
                    cursor: "pointer",
                  }}
                />
                <Text
                  typography="body2"
                  style={{
                    fontSize: "11px",
                    color: "#999",
                    minWidth: "24px",
                    textAlign: "center",
                  }}
                >
                  {brushSize}px
                </Text>
              </div>

              <div
                style={{
                  height: "24px",
                  width: "1px",
                  backgroundColor: "#ddd",
                  margin: "0 4px",
                }}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCanvas}
                disabled={!connected}
                style={{
                  fontSize: "11px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: connected ? "#fff" : "#f5f5f5",
                  border: "1px solid #ddd",
                  color: connected ? "#333" : "#999",
                  cursor: connected ? "pointer" : "not-allowed",
                }}
              >
                🧹 모두 지우기
              </Button>
            </div>

            <canvas
              ref={canvasRef}
              width={1200}
              height={800}
              style={{
                width: "100%",
                height: "100%",
                cursor: connected ? "crosshair" : "not-allowed",
                display: "block",
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </Box>
        </Card.Body>
      </Card.Root>
    </div>
  );
}

export default WhiteboardPage;
