#!/bin/bash

################################################################################
# System Health Check Script
# Purpose: Quick system health verification
# Usage: ./health-check.sh
################################################################################

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASS=0
FAIL=0
WARN=0

# Check function
check() {
    local test_name=$1
    local command=$2
    local expected=$3
    
    echo -n "Checking ${test_name}... "
    
    if eval "$command"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAIL++))
        return 1
    fi
}

# Warning function
warn_check() {
    local test_name=$1
    local command=$2
    
    echo -n "Checking ${test_name}... "
    
    if eval "$command"; then
        echo -e "${GREEN}✓ OK${NC}"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC}"
        ((WARN++))
    fi
}

# Print header
echo -e "${BLUE}=========================================="
echo "    SYSTEM HEALTH CHECK"
echo "========================================${NC}"
echo "Hostname: $(hostname)"
echo "Date: $(date)"
echo ""

# System Checks
echo -e "${BLUE}[System Status]${NC}"
check "System uptime" "uptime > /dev/null 2>&1"
check "Disk space (root < 90%)" "[ \$(df / | awk 'NR==2 {print \$5}' | sed 's/%//') -lt 90 ]"
check "Memory available" "[ \$(free | awk 'NR==2 {print \$7}') -gt 100000 ]"
warn_check "CPU load average < 2.0" "[ \$(uptime | awk -F'load average:' '{print \$2}' | awk -F',' '{print \$1}' | xargs | cut -d'.' -f1) -lt 2 ]"
echo ""

# Service Checks
echo -e "${BLUE}[Services Status]${NC}"
if systemctl list-units --full --all | grep -q "nginx.service"; then
    check "Nginx service" "systemctl is-active --quiet nginx"
fi

if systemctl list-units --full --all | grep -q "mysql.service"; then
    check "MySQL service" "systemctl is-active --quiet mysql"
fi

if systemctl list-units --full --all | grep -q "postgresql.service"; then
    check "PostgreSQL service" "systemctl is-active --quiet postgresql"
fi

if systemctl list-units --full --all | grep -q "apache2.service"; then
    check "Apache service" "systemctl is-active --quiet apache2"
fi

check "SSH service" "systemctl is-active --quiet sshd || systemctl is-active --quiet ssh"
echo ""

# Network Checks
echo -e "${BLUE}[Network Status]${NC}"
check "Internet connectivity" "ping -c 1 8.8.8.8 > /dev/null 2>&1"
check "DNS resolution" "nslookup google.com > /dev/null 2>&1"
check "Firewall status" "ufw status | grep -q 'Status: active' || iptables -L > /dev/null 2>&1"
echo ""

# Security Checks
echo -e "${BLUE}[Security Status]${NC}"
check "Root login disabled" "grep -q '^PermitRootLogin no' /etc/ssh/sshd_config"
warn_check "Password auth disabled" "grep -q '^PasswordAuthentication no' /etc/ssh/sshd_config"
check "Firewall enabled" "ufw status | grep -q 'Status: active'"

# Check for failed login attempts
FAILED_LOGINS=$(grep "Failed password" /var/log/auth.log 2>/dev/null | wc -l)
if [ $FAILED_LOGINS -gt 10 ]; then
    echo -e "Failed login attempts: ${YELLOW}${FAILED_LOGINS} (review auth logs)${NC}"
    ((WARN++))
else
    echo -e "Failed login attempts: ${GREEN}${FAILED_LOGINS}${NC}"
    ((PASS++))
fi
echo ""

# Backup Checks
echo -e "${BLUE}[Backup Status]${NC}"
if [ -d "/backup" ]; then
    LAST_BACKUP=$(find /backup -type f -name "*.tar.gz" -o -name "*.sql.gz" 2>/dev/null | head -1)
    if [ ! -z "$LAST_BACKUP" ]; then
        BACKUP_AGE=$(find /backup -type f -mtime -2 2>/dev/null | wc -l)
        if [ $BACKUP_AGE -gt 0 ]; then
            echo -e "Recent backups: ${GREEN}Found (< 48 hours old)${NC}"
            ((PASS++))
        else
            echo -e "Recent backups: ${YELLOW}Old (> 48 hours)${NC}"
            ((WARN++))
        fi
    else
        echo -e "Recent backups: ${YELLOW}None found${NC}"
        ((WARN++))
    fi
    
    BACKUP_SIZE=$(du -sh /backup 2>/dev/null | awk '{print $1}')
    echo -e "Backup storage used: ${BLUE}${BACKUP_SIZE}${NC}"
else
    echo -e "Backup directory: ${YELLOW}Not found${NC}"
    ((WARN++))
fi
echo ""

# System Resources
echo -e "${BLUE}[Resource Usage]${NC}"
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
echo "CPU Usage: ${CPU_USAGE}%"

MEM_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
echo "Memory Usage: ${MEM_USAGE}%"

DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}')
echo "Disk Usage (root): ${DISK_USAGE}"

LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}')
echo "Load Average:${LOAD_AVG}"
echo ""

# Summary
echo -e "${BLUE}=========================================="
echo "           SUMMARY"
echo "==========================================${NC}"
echo -e "${GREEN}Passed: ${PASS}${NC}"
echo -e "${YELLOW}Warnings: ${WARN}${NC}"
echo -e "${RED}Failed: ${FAIL}${NC}"
echo ""

if [ $FAIL -eq 0 ] && [ $WARN -eq 0 ]; then
    echo -e "${GREEN}System health: EXCELLENT ✓${NC}"
    exit 0
elif [ $FAIL -eq 0 ]; then
    echo -e "${YELLOW}System health: GOOD (with warnings)${NC}"
    exit 0
else
    echo -e "${RED}System health: NEEDS ATTENTION ✗${NC}"
    echo "Please review failed checks above."
    exit 1
fi
