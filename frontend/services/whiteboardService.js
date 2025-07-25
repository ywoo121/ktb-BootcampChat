import axios from './axios';

class WhiteboardService {
  // 화이트보드 데이터 가져오기
  async getWhiteboardData(roomId) {
    try {
      const response = await axios.get(`/api/whiteboard/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('Get whiteboard data error:', error);
      throw error;
    }
  }

  // 화이트보드 데이터 저장
  async saveWhiteboardData(roomId, data) {
    try {
      const response = await axios.put(`/api/whiteboard/${roomId}`, { data });
      return response.data;
    } catch (error) {
      console.error('Save whiteboard data error:', error);
      throw error;
    }
  }

  // 화이트보드 초기화
  async clearWhiteboard(roomId) {
    try {
      const response = await axios.delete(`/api/whiteboard/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('Clear whiteboard error:', error);
      throw error;
    }
  }

  // 화이트보드 이미지 다운로드
  downloadWhiteboardImage(canvas, roomId) {
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1
    });

    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // JSON 파일로 화이트보드 데이터 내보내기
  exportWhiteboardData(canvas, roomId) {
    if (!canvas) return;

    const data = JSON.stringify(canvas.toJSON(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `whiteboard-data-${roomId}-${Date.now()}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // JSON 파일에서 화이트보드 데이터 가져오기
  importWhiteboardData(file, canvas) {
    return new Promise((resolve, reject) => {
      if (!file || !canvas) {
        reject(new Error('파일과 캔버스가 필요합니다.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          canvas.loadFromJSON(data, () => {
            canvas.renderAll();
            resolve(data);
          });
        } catch (error) {
          reject(new Error('잘못된 파일 형식입니다.'));
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'));
      reader.readAsText(file);
    });
  }
}

export default new WhiteboardService();