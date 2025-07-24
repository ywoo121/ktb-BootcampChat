#!/bin/bash

# Docker 설치 스크립트 for Amazon Linux 2023
# 실행 권한: chmod +x install-docker.sh

echo "🚀 Docker 설치를 시작합니다..."

# 기존 Docker 패키지 제거 (있다면)
echo "📦 기존 Docker 패키지 제거 중..."
sudo yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 시스템 업데이트
echo "📦 시스템 업데이트 중..."
sudo yum update -y

# Amazon Linux 2023 기본 저장소에서 Docker 설치
echo "🔧 Docker Engine 설치 중..."
sudo yum install -y docker

# 현재 사용자를 docker 그룹에 추가
echo "👤 사용자를 docker 그룹에 추가 중..."
sudo usermod -aG docker $USER

# Docker 서비스 시작 및 활성화
echo "🔄 Docker 서비스 시작 중..."
sudo systemctl start docker
sudo systemctl enable docker

# Docker Compose 설치
echo "📦 Docker Compose 설치 중..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 설치 확인
echo "✅ 설치 확인 중..."
docker --version
docker-compose --version

echo ""
echo "🎉 Docker 설치가 완료되었습니다!"
echo "⚠️  중요: 변경사항을 적용하려면 시스템을 재부팅하거나 새 터미널 세션을 시작하세요."
echo ""
echo "사용 예시:"
echo "  docker --version"
echo "  docker run hello-world"
echo "  docker-compose --version"

# chmod +x install-docker.sh
# ./install-docker.sh 