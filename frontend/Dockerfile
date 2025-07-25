# 베이스 이미지
FROM node:18-alpine

# 작업 디렉토리 생성
WORKDIR /app

# 의존성 관련 파일 먼저 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 앱 소스 복사
COPY . .

# 빌드 실행
RUN npm run build

# 포트 개방
EXPOSE 3000

# 앱 실행
CMD ["npm", "start"]