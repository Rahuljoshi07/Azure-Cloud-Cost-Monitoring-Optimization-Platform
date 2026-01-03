# System Setup and Configuration

## Overview
This document outlines the process of provisioning and configuring Linux-based cloud compute resources.

## Cloud Instance Provisioning

### AWS EC2 Instance Setup
```bash
# Launch EC2 instance (example using AWS CLI)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name my-key-pair \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=WebServer}]'
```

### GCP Compute Engine Setup
```bash
# Create GCP compute instance
gcloud compute instances create web-server \
  --zone=us-central1-a \
  --machine-type=e2-micro \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=10GB
```

## Initial System Configuration

### 1. System Update
```bash
# Update package repositories
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Check system version
lsb_release -a
uname -r
```

### 2. Install Essential Tools
```bash
# Install monitoring and management tools
sudo apt install -y \
  htop \
  net-tools \
  vim \
  curl \
  wget \
  git

# Verify installations
htop --version
vim --version
```

### 3. Configure Hostname
```bash
# Set system hostname
sudo hostnamectl set-hostname cloud-server-01

# Verify hostname
hostnamectl
hostname
```

### 4. Configure Timezone
```bash
# Set timezone
sudo timedatectl set-timezone America/New_York

# Verify timezone
timedatectl
```

## Service Installation and Configuration

### Web Server (Nginx)
```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Test configuration
sudo nginx -t
```

### Database Server (MySQL)
```bash
# Install MySQL
sudo apt install -y mysql-server

# Secure installation
sudo mysql_secure_installation

# Start and enable MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Check status
sudo systemctl status mysql
```

### Application Runtime (Node.js)
```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

## Network Configuration

### Firewall Setup (UFW)
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check firewall status
sudo ufw status verbose
```

### Configure Static IP (if needed)
```bash
# Edit netplan configuration
sudo vim /etc/netplan/00-installer-config.yaml

# Apply configuration
sudo netplan apply

# Verify network configuration
ip addr show
```

## System Verification

### Check Running Services
```bash
# List all running services
systemctl list-units --type=service --state=running

# Check specific service
systemctl status nginx
systemctl status mysql
```

### Verify Network Connectivity
```bash
# Test internet connectivity
ping -c 4 google.com

# Check open ports
sudo netstat -tulpn
sudo ss -tulpn
```

### System Information
```bash
# Display system information
uname -a
hostnamectl
df -h
free -h
```

## Key Learnings
1. **Cloud provisioning**: Understanding instance types, regions, and availability zones
2. **Package management**: Using apt/yum for software installation and updates
3. **Service management**: Using systemctl to manage services
4. **Network security**: Configuring firewalls and security groups
5. **System configuration**: Setting up hostname, timezone, and network settings

## Next Steps
- Proceed to [Monitoring Setup](monitoring.md)
- Configure [Security and Access Control](security.md)
- Set up [Backup and Recovery](backup-recovery.md)
