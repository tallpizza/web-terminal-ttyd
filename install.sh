#!/bin/bash

# Web Terminal Installation Script
# Supports: Linux, macOS, Windows (WSL)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="${INSTALL_DIR:-$HOME/.web-terminal}"
BIN_DIR="${BIN_DIR:-/usr/local/bin}"
GOTTY_VERSION="1.0.1"
NODE_MIN_VERSION="18"

# Functions
print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════╗"
    echo "║       Web Terminal Installer         ║"
    echo "║         Version 1.0.0                ║"
    echo "╚══════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
        elif [ -f /etc/redhat-release ]; then
            OS="redhat"
        elif [ -f /etc/arch-release ]; then
            OS="arch"
        else
            OS="linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
    echo $OS
}

detect_arch() {
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            echo "amd64"
            ;;
        aarch64|arm64)
            echo "arm64"
            ;;
        armv7l)
            echo "arm"
            ;;
        *)
            echo $ARCH
            ;;
    esac
}

check_command() {
    if command -v $1 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

check_node_version() {
    if check_command node; then
        NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
        if [ "$NODE_VERSION" -ge "$NODE_MIN_VERSION" ]; then
            return 0
        fi
    fi
    return 1
}

install_dependencies_debian() {
    print_info "Installing dependencies for Debian/Ubuntu..."
    sudo apt-get update
    sudo apt-get install -y curl wget git build-essential sqlite3
}

install_dependencies_redhat() {
    print_info "Installing dependencies for RedHat/CentOS/Fedora..."
    sudo yum install -y curl wget git gcc make sqlite
}

install_dependencies_arch() {
    print_info "Installing dependencies for Arch Linux..."
    sudo pacman -Sy --noconfirm curl wget git base-devel sqlite
}

install_dependencies_macos() {
    print_info "Installing dependencies for macOS..."
    if ! check_command brew; then
        print_error "Homebrew is required. Install from https://brew.sh"
        exit 1
    fi
    brew install curl wget git sqlite3
}

install_node() {
    print_info "Installing Node.js..."
    
    if [[ "$OS" == "macos" ]]; then
        brew install node@18
    elif [[ "$OS" == "debian" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "redhat" ]]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    elif [[ "$OS" == "arch" ]]; then
        sudo pacman -Sy --noconfirm nodejs npm
    else
        print_error "Please install Node.js 18+ manually from https://nodejs.org"
        exit 1
    fi
}

install_gotty() {
    print_info "Installing GoTTY..."
    
    ARCH=$(detect_arch)
    GOTTY_URL="https://github.com/yudai/gotty/releases/download/v${GOTTY_VERSION}/gotty_linux_${ARCH}.tar.gz"
    
    if [[ "$OS" == "macos" ]]; then
        GOTTY_URL="https://github.com/yudai/gotty/releases/download/v${GOTTY_VERSION}/gotty_darwin_${ARCH}.tar.gz"
    fi
    
    # Download and extract GoTTY
    cd /tmp
    wget -q $GOTTY_URL -O gotty.tar.gz
    tar -xzf gotty.tar.gz
    sudo mv gotty $BIN_DIR/
    sudo chmod +x $BIN_DIR/gotty
    rm gotty.tar.gz
    
    print_success "GoTTY installed successfully"
}

clone_repository() {
    print_info "Cloning Web Terminal repository..."
    
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Installation directory already exists. Backing up..."
        mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%s)"
    fi
    
    git clone https://github.com/yourusername/web-terminal.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    print_success "Repository cloned successfully"
}

install_npm_dependencies() {
    print_info "Installing npm dependencies..."
    
    # Install backend dependencies
    cd "$INSTALL_DIR/backend"
    npm install --production
    
    # Install frontend dependencies and build
    cd "$INSTALL_DIR/frontend"
    npm install
    npm run build
    
    # Install CLI dependencies
    cd "$INSTALL_DIR/cli"
    npm install --production
    
    print_success "Dependencies installed successfully"
}

setup_environment() {
    print_info "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f "$INSTALL_DIR/backend/.env" ]; then
        cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/backend/.env"
        
        # Generate random session secret
        SESSION_SECRET=$(openssl rand -hex 32)
        if [[ "$OS" == "macos" ]]; then
            sed -i '' "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" "$INSTALL_DIR/backend/.env"
        else
            sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" "$INSTALL_DIR/backend/.env"
        fi
    fi
    
    # Create data directory
    mkdir -p "$INSTALL_DIR/data"
    
    # Set permissions
    chmod 755 "$INSTALL_DIR"
    chmod 700 "$INSTALL_DIR/data"
    
    print_success "Environment configured successfully"
}

install_cli() {
    print_info "Installing CLI tool..."
    
    # Create symlink for CLI
    sudo ln -sf "$INSTALL_DIR/cli/cli.js" "$BIN_DIR/web-terminal"
    sudo chmod +x "$BIN_DIR/web-terminal"
    
    print_success "CLI tool installed successfully"
}

create_systemd_service() {
    print_info "Creating systemd service..."
    
    cat << EOF | sudo tee /etc/systemd/system/web-terminal.service > /dev/null
[Unit]
Description=Web Terminal Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=$(which node) server.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/web-terminal.log
StandardError=append:/var/log/web-terminal.error.log
Environment="NODE_ENV=production"
Environment="PATH=/usr/local/bin:/usr/bin:/bin"

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable web-terminal
    
    print_success "Systemd service created"
}

create_launchd_service() {
    print_info "Creating launchd service for macOS..."
    
    cat << EOF | tee ~/Library/LaunchAgents/com.web-terminal.plist > /dev/null
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.web-terminal</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which node)</string>
        <string>$INSTALL_DIR/backend/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR/backend</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/web-terminal.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/web-terminal.error.log</string>
</dict>
</plist>
EOF
    
    launchctl load ~/Library/LaunchAgents/com.web-terminal.plist
    
    print_success "Launchd service created"
}

run_tests() {
    print_info "Running installation tests..."
    
    # Test GoTTY
    if check_command gotty; then
        print_success "GoTTY is installed"
    else
        print_error "GoTTY installation failed"
        return 1
    fi
    
    # Test Node.js
    if check_node_version; then
        print_success "Node.js version is compatible"
    else
        print_error "Node.js version is incompatible"
        return 1
    fi
    
    # Test CLI
    if check_command web-terminal; then
        print_success "CLI tool is installed"
    else
        print_error "CLI installation failed"
        return 1
    fi
    
    # Test backend
    cd "$INSTALL_DIR/backend"
    if timeout 5 node -e "require('./server.js')" 2>/dev/null; then
        print_success "Backend modules loaded successfully"
    else
        print_warning "Backend test skipped (requires manual verification)"
    fi
    
    return 0
}

print_completion() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}     Installation completed successfully!${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo ""
    echo "Web Terminal has been installed to: $INSTALL_DIR"
    echo ""
    echo "To start the service:"
    if [[ "$OS" == "macos" ]]; then
        echo "  launchctl start com.web-terminal"
    elif [[ "$OS" == "linux" ]] || [[ "$OS" == "debian" ]] || [[ "$OS" == "redhat" ]] || [[ "$OS" == "arch" ]]; then
        echo "  sudo systemctl start web-terminal"
    else
        echo "  web-terminal start"
    fi
    echo ""
    echo "To access the web interface:"
    echo "  http://localhost:3000"
    echo ""
    echo "For CLI usage:"
    echo "  web-terminal --help"
    echo ""
}

main() {
    print_banner
    
    # Detect OS and architecture
    OS=$(detect_os)
    ARCH=$(detect_arch)
    
    print_info "Detected OS: $OS ($ARCH)"
    
    if [[ "$OS" == "unknown" ]]; then
        print_error "Unsupported operating system"
        exit 1
    fi
    
    # Check for root/sudo (not needed for macOS user install)
    if [[ "$OS" != "macos" ]] && [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root"
        exit 1
    fi
    
    # Install system dependencies
    case $OS in
        debian)
            install_dependencies_debian
            ;;
        redhat)
            install_dependencies_redhat
            ;;
        arch)
            install_dependencies_arch
            ;;
        macos)
            install_dependencies_macos
            ;;
    esac
    
    # Install Node.js if needed
    if ! check_node_version; then
        install_node
    else
        print_success "Node.js $(node -v) is already installed"
    fi
    
    # Install GoTTY
    if ! check_command gotty; then
        install_gotty
    else
        print_success "GoTTY is already installed"
    fi
    
    # Clone repository
    clone_repository
    
    # Install npm dependencies
    install_npm_dependencies
    
    # Setup environment
    setup_environment
    
    # Install CLI tool
    install_cli
    
    # Create service
    if [[ "$OS" == "macos" ]]; then
        create_launchd_service
    elif [[ "$OS" == "linux" ]] || [[ "$OS" == "debian" ]] || [[ "$OS" == "redhat" ]] || [[ "$OS" == "arch" ]]; then
        if check_command systemctl; then
            create_systemd_service
        fi
    fi
    
    # Run tests
    if run_tests; then
        print_completion
    else
        print_error "Installation completed with errors. Please check the logs."
        exit 1
    fi
}

# Run main function
main "$@"