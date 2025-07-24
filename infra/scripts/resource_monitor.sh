#!/bin/bash

# 시스템 리소스 모니터링 및 리포트 생성 스크립트
# 작성자: System Admin
# 날짜: $(date +%Y-%m-%d)

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 설정
REPORT_DIR="/home/ec2-user/reports"
LOG_FILE="$REPORT_DIR/resource_monitor.log"
REPORT_FILE="$REPORT_DIR/resource_report_$(date +%Y%m%d_%H%M%S).txt"

# 디렉토리 생성
mkdir -p "$REPORT_DIR"

# 로그 함수
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# 경고 함수
check_warning() {
    local value=$1
    local threshold=$2
    local message=$3
    
    if (( $(echo "$value >= $threshold" | bc -l) )); then
        echo -e "${RED}⚠️  경고: $message${NC}"
        return 1
    else
        echo -e "${GREEN}✅ 정상: $message${NC}"
        return 0
    fi
}

# 시스템 정보 수집
collect_system_info() {
    log_message "시스템 정보 수집 시작"
    
    echo "==========================================" >> "$REPORT_FILE"
    echo "           시스템 리소스 리포트" >> "$REPORT_FILE"
    echo "==========================================" >> "$REPORT_FILE"
    echo "생성 시간: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # 시스템 기본 정보
    echo "📋 시스템 기본 정보" >> "$REPORT_FILE"
    echo "------------------------------------------" >> "$REPORT_FILE"
    echo "호스트명: $(hostname)" >> "$REPORT_FILE"
    echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)" >> "$REPORT_FILE"
    echo "커널: $(uname -r)" >> "$REPORT_FILE"
    echo "아키텍처: $(uname -m)" >> "$REPORT_FILE"
    echo "가동 시간: $(uptime -p)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# CPU 정보 수집
collect_cpu_info() {
    log_message "CPU 정보 수집"
    
    echo "🖥️  CPU 정보" >> "$REPORT_FILE"
    echo "------------------------------------------" >> "$REPORT_FILE"
    
    # CPU 사용률
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    echo "CPU 사용률: ${cpu_usage}%" >> "$REPORT_FILE"
    
    # 로드 평균
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    echo "로드 평균 (1분): $load_avg" >> "$REPORT_FILE"
    
    # CPU 상세 정보
    echo "CPU 모델: $(lscpu | grep 'Model name' | cut -d':' -f2 | xargs)" >> "$REPORT_FILE"
    echo "CPU 코어 수: $(nproc)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # 경고 체크
    check_warning "$cpu_usage" 80 "CPU 사용률이 높습니다 (${cpu_usage}%)"
    check_warning "$load_avg" 2 "시스템 로드가 높습니다 ($load_avg)"
}

# 메모리 정보 수집
collect_memory_info() {
    log_message "메모리 정보 수집"
    
    echo "💾 메모리 정보" >> "$REPORT_FILE"
    echo "------------------------------------------" >> "$REPORT_FILE"
    
    # 메모리 사용량
    total_mem=$(free -m | awk 'NR==2{printf "%.1f", $2/1024}')
    used_mem=$(free -m | awk 'NR==2{printf "%.1f", $3/1024}')
    free_mem=$(free -m | awk 'NR==2{printf "%.1f", $4/1024}')
    available_mem=$(free -m | awk 'NR==2{printf "%.1f", $7/1024}')
    
    mem_usage_percent=$(echo "scale=1; $used_mem * 100 / $total_mem" | bc)
    
    echo "총 메모리: ${total_mem}GB" >> "$REPORT_FILE"
    echo "사용 중: ${used_mem}GB (${mem_usage_percent}%)" >> "$REPORT_FILE"
    echo "사용 가능: ${available_mem}GB" >> "$REPORT_FILE"
    echo "여유 메모리: ${free_mem}GB" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # 스왑 정보
    swap_total=$(free -m | awk 'NR==3{printf "%.1f", $2/1024}')
    swap_used=$(free -m | awk 'NR==3{printf "%.1f", $3/1024}')
    
    if [ "$swap_total" != "0.0" ]; then
        swap_usage_percent=$(echo "scale=1; $swap_used * 100 / $swap_total" | bc)
        echo "스왑 총량: ${swap_total}GB" >> "$REPORT_FILE"
        echo "스왑 사용: ${swap_used}GB (${swap_usage_percent}%)" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        check_warning "$swap_usage_percent" 50 "스왑 사용률이 높습니다 (${swap_usage_percent}%)"
    else
        echo "스왑: 비활성화됨" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
    
    # 경고 체크
    check_warning "$mem_usage_percent" 80 "메모리 사용률이 높습니다 (${mem_usage_percent}%)"
}

# 디스크 정보 수집
collect_disk_info() {
    log_message "디스크 정보 수집"
    
    echo "💿 디스크 정보" >> "$REPORT_FILE"
    echo "------------------------------------------" >> "$REPORT_FILE"
    
    # 디스크 사용량
    df -h | grep -E '^/dev/' | while read line; do
        filesystem=$(echo $line | awk '{print $1}')
        size=$(echo $line | awk '{print $2}')
        used=$(echo $line | awk '{print $3}')
        available=$(echo $line | awk '{print $4}')
        usage_percent=$(echo $line | awk '{print $5}' | sed 's/%//')
        mount_point=$(echo $line | awk '{print $6}')
        
        echo "파일시스템: $filesystem" >> "$REPORT_FILE"
        echo "  마운트 포인트: $mount_point" >> "$REPORT_FILE"
        echo "  크기: $size, 사용: $used, 여유: $available" >> "$REPORT_FILE"
        echo "  사용률: ${usage_percent}%" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        # 경고 체크
        check_warning "$usage_percent" 80 "디스크 사용률이 높습니다 ($filesystem: ${usage_percent}%)"
    done
}

# 네트워크 정보 수집
collect_network_info() {
    log_message "네트워크 정보 수집"
    
    echo "🌐 네트워크 정보" >> "$REPORT_FILE"
    echo "------------------------------------------" >> "$REPORT_FILE"
    
    # 네트워크 인터페이스
    echo "네트워크 인터페이스:" >> "$REPORT_FILE"
    ip addr show | grep -E "^[0-9]+:" | while read line; do
        interface=$(echo $line | awk '{print $2}' | sed 's/://')
        echo "  $interface" >> "$REPORT_FILE"
    done
    echo "" >> "$REPORT_FILE"
    
    # 열린 포트
    echo "열린 포트:" >> "$REPORT_FILE"
    netstat -tuln | grep LISTEN | head -10 | while read line; do
        protocol=$(echo $line | awk '{print $1}')
        local_address=$(echo $line | awk '{print $4}')
        echo "  $protocol $local_address" >> "$REPORT_FILE"
    done
    echo "" >> "$REPORT_FILE"
}

# 프로세스 정보 수집
collect_process_info() {
    log_message "프로세스 정보 수집"
    
    echo "⚙️  상위 프로세스 (CPU 사용률 기준)" >> "$REPORT_FILE"
    echo "------------------------------------------" >> "$REPORT_FILE"
    
    ps aux --sort=-%cpu | head -6 | tail -5 | while read line; do
        user=$(echo $line | awk '{print $1}')
        pid=$(echo $line | awk '{print $2}')
        cpu=$(echo $line | awk '{print $3}')
        mem=$(echo $line | awk '{print $4}')
        command=$(echo $line | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}')
        
        echo "사용자: $user, PID: $pid, CPU: ${cpu}%, 메모리: ${mem}%" >> "$REPORT_FILE"
        echo "  명령어: $command" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    done
    
    echo "⚙️  상위 프로세스 (메모리 사용률 기준)" >> "$REPORT_FILE"
    echo "------------------------------------------" >> "$REPORT_FILE"
    
    ps aux --sort=-%mem | head -6 | tail -5 | while read line; do
        user=$(echo $line | awk '{print $1}')
        pid=$(echo $line | awk '{print $2}')
        cpu=$(echo $line | awk '{print $3}')
        mem=$(echo $line | awk '{print $4}')
        command=$(echo $line | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}')
        
        echo "사용자: $user, PID: $pid, CPU: ${cpu}%, 메모리: ${mem}%" >> "$REPORT_FILE"
        echo "  명령어: $command" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    done
}

# 서비스 상태 확인
check_services() {
    log_message "서비스 상태 확인"
    
    echo "🔧 주요 서비스 상태" >> "$REPORT_FILE"
    echo "------------------------------------------" >> "$REPORT_FILE"
    
    # 주요 서비스 목록
    services=("sshd" "docker" "mongod" "redis-server")
    
    for service in "${services[@]}"; do
        if pgrep -x "$service" > /dev/null; then
            echo "✅ $service: 실행 중" >> "$REPORT_FILE"
        else
            echo "❌ $service: 중지됨" >> "$REPORT_FILE"
        fi
    done
    echo "" >> "$REPORT_FILE"
}

# 리포트 요약 생성
generate_summary() {
    log_message "리포트 요약 생성"
    
    echo "📊 시스템 상태 요약" >> "$REPORT_FILE"
    echo "==========================================" >> "$REPORT_FILE"
    
    # CPU 사용률
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    echo "CPU 사용률: ${cpu_usage}%" >> "$REPORT_FILE"
    
    # 메모리 사용률
    total_mem=$(free -m | awk 'NR==2{printf "%.1f", $2/1024}')
    used_mem=$(free -m | awk 'NR==2{printf "%.1f", $3/1024}')
    mem_usage_percent=$(echo "scale=1; $used_mem * 100 / $total_mem" | bc)
    echo "메모리 사용률: ${mem_usage_percent}%" >> "$REPORT_FILE"
    
    # 디스크 사용률 (루트 파티션)
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    echo "디스크 사용률 (루트): ${disk_usage}%" >> "$REPORT_FILE"
    
    # 로드 평균
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    echo "로드 평균: $load_avg" >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    echo "리포트 파일: $REPORT_FILE" >> "$REPORT_FILE"
    echo "로그 파일: $LOG_FILE" >> "$REPORT_FILE"
}

# 메인 함수
main() {
    log_message "리소스 모니터링 시작"
    
    # 리포트 파일 초기화
    > "$REPORT_FILE"
    
    # 정보 수집
    collect_system_info
    collect_cpu_info
    collect_memory_info
    collect_disk_info
    collect_network_info
    collect_process_info
    check_services
    generate_summary
    
    log_message "리소스 모니터링 완료"
    
    echo -e "${GREEN}✅ 리소스 리포트가 생성되었습니다:${NC}"
    echo -e "${BLUE}📄 리포트 파일: $REPORT_FILE${NC}"
    echo -e "${BLUE}📝 로그 파일: $LOG_FILE${NC}"
    
    # 리포트 내용 미리보기
    echo -e "${CYAN}📋 리포트 미리보기:${NC}"
    echo "------------------------------------------"
    head -20 "$REPORT_FILE"
    echo "..."
    tail -10 "$REPORT_FILE"
}

# 스크립트 실행
main "$@" 