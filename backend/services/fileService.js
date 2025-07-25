// 깔끔한 파일 서비스 (RAG 기능 제거됨)

/**
 * 파일 관련 유틸리티 함수들
 */

/**
 * 파일 크기를 읽기 쉬운 형태로 변환
 * @param {number} bytes - 파일 크기 (바이트)
 * @returns {string} 읽기 쉬운 크기 (예: "1.5 MB")
 */
exports.formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 파일 확장자에서 MIME 타입 추정
 * @param {string} filename - 파일명
 * @returns {string} MIME 타입
 */
exports.getMimeTypeFromExtension = (filename) => {
  const extension = filename.toLowerCase().split('.').pop();
  
  const mimeTypes = {
    // 이미지
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    
    // 동영상
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'avi': 'video/x-msvideo',
    
    // 문서
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'json': 'application/json',
    'csv': 'text/csv',
    'xml': 'application/xml',
    
    // 오피스
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

/**
 * 파일이 이미지인지 확인
 * @param {string} mimetype - MIME 타입
 * @returns {boolean} 이미지 여부
 */
exports.isImage = (mimetype) => {
  return mimetype.startsWith('image/');
};

/**
 * 파일이 동영상인지 확인
 * @param {string} mimetype - MIME 타입
 * @returns {boolean} 동영상 여부
 */
exports.isVideo = (mimetype) => {
  return mimetype.startsWith('video/');
};

/**
 * 파일이 문서인지 확인
 * @param {string} mimetype - MIME 타입
 * @returns {boolean} 문서 여부
 */
exports.isDocument = (mimetype) => {
  const documentTypes = [
    'application/pdf',
    'text/plain',
    'application/json',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  return documentTypes.includes(mimetype) || mimetype.startsWith('text/');
};