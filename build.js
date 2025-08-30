#!/usr/bin/env node

/**
 * Build script for creating platform-specific binaries
 * Uses pkg to package Node.js application into executables
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PKG_CONFIG = {
  name: 'web-terminal',
  version: '1.0.0',
  description: 'Web Terminal - Terminal emulator with mobile support',
  targets: [
    'node18-linux-x64',
    'node18-linux-arm64',
    'node18-macos-x64',
    'node18-macos-arm64',
    'node18-win-x64'
  ],
  outputDir: path.join(__dirname, 'dist'),
  assets: [
    'backend/static/**/*',
    'backend/migrations/**/*',
    'backend/.env.example',
    'cli/**/*',
    'scripts/**/*',
    'bin/gotty*'
  ]
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

/**
 * Check if required tools are installed
 */
function checkDependencies() {
  logInfo('Checking dependencies...');
  
  // Check for Node.js
  try {
    const nodeVersion = execSync('node -v', { encoding: 'utf8' }).trim();
    logSuccess(`Node.js ${nodeVersion} found`);
  } catch (error) {
    logError('Node.js is not installed');
    process.exit(1);
  }
  
  // Check for npm
  try {
    const npmVersion = execSync('npm -v', { encoding: 'utf8' }).trim();
    logSuccess(`npm ${npmVersion} found`);
  } catch (error) {
    logError('npm is not installed');
    process.exit(1);
  }
  
  // Check for pkg
  try {
    execSync('npx pkg --version', { encoding: 'utf8' });
    logSuccess('pkg is available');
  } catch (error) {
    logWarning('pkg not found, will be installed via npx');
  }
}

/**
 * Build frontend
 */
function buildFrontend() {
  logInfo('Building frontend...');
  
  const frontendDir = path.join(__dirname, 'frontend');
  
  // Install dependencies
  logInfo('Installing frontend dependencies...');
  execSync('npm ci', { cwd: frontendDir, stdio: 'inherit' });
  
  // Build production bundle
  logInfo('Building production bundle...');
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
  
  // Copy to backend static directory
  const staticDir = path.join(__dirname, 'backend', 'static');
  if (fs.existsSync(staticDir)) {
    fs.rmSync(staticDir, { recursive: true });
  }
  
  const distDir = path.join(frontendDir, 'dist');
  fs.cpSync(distDir, staticDir, { recursive: true });
  
  logSuccess('Frontend built successfully');
}

/**
 * Prepare backend for packaging
 */
function prepareBackend() {
  logInfo('Preparing backend...');
  
  const backendDir = path.join(__dirname, 'backend');
  
  // Install production dependencies only
  logInfo('Installing backend dependencies...');
  execSync('npm ci --production', { cwd: backendDir, stdio: 'inherit' });
  
  logSuccess('Backend prepared successfully');
}

/**
 * Create pkg configuration file
 */
function createPkgConfig() {
  logInfo('Creating pkg configuration...');
  
  const config = {
    name: PKG_CONFIG.name,
    version: PKG_CONFIG.version,
    description: PKG_CONFIG.description,
    bin: 'backend/server.js',
    scripts: [
      'backend/src/**/*.js',
      'cli/**/*.js'
    ],
    assets: PKG_CONFIG.assets,
    targets: PKG_CONFIG.targets,
    outputPath: PKG_CONFIG.outputDir,
    compress: 'GZip'
  };
  
  const configPath = path.join(__dirname, 'pkg.config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  logSuccess('pkg configuration created');
  return configPath;
}

/**
 * Build binaries for all platforms
 */
function buildBinaries() {
  logInfo('Building platform-specific binaries...');
  
  // Create output directory
  if (!fs.existsSync(PKG_CONFIG.outputDir)) {
    fs.mkdirSync(PKG_CONFIG.outputDir, { recursive: true });
  }
  
  // Create pkg config
  const configPath = createPkgConfig();
  
  // Build for each target
  for (const target of PKG_CONFIG.targets) {
    logInfo(`Building for ${target}...`);
    
    const [node, platform, arch] = target.split('-');
    let outputName = `${PKG_CONFIG.name}-${platform}-${arch}`;
    
    if (platform === 'win') {
      outputName += '.exe';
    }
    
    const outputPath = path.join(PKG_CONFIG.outputDir, outputName);
    
    try {
      execSync(
        `npx pkg backend/server.js --target ${target} --output ${outputPath} --compress GZip`,
        { stdio: 'inherit' }
      );
      
      // Make executable on Unix systems
      if (platform !== 'win') {
        fs.chmodSync(outputPath, '755');
      }
      
      logSuccess(`Built ${outputName}`);
    } catch (error) {
      logError(`Failed to build for ${target}: ${error.message}`);
    }
  }
  
  // Clean up config file
  fs.unlinkSync(configPath);
  
  logSuccess('All binaries built successfully');
}

/**
 * Create distribution packages
 */
function createDistributions() {
  logInfo('Creating distribution packages...');
  
  const distDir = PKG_CONFIG.outputDir;
  const packagesDir = path.join(distDir, 'packages');
  
  if (!fs.existsSync(packagesDir)) {
    fs.mkdirSync(packagesDir, { recursive: true });
  }
  
  // Create tar.gz for Linux/macOS
  const unixPlatforms = ['linux-x64', 'linux-arm64', 'macos-x64', 'macos-arm64'];
  
  for (const platform of unixPlatforms) {
    const binaryName = `${PKG_CONFIG.name}-${platform}`;
    const binaryPath = path.join(distDir, binaryName);
    
    if (fs.existsSync(binaryPath)) {
      const packageName = `${PKG_CONFIG.name}-${PKG_CONFIG.version}-${platform}.tar.gz`;
      const packagePath = path.join(packagesDir, packageName);
      
      // Create temporary directory for package contents
      const tempDir = path.join(distDir, `temp-${platform}`);
      fs.mkdirSync(tempDir, { recursive: true });
      
      // Copy binary
      fs.copyFileSync(binaryPath, path.join(tempDir, PKG_CONFIG.name));
      
      // Copy additional files
      fs.copyFileSync(
        path.join(__dirname, 'README.md'),
        path.join(tempDir, 'README.md')
      );
      fs.copyFileSync(
        path.join(__dirname, 'LICENSE'),
        path.join(tempDir, 'LICENSE')
      );
      fs.copyFileSync(
        path.join(__dirname, '.env.example'),
        path.join(tempDir, '.env.example')
      );
      
      // Create tar.gz
      execSync(
        `tar -czf ${packagePath} -C ${tempDir} .`,
        { stdio: 'inherit' }
      );
      
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true });
      
      logSuccess(`Created ${packageName}`);
    }
  }
  
  // Create zip for Windows
  const winBinary = `${PKG_CONFIG.name}-win-x64.exe`;
  const winBinaryPath = path.join(distDir, winBinary);
  
  if (fs.existsSync(winBinaryPath)) {
    const packageName = `${PKG_CONFIG.name}-${PKG_CONFIG.version}-win-x64.zip`;
    const packagePath = path.join(packagesDir, packageName);
    
    // Create temporary directory
    const tempDir = path.join(distDir, 'temp-win');
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Copy files
    fs.copyFileSync(winBinaryPath, path.join(tempDir, `${PKG_CONFIG.name}.exe`));
    fs.copyFileSync(
      path.join(__dirname, 'README.md'),
      path.join(tempDir, 'README.md')
    );
    fs.copyFileSync(
      path.join(__dirname, 'LICENSE'),
      path.join(tempDir, 'LICENSE')
    );
    fs.copyFileSync(
      path.join(__dirname, '.env.example'),
      path.join(tempDir, '.env.example')
    );
    
    // Create zip (using native zip if available, otherwise use node)
    try {
      execSync(
        `zip -r ${packagePath} .`,
        { cwd: tempDir, stdio: 'inherit' }
      );
    } catch (error) {
      logWarning('zip command not found, creating archive using Node.js...');
      // Fallback to Node.js implementation
      const archiver = await import('archiver');
      const output = fs.createWriteStream(packagePath);
      const archive = archiver.default('zip', { zlib: { level: 9 } });
      
      archive.pipe(output);
      archive.directory(tempDir, false);
      await archive.finalize();
    }
    
    // Clean up
    fs.rmSync(tempDir, { recursive: true });
    
    logSuccess(`Created ${packageName}`);
  }
  
  logSuccess('Distribution packages created');
}

/**
 * Generate checksums for all packages
 */
function generateChecksums() {
  logInfo('Generating checksums...');
  
  const packagesDir = path.join(PKG_CONFIG.outputDir, 'packages');
  const checksumFile = path.join(packagesDir, 'checksums.txt');
  
  let checksums = '';
  
  const files = fs.readdirSync(packagesDir);
  for (const file of files) {
    if (file.endsWith('.tar.gz') || file.endsWith('.zip')) {
      const filePath = path.join(packagesDir, file);
      
      try {
        const sha256 = execSync(
          `shasum -a 256 ${filePath} | cut -d' ' -f1`,
          { encoding: 'utf8' }
        ).trim();
        
        checksums += `${sha256}  ${file}\n`;
        logSuccess(`Checksum for ${file}: ${sha256}`);
      } catch (error) {
        logWarning(`Could not generate checksum for ${file}`);
      }
    }
  }
  
  fs.writeFileSync(checksumFile, checksums);
  logSuccess('Checksums generated');
}

/**
 * Main build process
 */
async function build() {
  console.log('');
  log('╔══════════════════════════════════════╗', 'blue');
  log('║     Web Terminal Build System        ║', 'blue');
  log('║        Creating Binaries...          ║', 'blue');
  log('╚══════════════════════════════════════╝', 'blue');
  console.log('');
  
  try {
    // Check dependencies
    checkDependencies();
    
    // Build frontend
    buildFrontend();
    
    // Prepare backend
    prepareBackend();
    
    // Build binaries
    buildBinaries();
    
    // Create distribution packages
    createDistributions();
    
    // Generate checksums
    generateChecksums();
    
    console.log('');
    log('════════════════════════════════════════', 'green');
    log('     Build completed successfully!', 'green');
    log('════════════════════════════════════════', 'green');
    console.log('');
    logInfo(`Binaries available in: ${PKG_CONFIG.outputDir}`);
    logInfo(`Packages available in: ${path.join(PKG_CONFIG.outputDir, 'packages')}`);
    console.log('');
    
  } catch (error) {
    console.log('');
    logError(`Build failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run build if called directly
if (import.meta.url === `file://${__filename}`) {
  build();
}

export default build;