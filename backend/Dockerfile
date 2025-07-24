# 1. Node.js 20 공식 이미지 사용
FROM node:20

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 의존성 설치를 위해 package.json 및 package-lock.json 복사
COPY package.json package-lock.json ./

# 4. 의존성 설치
RUN npm install

# 5. 애플리케이션 파일 복사
COPY . .

# 6. 환경변수 파일 복사 (필요 시 주석 제거)
COPY .env .env

# 7. 컨테이너가 바인딩할 포트 정의
EXPOSE 5000

# 8. 애플리케이션 실행 명령어
CMD ["node", "server.js"]