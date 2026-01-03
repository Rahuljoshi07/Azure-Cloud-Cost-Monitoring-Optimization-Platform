#!/bin/bash

################################################################################
# System Monitoring Script
# Purpose: Monitor system resources and generate reports
# Usage: ./monitor.sh [--log] [--alert]
################################################################################

# Configuration
LOG_FILE="/var/log/monitoring.log"
ALERT_EMAIL="admin@example.com"
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=80

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Flags
LOG_OUTPUT=false
SEND_ALERTS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --log)
            LOG_OUTPUT=true
            shift
            ;;
        --alert)
            SEND_ALERTS=true
            shift
            ;;
        *)
            echo "Usage: $0 [--log] [--alert]"
            exit 1
            ;;
    esac
done

# Function to print header
print_header() {
    echo "=========================================="
    echo "$1"
    echo "=========================================="
}

# Function to check and alert
check_threshold() {
    local value=$1
    local threshold=$2
    local metric=$3
    
    if (( $(echo "$value > $threshold" | bc -l) )); then
        echo -e "${RED}⚠ WARNING: ${metric} is at ${value}% (threshold: ${threshold}%)${NC}"
        if [ "$SEND_ALERTS" = true ]; then
            echo "Alert: ${metric} at ${value}%" | mail -s "System Alert: High ${metric}" $ALERT_EMAIL
        fi
        return 1
    else
        echo -e "${GREEN}✓ ${metric}: ${value}% (Normal)${NC}"
        return 0
    fi
}

# Start monitoring report
{
    print_header "SYSTEM MONITORING REPORT"
    echo "Generated: $(date)"
    echo "Hostname: $(hostname)"
    echo ""

    # System Uptime
    print_header "SYSTEM UPTIME"
    uptime
    echo ""

    # CPU Usage
    print_header "CPU USAGE"
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    echo "Current CPU Usage: ${CPU_USAGE}%"
    check_threshold "$CPU_USAGE" "$CPU_THRESHOLD" "CPU Usage"
    echo ""
    echo "Top 5 CPU-consuming processes:"
    ps aux --sort=-%cpu | head -6 | tail -5
    echo ""

    # Memory Usage
    print_header "MEMORY USAGE"
    MEMORY_TOTAL=$(free -m | awk 'NR==2{print $2}')
    MEMORY_USED=$(free -m | awk 'NR==2{print $3}')
    MEMORY_PERCENT=$(awk "BEGIN {printf \"%.2f\", ($MEMORY_USED/$MEMORY_TOTAL)*100}")
    
    echo "Memory: ${MEMORY_USED}MB / ${MEMORY_TOTAL}MB (${MEMORY_PERCENT}%)"
    check_threshold "$MEMORY_PERCENT" "$MEMORY_THRESHOLD" "Memory Usage"
    echo ""
    free -h
    echo ""
    echo "Top 5 memory-consuming processes:"
    ps aux --sort=-%mem | head -6 | tail -5
    echo ""

    # Disk Usage
    print_header "DISK USAGE"
    while IFS= read -r line; do
        PARTITION=$(echo $line | awk '{print $1}')
        USAGE=$(echo $line | awk '{print $5}' | sed 's/%//')
        MOUNTPOINT=$(echo $line | awk '{print $6}')
        
        if [ ! -z "$USAGE" ] && [ "$USAGE" != "Use%" ]; then
            echo "Partition: $PARTITION (mounted on $MOUNTPOINT)"
            echo "$line"
            check_threshold "$USAGE" "$DISK_THRESHOLD" "Disk Usage ($MOUNTPOINT)"
            echo ""
        fi
    done < <(df -h | grep -E '^/dev/')
    echo ""

    # Load Average
    print_header "LOAD AVERAGE"
    LOAD_1=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | xargs)
    LOAD_5=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $2}' | xargs)
    LOAD_15=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $3}' | xargs)
    CPU_CORES=$(nproc)
    
    echo "1 min:  $LOAD_1"
    echo "5 min:  $LOAD_5"
    echo "15 min: $LOAD_15"
    echo "CPU Cores: $CPU_CORES"
    echo ""

    # Network Statistics
    print_header "NETWORK STATISTICS"
    echo "Active connections:"
    ESTABLISHED=$(netstat -an 2>/dev/null | grep ESTABLISHED | wc -l)
    echo "  ESTABLISHED: $ESTABLISHED"
    echo ""
    echo "Network interfaces:"
    ip -brief addr show
    echo ""

    # Running Services
    print_header "CRITICAL SERVICES STATUS"
    for service in nginx mysql postgresql apache2; do
        if systemctl list-units --full --all | grep -q "$service.service"; then
            STATUS=$(systemctl is-active $service 2>/dev/null || echo "not-installed")
            if [ "$STATUS" = "active" ]; then
                echo -e "${GREEN}✓ $service: $STATUS${NC}"
            else
                echo -e "${YELLOW}⚠ $service: $STATUS${NC}"
            fi
        fi
    done
    echo ""

    # Disk I/O
    print_header "DISK I/O STATISTICS"
    iostat -x 1 2 | tail -n +4
    echo ""

    # Recent Failed Login Attempts
    print_header "RECENT FAILED LOGIN ATTEMPTS (Last 10)"
    if [ -f /var/log/auth.log ]; then
        grep "Failed password" /var/log/auth.log 2>/dev/null | tail -10 || echo "No recent failed attempts"
    else
        echo "Auth log not available"
    fi
    echo ""

    # Last System Reboot
    print_header "LAST SYSTEM REBOOT"
    who -b
    echo ""

    print_header "MONITORING COMPLETE"

} | if [ "$LOG_OUTPUT" = true ]; then
    tee -a "$LOG_FILE"
else
    cat
fi

echo ""
echo "Tip: Run with --log to save output to $LOG_FILE"
echo "Tip: Run with --alert to send email alerts when thresholds are exceeded"
