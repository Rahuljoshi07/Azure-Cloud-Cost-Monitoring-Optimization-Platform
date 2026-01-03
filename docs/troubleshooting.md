# Troubleshooting Guide

## Overview
Common issues encountered in Linux-based cloud system administration and their solutions.

## System Performance Issues

### High CPU Usage

#### Symptoms
- System slow or unresponsive
- Load average > number of CPU cores
- High CPU percentage in top/htop

#### Diagnosis
```bash
# Check CPU usage
top
htop

# Find processes consuming most CPU
ps aux --sort=-%cpu | head -10

# Check load average
uptime
cat /proc/loadavg

# Monitor CPU usage over time
sar -u 5 10  # 10 samples, 5 seconds apart
```

#### Solutions
```bash
# Identify and kill problematic process
ps aux | grep process_name
sudo kill -9 PID

# Restart service if it's consuming too much CPU
sudo systemctl restart service_name

# Check for runaway cron jobs
ps aux | grep cron

# Optimize or reschedule resource-intensive tasks
# Consider upgrading instance type if consistently high
```

### Memory Issues

#### Symptoms
- System using swap extensively
- Out of memory (OOM) errors
- Applications crashing

#### Diagnosis
```bash
# Check memory usage
free -h
cat /proc/meminfo

# Check swap usage
swapon --show

# Find memory-consuming processes
ps aux --sort=-%mem | head -10

# Check for memory leaks
watch -n 1 'ps aux --sort=-%mem | head -10'

# View OOM killer logs
sudo dmesg | grep -i oom
sudo journalctl -k | grep -i oom
```

#### Solutions
```bash
# Clear cache (safe operation)
sudo sync
sudo sysctl -w vm.drop_caches=3

# Restart memory-hogging service
sudo systemctl restart service_name

# Add more swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Consider upgrading instance with more RAM
```

### Disk Space Issues

#### Symptoms
- Disk full errors
- Applications can't write files
- System becoming unstable

#### Diagnosis
```bash
# Check disk usage
df -h

# Find large files
sudo find / -type f -size +100M 2>/dev/null

# Find largest directories
sudo du -h --max-depth=1 / | sort -hr | head -20

# Check inode usage
df -i

# Find directories with most files
sudo find / -xdev -type d -exec bash -c 'echo -n "{} "; ls -1 "{}" | wc -l' \; 2>/dev/null | sort -k2 -nr | head -20
```

#### Solutions
```bash
# Remove old log files
sudo find /var/log -type f -name "*.log" -mtime +30 -delete

# Clean package manager cache
sudo apt clean
sudo apt autoremove

# Remove old kernels (Ubuntu/Debian)
sudo apt autoremove --purge

# Compress old log files
sudo gzip /var/log/*.log

# Use logrotate for automatic log management
sudo vim /etc/logrotate.conf

# Expand disk volume (cloud)
# AWS: Extend EBS volume, then resize filesystem
# GCP: Resize persistent disk
```

## Network Issues

### Connection Problems

#### Symptoms
- Can't connect to server
- Timeout errors
- Network unreachable

#### Diagnosis
```bash
# Check network interfaces
ip addr show
ifconfig -a

# Test network connectivity
ping -c 4 8.8.8.8
ping -c 4 google.com

# Check default gateway
ip route show
route -n

# Test DNS resolution
nslookup google.com
dig google.com

# Check listening ports
sudo netstat -tulpn
sudo ss -tulpn

# Test specific port
telnet hostname 80
nc -zv hostname 80
```

#### Solutions
```bash
# Restart network service
sudo systemctl restart networking
sudo systemctl restart NetworkManager

# Renew DHCP lease
sudo dhclient -r
sudo dhclient

# Check firewall rules
sudo ufw status verbose
sudo iptables -L -n -v

# Verify DNS configuration
cat /etc/resolv.conf

# Flush DNS cache
sudo systemd-resolve --flush-caches

# Check cloud security groups (AWS/GCP)
# Ensure proper inbound/outbound rules
```

### SSH Connection Issues

#### Symptoms
- Can't connect via SSH
- Connection refused
- Permission denied

#### Diagnosis
```bash
# Check if SSH service is running
sudo systemctl status sshd

# Check SSH port
sudo netstat -tulpn | grep ssh

# Test SSH connection with verbose output
ssh -vvv user@hostname

# Check SSH logs
sudo tail -f /var/log/auth.log
sudo journalctl -u sshd -f
```

#### Solutions
```bash
# Restart SSH service
sudo systemctl restart sshd

# Check SSH configuration
sudo sshd -t  # Test config file

# Fix SSH key permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/id_rsa

# Reset SSH known_hosts (if host key changed)
ssh-keygen -R hostname

# Check firewall allows SSH
sudo ufw allow ssh

# Verify cloud security group allows port 22 (or custom port)
```

## Service Issues

### Service Won't Start

#### Symptoms
- Service fails to start
- Error messages in logs

#### Diagnosis
```bash
# Check service status
sudo systemctl status service_name

# View service logs
sudo journalctl -u service_name -n 50
sudo journalctl -u service_name -f

# Check for configuration errors
sudo nginx -t           # For Nginx
sudo apache2ctl -t      # For Apache
sudo php -v             # For PHP

# Check for port conflicts
sudo lsof -i :80
sudo netstat -tulpn | grep :80
```

#### Solutions
```bash
# Fix configuration errors
sudo vim /etc/service/config.conf

# Reload configuration
sudo systemctl reload service_name

# Restart service
sudo systemctl restart service_name

# Enable service to start on boot
sudo systemctl enable service_name

# Check dependencies
systemctl list-dependencies service_name
```

### Database Connection Errors

#### Symptoms
- Can't connect to database
- Connection refused errors

#### Diagnosis
```bash
# Check if database is running
sudo systemctl status mysql
sudo systemctl status postgresql

# Test database connection
mysql -u root -p
psql -U postgres

# Check database logs
sudo tail -f /var/log/mysql/error.log
sudo tail -f /var/log/postgresql/postgresql-*.log

# Check listening ports
sudo netstat -tulpn | grep 3306  # MySQL
sudo netstat -tulpn | grep 5432  # PostgreSQL
```

#### Solutions
```bash
# Restart database service
sudo systemctl restart mysql
sudo systemctl restart postgresql

# Check database configuration
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf
sudo vim /etc/postgresql/*/main/postgresql.conf

# Verify bind address (should be 0.0.0.0 for remote access)
bind-address = 0.0.0.0

# Grant remote access (MySQL)
mysql> GRANT ALL PRIVILEGES ON *.* TO 'user'@'%' IDENTIFIED BY 'password';
mysql> FLUSH PRIVILEGES;

# Edit PostgreSQL access (PostgreSQL)
sudo vim /etc/postgresql/*/main/pg_hba.conf
```

## Permission Issues

### Access Denied Errors

#### Symptoms
- Permission denied when accessing files
- Can't write to directory

#### Diagnosis
```bash
# Check file permissions
ls -la file_or_directory

# Check file ownership
stat filename

# Check current user permissions
id
groups

# Check process ownership
ps aux | grep process_name
```

#### Solutions
```bash
# Fix file permissions
chmod 644 file.txt        # rw-r--r--
chmod 755 script.sh       # rwxr-xr-x
chmod -R 755 directory/   # Recursive

# Fix file ownership
sudo chown user:group file.txt
sudo chown -R user:group directory/

# Add user to required group
sudo usermod -aG groupname username

# Fix web directory permissions (typical)
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

### Sudo Issues

#### Symptoms
- User not in sudoers file
- Sudo commands not working

#### Diagnosis
```bash
# Check sudo access
sudo -l

# View sudoers file
sudo visudo -c  # Check syntax
sudo cat /etc/sudoers
```

#### Solutions
```bash
# Add user to sudo group
sudo usermod -aG sudo username

# Edit sudoers file (ALWAYS use visudo)
sudo visudo

# Grant specific command access
username ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx

# Check sudo logs
sudo cat /var/log/auth.log | grep sudo
```

## Boot Issues

### System Won't Boot

#### Diagnosis (from rescue mode)
```bash
# Check system logs
journalctl -xb
dmesg | less

# Check filesystem errors
sudo fsck /dev/sda1

# Check disk space
df -h

# Check fstab errors
cat /etc/fstab
```

#### Solutions
```bash
# Boot into recovery mode
# Select "Advanced options" -> "Recovery mode"

# Fix filesystem
fsck -y /dev/sda1

# Fix fstab errors
sudo vim /etc/fstab

# Reinstall GRUB
sudo grub-install /dev/sda
sudo update-grub

# Restore from snapshot (cloud)
```

## Cloud-Specific Issues

### AWS Issues

#### Instance Not Accessible
```bash
# Check instance status
aws ec2 describe-instance-status --instance-ids i-xxxxx

# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Check system log
aws ec2 get-console-output --instance-id i-xxxxx

# Verify key pair
aws ec2 describe-key-pairs
```

### GCP Issues

#### Instance Connection Problems
```bash
# Check instance status
gcloud compute instances describe instance-name

# View serial console
gcloud compute instances get-serial-port-output instance-name

# Check firewall rules
gcloud compute firewall-rules list

# Reset instance
gcloud compute instances reset instance-name
```

## Troubleshooting Methodology

### Step-by-Step Approach
1. **Identify the problem**: What exactly is failing?
2. **Gather information**: Logs, error messages, system state
3. **Form hypothesis**: What could be causing this?
4. **Test hypothesis**: Try solution in safe manner
5. **Verify fix**: Confirm problem is resolved
6. **Document**: Record issue and solution

### Essential Commands for Diagnosis
```bash
# System information
uname -a
hostnamectl
lsb_release -a

# Process information
ps aux
top
htop

# System logs
journalctl -xe
dmesg
tail -f /var/log/syslog

# Network
ip addr
ss -tulpn
netstat -tulpn

# Disk
df -h
du -h
lsblk

# Performance
vmstat 1
iostat -x 1
sar -u 5 10
```

## Key Learnings
1. **Check logs first**: Most issues leave traces in logs
2. **Systematic approach**: Follow logical troubleshooting steps
3. **Backup before changes**: Always backup before making major changes
4. **Test in isolation**: Isolate variables when troubleshooting
5. **Document solutions**: Record fixes for future reference

## Additional Resources
- System logs: `/var/log/`
- Service logs: `journalctl -u service_name`
- Cloud console: AWS/GCP web interface
- Community forums: Stack Overflow, Server Fault
- Official documentation: Distribution and service docs
