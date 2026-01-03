#!/bin/bash

################################################################################
# System Setup Script
# Purpose: Automate initial Linux system setup and configuration
# Usage: sudo ./setup.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    error "Please run as root (use sudo)"
    exit 1
fi

log "Starting system setup..."

# Update system
log "Updating system packages..."
apt update -y
apt upgrade -y

# Install essential tools
log "Installing essential tools..."
apt install -y \
    vim \
    git \
    curl \
    wget \
    htop \
    net-tools \
    ufw \
    fail2ban \
    unzip \
    tree \
    ncdu

# Configure firewall
log "Configuring firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
log "Firewall configured (SSH allowed)"

# Set timezone
log "Setting timezone..."
timedatectl set-timezone America/New_York
log "Timezone set to America/New_York"

# Configure automatic security updates
log "Configuring automatic security updates..."
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Create backup directory
log "Creating backup directory..."
mkdir -p /backup/{configs,databases,files}
chmod 700 /backup
log "Backup directory created at /backup"

# Install monitoring tools
log "Installing monitoring tools..."
apt install -y \
    sysstat \
    iotop \
    iftop \
    nethogs

# Enable sysstat
sed -i 's/ENABLED="false"/ENABLED="true"/' /etc/default/sysstat
systemctl enable sysstat
systemctl start sysstat

# Configure SSH security
log "Hardening SSH configuration..."
SSH_CONFIG="/etc/ssh/sshd_config"
cp ${SSH_CONFIG} ${SSH_CONFIG}.backup

# Update SSH settings
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' ${SSH_CONFIG}
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' ${SSH_CONFIG}
sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/' ${SSH_CONFIG}

# Restart SSH
systemctl restart sshd
log "SSH hardened and restarted"

# Set up log rotation
log "Configuring log rotation..."
cat > /etc/logrotate.d/custom-logs <<EOF
/var/log/monitoring.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
}
EOF

# Create monitoring log
touch /var/log/monitoring.log
chmod 640 /var/log/monitoring.log

# System information
log "System setup completed!"
echo ""
echo "=========================================="
echo "System Information:"
echo "=========================================="
echo "Hostname: $(hostname)"
echo "OS: $(lsb_release -d | cut -f2)"
echo "Kernel: $(uname -r)"
echo "Timezone: $(timedatectl | grep "Time zone" | awk '{print $3}')"
echo "Firewall: $(ufw status | grep Status | awk '{print $2}')"
echo "=========================================="
echo ""

log "Next steps:"
echo "  1. Configure monitoring: ./scripts/monitor.sh"
echo "  2. Set up backups: ./scripts/backup.sh"
echo "  3. Create users and configure access control"
echo "  4. Install application services (nginx, mysql, etc.)"
echo ""
