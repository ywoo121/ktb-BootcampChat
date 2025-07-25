import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button, Text, Card } from '@vapor-ui/core';
import { Flex, Box } from '../ui/Layout';
import { 
  Pencil, 
  Square, 
  Circle, 
  Type, 
  Eraser, 
  Trash2, 
  Download, 
  Upload,
  Palette,
  RotateCcw,
  Users
} from 'lucide-react';
import { fabric } from 'fabric';

const TOOLS = {
  PEN: 'pen',
  RECTANGLE: 'rectangle', 
  CIRCLE: 'circle',
  TEXT: 'text',
  ERASER: 'eraser',
  SELECT: 'select'
};

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', 
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
  '#800080', '#008000', '#000080', '#808080'
];

const Whiteboard = ({ 
  roomId, 
  socketRef, 
  currentUser,
  isVisible = true,
  onClose 
}) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [selectedTool, setSelectedTool] = useState(TOOLS.PEN);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [userCursors, setUserCursors] = useState({});

  // Canvas 초기화
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff'
    });

    fabricCanvasRef.current = canvas;

    // Canvas 이벤트 리스너
    canvas.on('path:created', handlePathCreated);
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:removed', handleObjectRemoved);
    canvas.on('mouse:move', handleMouseMove);

    // 초기 화이트보드 데이터 로드
    loadWhiteboardData();

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [roomId]);

  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;

    socket.on('whiteboardUpdate', handleRemoteUpdate);
    socket.on('whiteboardCursor', handleRemoteCursor);
    socket.on('whiteboardError', handleWhiteboardError);

    return () => {
      socket.off('whiteboardUpdate', handleRemoteUpdate);
      socket.off('whiteboardCursor', handleRemoteCursor);
      socket.off('whiteboardError', handleWhiteboardError);
    };
  }, [socketRef]);

  // 도구 변경 시 Canvas 모드 설정
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    switch (selectedTool) {
      case TOOLS.PEN:
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = selectedColor;
        canvas.freeDrawingBrush.width = brushSize;
        canvas.selection = false;
        break;
      case TOOLS.ERASER:
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = '#ffffff';
        canvas.freeDrawingBrush.width = brushSize * 2;
        canvas.selection = false;
        break;
      case TOOLS.SELECT:
        canvas.isDrawingMode = false;
        canvas.selection = true;
        break;
      default:
        canvas.isDrawingMode = false;
        canvas.selection = false;
        break;
    }
  }, [selectedTool, selectedColor, brushSize]);

  // 화이트보드 데이터 로드
  const loadWhiteboardData = useCallback(async () => {
    try {
      const response = await fetch(`/api/whiteboard/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const { data } = await response.json();
        if (data?.data && fabricCanvasRef.current) {
          fabricCanvasRef.current.loadFromJSON(data.data, () => {
            fabricCanvasRef.current.renderAll();
          });
        }
      }
    } catch (error) {
      console.error('화이트보드 데이터 로드 실패:', error);
    }
  }, [roomId]);

  // 화이트보드 데이터 저장
  const saveWhiteboardData = useCallback(async (data) => {
    try {
      await fetch(`/api/whiteboard/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ data })
      });
    } catch (error) {
      console.error('화이트보드 데이터 저장 실패:', error);
    }
  }, [roomId]);

  // Canvas 이벤트 핸들러
  const handlePathCreated = useCallback((e) => {
    const pathData = e.path.toObject();
    broadcastUpdate('path:created', pathData);
  }, []);

  const handleObjectAdded = useCallback((e) => {
    if (e.target?.type !== 'path') {
      const objectData = e.target.toObject();
      broadcastUpdate('object:added', objectData);
    }
  }, []);

  const handleObjectModified = useCallback((e) => {
    const objectData = e.target.toObject();
    broadcastUpdate('object:modified', { 
      ...objectData, 
      index: fabricCanvasRef.current.getObjects().indexOf(e.target) 
    });
  }, []);

  const handleObjectRemoved = useCallback((e) => {
    const index = fabricCanvasRef.current.getObjects().indexOf(e.target);
    broadcastUpdate('object:removed', { index });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!socketRef?.current || !e.e) return;

    const pointer = fabricCanvasRef.current.getPointer(e.e);
    socketRef.current.emit('whiteboardCursor', {
      roomId,
      cursor: { x: pointer.x, y: pointer.y }
    });
  }, [roomId, socketRef]);

  // 실시간 업데이트 브로드캐스트
  const broadcastUpdate = useCallback((action, data) => {
    if (!socketRef?.current) return;

    socketRef.current.emit('whiteboardUpdate', {
      roomId,
      action,
      data
    });

    // 자동 저장 (디바운스)
    setTimeout(() => {
      if (fabricCanvasRef.current) {
        const canvasData = fabricCanvasRef.current.toJSON();
        saveWhiteboardData(canvasData);
      }
    }, 1000);
  }, [roomId, socketRef, saveWhiteboardData]);

  // 원격 업데이트 처리
  const handleRemoteUpdate = useCallback((update) => {
    if (!fabricCanvasRef.current || update.userId === currentUser?.id) return;

    const canvas = fabricCanvasRef.current;

    switch (update.action) {
      case 'path:created':
        fabric.Path.fromObject(update.data, (path) => {
          canvas.add(path);
          canvas.renderAll();
        });
        break;
      case 'object:added':
        fabric.util.enlivenObjects([update.data], (objects) => {
          objects.forEach(obj => canvas.add(obj));
          canvas.renderAll();
        });
        break;
      case 'object:modified':
        const obj = canvas.getObjects()[update.data.index];
        if (obj) {
          obj.set(update.data);
          canvas.renderAll();
        }
        break;
      case 'object:removed':
        const objToRemove = canvas.getObjects()[update.data.index];
        if (objToRemove) {
          canvas.remove(objToRemove);
          canvas.renderAll();
        }
        break;
      case 'clear':
        canvas.clear();
        canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
        break;
    }
  }, [currentUser]);

  // 원격 커서 처리
  const handleRemoteCursor = useCallback((data) => {
    if (data.userId === currentUser?.id) return;

    setUserCursors(prev => ({
      ...prev,
      [data.userId]: {
        ...data.cursor,
        userName: data.userName,
        timestamp: data.timestamp
      }
    }));

    // 5초 후 커서 제거
    setTimeout(() => {
      setUserCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[data.userId];
        return newCursors;
      });
    }, 5000);
  }, [currentUser]);

  const handleWhiteboardError = useCallback((error) => {
    console.error('Whiteboard error:', error);
  }, []);

  // 도형 추가
  const addShape = useCallback((shapeType) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    let shape;

    switch (shapeType) {
      case TOOLS.RECTANGLE:
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 80,
          fill: 'transparent',
          stroke: selectedColor,
          strokeWidth: 2
        });
        break;
      case TOOLS.CIRCLE:
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: 'transparent',
          stroke: selectedColor,
          strokeWidth: 2
        });
        break;
      case TOOLS.TEXT:
        shape = new fabric.IText('텍스트 입력', {
          left: 100,
          top: 100,
          fontFamily: 'Arial',
          fontSize: 20,
          fill: selectedColor
        });
        break;
    }

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
    }
  }, [selectedColor]);

  // 화이트보드 초기화
  const clearWhiteboard = useCallback(async () => {
    if (!fabricCanvasRef.current) return;

    fabricCanvasRef.current.clear();
    fabricCanvasRef.current.setBackgroundColor('#ffffff', 
      fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current)
    );

    broadcastUpdate('clear', {});

    try {
      await fetch(`/api/whiteboard/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('화이트보드 초기화 실패:', error);
    }
  }, [roomId, broadcastUpdate]);

  // 화이트보드 다운로드
  const downloadWhiteboard = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1
    });

    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }, [roomId]);

  if (!isVisible) return null;

  return (
    <Card.Root className="whiteboard-container" style={{ 
      position: 'fixed', 
      top: '50px', 
      left: '50px', 
      right: '50px', 
      bottom: '50px',
      zIndex: 1000,
      backgroundColor: 'white'
    }}>
      <Card.Header style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <Flex justify="space-between" align="center">
          <Text typography="heading4">실시간 공유 화이트보드</Text>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </Flex>
      </Card.Header>

      <Card.Body style={{ padding: '16px', height: 'calc(100% - 120px)' }}>
        {/* 도구 모음 */}
        <Flex gap="200" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
          <Button
            variant={selectedTool === TOOLS.SELECT ? 'solid' : 'outline'}
            onClick={() => setSelectedTool(TOOLS.SELECT)}
            title="선택 도구"
          >
            선택
          </Button>
          <Button
            variant={selectedTool === TOOLS.PEN ? 'solid' : 'outline'}
            onClick={() => setSelectedTool(TOOLS.PEN)}
            title="펜"
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant={selectedTool === TOOLS.ERASER ? 'solid' : 'outline'}
            onClick={() => setSelectedTool(TOOLS.ERASER)}
            title="지우개"
          >
            <Eraser size={16} />
          </Button>
          <Button
            variant="outline"
            onClick={() => addShape(TOOLS.RECTANGLE)}
            title="사각형"
          >
            <Square size={16} />
          </Button>
          <Button
            variant="outline"
            onClick={() => addShape(TOOLS.CIRCLE)}
            title="원"
          >
            <Circle size={16} />
          </Button>
          <Button
            variant="outline"
            onClick={() => addShape(TOOLS.TEXT)}
            title="텍스트"
          >
            <Type size={16} />
          </Button>
          <Button
            variant="outline"
            onClick={clearWhiteboard}
            title="전체 지우기"
          >
            <Trash2 size={16} />
          </Button>
          <Button
            variant="outline"
            onClick={downloadWhiteboard}
            title="다운로드"
          >
            <Download size={16} />
          </Button>
        </Flex>

        {/* 색상 및 브러시 크기 */}
        <Flex gap="200" align="center" style={{ marginBottom: '16px' }}>
          <Text>색상:</Text>
          <Flex gap="100">
            {COLORS.map(color => (
              <Box
                key={color}
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: color,
                  border: selectedColor === color ? '2px solid #000' : '1px solid #ccc',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </Flex>
          
          <Text style={{ marginLeft: '20px' }}>브러시 크기:</Text>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            style={{ width: '100px' }}
          />
          <Text>{brushSize}px</Text>
        </Flex>

        {/* Canvas 영역 */}
        <Box style={{ 
          position: 'relative', 
          border: '1px solid #ccc',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <canvas 
            ref={canvasRef}
            style={{ display: 'block' }}
          />
          
          {/* 다른 사용자 커서 표시 */}
          {Object.entries(userCursors).map(([userId, cursor]) => (
            <div
              key={userId}
              style={{
                position: 'absolute',
                left: cursor.x,
                top: cursor.y,
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
            >
              <div style={{
                backgroundColor: '#ff4444',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap'
              }}>
                {cursor.userName}
              </div>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#ff4444',
                borderRadius: '50%',
                margin: '2px auto'
              }} />
            </div>
          ))}
        </Box>
      </Card.Body>
    </Card.Root>
  );
};

export default Whiteboard;