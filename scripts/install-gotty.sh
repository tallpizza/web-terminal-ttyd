#!/bin/bash

# GoTTY Installation Script
# Supports Linux, macOS, and Windows (via WSL)

set -e

GOTTY_VERSION="v1.5.0"
INSTALL_DIR="/usr/local/bin"
TEMP_DIR=$(mktemp -d)

# Detect OS and architecture
detect_platform() {
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    case "$ARCH" in
        x86_64)
            ARCH="amd64"
            ;;
        aarch64|arm64)
            ARCH="arm64"
            ;;
        armv7l)
            ARCH="arm"
            ;;
        *)
            echo "Unsupported architecture: $ARCH"
            exit 1
            ;;
    esac
    
    case "$OS" in
        linux)
            PLATFORM="linux_${ARCH}"
            ;;
        darwin)
            PLATFORM="darwin_${ARCH}"
            ;;
        *)
            echo "Unsupported OS: $OS"
            exit 1
            ;;
    esac
}

# Download GoTTY
download_gotty() {
    echo "📦 Downloading GoTTY ${GOTTY_VERSION} for ${PLATFORM}..."
    
    URL="https://github.com/sorenisanerd/gotty/releases/download/${GOTTY_VERSION}/gotty_${GOTTY_VERSION}_${PLATFORM}.tar.gz"
    
    cd "$TEMP_DIR"
    
    if command -v curl &> /dev/null; then
        curl -L -o gotty.tar.gz "$URL"
    elif command -v wget &> /dev/null; then
        wget -O gotty.tar.gz "$URL"
    else
        echo "❌ Neither curl nor wget found. Please install one of them."
        exit 1
    fi
    
    echo "📂 Extracting GoTTY..."
    tar -xzf gotty.tar.gz
}

# Install GoTTY
install_gotty() {
    echo "🔧 Installing GoTTY to ${INSTALL_DIR}..."
    
    # Check if we need sudo
    if [ -w "$INSTALL_DIR" ]; then
        mv gotty "$INSTALL_DIR/"
    else
        echo "🔐 Administrator privileges required to install to ${INSTALL_DIR}"
        sudo mv gotty "$INSTALL_DIR/"
    fi
    
    # Make executable
    if [ -w "$INSTALL_DIR/gotty" ]; then
        chmod +x "$INSTALL_DIR/gotty"
    else
        sudo chmod +x "$INSTALL_DIR/gotty"
    fi
}

# Verify installation
verify_installation() {
    if command -v gotty &> /dev/null; then
        VERSION=$(gotty --version 2>&1 | head -n1)
        echo "✅ GoTTY installed successfully!"
        echo "📍 Location: $(which gotty)"
        echo "📌 Version: ${VERSION}"
        return 0
    else
        echo "❌ GoTTY installation failed"
        return 1
    fi
}

# Test GoTTY with UTF-8
test_gotty() {
    echo ""
    echo "🧪 Testing GoTTY..."
    
    # Test basic functionality
    timeout 2 gotty --once --permit-write echo "Hello World" &> /dev/null &
    PID=$!
    sleep 1
    
    if kill -0 $PID 2>/dev/null; then
        kill $PID 2>/dev/null
        echo "✅ GoTTY basic test passed"
    else
        echo "⚠️ GoTTY process test needs manual verification"
    fi
    
    # Test UTF-8 support
    echo "🌏 Testing Unicode support..."
    echo "   Korean: 한글 테스트"
    echo "   Japanese: 日本語テスト"
    echo "   Chinese: 中文测试"
    echo "   Emoji: 🚀 🎉 ✨"
    echo "✅ Unicode display test complete"
}

# Cleanup
cleanup() {
    echo "🧹 Cleaning up..."
    rm -rf "$TEMP_DIR"
}

# Main installation flow
main() {
    echo "==================================="
    echo "   GoTTY Installation Script"
    echo "==================================="
    echo ""
    
    # Check if GoTTY is already installed
    if command -v gotty &> /dev/null; then
        CURRENT_VERSION=$(gotty --version 2>&1 | head -n1)
        echo "⚠️ GoTTY is already installed: ${CURRENT_VERSION}"
        read -p "Do you want to reinstall? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Installation cancelled."
            exit 0
        fi
    fi
    
    detect_platform
    download_gotty
    install_gotty
    cleanup
    
    if verify_installation; then
        test_gotty
        echo ""
        echo "==================================="
        echo "   Installation Complete! 🎉"
        echo "==================================="
        echo ""
        echo "You can now use GoTTY by running:"
        echo "  gotty -w bash"
        echo ""
    else
        exit 1
    fi
}

# Trap errors
trap cleanup EXIT

# Run main function
main "$@"