# Security and Access Control

## Overview
This document covers user management, permissions, and access control using Linux and cloud IAM.

## Linux User Management

### 1. Creating Users
```bash
# Create a new user
sudo useradd -m -s /bin/bash john

# Create user with specific UID
sudo useradd -m -u 1500 -s /bin/bash jane

# Set user password
sudo passwd john

# Create user and add to groups
sudo useradd -m -G sudo,developers john
```

### 2. Managing Users
```bash
# List all users
cat /etc/passwd

# View user information
id username
finger username

# Modify user account
sudo usermod -aG sudo john    # Add to sudo group
sudo usermod -s /bin/zsh jane # Change shell

# Lock/Unlock user account
sudo usermod -L john          # Lock
sudo usermod -U john          # Unlock

# Delete user
sudo userdel john             # Delete user
sudo userdel -r john          # Delete user and home directory
```

### 3. Group Management
```bash
# Create a new group
sudo groupadd developers
sudo groupadd -g 1500 testers  # With specific GID

# Add user to group
sudo usermod -aG developers john
sudo gpasswd -a john developers

# Remove user from group
sudo gpasswd -d john developers

# List all groups
cat /etc/group

# View user's groups
groups john
id john

# Delete group
sudo groupdel developers
```

## File Permissions and Ownership

### 1. Understanding Permissions
```bash
# View file permissions
ls -l filename
ls -la directory/

# Permission types:
# r (read)    = 4
# w (write)   = 2
# x (execute) = 1

# Permission examples:
# 755 = rwxr-xr-x (owner: all, group: rx, others: rx)
# 644 = rw-r--r-- (owner: rw, group: r, others: r)
# 600 = rw------- (owner: rw, group: none, others: none)
```

### 2. Changing Permissions
```bash
# Change file permissions (symbolic)
chmod u+x script.sh           # Add execute for owner
chmod g+w file.txt           # Add write for group
chmod o-r file.txt           # Remove read for others
chmod a+r file.txt           # Add read for all

# Change file permissions (numeric)
chmod 755 script.sh          # rwxr-xr-x
chmod 644 file.txt           # rw-r--r--
chmod 600 private.key        # rw-------

# Recursive permission change
chmod -R 755 /var/www/html
```

### 3. Changing Ownership
```bash
# Change file owner
sudo chown john file.txt

# Change owner and group
sudo chown john:developers file.txt

# Change only group
sudo chgrp developers file.txt

# Recursive ownership change
sudo chown -R john:developers /home/john/project
```

### 4. Special Permissions
```bash
# SetUID (4000) - Run as file owner
chmod 4755 program

# SetGID (2000) - Run as group owner
chmod 2755 directory

# Sticky Bit (1000) - Only owner can delete
chmod 1777 /tmp
```

## SSH Access Control

### 1. SSH Key Setup
```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "user@example.com"

# Copy public key to server
ssh-copy-id user@server

# Manual key copy
cat ~/.ssh/id_rsa.pub | ssh user@server "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# Set correct permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 2. SSH Configuration
```bash
# Edit SSH daemon config
sudo vim /etc/ssh/sshd_config

# Recommended security settings:
Port 2222                          # Change default port
PermitRootLogin no                 # Disable root login
PasswordAuthentication no          # Use key-based auth only
PubkeyAuthentication yes           # Enable key authentication
MaxAuthTries 3                     # Limit auth attempts
ClientAliveInterval 300            # Keep-alive interval
ClientAliveCountMax 2              # Max keep-alive count

# Restart SSH service
sudo systemctl restart sshd
```

### 3. SSH Access Control Lists
```bash
# Allow specific users only
AllowUsers john jane admin

# Allow specific groups
AllowGroups sshusers developers

# Deny specific users
DenyUsers guest test
```

## Sudo Configuration

### 1. Sudo Access Management
```bash
# Edit sudoers file (ALWAYS use visudo)
sudo visudo

# Grant full sudo access
john ALL=(ALL:ALL) ALL

# Grant specific command access
john ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx

# Grant access to specific group
%developers ALL=(ALL:ALL) ALL

# No password for specific commands
%developers ALL=(ALL) NOPASSWD: /usr/bin/apt update, /usr/bin/apt upgrade
```

### 2. Sudo Best Practices
```bash
# Check sudo access
sudo -l

# View sudo logs
sudo cat /var/log/auth.log | grep sudo

# Set sudo timeout
Defaults timestamp_timeout=15

# Require password for every sudo command
Defaults timestamp_timeout=0
```

## Cloud IAM (Identity and Access Management)

### AWS IAM

#### 1. Create IAM User
```bash
# Create IAM user
aws iam create-user --user-name john-admin

# Create access key
aws iam create-access-key --user-name john-admin

# Attach policy to user
aws iam attach-user-policy \
  --user-name john-admin \
  --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess
```

#### 2. IAM Groups
```bash
# Create IAM group
aws iam create-group --group-name Developers

# Add user to group
aws iam add-user-to-group \
  --user-name john \
  --group-name Developers

# Attach policy to group
aws iam attach-group-policy \
  --group-name Developers \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

#### 3. IAM Roles for EC2
```bash
# Create role trust policy
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

# Create IAM role
aws iam create-role \
  --role-name EC2-S3-Access \
  --assume-role-policy-document file://trust-policy.json

# Attach policy to role
aws iam attach-role-policy \
  --role-name EC2-S3-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
```

### GCP IAM

#### 1. Create Service Account
```bash
# Create service account
gcloud iam service-accounts create app-server \
  --display-name="Application Server"

# Grant role to service account
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:app-server@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

#### 2. Manage IAM Policies
```bash
# List IAM policies
gcloud projects get-iam-policy PROJECT_ID

# Add IAM binding
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="user:john@example.com" \
  --role="roles/compute.instanceAdmin.v1"

# Remove IAM binding
gcloud projects remove-iam-policy-binding PROJECT_ID \
  --member="user:john@example.com" \
  --role="roles/compute.instanceAdmin.v1"
```

## Firewall Configuration

### 1. UFW (Uncomplicated Firewall)
```bash
# Enable firewall
sudo ufw enable

# Allow services
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 192.168.1.0/24 to any port 3306  # MySQL from specific subnet

# Deny services
sudo ufw deny 23/tcp  # Deny telnet

# Delete rules
sudo ufw delete allow 80/tcp

# Check status
sudo ufw status verbose
sudo ufw status numbered
```

### 2. iptables
```bash
# List rules
sudo iptables -L -n -v

# Allow SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Save rules
sudo iptables-save > /etc/iptables/rules.v4
```

## Security Best Practices

### 1. Password Policy
```bash
# Install password quality checking library
sudo apt install libpam-pwquality

# Edit password policy
sudo vim /etc/security/pwquality.conf

# Set minimum password length
minlen = 12

# Require different character classes
dcredit = -1  # At least 1 digit
ucredit = -1  # At least 1 uppercase
lcredit = -1  # At least 1 lowercase
ocredit = -1  # At least 1 special character
```

### 2. Login Security
```bash
# Set password expiry
sudo chage -M 90 john      # Max 90 days
sudo chage -m 7 john       # Min 7 days
sudo chage -W 7 john       # Warning 7 days before

# View password expiry info
sudo chage -l john

# Lock account after failed attempts
sudo vim /etc/pam.d/common-auth
# Add: auth required pam_tally2.so deny=5 unlock_time=1800
```

### 3. Audit Logging
```bash
# Install auditd
sudo apt install auditd

# Start audit service
sudo systemctl start auditd
sudo systemctl enable auditd

# Add audit rules
sudo auditctl -w /etc/passwd -p wa -k passwd_changes
sudo auditctl -w /etc/sudoers -p wa -k sudoers_changes

# View audit logs
sudo ausearch -k passwd_changes
```

## Security Checklist

- [ ] Disable root login via SSH
- [ ] Use SSH keys instead of passwords
- [ ] Configure firewall (UFW/iptables)
- [ ] Regular security updates
- [ ] Strong password policy
- [ ] Minimal user privileges (principle of least privilege)
- [ ] Regular security audits
- [ ] Monitor authentication logs
- [ ] Use IAM roles for cloud resources
- [ ] Enable MFA for critical accounts

## Key Learnings
1. **Least Privilege**: Grant only necessary permissions
2. **Defense in Depth**: Multiple layers of security
3. **Regular Audits**: Monitor and review access logs
4. **Key-based Authentication**: More secure than passwords
5. **IAM Integration**: Cloud IAM provides centralized access control

## Next Steps
- Set up [Backup and Recovery](backup-recovery.md)
- Review [Troubleshooting Guide](troubleshooting.md)
- Return to [System Setup](system-setup.md)
