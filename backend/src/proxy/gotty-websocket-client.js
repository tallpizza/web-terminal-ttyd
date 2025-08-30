import { WebSocket } from 'ws';

class GottyWebSocketClient {
  constructor(port, sessionId) {
    this.port = port;
    this.sessionId = sessionId;
    this.ws = null;
    this.connected = false;
    this.authenticated = false;
    this.initialized = false;
    this.messageQueue = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const url = `ws://localhost:${this.port}/ws`;
      console.log(`Connecting to GoTTY at ${url} for session ${this.sessionId}`);
      this.ws = new WebSocket(url);

      this.ws.on('open', async () => {
        console.log(`Connected to GoTTY session ${this.sessionId}`);
        
        // Step 1: Send authentication token (empty for default config)
        const authToken = JSON.stringify({ AuthToken: '', Arguments: '' });
        this.ws.send('0' + authToken);
        console.log(`Sent auth token to session ${this.sessionId}`);
        
        // Step 2: Wait for auth response, then initialize
        setTimeout(() => {
          const initMsg = JSON.stringify({ Width: 120, Height: 40 });
          this.ws.send('2' + initMsg);
          console.log(`Sent init message to session ${this.sessionId}`);
          this.initialized = true;
          this.connected = true;
          
          // Process any queued messages
          this.processQueue();
          resolve();
        }, 100);
      });

      this.ws.on('message', (data) => {
        // Handle GoTTY responses
        const msg = data.toString();
        if (msg.startsWith('0')) {
          // Output from terminal - could be used for logging or streaming
          this.handleOutput(msg.substring(1));
        } else if (msg.startsWith('3')) {
          // Pong response to our ping
          console.log(`Received pong from session ${this.sessionId}`);
        }
      });

      this.ws.on('error', (error) => {
        console.error(`GoTTY WebSocket error for session ${this.sessionId}:`, error);
        this.connected = false;
        reject(error);
      });

      this.ws.on('close', (code, reason) => {
        console.log(`GoTTY WebSocket closed for session ${this.sessionId}: ${code} ${reason}`);
        this.connected = false;
        this.authenticated = false;
        this.initialized = false;
      });

      // Set a timeout for connection
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error(`Connection timeout for session ${this.sessionId}`));
        }
      }, 5000);
    });
  }

  sendInput(data) {
    if (!this.connected || !this.initialized) {
      console.log(`Queueing input for session ${this.sessionId} (connected: ${this.connected}, initialized: ${this.initialized})`);
      this.messageQueue.push(data);
      return;
    }

    // GoTTY expects '1' prefix for input with base64 encoding
    const message = '1' + Buffer.from(data).toString('base64');
    console.log(`Sending input to session ${this.sessionId}: ${data} (encoded: ${message})`);
    this.ws.send(message);
  }

  processQueue() {
    console.log(`Processing ${this.messageQueue.length} queued messages for session ${this.sessionId}`);
    while (this.messageQueue.length > 0) {
      const data = this.messageQueue.shift();
      this.sendInput(data);
    }
  }

  handleOutput(data) {
    // Decode base64 output from terminal
    try {
      const decoded = Buffer.from(data, 'base64').toString('utf8');
      // Could emit this to clients or log it
      // For now, just log significant output
      if (decoded.trim()) {
        console.log(`Terminal output for session ${this.sessionId}: ${decoded.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error(`Error decoding output for session ${this.sessionId}:`, error);
    }
  }

  sendPing() {
    if (this.connected) {
      this.ws.send('3');
    }
  }

  close() {
    if (this.ws) {
      console.log(`Closing WebSocket for session ${this.sessionId}`);
      this.ws.close();
      this.ws = null;
      this.connected = false;
      this.initialized = false;
    }
  }

  isConnected() {
    return this.connected && this.initialized;
  }
}

export default GottyWebSocketClient;