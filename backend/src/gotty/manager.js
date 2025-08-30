import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TerminalManager {
  constructor() {
    this.sessions = new Map();
    this.nextPort = 8081;
    // Use ttyd instead of gotty - ttyd is installed via brew
    this.terminalPath = 'ttyd'; // ttyd is in PATH after brew install
  }

  async init() {
    // Check if ttyd is installed
    try {
      const { execSync } = await import('child_process');
      execSync('which ttyd', { stdio: 'ignore' });
      console.log(`✅ ttyd found in PATH`);
    } catch (error) {
      console.error(`❌ ttyd not found in PATH`);
      console.error('Please run: brew install ttyd');
      throw new Error('ttyd binary not found');
    }
  }

  /**
   * Check if a port is taken by existing session
   */
  isPortTaken(port) {
    for (const session of this.sessions.values()) {
      if (session.port === port) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a port is in use
   */
  async isPortInUse(port) {
    return new Promise(async (resolve) => {
      const { createServer } = await import('net');
      const server = createServer();
      
      server.listen(port, (err) => {
        if (err) {
          resolve(true); // Port is in use
        } else {
          server.close(() => {
            resolve(false); // Port is free
          });
        }
      });
      
      server.on('error', () => {
        resolve(true); // Port is in use
      });
    });
  }

  /**
   * Spawn a new ttyd process for a terminal session
   */
  async spawnTerminal(config = {}) {
    const sessionId = config.id || this.generateId();
    
    // Find available port
    let port = this.nextPort;
    while (this.isPortTaken(port) || await this.isPortInUse(port)) {
      port++;
    }
    this.nextPort = port + 1;
    
    // Generate a proper session number
    const sessionNumber = this.sessions.size + 1;
    
    const defaults = {
      name: `Session ${sessionNumber}`,
      shell: process.env.SHELL || '/bin/bash',
      workingDir: process.env.HOME,
      cols: 150, // Optimal width for better rendering
      rows: 40   // Optimal height for better rendering
    };
    
    const sessionConfig = { ...defaults, ...config };
    
    // Build ttyd arguments
    const ttydArgs = [
      '-p', port.toString(),
      '-W', // Allow write (input from browser)
      '-t', 'titleFixed=' + sessionConfig.name, // Set terminal title
      '-s', '2', // SIGINT signal when exiting
      '-P', '10', // Ping interval (10 seconds)
      '-w', sessionConfig.workingDir || process.env.HOME // Set working directory
      // ttyd handles dynamic resizing automatically
    ];
    
    // Command to execute (shell) 
    // GoTTY handles working directory through environment variables
    let shellCommand = sessionConfig.shell;
    
    console.log(`🚀 Spawning ttyd session ${sessionId} on port ${port}`);
    console.log(`   Command: ${this.terminalPath} ${ttydArgs.join(' ')} ${shellCommand}`);
    
    // Spawn ttyd process
    const ttydProcess = spawn(this.terminalPath, [...ttydArgs, shellCommand], {
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        LANG: 'en_US.UTF-8',
        LC_ALL: 'en_US.UTF-8',
        COLUMNS: sessionConfig.cols.toString(),
        LINES: sessionConfig.rows.toString(),
        HOME: process.env.HOME
      },
      detached: false
    });
    
    // Handle process output
    ttydProcess.stdout.on('data', (data) => {
      console.log(`[ttyd ${sessionId}] ${data.toString().trim()}`);
    });
    
    ttydProcess.stderr.on('data', (data) => {
      console.error(`[ttyd ${sessionId} ERROR] ${data.toString().trim()}`);
    });
    
    // Handle process exit
    ttydProcess.on('exit', (code, signal) => {
      console.log(`[ttyd ${sessionId}] Process exited (code: ${code}, signal: ${signal})`);
      this.sessions.delete(sessionId);
    });
    
    ttydProcess.on('error', (error) => {
      console.error(`[ttyd ${sessionId}] Process error:`, error);
      this.sessions.delete(sessionId);
    });
    
    // Store session information
    const session = {
      id: sessionId,
      name: sessionConfig.name,
      port: port,
      pid: ttydProcess.pid,
      process: ttydProcess,
      url: `http://localhost:${port}`,
      shell: sessionConfig.shell,
      workingDir: sessionConfig.workingDir,
      createdAt: new Date(),
      lastActivity: new Date(),
      status: 'starting'
    };
    
    this.sessions.set(sessionId, session);
    
    // Wait for GoTTY to start (give it 2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if process is still running
    if (ttydProcess.killed) {
      throw new Error('ttyd process failed to start');
    }
    
    session.status = 'running';
    
    // Don't create separate WebSocket client - we'll use the proxy connection instead
    console.log(`✅ ttyd session ${sessionId} ready on port ${port}`)
    
    // Return session info (without the process object)
    const { process: _, ...sessionInfo } = session;
    return sessionInfo;
  }


  /**
   * Kill a terminal session
   */
  async killTerminal(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    console.log(`🛑 Killing terminal session ${sessionId} (PID: ${session.pid})`)
    
    // Try graceful shutdown first
    session.process.kill('SIGTERM');
    
    // Give it 2 seconds to shutdown
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Force kill if still running
    try {
      process.kill(session.pid, 0); // Check if still running
      session.process.kill('SIGKILL'); // Force kill
      console.log(`⚠️ Force killed session ${sessionId}`);
    } catch {
      // Process already dead
    }
    
    this.sessions.delete(sessionId);
    
    return { success: true, sessionId };
  }

  /**
   * Get all sessions
   */
  getAllSessions() {
    const sessions = [];
    
    for (const [id, session] of this.sessions) {
      const { process: _, ...sessionInfo } = session;
      sessions.push(sessionInfo);
    }
    
    return sessions;
  }

  /**
   * Get a specific session
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    const { process: _, ...sessionInfo } = session;
    return sessionInfo;
  }

  /**
   * Update session activity
   */
  updateActivity(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Health check for all sessions
   */
  async healthCheck() {
    const deadSessions = [];
    
    for (const [id, session] of this.sessions) {
      try {
        // Check if process is still running
        process.kill(session.pid, 0);
      } catch {
        // Process is dead
        deadSessions.push(id);
        console.log(`☠️ Session ${id} is dead, cleaning up`);
      }
    }
    
    // Clean up dead sessions
    for (const id of deadSessions) {
      this.sessions.delete(id);
    }
    
    return {
      alive: this.sessions.size,
      dead: deadSessions.length,
      cleaned: deadSessions
    };
  }

  /**
   * Kill all sessions (for cleanup)
   */
  async killAll() {
    console.log('🛑 Killing all terminal sessions...');
    
    const promises = [];
    
    for (const [id] of this.sessions) {
      promises.push(this.killTerminal(id).catch(err => {
        console.error(`Failed to kill session ${id}:`, err);
      }));
    }
    
    await Promise.all(promises);
    
    this.sessions.clear();
    
    return { success: true };
  }

  /**
   * Generate unique session ID
   */
  generateId() {
    return Math.random().toString(36).substring(2, 11);
  }
}

export default TerminalManager;