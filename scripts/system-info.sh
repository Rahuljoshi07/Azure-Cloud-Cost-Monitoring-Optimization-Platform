#!/bin/bash

################################################################################
# System Information Script
# Purpose: Display comprehensive system information
# Usage: ./system-info.sh
################################################################################

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Print section header
section() {
    echo -e "\n${BLUE}=========================================="
    echo "$1"
    echo -e "==========================================${NC}"
}

# System Overview
section "SYSTEM OVERVIEW"
echo "Hostname:        $(hostname)"
echo "Domain:          $(hostname -d 2>/dev/null || echo 'N/A')"
echo "OS:              $(lsb_release -d 2>/dev/null | cut -f2 || cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "Kernel:          $(uname -r)"
echo "Architecture:    $(uname -m)"
echo "Uptime:          $(uptime -p)"
echo "Current Time:    $(date)"
echo "Timezone:        $(timedatectl 2>/dev/null | grep "Time zone" | awk '{print $3}' || cat /etc/timezone)"
echo "Last Boot:       $(who -b | awk '{print $3, $4}')"

# Hardware Information
section "HARDWARE INFORMATION"
echo "CPU Model:       $(lscpu | grep "Model name" | cut -d':' -f2 | xargs)"
echo "CPU Cores:       $(nproc)"
echo "CPU MHz:         $(lscpu | grep "CPU MHz" | cut -d':' -f2 | xargs)"
echo "Total Memory:    $(free -h | awk 'NR==2{print $2}')"
echo "Total Swap:      $(free -h | awk 'NR==3{print $2}')"

# Disk Information
section "DISK INFORMATION"
df -h | grep -E '^/dev/' | awk '{printf "%-20s %-10s %-10s %-10s %-6s %s\n", $1, $2, $3, $4, $5, $6}'

# Network Information
section "NETWORK INFORMATION"
echo "Network Interfaces:"
ip -brief addr show | while read line; do
    echo "  $line"
done

echo -e "\nDefault Gateway:"
ip route | grep default | awk '{print "  " $0}'

echo -e "\nDNS Servers:"
if [ -f /etc/resolv.conf ]; then
    grep nameserver /etc/resolv.conf | awk '{print "  " $2}'
fi

echo -e "\nPublic IP:"
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "Unable to determine")
echo "  $PUBLIC_IP"

# Current Resource Usage
section "CURRENT RESOURCE USAGE"
echo "CPU Usage:       $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo "Memory Usage:    $(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
echo "Swap Usage:      $(free | awk 'NR==3{printf "%.1f%%", $3*100/$2}')"
echo "Disk Usage (/):"
df -h / | awk 'NR==2{printf "  Used: %s / %s (%s)\n", $3, $2, $5}'

LOAD=$(uptime | awk -F'load average:' '{print $2}')
echo "Load Average:   ${LOAD}"

# Running Services
section "RUNNING SERVICES"
systemctl list-units --type=service --state=running --no-pager --no-legend | wc -l | xargs echo "Total running services:"

echo -e "\nKey Services:"
for service in nginx apache2 mysql postgresql ssh sshd ufw docker; do
    if systemctl list-units --full --all | grep -q "$service.service"; then
        STATUS=$(systemctl is-active $service 2>/dev/null || echo "inactive")
        if [ "$STATUS" = "active" ]; then
            echo -e "  ${GREEN}✓${NC} $service: $STATUS"
        else
            echo -e "  ${YELLOW}○${NC} $service: $STATUS"
        fi
    fi
done

# User Information
section "USER INFORMATION"
echo "Current User:    $(whoami)"
echo "User Groups:     $(groups)"
echo "Home Directory:  $HOME"
echo -e "\nLogged In Users:"
who | awk '{print "  " $1 " from " $5 " at " $3 " " $4}'

echo -e "\nTotal Users:     $(cat /etc/passwd | wc -l)"
echo "Regular Users:   $(cat /etc/passwd | awk -F: '$3 >= 1000 {print $1}' | wc -l)"

# Security Status
section "SECURITY STATUS"
echo "Firewall (UFW):  $(ufw status 2>/dev/null | head -1 | awk '{print $2}' || echo 'Not installed')"
echo "SELinux:         $(getenforce 2>/dev/null || echo 'Not installed')"

echo -e "\nSSH Configuration:"
if [ -f /etc/ssh/sshd_config ]; then
    ROOT_LOGIN=$(grep "^PermitRootLogin" /etc/ssh/sshd_config | awk '{print $2}' || echo "default")
    PASS_AUTH=$(grep "^PasswordAuthentication" /etc/ssh/sshd_config | awk '{print $2}' || echo "default")
    echo "  Root Login:          $ROOT_LOGIN"
    echo "  Password Auth:       $PASS_AUTH"
fi

echo -e "\nRecent Failed Login Attempts (last 24h):"
if [ -f /var/log/auth.log ]; then
    FAILED=$(grep "Failed password" /var/log/auth.log 2>/dev/null | wc -l)
    echo "  $FAILED attempts"
fi

# Package Information
section "PACKAGE INFORMATION"
if command -v apt &> /dev/null; then
    echo "Package Manager: APT (Debian/Ubuntu)"
    echo "Installed:       $(dpkg -l | grep ^ii | wc -l) packages"
    echo -e "\nUpdates Available:"
    apt list --upgradable 2>/dev/null | grep -v "Listing" | wc -l | xargs echo "  "
elif command -v yum &> /dev/null; then
    echo "Package Manager: YUM (RHEL/CentOS)"
    echo "Installed:       $(yum list installed 2>/dev/null | wc -l) packages"
fi

# Process Information
section "PROCESS INFORMATION"
echo "Total Processes: $(ps aux | wc -l)"
echo "Running:         $(ps aux | awk '$8 == "R" || $8 == "R+" {print}' | wc -l)"
echo "Sleeping:        $(ps aux | awk '$8 == "S" || $8 == "S+" {print}' | wc -l)"
echo "Zombie:          $(ps aux | awk '$8 == "Z" {print}' | wc -l)"

echo -e "\nTop 5 CPU Processes:"
ps aux --sort=-%cpu | head -6 | tail -5 | awk '{printf "  %-10s %-6s %s\n", $11, $3"%", $1}'

echo -e "\nTop 5 Memory Processes:"
ps aux --sort=-%mem | head -6 | tail -5 | awk '{printf "  %-10s %-6s %s\n", $11, $4"%", $1}'

# Cloud Provider Detection
section "CLOUD PROVIDER"
if [ -f /sys/hypervisor/uuid ] && [ "$(head -c 3 /sys/hypervisor/uuid)" = "ec2" ]; then
    echo "Provider:        Amazon Web Services (AWS)"
    echo "Instance ID:     $(ec2-metadata --instance-id 2>/dev/null | cut -d' ' -f2 || echo 'N/A')"
    echo "Instance Type:   $(ec2-metadata --instance-type 2>/dev/null | cut -d' ' -f2 || echo 'N/A')"
    echo "Region:          $(ec2-metadata --availability-zone 2>/dev/null | cut -d' ' -f2 || echo 'N/A')"
elif curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/id &>/dev/null; then
    echo "Provider:        Google Cloud Platform (GCP)"
    echo "Instance ID:     $(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/id)"
    echo "Instance Name:   $(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/name)"
    echo "Zone:            $(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/zone | cut -d'/' -f4)"
else
    echo "Provider:        On-premises / Unknown"
fi

# System Warnings
section "SYSTEM WARNINGS"
WARNINGS=0

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo -e "${YELLOW}⚠${NC} Disk usage is above 80%: ${DISK_USAGE}%"
    ((WARNINGS++))
fi

# Check memory
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEM_USAGE -gt 85 ]; then
    echo -e "${YELLOW}⚠${NC} Memory usage is above 85%: ${MEM_USAGE}%"
    ((WARNINGS++))
fi

# Check old backups
if [ -d /backup ]; then
    OLD_BACKUPS=$(find /backup -type f -mtime +7 2>/dev/null | wc -l)
    if [ $OLD_BACKUPS -eq 0 ]; then
        echo -e "${YELLOW}⚠${NC} No recent backups found (< 7 days)"
        ((WARNINGS++))
    fi
fi

if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}No warnings detected${NC}"
fi

echo -e "\n${BLUE}=========================================="
echo "Report generated: $(date)"
echo -e "==========================================${NC}\n"
