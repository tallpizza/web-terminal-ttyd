#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'cross-spawn';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();
let serverProcess = null;

// Configuration
const CONFIG = {
  defaultPort: 8080,
  defaultHost: '0.0.0.0',
  pidFile: path.join(__dirname, '.web-terminal.pid'),
  backendPath: path.join(__dirname, '..', 'backend')
};

// Helper functions
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

function savePid(pid) {
  fs.writeFileSync(CONFIG.pidFile, pid.toString());
}

function getPid() {
  try {
    return parseInt(fs.readFileSync(CONFIG.pidFile, 'utf8'));
  } catch {
    return null;
  }
}

function removePid() {
  try {
    fs.unlinkSync(CONFIG.pidFile);
  } catch {}
}

async function checkServerStatus(port) {
  try {
    const response = await fetch(`http://localhost:${port}/api/health`, {
      timeout: 2000
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Commands
program
  .name('web-terminal')
  .description('Web-based terminal emulator with customizable virtual keyboard')
  .version('1.0.0');

program
  .command('start')
  .description('Start the web terminal server')
  .option('-p, --port <port>', 'server port', CONFIG.defaultPort)
  .option('-h, --host <host>', 'server host', CONFIG.defaultHost)
  .option('-d, --detach', 'run in background')
  .action(async (options) => {
    const spinner = ora('Starting Web Terminal server...').start();
    
    // Check if server is already running
    const existingPid = getPid();
    if (existingPid) {
      try {
        process.kill(existingPid, 0);
        spinner.fail(chalk.red(`Server is already running with PID ${existingPid}`));
        console.log(chalk.yellow('Use "web-terminal stop" to stop the server'));
        process.exit(1);
      } catch {
        // Process doesn't exist, clean up PID file
        removePid();
      }
    }
    
    // Check if port is available
    const portAvailable = await isPortAvailable(options.port);
    if (!portAvailable) {
      spinner.fail(chalk.red(`Port ${options.port} is already in use`));
      process.exit(1);
    }
    
    // Start backend server
    const env = {
      ...process.env,
      PORT: options.port,
      HOST: options.host,
      NODE_ENV: 'production'
    };
    
    const serverPath = path.join(CONFIG.backendPath, 'server.js');
    
    // Check if backend exists
    if (!fs.existsSync(serverPath)) {
      // Try to find it in the parent directory structure
      const altPath = path.join(__dirname, '../../backend/server.js');
      if (fs.existsSync(altPath)) {
        CONFIG.backendPath = path.join(__dirname, '../../backend');
      } else {
        spinner.fail(chalk.red('Backend server not found. Please run npm install first.'));
        process.exit(1);
      }
    }
    
    if (options.detach) {
      // Run in background
      serverProcess = spawn('node', [serverPath], {
        env,
        detached: true,
        stdio: 'ignore'
      });
      
      serverProcess.unref();
      savePid(serverProcess.pid);
      
      spinner.succeed(chalk.green(`Web Terminal server started on http://localhost:${options.port}`));
      console.log(chalk.cyan(`Process ID: ${serverProcess.pid}`));
      console.log(chalk.yellow('Use "web-terminal stop" to stop the server'));
    } else {
      // Run in foreground
      serverProcess = spawn('node', [serverPath], {
        env,
        stdio: 'inherit'
      });
      
      savePid(serverProcess.pid);
      
      serverProcess.on('exit', (code) => {
        removePid();
        if (code !== 0) {
          spinner.fail(chalk.red(`Server exited with code ${code}`));
        }
      });
      
      // Handle Ctrl+C
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\\nShutting down server...'));
        if (serverProcess) {
          serverProcess.kill('SIGTERM');
        }
        removePid();
        process.exit(0);
      });
      
      spinner.succeed(chalk.green(`Web Terminal server started on http://localhost:${options.port}`));
      console.log(chalk.cyan('Press Ctrl+C to stop'));
    }
  });

program
  .command('stop')
  .description('Stop the web terminal server')
  .action(() => {
    const spinner = ora('Stopping Web Terminal server...').start();
    
    const pid = getPid();
    if (!pid) {
      spinner.fail(chalk.yellow('No server is running'));
      process.exit(0);
    }
    
    try {
      process.kill(pid, 'SIGTERM');
      removePid();
      spinner.succeed(chalk.green('Server stopped successfully'));
    } catch (error) {
      if (error.code === 'ESRCH') {
        // Process doesn't exist
        removePid();
        spinner.warn(chalk.yellow('Server was not running (cleaned up PID file)'));
      } else {
        spinner.fail(chalk.red(`Failed to stop server: ${error.message}`));
        process.exit(1);
      }
    }
  });

program
  .command('status')
  .description('Check server status')
  .option('-p, --port <port>', 'server port', CONFIG.defaultPort)
  .action(async (options) => {
    const spinner = ora('Checking server status...').start();
    
    const pid = getPid();
    if (!pid) {
      spinner.info(chalk.yellow('Server is not running'));
      process.exit(0);
    }
    
    try {
      process.kill(pid, 0);
      const isResponding = await checkServerStatus(options.port);
      
      if (isResponding) {
        spinner.succeed(chalk.green(`Server is running (PID: ${pid})`));
        console.log(chalk.cyan(`URL: http://localhost:${options.port}`));
        
        // Get session count
        try {
          const response = await fetch(`http://localhost:${options.port}/api/sessions`);
          const sessions = await response.json();
          console.log(chalk.cyan(`Active sessions: ${sessions.length}`));
        } catch {}
      } else {
        spinner.warn(chalk.yellow(`Server process is running (PID: ${pid}) but not responding`));
      }
    } catch {
      removePid();
      spinner.info(chalk.yellow('Server is not running (cleaned up stale PID file)'));
    }
  });

program
  .command('restart')
  .description('Restart the web terminal server')
  .option('-p, --port <port>', 'server port', CONFIG.defaultPort)
  .option('-h, --host <host>', 'server host', CONFIG.defaultHost)
  .action(async (options) => {
    console.log(chalk.cyan('Restarting Web Terminal server...'));
    
    // Stop server
    const pid = getPid();
    if (pid) {
      try {
        process.kill(pid, 'SIGTERM');
        removePid();
        console.log(chalk.green('✓ Server stopped'));
      } catch {}
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start server
    program.parse(['node', 'cli.js', 'start', '--detach', '--port', options.port, '--host', options.host]);
  });

// Parse command line arguments
program.parse(process.argv);