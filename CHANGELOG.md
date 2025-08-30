# Changelog

All notable changes to Web Terminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-20

### Added
- 🎉 Initial release of Web Terminal
- 🖥️ Multiple terminal sessions with tab management
- 📱 Mobile-first responsive design with touch gesture support
- ⌨️ Fully customizable virtual keyboard with:
  - Custom shortcuts and macros
  - Multiple keyboard layouts
  - Import/export configuration
  - Quick access buttons for common commands
- 🌍 Full Unicode support including Korean, Chinese, and Japanese input
- 🎨 12 built-in terminal themes:
  - Monokai, Dracula, Solarized Dark/Light
  - One Dark, Tokyo Night, Gruvbox Dark/Light
  - Material, Nord, Catppuccin, Synthwave '84
- 💾 Session persistence across page refreshes
- 🔧 Comprehensive settings panel with:
  - Theme selection
  - Font size adjustment (10-24px)
  - Fullscreen mode toggle
  - Virtual keyboard customization
- 🚀 GoTTY integration for terminal emulation
- 🔒 Secure local-only access (no SSH required)
- 🐳 Docker support with docker-compose
- 📦 Platform-specific binaries for:
  - Linux (x64, arm64)
  - macOS (x64, arm64/M1)
  - Windows (x64)
- 🛠️ CLI tool for managing sessions
- 🧹 Automatic cleanup service for stale sessions
- 📊 Health monitoring and status reporting
- 🔄 WebSocket proxy for reliable connections
- 📝 Comprehensive documentation

### Technical Features
- Vue 3 + TypeScript frontend
- Vuetify 3 Material Design components
- Tailwind CSS with 'tw-' prefix
- Pinia state management
- Express.js backend with WebSocket support
- SQLite database with Knex migrations
- Environment-based configuration
- Production-ready Dockerfile
- Nginx reverse proxy configuration
- Cross-platform installation scripts

### Platform Support
- Linux (Ubuntu, Debian, Fedora, Arch)
- macOS (Intel and Apple Silicon)
- Windows 10/11 (native and WSL)
- Docker containers

## [0.9.0-beta] - 2024-01-15

### Added
- Beta release for testing
- Core terminal functionality
- Basic virtual keyboard
- Session management

### Known Issues
- Limited theme options
- No session persistence
- Basic touch support only

## [0.8.0-alpha] - 2024-01-10

### Added
- Alpha release for internal testing
- Basic terminal emulation
- Simple web interface
- GoTTY integration

---

## Roadmap

### [1.1.0] - Planned
- [ ] Terminal output history (last 1000 lines)
- [ ] Data migration system for updates
- [ ] Additional IME support (Chinese, Japanese)
- [ ] Emoji picker integration
- [ ] RTL language support
- [ ] Terminal recording and playback
- [ ] Session sharing via secure links
- [ ] Multi-user support with authentication
- [ ] Terminal multiplexing (tmux-like features)
- [ ] Custom theme editor

### [1.2.0] - Future
- [ ] SSH key management UI
- [ ] File transfer support (upload/download)
- [ ] Terminal command history search
- [ ] Snippet manager
- [ ] Plugin system for extensions
- [ ] Cloud sync for settings
- [ ] Mobile apps (iOS/Android)
- [ ] Collaborative terminal sessions
- [ ] AI-powered command suggestions
- [ ] Performance analytics dashboard

## Version History

| Version | Date | Status | Downloads |
|---------|------|--------|-----------|
| 1.0.0 | 2024-01-20 | Stable | - |
| 0.9.0-beta | 2024-01-15 | Beta | - |
| 0.8.0-alpha | 2024-01-10 | Alpha | - |

## Support

For issues, feature requests, or questions:
- GitHub Issues: https://github.com/yourusername/web-terminal/issues
- Documentation: https://github.com/yourusername/web-terminal/wiki
- Discussions: https://github.com/yourusername/web-terminal/discussions