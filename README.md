# Web Terminal 🚀

A powerful web-based terminal emulator with mobile-first design, virtual keyboard support, and multi-session management. Access your terminal from anywhere using just a web browser!

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey)

## Features

- 🖥️ Multiple terminal sessions with tabs
- 📱 Mobile-friendly with touch gestures
- ⌨️ Fully customizable virtual keyboard
- 🌍 Unicode support (Korean, Chinese, Japanese, etc.)
- 🎨 Multiple themes and customization options
- 💾 Session persistence across page refreshes
- 🔒 Secure local-only access (no SSH required)

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/web-terminal.git
cd web-terminal

# Install dependencies
npm install

# Install GoTTY
./scripts/install-gotty.sh

# Link CLI tool globally
npm link
```

### Usage

```bash
# Start the web terminal server
web-terminal start

# Start on custom port
web-terminal start --port 3000

# Check status
web-terminal status

# Stop all sessions
web-terminal stop
```

Then open your browser and navigate to:
- Local: `http://localhost:8080`
- Network: `http://[your-ip]:8080`

## Virtual Keyboard Customization

1. Click the Settings icon in the terminal
2. Navigate to "Virtual Keyboard"
3. Add custom shortcuts:
   - Set key combinations (e.g., Ctrl+C, Shift+Tab)
   - Create command macros
   - Organize shortcuts into groups
4. Export/Import keyboard configurations as JSON

## System Requirements

- Node.js 18+ 
- npm or yarn
- Linux, macOS, or Windows with WSL
- Modern browser (Chrome, Firefox, Safari, Edge)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## License

MIT