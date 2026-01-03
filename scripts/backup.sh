#!/bin/bash

################################################################################
# Automated Backup Script
# Purpose: Backup files, databases, and configurations
# Usage: ./backup.sh [--full|--incremental|--config]
################################################################################

set -e

# Configuration
BACKUP_ROOT="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
LOG_FILE="/var/log/backup.log"

# Directories to backup
BACKUP_SOURCES=(
    "/var/www/html"
    "/home"
    "/etc/nginx"
    "/etc/apache2"
)

# Database configuration
DB_USER="backup_user"
DB_PASS=""  # Set this or use .my.cnf

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    error "Please run as root (use sudo)"
    exit 1
fi

# Create backup directories
mkdir -p ${BACKUP_ROOT}/{files,databases,configs,incremental}

# Function: Full backup
full_backup() {
    log "Starting FULL backup..."
    
    BACKUP_DIR="${BACKUP_ROOT}/files/full-${DATE}"
    mkdir -p "$BACKUP_DIR"
    
    for SOURCE in "${BACKUP_SOURCES[@]}"; do
        if [ -d "$SOURCE" ]; then
            log "Backing up: $SOURCE"
            BASENAME=$(basename "$SOURCE")
            tar -czf "${BACKUP_DIR}/${BASENAME}.tar.gz" "$SOURCE" 2>/dev/null || warning "Could not backup $SOURCE"
        else
            warning "Directory not found: $SOURCE"
        fi
    done
    
    success "Full backup completed: $BACKUP_DIR"
}

# Function: Incremental backup
incremental_backup() {
    log "Starting INCREMENTAL backup..."
    
    SNAPSHOT_FILE="${BACKUP_ROOT}/incremental/snapshot.snar"
    BACKUP_DIR="${BACKUP_ROOT}/incremental/inc-${DATE}"
    mkdir -p "$BACKUP_DIR"
    
    for SOURCE in "${BACKUP_SOURCES[@]}"; do
        if [ -d "$SOURCE" ]; then
            log "Incremental backup: $SOURCE"
            BASENAME=$(basename "$SOURCE")
            tar -czf "${BACKUP_DIR}/${BASENAME}.tar.gz" \
                --listed-incremental="$SNAPSHOT_FILE" \
                "$SOURCE" 2>/dev/null || warning "Could not backup $SOURCE"
        fi
    done
    
    success "Incremental backup completed: $BACKUP_DIR"
}

# Function: Configuration backup
config_backup() {
    log "Starting CONFIGURATION backup..."
    
    BACKUP_FILE="${BACKUP_ROOT}/configs/config-${DATE}.tar.gz"
    
    tar -czf "$BACKUP_FILE" \
        /etc/nginx/ \
        /etc/mysql/ \
        /etc/postgresql/ \
        /etc/ssh/sshd_config \
        /etc/apache2/ \
        /etc/php/ \
        /etc/hosts \
        /etc/fstab \
        /etc/crontab \
        /etc/systemd/system/ \
        2>/dev/null || true
    
    # Backup crontabs
    crontab -l > "${BACKUP_ROOT}/configs/crontab-${DATE}.txt" 2>/dev/null || true
    
    # Backup package list
    dpkg --get-selections > "${BACKUP_ROOT}/configs/packages-${DATE}.txt"
    
    # Backup firewall rules
    ufw status verbose > "${BACKUP_ROOT}/configs/ufw-rules-${DATE}.txt" 2>/dev/null || true
    
    success "Configuration backup completed: $BACKUP_FILE"
}

# Function: Database backup
database_backup() {
    log "Starting DATABASE backup..."
    
    BACKUP_DIR="${BACKUP_ROOT}/databases"
    
    # MySQL/MariaDB backup
    if command -v mysql &> /dev/null; then
        log "Backing up MySQL databases..."
        
        DATABASES=$(mysql -u root -e "SHOW DATABASES;" 2>/dev/null | grep -Ev "(Database|information_schema|performance_schema|mysql|sys)")
        
        for DB in $DATABASES; do
            log "  - Backing up database: $DB"
            mysqldump -u root --databases "$DB" 2>/dev/null | gzip > "${BACKUP_DIR}/${DB}-${DATE}.sql.gz" || warning "Could not backup $DB"
        done
        
        success "MySQL backup completed"
    fi
    
    # PostgreSQL backup
    if command -v psql &> /dev/null; then
        log "Backing up PostgreSQL databases..."
        sudo -u postgres pg_dumpall | gzip > "${BACKUP_DIR}/postgresql-all-${DATE}.sql.gz" 2>/dev/null || warning "Could not backup PostgreSQL"
        success "PostgreSQL backup completed"
    fi
}

# Function: Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
    
    find "${BACKUP_ROOT}/files" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
    find "${BACKUP_ROOT}/databases" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
    find "${BACKUP_ROOT}/configs" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
    find "${BACKUP_ROOT}/incremental" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
    
    success "Cleanup completed"
}

# Function: Display backup summary
backup_summary() {
    log "=========================================="
    log "BACKUP SUMMARY"
    log "=========================================="
    log "Date: $(date)"
    log "Backup location: $BACKUP_ROOT"
    log ""
    log "Backup sizes:"
    du -sh ${BACKUP_ROOT}/* 2>/dev/null || true
    log ""
    log "Total backup space used:"
    du -sh ${BACKUP_ROOT} 2>/dev/null || true
    log "=========================================="
}

# Main execution
log "=========================================="
log "Backup script started"
log "=========================================="

case "${1:-full}" in
    --full)
        full_backup
        database_backup
        config_backup
        ;;
    --incremental)
        incremental_backup
        database_backup
        ;;
    --config)
        config_backup
        ;;
    --db)
        database_backup
        ;;
    *)
        log "Running FULL backup (default)"
        full_backup
        database_backup
        config_backup
        ;;
esac

cleanup_old_backups
backup_summary

log "Backup script completed successfully!"

# Optional: Send notification
# echo "Backup completed successfully" | mail -s "Backup Report" admin@example.com
