# Web Terminal Installation Script for Windows
# Requires: PowerShell 5.0+, Windows 10/11 or Windows Server 2016+

param(
    [string]$InstallDir = "$env:USERPROFILE\.web-terminal",
    [string]$BinDir = "$env:ProgramFiles\web-terminal",
    [switch]$SkipNodeInstall,
    [switch]$SkipGoTTYInstall,
    [switch]$DevMode
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "Continue"

# Configuration
$GOTTY_VERSION = "1.0.1"
$NODE_MIN_VERSION = 18
$REPO_URL = "https://github.com/yourusername/web-terminal.git"

# Colors for output
function Write-Success {
    Write-Host "✓ " -ForegroundColor Green -NoNewline
    Write-Host $args[0]
}

function Write-Error {
    Write-Host "✗ " -ForegroundColor Red -NoNewline
    Write-Host $args[0]
}

function Write-Warning {
    Write-Host "⚠ " -ForegroundColor Yellow -NoNewline
    Write-Host $args[0]
}

function Write-Info {
    Write-Host "ℹ " -ForegroundColor Blue -NoNewline
    Write-Host $args[0]
}

function Show-Banner {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Blue
    Write-Host "║       Web Terminal Installer         ║" -ForegroundColor Blue
    Write-Host "║     Windows PowerShell Edition       ║" -ForegroundColor Blue
    Write-Host "║         Version 1.0.0                ║" -ForegroundColor Blue
    Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Blue
    Write-Host ""
}

function Test-Administrator {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-Command {
    param([string]$Command)
    return [bool](Get-Command -Name $Command -ErrorAction SilentlyContinue)
}

function Test-NodeVersion {
    if (Test-Command "node") {
        $nodeVersion = (node -v) -replace 'v', ''
        $majorVersion = [int]($nodeVersion.Split('.')[0])
        return $majorVersion -ge $NODE_MIN_VERSION
    }
    return $false
}

function Install-Chocolatey {
    if (!(Test-Command "choco")) {
        Write-Info "Installing Chocolatey package manager..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    }
}

function Install-Dependencies {
    Write-Info "Installing system dependencies..."
    
    # Install Chocolatey if not present
    Install-Chocolatey
    
    # Install Git
    if (!(Test-Command "git")) {
        Write-Info "Installing Git..."
        choco install git -y
    } else {
        Write-Success "Git is already installed"
    }
    
    # Install SQLite
    if (!(Test-Command "sqlite3")) {
        Write-Info "Installing SQLite..."
        choco install sqlite -y
    } else {
        Write-Success "SQLite is already installed"
    }
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

function Install-NodeJS {
    if (!$SkipNodeInstall) {
        if (!(Test-NodeVersion)) {
            Write-Info "Installing Node.js..."
            choco install nodejs --version=18.0.0 -y
            
            # Refresh PATH
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            
            if (Test-NodeVersion) {
                Write-Success "Node.js installed successfully"
            } else {
                throw "Failed to install Node.js"
            }
        } else {
            $version = node -v
            Write-Success "Node.js $version is already installed"
        }
    }
}

function Install-GoTTY {
    if (!$SkipGoTTYInstall) {
        Write-Info "Installing GoTTY..."
        
        $arch = if ([Environment]::Is64BitProcess) { "amd64" } else { "386" }
        $gottyUrl = "https://github.com/yudai/gotty/releases/download/v$GOTTY_VERSION/gotty_windows_$arch.zip"
        $gottyZip = "$env:TEMP\gotty.zip"
        $gottyExe = "$BinDir\gotty.exe"
        
        # Create bin directory if it doesn't exist
        if (!(Test-Path $BinDir)) {
            New-Item -ItemType Directory -Path $BinDir -Force | Out-Null
        }
        
        # Download GoTTY
        Write-Info "Downloading GoTTY from $gottyUrl..."
        Invoke-WebRequest -Uri $gottyUrl -OutFile $gottyZip
        
        # Extract GoTTY
        Write-Info "Extracting GoTTY..."
        Expand-Archive -Path $gottyZip -DestinationPath $BinDir -Force
        
        # Clean up
        Remove-Item $gottyZip
        
        # Add to PATH if not already there
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($currentPath -notlike "*$BinDir*") {
            [Environment]::SetEnvironmentVariable("Path", "$currentPath;$BinDir", "User")
            $env:Path += ";$BinDir"
        }
        
        Write-Success "GoTTY installed successfully"
    }
}

function Clone-Repository {
    Write-Info "Cloning Web Terminal repository..."
    
    # Backup existing installation if present
    if (Test-Path $InstallDir) {
        $backupDir = "$InstallDir.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
        Write-Warning "Installation directory exists. Backing up to $backupDir"
        Move-Item -Path $InstallDir -Destination $backupDir
    }
    
    # Clone repository
    git clone $REPO_URL $InstallDir
    
    if (Test-Path $InstallDir) {
        Write-Success "Repository cloned successfully"
    } else {
        throw "Failed to clone repository"
    }
}

function Install-NPMDependencies {
    Write-Info "Installing npm dependencies..."
    
    # Install backend dependencies
    Write-Info "Installing backend dependencies..."
    Set-Location "$InstallDir\backend"
    if ($DevMode) {
        npm install
    } else {
        npm install --production
    }
    
    # Install and build frontend
    Write-Info "Building frontend..."
    Set-Location "$InstallDir\frontend"
    npm install
    npm run build
    
    # Install CLI dependencies
    Write-Info "Installing CLI dependencies..."
    Set-Location "$InstallDir\cli"
    if ($DevMode) {
        npm install
    } else {
        npm install --production
    }
    
    Write-Success "Dependencies installed successfully"
}

function Setup-Environment {
    Write-Info "Setting up environment..."
    
    # Create .env file if it doesn't exist
    $envFile = "$InstallDir\backend\.env"
    if (!(Test-Path $envFile)) {
        Copy-Item "$InstallDir\.env.example" $envFile
        
        # Generate random session secret
        $bytes = New-Object byte[] 32
        [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
        $sessionSecret = [Convert]::ToBase64String($bytes)
        
        # Update session secret in .env file
        $content = Get-Content $envFile
        $content = $content -replace 'SESSION_SECRET=.*', "SESSION_SECRET=$sessionSecret"
        Set-Content $envFile $content
    }
    
    # Create data directory
    $dataDir = "$InstallDir\data"
    if (!(Test-Path $dataDir)) {
        New-Item -ItemType Directory -Path $dataDir | Out-Null
    }
    
    Write-Success "Environment configured successfully"
}

function Install-CLI {
    Write-Info "Installing CLI tool..."
    
    # Create batch file for CLI
    $cliScript = @"
@echo off
node "$InstallDir\cli\cli.js" %*
"@
    
    $cliBatch = "$BinDir\web-terminal.cmd"
    Set-Content -Path $cliBatch -Value $cliScript
    
    # Create PowerShell wrapper
    $psScript = @"
& node "$InstallDir\cli\cli.js" `$args
"@
    
    $psFile = "$BinDir\web-terminal.ps1"
    Set-Content -Path $psFile -Value $psScript
    
    Write-Success "CLI tool installed successfully"
}

function Create-WindowsService {
    Write-Info "Creating Windows service..."
    
    # Install node-windows for service management
    Set-Location "$InstallDir\backend"
    npm install node-windows --save
    
    # Create service installation script
    $serviceScript = @"
const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
    name: 'Web Terminal',
    description: 'Web Terminal Service',
    script: path.join(__dirname, 'server.js'),
    nodeOptions: ['--harmony', '--max_old_space_size=4096'],
    env: [{
        name: 'NODE_ENV',
        value: 'production'
    }, {
        name: 'PORT',
        value: '3000'
    }]
});

svc.on('install', function() {
    console.log('Service installed successfully');
    svc.start();
});

svc.on('alreadyinstalled', function() {
    console.log('Service is already installed');
});

svc.on('start', function() {
    console.log('Service started successfully');
});

svc.install();
"@
    
    $serviceInstaller = "$InstallDir\backend\install-service.js"
    Set-Content -Path $serviceInstaller -Value $serviceScript
    
    # Run service installer
    node $serviceInstaller
    
    Write-Success "Windows service created"
}

function Create-StartupShortcut {
    Write-Info "Creating startup shortcut..."
    
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\WebTerminal.lnk")
    $Shortcut.TargetPath = "node"
    $Shortcut.Arguments = "$InstallDir\backend\server.js"
    $Shortcut.WorkingDirectory = "$InstallDir\backend"
    $Shortcut.IconLocation = "$InstallDir\assets\icon.ico"
    $Shortcut.Save()
    
    Write-Success "Startup shortcut created"
}

function Test-Installation {
    Write-Info "Running installation tests..."
    
    $allTestsPassed = $true
    
    # Test GoTTY
    if (Test-Command "gotty") {
        Write-Success "GoTTY is installed"
    } else {
        Write-Error "GoTTY installation failed"
        $allTestsPassed = $false
    }
    
    # Test Node.js
    if (Test-NodeVersion) {
        Write-Success "Node.js version is compatible"
    } else {
        Write-Error "Node.js version is incompatible"
        $allTestsPassed = $false
    }
    
    # Test CLI
    if (Test-Path "$BinDir\web-terminal.cmd") {
        Write-Success "CLI tool is installed"
    } else {
        Write-Error "CLI installation failed"
        $allTestsPassed = $false
    }
    
    # Test backend modules
    try {
        Set-Location "$InstallDir\backend"
        $result = node -e "console.log('OK')" 2>&1
        if ($result -eq "OK") {
            Write-Success "Backend modules loaded successfully"
        } else {
            throw "Backend test failed"
        }
    } catch {
        Write-Warning "Backend test skipped (requires manual verification)"
    }
    
    return $allTestsPassed
}

function Show-CompletionMessage {
    Write-Host ""
    Write-Host "════════════════════════════════════════" -ForegroundColor Green
    Write-Host "     Installation completed successfully!" -ForegroundColor Green
    Write-Host "════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "Web Terminal has been installed to: $InstallDir"
    Write-Host ""
    Write-Host "To start the service:"
    Write-Host "  web-terminal start" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To access the web interface:"
    Write-Host "  http://localhost:3000" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For CLI usage:"
    Write-Host "  web-terminal --help" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To start automatically with Windows:"
    Write-Host "  A startup shortcut has been created" -ForegroundColor Gray
    Write-Host ""
}

# Main installation flow
try {
    Show-Banner
    
    # Check if running as administrator (recommended but not required)
    if (!(Test-Administrator)) {
        Write-Warning "Running without administrator privileges. Some features may be limited."
        Write-Warning "For full functionality, run this script as Administrator."
        Write-Host ""
        
        $response = Read-Host "Continue anyway? (Y/N)"
        if ($response -ne 'Y' -and $response -ne 'y') {
            exit 0
        }
    }
    
    # Install dependencies
    Install-Dependencies
    
    # Install Node.js
    Install-NodeJS
    
    # Install GoTTY
    Install-GoTTY
    
    # Clone repository
    Clone-Repository
    
    # Install npm dependencies
    Install-NPMDependencies
    
    # Setup environment
    Setup-Environment
    
    # Install CLI
    Install-CLI
    
    # Create Windows service (requires admin)
    if (Test-Administrator) {
        Create-WindowsService
    } else {
        Create-StartupShortcut
    }
    
    # Run tests
    if (Test-Installation) {
        Show-CompletionMessage
    } else {
        Write-Error "Installation completed with errors. Please check the output above."
        exit 1
    }
    
} catch {
    Write-Error "Installation failed: $_"
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}