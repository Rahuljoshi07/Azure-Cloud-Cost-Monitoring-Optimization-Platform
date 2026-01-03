# Backup and Recovery Procedures

## Overview
This document covers backup strategies, implementation, and recovery procedures for Linux-based cloud systems.

## Backup Strategy

### Backup Types
1. **Full Backup**: Complete copy of all data
2. **Incremental Backup**: Only changes since last backup
3. **Differential Backup**: Changes since last full backup
4. **Snapshot**: Point-in-time copy of system state

### Backup Schedule Example
```
- Full Backup: Weekly (Sunday 2 AM)
- Incremental Backup: Daily (2 AM)
- Critical Data: Hourly snapshots
- Retention: 30 days
```

## File-Level Backups

### 1. Using tar
```bash
# Create backup archive
tar -czf backup-$(date +%Y%m%d).tar.gz /path/to/data

# Create backup with exclusions
tar -czf backup.tar.gz \
  --exclude='*.log' \
  --exclude='tmp/*' \
  /var/www/html

# Extract backup
tar -xzf backup-20260103.tar.gz -C /restore/location

# List contents without extracting
tar -tzf backup-20260103.tar.gz

# Verify archive integrity
tar -tzf backup-20260103.tar.gz > /dev/null && echo "Archive is valid"
```

### 2. Using rsync
```bash
# Sync to local backup location
rsync -avz --delete /var/www/html/ /backup/www/

# Sync to remote server
rsync -avz -e ssh /var/www/html/ user@backup-server:/backup/www/

# Sync with exclusions
rsync -avz --exclude='*.log' --exclude='tmp/' \
  /var/www/html/ /backup/www/

# Dry run (preview changes)
rsync -avz --dry-run /var/www/html/ /backup/www/

# Incremental backup with hard links
rsync -avz --link-dest=/backup/previous/ \
  /var/www/html/ /backup/current/
```

### 3. Backup Script Example
```bash
#!/bin/bash
# backup-files.sh - Automated file backup script

# Configuration
SOURCE_DIR="/var/www/html"
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="website-backup-${DATE}.tar.gz"
RETENTION_DAYS=30

# Create backup directory if not exists
mkdir -p ${BACKUP_DIR}

# Create backup
echo "Starting backup at $(date)"
tar -czf ${BACKUP_DIR}/${BACKUP_FILE} ${SOURCE_DIR}

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup completed successfully: ${BACKUP_FILE}"
    
    # Remove old backups
    find ${BACKUP_DIR} -name "website-backup-*.tar.gz" \
      -type f -mtime +${RETENTION_DAYS} -delete
    
    echo "Old backups cleaned up (retention: ${RETENTION_DAYS} days)"
else
    echo "Backup failed!" >&2
    exit 1
fi

# Log backup size
du -h ${BACKUP_DIR}/${BACKUP_FILE}
```

Make executable and schedule:
```bash
chmod +x backup-files.sh

# Add to crontab for daily 2 AM execution
crontab -e
0 2 * * * /home/user/backup-files.sh >> /var/log/backup.log 2>&1
```

## Database Backups

### 1. MySQL/MariaDB Backup
```bash
# Backup single database
mysqldump -u root -p database_name > db-backup-$(date +%Y%m%d).sql

# Backup all databases
mysqldump -u root -p --all-databases > all-db-backup-$(date +%Y%m%d).sql

# Backup with compression
mysqldump -u root -p database_name | gzip > db-backup-$(date +%Y%m%d).sql.gz

# Backup specific tables
mysqldump -u root -p database_name table1 table2 > tables-backup.sql

# Backup with structure and data
mysqldump -u root -p --routines --triggers database_name > full-backup.sql
```

### 2. MySQL Restore
```bash
# Restore database
mysql -u root -p database_name < db-backup-20260103.sql

# Restore from compressed backup
gunzip < db-backup-20260103.sql.gz | mysql -u root -p database_name

# Restore all databases
mysql -u root -p < all-db-backup-20260103.sql
```

### 3. MySQL Backup Script
```bash
#!/bin/bash
# mysql-backup.sh - Automated MySQL backup

# Configuration
DB_USER="backup_user"
DB_PASS="backup_password"
BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Get list of databases
DATABASES=$(mysql -u ${DB_USER} -p${DB_PASS} -e "SHOW DATABASES;" | grep -Ev "(Database|information_schema|performance_schema|mysql|sys)")

# Backup each database
for DB in ${DATABASES}; do
    echo "Backing up database: ${DB}"
    mysqldump -u ${DB_USER} -p${DB_PASS} --databases ${DB} | \
      gzip > ${BACKUP_DIR}/${DB}-${DATE}.sql.gz
done

# Remove old backups
find ${BACKUP_DIR} -name "*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

echo "MySQL backup completed at $(date)"
```

### 4. PostgreSQL Backup
```bash
# Backup single database
pg_dump database_name > db-backup-$(date +%Y%m%d).sql

# Backup with custom format (compressed)
pg_dump -Fc database_name > db-backup-$(date +%Y%m%d).dump

# Backup all databases
pg_dumpall > all-db-backup-$(date +%Y%m%d).sql

# Restore PostgreSQL database
psql database_name < db-backup-20260103.sql

# Restore custom format
pg_restore -d database_name db-backup-20260103.dump
```

## Cloud Snapshots

### AWS EC2 Snapshots

#### Create Snapshot
```bash
# Create EBS snapshot
aws ec2 create-snapshot \
  --volume-id vol-xxxxxxxxx \
  --description "Backup-$(date +%Y%m%d)" \
  --tag-specifications 'ResourceType=snapshot,Tags=[{Key=Name,Value=Daily-Backup}]'

# Create AMI (full instance backup)
aws ec2 create-image \
  --instance-id i-xxxxxxxxx \
  --name "server-backup-$(date +%Y%m%d)" \
  --description "Full server backup" \
  --no-reboot
```

#### Automated Snapshot Script
```bash
#!/bin/bash
# aws-snapshot.sh - Automated EBS snapshot

VOLUME_ID="vol-xxxxxxxxx"
DESCRIPTION="Automated-Backup-$(date +%Y%m%d)"
RETENTION_DAYS=30

# Create snapshot
SNAPSHOT_ID=$(aws ec2 create-snapshot \
  --volume-id ${VOLUME_ID} \
  --description "${DESCRIPTION}" \
  --query 'SnapshotId' \
  --output text)

echo "Created snapshot: ${SNAPSHOT_ID}"

# Tag snapshot
aws ec2 create-tags \
  --resources ${SNAPSHOT_ID} \
  --tags Key=Name,Value=AutoBackup Key=Date,Value=$(date +%Y%m%d)

# Delete old snapshots
OLD_SNAPSHOTS=$(aws ec2 describe-snapshots \
  --filters "Name=volume-id,Values=${VOLUME_ID}" \
  --query "Snapshots[?StartTime<='$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)'].SnapshotId" \
  --output text)

for SNAPSHOT in ${OLD_SNAPSHOTS}; do
    echo "Deleting old snapshot: ${SNAPSHOT}"
    aws ec2 delete-snapshot --snapshot-id ${SNAPSHOT}
done
```

### GCP Persistent Disk Snapshots

#### Create Snapshot
```bash
# Create disk snapshot
gcloud compute disks snapshot disk-name \
  --snapshot-names=backup-$(date +%Y%m%d) \
  --zone=us-central1-a \
  --description="Daily backup"

# Create instance snapshot
gcloud compute instances create-snapshot instance-name \
  --snapshot-names=instance-backup-$(date +%Y%m%d) \
  --zone=us-central1-a
```

#### Automated Snapshot Script
```bash
#!/bin/bash
# gcp-snapshot.sh - Automated disk snapshot

DISK_NAME="production-disk"
ZONE="us-central1-a"
SNAPSHOT_NAME="auto-backup-$(date +%Y%m%d-%H%M%S)"
RETENTION_DAYS=30

# Create snapshot
gcloud compute disks snapshot ${DISK_NAME} \
  --snapshot-names=${SNAPSHOT_NAME} \
  --zone=${ZONE}

# Delete old snapshots
gcloud compute snapshots list \
  --filter="creationTimestamp<-P${RETENTION_DAYS}D" \
  --format="value(name)" | \
while read SNAPSHOT; do
    gcloud compute snapshots delete ${SNAPSHOT} --quiet
done
```

## System Configuration Backups

### 1. Backup System Configuration
```bash
#!/bin/bash
# backup-configs.sh - Backup important configuration files

BACKUP_DIR="/backup/configs"
DATE=$(date +%Y%m%d)

mkdir -p ${BACKUP_DIR}

# Backup important directories
tar -czf ${BACKUP_DIR}/configs-${DATE}.tar.gz \
  /etc/nginx/ \
  /etc/mysql/ \
  /etc/ssh/ \
  /etc/apache2/ \
  /etc/systemd/system/ \
  /etc/cron.d/ \
  /etc/hosts \
  /etc/fstab

# Backup user crontabs
crontab -l > ${BACKUP_DIR}/crontab-${DATE}.txt

# Backup installed packages list
dpkg --get-selections > ${BACKUP_DIR}/packages-${DATE}.txt

# Backup UFW rules
sudo ufw status verbose > ${BACKUP_DIR}/ufw-rules-${DATE}.txt

echo "Configuration backup completed: ${DATE}"
```

### 2. Document System State
```bash
#!/bin/bash
# system-state.sh - Document current system state

OUTPUT_FILE="system-state-$(date +%Y%m%d).txt"

{
  echo "===== System State Report ====="
  echo "Generated: $(date)"
  echo ""
  
  echo "--- Hostname ---"
  hostname
  echo ""
  
  echo "--- OS Version ---"
  lsb_release -a
  echo ""
  
  echo "--- Installed Packages ---"
  dpkg -l
  echo ""
  
  echo "--- Running Services ---"
  systemctl list-units --type=service --state=running
  echo ""
  
  echo "--- Network Configuration ---"
  ip addr show
  echo ""
  
  echo "--- Disk Usage ---"
  df -h
  echo ""
  
  echo "--- Cron Jobs ---"
  crontab -l
  echo ""
  
} > ${OUTPUT_FILE}

echo "System state documented: ${OUTPUT_FILE}"
```

## Recovery Procedures

### 1. File Recovery
```bash
# Restore from tar archive
tar -xzf backup-20260103.tar.gz -C /restore/path

# Restore specific files
tar -xzf backup.tar.gz path/to/specific/file

# Restore using rsync
rsync -avz /backup/www/ /var/www/html/
```

### 2. Database Recovery
```bash
# Restore MySQL database
mysql -u root -p database_name < backup-20260103.sql

# Restore PostgreSQL database
psql -U postgres database_name < backup-20260103.sql

# Restore with progress indication
pv backup-20260103.sql | mysql -u root -p database_name
```

### 3. Snapshot Recovery

#### AWS EC2 Recovery
```bash
# Create volume from snapshot
aws ec2 create-volume \
  --snapshot-id snap-xxxxxxxxx \
  --availability-zone us-east-1a \
  --volume-type gp3

# Attach volume to instance
aws ec2 attach-volume \
  --volume-id vol-xxxxxxxxx \
  --instance-id i-xxxxxxxxx \
  --device /dev/sdf

# Mount the volume
sudo mount /dev/xvdf1 /mnt/restore
```

#### GCP Recovery
```bash
# Create disk from snapshot
gcloud compute disks create restored-disk \
  --source-snapshot=backup-20260103 \
  --zone=us-central1-a

# Attach disk to instance
gcloud compute instances attach-disk instance-name \
  --disk=restored-disk \
  --zone=us-central1-a
```

## Backup Verification

### 1. Test Backup Integrity
```bash
# Verify tar archive
tar -tzf backup-20260103.tar.gz > /dev/null
echo $?  # Should return 0 if valid

# Verify rsync backup
rsync -avzn --delete /original/ /backup/
# Review output for differences

# Test database backup restore
mysql -u root -p test_restore < backup-20260103.sql
```

### 2. Regular Restore Testing
```bash
# Monthly restore test procedure
1. Create test environment
2. Restore latest backup
3. Verify data integrity
4. Document test results
5. Update recovery procedures if needed
```

## Backup Best Practices

1. **3-2-1 Rule**
   - 3 copies of data
   - 2 different media types
   - 1 offsite backup

2. **Regular Testing**
   - Test restore procedures monthly
   - Document recovery time objectives (RTO)
   - Verify backup integrity

3. **Automation**
   - Automate backup tasks with cron
   - Monitor backup success/failure
   - Alert on backup failures

4. **Security**
   - Encrypt backups
   - Secure backup storage
   - Control access to backups

5. **Documentation**
   - Document backup procedures
   - Maintain recovery runbooks
   - Keep backup logs

## Monitoring Backup Health

```bash
# Check backup job status
systemctl status backup.service

# View backup logs
tail -f /var/log/backup.log

# Monitor backup storage
df -h /backup

# Alert script for backup failures
#!/bin/bash
if ! systemctl is-active --quiet backup.service; then
    echo "Backup service failed!" | mail -s "Backup Alert" admin@example.com
fi
```

## Key Learnings
1. **Regular backups**: Prevent data loss from failures or errors
2. **Multiple backup types**: Full, incremental, and snapshots serve different purposes
3. **Test restores**: Untested backups are not reliable
4. **Automation**: Reduces human error and ensures consistency
5. **Offsite storage**: Protects against physical disasters

## Next Steps
- Review [Troubleshooting Guide](troubleshooting.md)
- Return to [System Setup](system-setup.md)
- Check [Monitoring Setup](monitoring.md)
