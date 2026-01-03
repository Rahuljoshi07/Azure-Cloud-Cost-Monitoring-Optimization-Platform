#!/bin/bash

################################################################################
# 👤 User Setup Script - Interactive Edition
# Usage: sudo ./user-setup.sh
################################################################################

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Oops! This script needs administrator privileges.${NC}"
    echo -e "${YELLOW}Please run it with: sudo ./user-setup.sh${NC}"
    exit 1
fi

clear
echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                ║${NC}"
echo -e "${CYAN}║       👤 User Account Setup Wizard 👤          ║${NC}"
echo -e "${CYAN}║                                                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}This wizard will help you create new user accounts${NC}"
echo -e "${BLUE}and configure their permissions step by step.${NC}"
echo ""

create_user() {
    local username=$1
    local groups=$2
    local description=$3
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Creating user account: ${GREEN}$username${NC}"
    if [ ! -z "$description" ]; then
        echo -e "${BLUE}Role: ${YELLOW}$description${NC}"
    fi
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if id "$username" &>/dev/null; then
        echo -e "${YELLOW}⚠️  User '$username' already exists. Skipping...${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📁 Creating home directory...${NC}"
    if useradd -m -s /bin/bash "$username"; then
        echo -e "${GREEN}✓ Home directory created at /home/$username${NC}"
    else
        echo -e "${RED}❌ Failed to create user. Please check system logs.${NC}"
        return 1
    fi
    
    # Add to groups
    if [ ! -z "$groups" ]; then
    if [ ! -z "$groups" ]; then
        echo -e "${BLUE}👥 Adding to groups: ${YELLOW}$groups${NC}"
        usermod -aG "$groups" "$username"
        echo -e "${GREEN}✓ Groups assigned successfully${NC}"
    fi
    LOW}🔐 Time to set a password for $username${NC}"
    echo -e "${BLUE}Make it strong! Use a mix of letters, numbers, and symbols.${NC}"
    passwd "$username"
    
    # Create SSH directory
    echo ""
    echo -e "${BLUE}🔑 Setting up SSH access...${NC}"
    mkdir -p "/home/$username/.ssh"
    chmod 700 "/home/$username/.ssh"
    chmod 600 "/home/$username/.ssh/authorized_keys"
    chown -R "$username:$username" "/home/$username/.ssh"
    echo -e "${GREEN}✓ SSH directory configured${NC}"
    
    # Success message
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo -e "   1. Get the user's public SSH key (usually id_rsa.pub)"
    echo -e "   2. Add it to: ${CYAN}/home/$username/.ssh/authorized_keys${NC}"
    echo -e "   3. The user can then login with: ${CYAN}ssh $username@your-server${NC}"
    echo ""
}

# Interactive menu
while true; do
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}What type of user would you like to create?${NC}"
    echo ""
    echo -e "  ${GREEN}1)${NC} 👨‍💼 Admin User (full sudo access)"
    echo -e "  ${GREEN}2)${NC} 👨‍💻 Developer (sudo + developer group)"
    echo -e "  ${GREEN}3)${NC} 🌐 Web Administrator (nginx/apache access)"
    echo -e "  ${GREEN}4)${NC} 🗄️  Database Administrator (mysql/postgres access)"
    echo -e "  ${GREEN}5)${NC} 👤 Regular User (limited access)"
    echo -e "  ${GREEN}6)${NC} ⚙️  Custom User (choose your own groups)"
    echo -e "  ${RED}7)${NC} 🚪 Exit"
    echo ""
    echo -ne "${YELLOW}Enter your choice [1-7]: ${NC}"
    read choice
    
    case $choice in
        1)
            echo ""
            echo -ne "${BLUE}Enter username for Admin: ${NC}"
            read username
            if [ ! -z "$username" ]; then
                create_user "$username" "sudo" "System Administrator with full access"
            else
                echo -e "${RED}❌ Username cannot be empty${NC}"
            fi
            ;;
        2)
            echo ""
            echo -ne "${BLUE}Enter username for Developer: ${NC}"
            read username
            if [ ! -z "$username" ]; then
                # Create developers group if it doesn't exist
                groupadd -f developers
                create_user "$username" "sudo,developers" "Software Developer"
            elseecho -e "${RED}❌ Username cannot be empty${NC}"
            fi
            ;;
        3)
            echo ""
            echo -ne "${BLUE}Enter username for Web Admin: ${NC}"
            read username
            if [ ! -z "$username" ]; then
                create_user "$username" "www-data" "Web Server Administrator"
            else
                echo -e "${RED}❌ Username cannot be empty${NC}"
            fi
            ;;
        4)
            echo ""
            echo -ne "${BLUE}Enter username for Database Admin: ${NC}"
            read username
            if [ ! -z "$username" ]; then
                create_user "$username" "mysql" "Database Administrator"
            else
                echo -e "${RED}❌ Username cannot be empty${NC}"
            fi
            ;;
        5)
            echo ""
            echo -ne "${BLUE}Enter username for Regular User: ${NC}"
            read username
            if [ ! -z "$username" ]; then
                create_user "$username" "" "Regular User"
            else
                echo -e "${RED}❌ Username cannot be empty${NC}"
            fi
            ;;
        6)
            echo ""
            echo -ne "${BLUE}Enter username: ${NC}"
            read username
            echo -ne "${BLUE}Enter groups (comma-separated, e.g., sudo,docker): ${NC}"
            read groups
            if [ ! -z "$username" ]; then
                create_user "$username" "$groups" "Custom Configuration"
            else
                echo -e "${RED}❌ Username cannot be empty${NC}"
            fi
            ;;
        7)
            echo ""
            echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${GREEN}👋 Thanks for using the User Setup Wizard!${NC}"
            echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo ""
            echo -e "${BLUE}📋 Quick reference for SSH key setup:${NC}"
            echo ""
            echo -e "${YELLOW}To add SSH key for any user:${NC}"
            echo -e "  1. Get the public key: ${CYAN}cat ~/.ssh/id_rsa.pub${NC}"
            echo -e "  2. Copy the entire key"
            echo -e "  3. Add to: ${CYAN}/home/USERNAME/.ssh/authorized_keys${NC}"
            echo -e "  4. Or use: ${CYAN}ssh-copy-id username@server${NC}"
            echo ""
            echo -e "${BLUE}Happy administrating! 🚀${NC}"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid choice. Please enter a number between 1 and 7.${NC}"
            sleep 1
            ;;
    esac
    
    # Ask if they want to create another user
    echo ""
    echo -ne "${YELLOW}Would you like to create another user? (y/n): ${NC}"
    read another
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✓ User setup completed! 👍${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${BLUE}📊 Summary of created users:${NC}"
        echo ""
        tail -5 /etc/passwd | awk -F: '{print "  • " $1 " (UID: " $3 ")"}'
        echo ""
        echo -e "${YELLOW}💡 Pro tip: Use ${CYAN}id username${YELLOW} to check user details${NC}"
        echo ""
        exit 0
    fi
    
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║       👤 User Account Setup Wizard 👤          ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
    echo ""
done
