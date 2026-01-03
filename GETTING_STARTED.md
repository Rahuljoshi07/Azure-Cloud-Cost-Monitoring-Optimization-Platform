# Getting Started Guide

## Prerequisites

Before beginning this project, ensure you have:

### Required Knowledge
- Basic Linux command line skills
- Understanding of cloud computing concepts (AWS or GCP)
- Familiarity with text editors (vim, nano)
- Basic networking concepts

### Required Accounts
- AWS account OR Google Cloud Platform account
- SSH key pair generated on your local machine
- Email account for alerts (optional)

### Local Machine Requirements
- SSH client installed
- Git (optional, for version control)
- Text editor or IDE

## Step-by-Step Setup

### Phase 1: Cloud Instance Setup (30 minutes)

#### Option A: AWS EC2

1. **Launch EC2 Instance**
   ```bash
   # Using AWS CLI
   aws ec2 run-instances \
     --image-id ami-0c55b159cbfafe1f0 \
     --instance-type t2.micro \
     --key-name your-key-pair \
     --security-group-ids sg-xxxxxxxx \
     --subnet-id subnet-xxxxxxxx \
     --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=LinuxAdminProject}]'
   ```

2. **Configure Security Group**
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) from anywhere
   - Allow HTTPS (port 443) from anywhere

3. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@ec2-xx-xx-xx-xx.compute.amazonaws.com
   ```

#### Option B: Google Cloud Platform

1. **Create Compute Instance**
   ```bash
   gcloud compute instances create linux-admin-project \
     --zone=us-central1-a \
     --machine-type=e2-micro \
     --image-family=ubuntu-2004-lts \
     --image-project=ubuntu-os-cloud
   ```

2. **Configure Firewall**
   ```bash
   gcloud compute firewall-rules create allow-http \
     --allow tcp:80
   
   gcloud compute firewall-rules create allow-https \
     --allow tcp:443
   ```

3. **Connect to Instance**
   ```bash
   gcloud compute ssh linux-admin-project --zone=us-central1-a
   ```

### Phase 2: Initial System Setup (20 minutes)

1. **Clone or Download Project Files**
   ```bash
   # If using git
   git clone <your-repo-url>
   cd linux-cloud-admin-project
   
   # Or manually create directory structure
   mkdir -p ~/project/{scripts,configs,docs}
   ```

2. **Run Initial Setup Script**
   ```bash
   # Make script executable
   chmod +x scripts/setup.sh
   
   # Run setup (requires sudo)
   sudo ./scripts/setup.sh
   ```

3. **Verify Installation**
   ```bash
   # Check installed tools
   htop --version
   nginx -v
   ufw status
   
   # Check system status
   systemctl status nginx
   ```

### Phase 3: Security Configuration (30 minutes)

Follow the [Security Guide](docs/security.md):

1. **Create Admin User**
   ```bash
   sudo adduser admin
   sudo usermod -aG sudo admin
   ```

2. **Set Up SSH Keys**
   ```bash
   # On your local machine
   ssh-keygen -t rsa -b 4096
   
   # Copy to server
   ssh-copy-id admin@your-server-ip
   ```

3. **Harden SSH**
   ```bash
   sudo vim /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   # Set: PasswordAuthentication no
   
   sudo systemctl restart sshd
   ```

4. **Configure Firewall**
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw status verbose
   ```

### Phase 4: Monitoring Setup (20 minutes)

1. **Make Monitoring Script Executable**
   ```bash
   chmod +x scripts/monitor.sh
   ```

2. **Test Monitoring**
   ```bash
   ./scripts/monitor.sh
   ```

3. **Schedule Monitoring**
   ```bash
   crontab -e
   
   # Add this line:
   */5 * * * * /home/admin/project/scripts/monitor.sh --log
   ```

4. **View Monitoring Logs**
   ```bash
   tail -f /var/log/monitoring.log
   ```

### Phase 5: Backup Configuration (20 minutes)

1. **Configure Backup Settings**
   ```bash
   # Edit backup script if needed
   vim scripts/backup.sh
   
   # Update these variables:
   # - BACKUP_SOURCES (directories to backup)
   # - DB_USER and DB_PASS (database credentials)
   # - RETENTION_DAYS (how long to keep backups)
   ```

2. **Create Backup Directory**
   ```bash
   sudo mkdir -p /backup/{files,databases,configs}
   sudo chmod 700 /backup
   ```

3. **Test Backup**
   ```bash
   chmod +x scripts/backup.sh
   sudo ./scripts/backup.sh --config
   ```

4. **Schedule Daily Backups**
   ```bash
   sudo crontab -e
   
   # Add this line for daily 2 AM backups:
   0 2 * * * /home/admin/project/scripts/backup.sh --full >> /var/log/backup.log 2>&1
   ```

### Phase 6: Application Deployment (40 minutes)

1. **Install Web Server**
   ```bash
   sudo apt update
   sudo apt install -y nginx
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

2. **Install Database (MySQL)**
   ```bash
   sudo apt install -y mysql-server
   sudo mysql_secure_installation
   sudo systemctl start mysql
   sudo systemctl enable mysql
   ```

3. **Configure Nginx**
   ```bash
   sudo cp configs/services/nginx-sample.conf /etc/nginx/sites-available/mysite
   sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Test Application**
   ```bash
   curl http://localhost
   ```

## Verification Checklist

After completing all phases, verify your setup:

- [ ] Can SSH into server using key-based authentication
- [ ] Root login via SSH is disabled
- [ ] Firewall is enabled and configured
- [ ] Web server (Nginx) is running
- [ ] Database server is running (if installed)
- [ ] Monitoring script runs successfully
- [ ] Monitoring is scheduled via cron
- [ ] Backup script runs successfully
- [ ] Backups are scheduled via cron
- [ ] System logs are accessible
- [ ] Can view system metrics (CPU, memory, disk)

## Common First-Time Issues

### Issue: Can't connect via SSH
**Solution:**
```bash
# Check security group/firewall allows SSH from your IP
# Verify SSH service is running
sudo systemctl status sshd

# Check SSH logs
sudo tail -f /var/log/auth.log
```

### Issue: Permission denied on scripts
**Solution:**
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### Issue: Backup script fails
**Solution:**
```bash
# Check permissions on backup directory
sudo ls -la /backup

# Create missing directories
sudo mkdir -p /backup/{files,databases,configs}

# Check disk space
df -h
```

### Issue: Nginx won't start
**Solution:**
```bash
# Check configuration
sudo nginx -t

# Check if port 80 is already in use
sudo netstat -tulpn | grep :80

# Check logs
sudo tail -f /var/log/nginx/error.log
```

## Next Steps

Once your basic setup is complete:

1. **Explore Advanced Features**
   - Set up SSL certificates with Let's Encrypt
   - Configure database replication
   - Implement log aggregation
   - Set up monitoring dashboards

2. **Practice Common Tasks**
   - Deploy a sample application
   - Perform a restore test
   - Simulate a service failure and recovery
   - Add a new user and configure access

3. **Documentation**
   - Document your specific setup
   - Create runbooks for common operations
   - Keep a change log

4. **Continuous Learning**
   - Review the [Troubleshooting Guide](docs/troubleshooting.md)
   - Practice disaster recovery scenarios
   - Experiment with cloud-native services

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting Guide](docs/troubleshooting.md)
2. Review system logs: `/var/log/syslog` and `/var/log/auth.log`
3. Use monitoring script: `./scripts/monitor.sh`
4. Check service status: `systemctl status <service-name>`

## Time Estimates

- **Minimal Setup**: 1-2 hours (Instance + Basic Security)
- **Standard Setup**: 2-3 hours (All phases above)
- **Complete Setup**: 4-6 hours (Including application deployment and testing)

## Resources

- [AWS Documentation](https://docs.aws.amazon.com/)
- [GCP Documentation](https://cloud.google.com/docs)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

Good luck with your Cloud System Administration project! 🚀
