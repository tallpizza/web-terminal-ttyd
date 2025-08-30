import { WebSocket } from 'ws';

class WebSocketProxy {
  constructor(terminalManager) {
    this.terminalManager = terminalManager;
    this.connections = new Map();
  }

  handleConnection(clientWs, sessionId) {
    const session = this.terminalManager.getSession(sessionId);
    
    if (!session) {
      clientWs.close(1008, 'Session not found');
      return;
    }

    // Create connection to ttyd WebSocket with proper headers
    const ttydUrl = `ws://localhost:${session.port}/ws`;
    const ttydWs = new WebSocket(ttydUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'en-US,en;q=0.9',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });
    
    // Store connection
    this.connections.set(sessionId, {
      client: clientWs,
      ttyd: ttydWs,
      connected: false
    });

    // Handle ttyd connection
    ttydWs.on('open', () => {
      console.log(`✅ Connected to ttyd session ${sessionId} on port ${session.port}`);
      
      const conn = this.connections.get(sessionId);
      if (conn) {
        conn.connected = true;
      }
    });

    // Forward messages from ttyd to client (binary data)
    ttydWs.on('message', (data) => {
      try {
        // ttyd sends binary data directly
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(data);
        }
      } catch (error) {
        console.error(`Error forwarding message to client ${sessionId}:`, error);
      }
    });

    // Forward messages from client to ttyd
    clientWs.on('message', (data) => {
      try {
        // For ttyd, just forward the data as-is
        if (ttydWs.readyState === WebSocket.OPEN) {
          ttydWs.send(data);
          // Update activity
          this.terminalManager.updateActivity(sessionId);
        }
      } catch (error) {
        console.error(`Error forwarding message to ttyd ${sessionId}:`, error);
      }
    });

    // Handle ttyd errors
    ttydWs.on('error', (error) => {
      console.error(`ttyd WebSocket error for session ${sessionId}:`, error);
      clientWs.close(1011, 'ttyd connection error');
      this.cleanup(sessionId);
    });

    // Handle ttyd close
    ttydWs.on('close', (code, reason) => {
      console.log(`ttyd WebSocket closed for session ${sessionId}: ${code} ${reason}`);
      if (clientWs.readyState === WebSocket.OPEN) {
        // Ensure code is a valid number, default to 1000 (normal closure)
        let closeCode = 1000;
        if (typeof code === 'number') {
          if (code >= 1000 && code <= 4999) {
            closeCode = code;
          } else {
            // Any other invalid code - use 1011
            closeCode = 1011;
          }
        }
        const closeReason = reason ? reason.toString() : '';
        clientWs.close(closeCode, closeReason);
      }
      this.cleanup(sessionId);
    });

    // Handle client errors
    clientWs.on('error', (error) => {
      console.error(`Client WebSocket error for session ${sessionId}:`, error);
      if (ttydWs.readyState === WebSocket.OPEN) {
        ttydWs.close();
      }
      this.cleanup(sessionId);
    });

    // Handle client close
    clientWs.on('close', (code, reason) => {
      console.log(`Client WebSocket closed for session ${sessionId}: ${code} ${reason}`);
      if (ttydWs.readyState === WebSocket.OPEN) {
        ttydWs.close();
      }
      this.cleanup(sessionId);
    });

    // Send ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // Every 30 seconds

    // Store ping interval for cleanup
    const conn = this.connections.get(sessionId);
    if (conn) {
      conn.pingInterval = pingInterval;
    }
  }

  // Send input to a session from REST API
  sendInput(sessionId, data) {
    const conn = this.connections.get(sessionId);
    if (!conn || !conn.ttyd || conn.ttyd.readyState !== WebSocket.OPEN) {
      throw new Error(`No active WebSocket connection for session ${sessionId}`);
    }
    
    // Send input directly to ttyd
    conn.ttyd.send(data);
    console.log(`Sent input to ttyd for session ${sessionId}:`, data);
    
    // Update activity
    this.terminalManager.updateActivity(sessionId);
  }

  cleanup(sessionId) {
    const conn = this.connections.get(sessionId);
    if (conn) {
      // Clear ping interval
      if (conn.pingInterval) {
        clearInterval(conn.pingInterval);
      }

      // Close connections if still open
      if (conn.client && conn.client.readyState === WebSocket.OPEN) {
        conn.client.close();
      }
      if (conn.ttyd && conn.ttyd.readyState === WebSocket.OPEN) {
        conn.ttyd.close();
      }

      // Remove from map
      this.connections.delete(sessionId);
      console.log(`Cleaned up WebSocket proxy for session ${sessionId}`);
    }
  }

  cleanupAll() {
    console.log('Cleaning up all WebSocket proxies...');
    for (const sessionId of this.connections.keys()) {
      this.cleanup(sessionId);
    }
  }

  getConnectionStatus(sessionId) {
    const conn = this.connections.get(sessionId);
    if (!conn) {
      return { connected: false };
    }

    return {
      connected: conn.connected,
      clientState: conn.client ? conn.client.readyState : null,
      ttydState: conn.ttyd ? conn.ttyd.readyState : null
    };
  }
}

export default WebSocketProxy;