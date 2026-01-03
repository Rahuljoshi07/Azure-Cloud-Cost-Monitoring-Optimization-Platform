# System Performance Monitoring

## Overview
This document covers system performance monitoring practices including CPU, memory, disk, and network monitoring.

## Real-Time Monitoring Tools

### 1. top Command
```bash
# Basic top command
top

# Sort by memory usage
top -o %MEM

# Show specific user processes
top -u username

# Key metrics to watch:
# - Load average (1, 5, 15 minute averages)
# - CPU usage (%CPU)
# - Memory usage (%MEM)
# - Process states (running, sleeping, stopped)
```

### 2. htop (Interactive Process Viewer)
```bash
# Install htop
sudo apt install -y htop

# Run htop
htop

# Features:
# - F5: Tree view
# - F6: Sort by column
# - F9: Kill process
# - Space: Tag process
```

### 3. System Resource Monitoring

#### CPU Monitoring
```bash
# View CPU information
lscpu
cat /proc/cpuinfo

# Monitor CPU usage
mpstat 1 10  # 10 samples, 1 second apart

# Install sysstat if needed
sudo apt install -y sysstat
```

#### Memory Monitoring
```bash
# Display memory usage
free -h

# Detailed memory information
cat /proc/meminfo

# Monitor memory continuously
watch -n 2 free -h

# Check memory usage by process
ps aux --sort=-%mem | head -10
```

#### Disk Monitoring
```bash
# Display disk usage
df -h

# Display inode usage
df -i

# Check disk usage by directory
du -h --max-depth=1 /var

# Find largest files
find / -type f -size +100M 2>/dev/null

# Monitor disk I/O
iostat -x 2

# Real-time disk activity
sudo iotop
```

#### Network Monitoring
```bash
# Display network interfaces
ip addr show
ifconfig

# Monitor network traffic
sudo iftop

# Check network statistics
netstat -i
ss -s

# Monitor bandwidth usage
sudo apt install -y nload
nload
```

## System Logs Monitoring

### 1. System Logs
```bash
# View system logs
sudo journalctl -f

# View logs for specific service
sudo journalctl -u nginx -f
sudo journalctl -u mysql -f

# View logs from last boot
sudo journalctl -b

# View logs with priority
sudo journalctl -p err -b
```

### 2. Application Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo tail -f /var/log/syslog
sudo tail -f /var/log/auth.log

# MySQL logs
sudo tail -f /var/log/mysql/error.log
```

## Cloud Platform Monitoring

### AWS CloudWatch
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure CloudWatch agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard

# Start CloudWatch agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json
```

### GCP Cloud Monitoring
```bash
# Install monitoring agent
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install

# Check agent status
sudo systemctl status google-cloud-ops-agent
```

## Custom Monitoring Script

### Create monitoring script
```bash
# Create script file
vim ~/monitor.sh
```

Content of `monitor.sh`:
```bash
#!/bin/bash

# System Monitoring Script
echo "===== System Monitoring Report ====="
echo "Generated: $(date)"
echo ""

# CPU Load
echo "--- CPU Load ---"
uptime
echo ""

# Memory Usage
echo "--- Memory Usage ---"
free -h
echo ""

# Disk Usage
echo "--- Disk Usage ---"
df -h | grep -v tmpfs
echo ""

# Top 5 CPU Processes
echo "--- Top 5 CPU Processes ---"
ps aux --sort=-%cpu | head -6
echo ""

# Top 5 Memory Processes
echo "--- Top 5 Memory Processes ---"
ps aux --sort=-%mem | head -6
echo ""

# Network Connections
echo "--- Active Network Connections ---"
netstat -an | grep ESTABLISHED | wc -l
echo "active connections"
echo ""

# Disk I/O
echo "--- Disk I/O ---"
iostat -x 1 2 | tail -n +4
echo ""
```

Make script executable:
```bash
chmod +x ~/monitor.sh
```

## Setting Up Alerts

### 1. CPU Alert Script
```bash
#!/bin/bash
# Alert if CPU usage exceeds 80%

THRESHOLD=80
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)

if (( $(echo "$CPU_USAGE > $THRESHOLD" | bc -l) )); then
    echo "HIGH CPU ALERT: ${CPU_USAGE}% usage detected" | \
    mail -s "CPU Alert" admin@example.com
fi
```

### 2. Disk Space Alert Script
```bash
#!/bin/bash
# Alert if disk usage exceeds 80%

THRESHOLD=80
CURRENT=$(df -h / | grep / | awk '{print $5}' | sed 's/%//g')

if [ "$CURRENT" -gt "$THRESHOLD" ]; then
    echo "DISK ALERT: ${CURRENT}% disk usage" | \
    mail -s "Disk Space Alert" admin@example.com
fi
```

### 3. Schedule Monitoring with Cron
```bash
# Edit crontab
crontab -e

# Add monitoring jobs
# Run monitoring script every 5 minutes
*/5 * * * * /home/user/monitor.sh >> /var/log/monitoring.log 2>&1

# Check disk space every hour
0 * * * * /home/user/disk-alert.sh

# Check CPU usage every 10 minutes
*/10 * * * * /home/user/cpu-alert.sh
```

## Monitoring Dashboards

### System Performance Baseline
Create a baseline document with normal metrics:
```
Normal Operating Conditions:
- CPU Usage: 15-30%
- Memory Usage: 40-60%
- Disk Usage: < 70%
- Load Average: < 2.0 (for 2-core system)
- Network Traffic: 10-50 Mbps
```

## Performance Optimization Actions

### When to Take Action
1. **CPU > 80%**: Identify and optimize resource-intensive processes
2. **Memory > 85%**: Consider adding more RAM or optimizing applications
3. **Disk > 80%**: Clean up logs, old files, or add more storage
4. **High Load Average**: Investigate running processes and services

## Key Learnings
1. **Proactive monitoring**: Regular monitoring prevents system failures
2. **Baseline metrics**: Understanding normal system behavior helps identify issues
3. **Multiple tools**: Different tools provide different insights
4. **Automation**: Scripts and cron jobs enable continuous monitoring
5. **Cloud integration**: Cloud platform monitoring provides additional insights

## Next Steps
- Configure [Security and Access Control](security.md)
- Set up [Backup and Recovery](backup-recovery.md)
- Review [Troubleshooting Guide](troubleshooting.md)
