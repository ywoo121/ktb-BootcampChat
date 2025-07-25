# STT (Speech-to-Text) 기능 사용 가이드

## 개요
OpenAI의 Whisper AI를 사용하여 음성을 텍스트로 변환하는 기능을 구현했습니다.

## 백엔드 구성

### 1. STT 서비스 (`backend/services/sttService.js`)
- OpenAI Whisper API를 사용한 음성 변환 서비스
- 지원 형식: mp3, mp4, m4a, wav, webm, ogg, flac
- 최대 파일 크기: 25MB
- 언어 지원: 한국어 우선, 다국어 지원

### 2. STT API 엔드포인트 (`backend/routes/api/stt.js`)
- `POST /api/stt/transcribe` - 음성 파일을 텍스트로 변환
- `GET /api/stt/supported-formats` - 지원 형식 조회

## 프론트엔드 구성

### 1. STT 서비스 (`frontend/services/sttService.js`)
- 브라우저 MediaRecorder API를 사용한 음성 녹음
- 실시간 음성 녹음 및 파일 업로드
- 자동 마이크 권한 요청

### 2. VoiceRecorder 컴포넌트 (`frontend/components/chat/VoiceRecorder.js`)
- 음성 녹음 UI 컴포넌트
- 녹음 시작/중지, 재생, 변환 기능
- 실시간 타이머 표시

### 3. ChatInput 통합
- 채팅 입력창에 음성 녹음 버튼 추가
- 음성을 텍스트로 변환 후 자동으로 입력창에 삽입

## 사용 방법

### 1. 환경 설정
```bash
# 백엔드 의존성 설치
cd backend
npm install

# OpenAI API 키 설정 (backend/config/keys.js)
openaiApiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key'
```

### 2. 기본 사용법
1. 채팅 입력창의 마이크 버튼 클릭
2. 브라우저에서 마이크 권한 허용
3. 녹음 버튼을 눌러 음성 녹음 시작
4. 중지 버튼을 눌러 녹음 종료
5. 자동으로 음성이 텍스트로 변환되어 입력창에 삽입

### 3. 고급 기능
- **재생**: 녹음된 음성을 재생하여 확인
- **다시 변환**: 변환 결과가 만족스럽지 않을 때 재변환
- **언어 설정**: 기본 한국어, 필요시 다른 언어 지원

## API 사용 예제

### 음성 변환 API 호출
```javascript
const formData = new FormData();
formData.append('audio', audioFile, 'recording.webm');
formData.append('language', 'ko');

const response = await fetch('/api/stt/transcribe', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
console.log('변환된 텍스트:', result.data.text);
```

### 지원 형식 조회
```javascript
const response = await fetch('/api/stt/supported-formats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const formats = await response.json();
console.log('지원 형식:', formats.data.formats);
```

## 브라우저 호환성
- Chrome/Edge: 완전 지원
- Firefox: 지원 (일부 제한)
- Safari: iOS 14.3+ 지원
- 모바일: Android Chrome, iOS Safari 지원

## 주의사항
1. **마이크 권한**: 첫 사용 시 브라우저에서 마이크 권한 허용 필요
2. **HTTPS 필요**: 보안상 HTTPS 환경에서만 동작
3. **파일 크기 제한**: 25MB 이하의 음성 파일만 지원
4. **API 비용**: OpenAI Whisper API 사용료 발생

## 에러 처리
- 마이크 권한 거부
- 지원되지 않는 브라우저
- 네트워크 오류
- API 한도 초과
- 파일 크기 초과

## 향후 개선사항
- 실시간 스트리밍 변환 (Whisper API 지원 시)
- 다국어 자동 감지
- 음성 품질 개선
- 배경 소음 제거
