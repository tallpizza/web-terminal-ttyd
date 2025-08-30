import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import TerminalManager from './src/gotty/manager.js';
import Database from './src/db/database.js';
import WebSocketProxy from './src/proxy/websocket-proxy.js';
import SessionCleanup from './src/tasks/cleanup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize components
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const terminalManager = new TerminalManager();
const db = new Database();
const wsProxy = new WebSocketProxy(terminalManager);
const cleanup = new SessionCleanup();

// Configuration from environment variables
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS || '20');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP completely for now
  crossOriginEmbedderPolicy: false
}));

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: ['*'], // Allow all headers
  exposedHeaders: ['*'], // Expose all headers
  preflightContinue: false,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(morgan(LOG_LEVEL === 'debug' ? 'dev' : 'combined'));

// Serve static files (Vue.js frontend)
const frontendPath = path.join(__dirname, 'static');
app.use(express.static(frontendPath));

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    sessions: terminalManager.getAllSessions().length
  });
});

// Session management

// List all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = terminalManager.getAllSessions();
    res.json(sessions);
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific session
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const session = terminalManager.getSession(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Add WebSocket connection status
    session.wsStatus = wsProxy.getConnectionStatus(req.params.id);
    
    res.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new session
app.post('/api/sessions', async (req, res) => {
  try {
    const { name, workingDir, shell } = req.body;
    
    // Check if max sessions reached
    const currentSessions = terminalManager.getAllSessions();
    if (currentSessions.length >= MAX_SESSIONS) {
      return res.status(429).json({ 
        error: `Maximum sessions (${MAX_SESSIONS}) reached. Please close some sessions first.` 
      });
    }
    
    const sessionConfig = {};
    if (name) sessionConfig.name = name;
    if (workingDir) sessionConfig.workingDir = workingDir;
    if (shell) sessionConfig.shell = shell;
    
    const session = await terminalManager.spawnTerminal(sessionConfig);
    
    // Store in database
    await db.createSession(session);
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rename session
app.put('/api/sessions/:id/rename', async (req, res) => {
  try {
    const { name } = req.body;
    const session = terminalManager.getSession(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    session.name = name;
    await db.updateSession(req.params.id, { name });
    
    res.json(session);
  } catch (error) {
    console.error('Error renaming session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send keyboard input to session
app.post('/api/sessions/:id/input', async (req, res) => {
  try {
    const { id } = req.params;
    const { key, ctrlKey, altKey, shiftKey } = req.body;
    
    console.log(`Received keyboard input for session ${id}:`, { key, ctrlKey, altKey, shiftKey });
    
    // Convert key event to terminal sequence
    let data = '';
    
    // Handle control key combinations
    if (ctrlKey && key && key.length === 1) {
      const code = key.toUpperCase().charCodeAt(0) - 64;
      data = String.fromCharCode(code);
    } else {
      // Use the key mapping
      const keyMap = {
        'Enter': '\r',
        'Tab': '\t',
        'Escape': '\x1b',
        'ArrowUp': '\x1b[A',
        'ArrowDown': '\x1b[B',
        'ArrowRight': '\x1b[C',
        'ArrowLeft': '\x1b[D',
        'Home': '\x1b[H',
        'End': '\x1b[F',
        'PageUp': '\x1b[5~',
        'PageDown': '\x1b[6~',
        'F1': '\x1bOP',
        'F2': '\x1bOQ',
        'F3': '\x1bOR',
        'F4': '\x1bOS',
        'F5': '\x1b[15~',
        'F6': '\x1b[17~',
        'F7': '\x1b[18~',
        'F8': '\x1b[19~',
        'F9': '\x1b[20~',
        'F10': '\x1b[21~',
        'F11': '\x1b[23~',
        'F12': '\x1b[24~'
      };
      
      data = keyMap[key] || key;
    }
    
    // Send to GoTTY through WebSocket proxy
    wsProxy.sendInput(id, data);
    
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('Error sending input:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete session
app.delete('/api/sessions/:id', async (req, res) => {
  try {
    const result = await terminalManager.killTerminal(req.params.id);
    await db.deleteSession(req.params.id);
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve terminal proxy page
app.get('/terminal/:id', (req, res) => {
  res.sendFile(path.join(frontendPath, 'terminal-proxy.html'));
});

// WebSocket handling for proxying to GoTTY
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  // Parse session ID from URL - support both old and new paths
  const url = new URL(req.url, `http://${req.headers.host}`);
  let sessionId = url.pathname.match(/\/ws\/terminal\/([^/]+)/)?.[1];
  if (!sessionId) {
    sessionId = url.pathname.match(/\/ws\/session\/([^/]+)/)?.[1];
  }
  
  if (!sessionId) {
    ws.close(1008, 'Session ID required');
    return;
  }
  
  console.log(`WebSocket connection request for session ${sessionId}`);
  
  // Use WebSocket proxy to handle the connection
  wsProxy.handleConnection(ws, sessionId);
});

// Catch-all route (serve Vue.js app)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Initialize and start server
async function start() {
  try {
    console.log('🚀 Starting Web Terminal Backend...');
    
    // Initialize terminal manager
    await terminalManager.init();
    
    // Initialize database
    await db.init();
    
    // Initialize cleanup service
    await cleanup.init();
    cleanup.startAutoCleanup(60 * 60 * 1000); // Run cleanup every hour
    
    // Start health check interval
    setInterval(async () => {
      const health = await terminalManager.healthCheck();
      if (health.dead > 0) {
        console.log(`Health check: ${health.alive} alive, ${health.dead} cleaned`);
      }
    }, 30000); // Every 30 seconds
    
    // Handle shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      wsProxy.cleanupAll();
      await cleanup.close();
      await terminalManager.killAll();
      await db.close();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      wsProxy.cleanupAll();
      await cleanup.close();
      await terminalManager.killAll();
      await db.close();
      process.exit(0);
    });
    
    // Start server
    server.listen(PORT, HOST, () => {
      console.log(`✅ Web Terminal Backend running on http://${HOST}:${PORT}`);
      console.log(`📍 Local: http://localhost:${PORT}`);
      
      // Get network interfaces
      import('os').then(os => {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
          for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
              console.log(`📍 Network: http://${iface.address}:${PORT}`);
            }
          }
        }
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
start();