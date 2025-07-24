// 3. frontend/pages/whiteboard.js
import React, { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { Button, Card, Text, Badge } from "@vapor-ui/core";
import { Flex, Box } from "../components/ui/Layout";
import { withAuth } from "../middleware/withAuth";
import socketService from "../services/socket";
import authService from "../services/authService";

function WhiteboardPage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentUser] = useState(authService.getCurrentUser());
  const [whiteboard, setWhiteboard] = useState(null);
  const [connected, setConnected] = useState(false);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);

  useEffect(() => {
    if (!router.query.room) return;

    const initializeWhiteboard = async () => {
      try {
        // 소켓 연결
        socketRef.current = await socketService.connect({
          auth: {
            token: currentUser.token,
            sessionId: currentUser.sessionId,
          },
        });

        // 화이트보드 방 참가
        socketRef.current.emit("joinWhiteboard", router.query.room);

        // 이벤트 리스너 설정
        socketRef.current.on("whiteboardData", (data) => {
          setWhiteboard(data);
        });

        socketRef.current.on("drawUpdate", (drawData) => {
          drawOnCanvas(drawData);
        });

        socketRef.current.on("canvasCleared", () => {
          clearCanvas();
        });

        setConnected(true);
      } catch (error) {
        console.error("Whiteboard initialization error:", error);
      }
    };

    initializeWhiteboard();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leaveWhiteboard", router.query.room);
        socketRef.current.disconnect();
      }
    };
  }, [router.query.room, currentUser]);

  const startDrawing = useCallback((e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback(
    (e) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ctx = canvas.getContext("2d");
      ctx.lineTo(x, y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.stroke();

      // 그리기 데이터를 다른 사용자들에게 전송
      if (socketRef.current) {
        socketRef.current.emit("draw", {
          x,
          y,
          color: brushColor,
          size: brushSize,
          isDrawing: true,
        });
      }
    },
    [isDrawing, brushColor, brushSize]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);

    if (socketRef.current) {
      socketRef.current.emit("draw", {
        isDrawing: false,
      });
    }
  }, []);

  const drawOnCanvas = useCallback((drawData) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (drawData.isDrawing) {
      ctx.lineTo(drawData.x, drawData.y);
      ctx.strokeStyle = drawData.color;
      ctx.lineWidth = drawData.size;
      ctx.lineCap = "round";
      ctx.stroke();
    } else {
      ctx.beginPath();
    }
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleClearCanvas = useCallback(() => {
    clearCanvas();
    if (socketRef.current) {
      socketRef.current.emit("clearCanvas");
    }
  }, [clearCanvas]);

  if (!whiteboard) {
    return (
      <div className="auth-container">
        <Card.Root>
          <Card.Body style={{ textAlign: "center" }}>
            <Text typography="heading4">화이트보드 로딩 중...</Text>
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
            <Text typography="heading4">{whiteboard.name}</Text>
            <Badge color={connected ? "success" : "danger"}>
              {connected ? "연결됨" : "연결 끊김"}
            </Badge>
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
          <Flex gap="200" align="center">
            <Text typography="body2">색상:</Text>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              style={{ width: "40px", height: "30px" }}
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
              지우기
            </Button>
          </Flex>

          {/* 캔버스 */}
          <Box
            style={{
              flex: 1,
              border: "1px solid var(--vapor-color-border)",
              borderRadius: "var(--vapor-radius-md)",
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
                backgroundColor: "white",
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

export default withAuth(WhiteboardPage);
