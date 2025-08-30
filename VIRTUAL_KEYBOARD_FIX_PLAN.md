# Virtual Keyboard Fix Plan

## Problem Analysis

### Current Issue
The virtual keyboard in the web terminal is completely non-functional. When pressing keys:
- ENTER key doesn't work
- Arrow keys don't work  
- No keystrokes are being sent to the terminal
- WebSocket errors occur: "failed to authenticate websocket connection"

### Root Cause
1. **Protocol Mismatch**: Frontend creates new WebSocket for each keypress, but GoTTY expects persistent connection with authentication flow
2. **Message Format Error**: GoTTY expects specific protocol (auth → init → input) with correct prefixes
3. **Architecture Issue**: Frontend shouldn't directly connect to GoTTY - it should go through backend proxy

## Solution Architecture

### Core Concept
Instead of frontend creating WebSocket connections, use a REST API approach where:
1. Frontend sends keyboard events via HTTP POST to backend
2. Backend maintains persistent WebSocket connection to GoTTY
3. Backend handles GoTTY protocol correctly

### Component Design

```
Frontend (Virtual Keyboard)
    ↓ HTTP POST /api/sessions/:id/input
Backend API Server
    ↓ Maintains WebSocket Client
GoTTY Terminal Process
```

## Implementation Plan

### Step 1: Create GoTTY WebSocket Client Class

**File**: `/Users/tallpizza/project/ssh_mobile/web-terminal/backend/src/proxy/gotty-websocket-client.js`

```javascript
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
      this.ws = new WebSocket(url);

      this.ws.on('open', async () => {
        console.log(`Connected to GoTTY session ${this.sessionId}`);
        
        // Step 1: Send authentication token
        const authToken = JSON.stringify({ AuthToken: '', Arguments: '' });
        this.ws.send('0' + authToken);
        
        // Step 2: Wait for auth response, then initialize
        setTimeout(() => {
          const initMsg = JSON.stringify({ Width: 80, Height: 24 });
          this.ws.send('2' + initMsg);
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
          // Output from terminal
          this.handleOutput(msg.substring(1));
        }
      });

      this.ws.on('error', (error) => {
        console.error(`GoTTY WebSocket error for session ${this.sessionId}:`, error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log(`GoTTY WebSocket closed for session ${this.sessionId}`);
        this.connected = false;
        this.authenticated = false;
        this.initialized = false;
      });
    });
  }

  sendInput(data) {
    if (!this.connected || !this.initialized) {
      this.messageQueue.push(data);
      return;
    }

    // GoTTY expects '1' prefix for input
    const message = '1' + Buffer.from(data).toString('base64');
    this.ws.send(message);
  }

  processQueue() {
    while (this.messageQueue.length > 0) {
      const data = this.messageQueue.shift();
      this.sendInput(data);
    }
  }

  handleOutput(data) {
    // Handle terminal output if needed
    console.log(`Terminal output for session ${this.sessionId}:`, data);
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default GottyWebSocketClient;
```

### Step 2: Update GoTTY Manager

**File**: `/Users/tallpizza/project/ssh_mobile/web-terminal/backend/src/gotty-manager.js`

Add WebSocket client management:

```javascript
import GottyWebSocketClient from './proxy/gotty-websocket-client.js';

class GottyManager {
  constructor() {
    this.sessions = new Map();
    this.wsClients = new Map(); // Add this
    this.availablePorts = new Set();
    // ... rest of constructor
  }

  async createSession(config) {
    // ... existing session creation code ...
    
    // After session is created successfully:
    const wsClient = new GottyWebSocketClient(session.port, session.id);
    await wsClient.connect();
    this.wsClients.set(session.id, wsClient);
    
    return session;
  }

  async sendInput(sessionId, input) {
    const wsClient = this.wsClients.get(sessionId);
    if (!wsClient) {
      throw new Error(`No WebSocket client for session ${sessionId}`);
    }
    
    wsClient.sendInput(input);
  }

  async closeSession(id) {
    // ... existing close code ...
    
    // Close WebSocket client
    const wsClient = this.wsClients.get(id);
    if (wsClient) {
      wsClient.close();
      this.wsClients.delete(id);
    }
  }
}
```

### Step 3: Create REST API Endpoint

**File**: `/Users/tallpizza/project/ssh_mobile/web-terminal/backend/src/routes/session-routes.js`

Add input endpoint:

```javascript
router.post('/sessions/:id/input', async (req, res) => {
  const { id } = req.params;
  const { key, ctrlKey, altKey, shiftKey } = req.body;
  
  try {
    // Convert key event to terminal sequence
    let data = '';
    
    // Handle control key combinations
    if (ctrlKey && key && key.length === 1) {
      const code = key.toUpperCase().charCodeAt(0) - 64;
      data = String.fromCharCode(code);
    } else {
      // Use the key mapping from the frontend
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
        // ... F1-F12 mappings
      };
      
      data = keyMap[key] || key;
    }
    
    // Send to GoTTY through manager
    await gottyManager.sendInput(id, data);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending input:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Step 4: Update Frontend Store

**File**: `/Users/tallpizza/project/ssh_mobile/web-terminal/frontend/src/stores/sessions.ts`

Replace WebSocket approach with HTTP POST:

```typescript
async function sendKeyToSession(id: string, event: any) {
  console.log('Sending key to session:', id, event)
  
  try {
    const response = await axios.post(`${API_BASE}/api/sessions/${id}/input`, {
      key: event.key,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey
    })
    
    console.log('Key sent successfully:', response.data)
  } catch (error) {
    console.error('Error sending key:', error)
  }
}
```

### Step 5: Clean Up WebSocket Proxy

Remove the client-to-GoTTY WebSocket forwarding from `/ws/session/:id` endpoint since we'll use REST API instead. The proxy should only handle iframe embedding, not keyboard input.

## Testing Plan

### Manual Testing
1. Start the application: `npm run dev`
2. Create a new session
3. Test each key:
   - ENTER: Should execute commands
   - Arrow Up/Down: Should navigate command history
   - TAB: Should trigger autocomplete
   - ESC: Should cancel current input
   - CTRL+C: Should interrupt running process
   - Function keys: Should work in applications like vim

### Automated Testing with Playwright

```javascript
test('Virtual keyboard functionality', async ({ page }) => {
  await page.goto('http://localhost:4080');
  
  // Create session
  await page.click('button:has-text("New Session")');
  await page.waitForSelector('iframe');
  
  // Test ENTER key
  await page.click('button:has-text("ENTER")');
  
  // Verify command execution (check for prompt change)
  await page.waitForTimeout(500);
  const screenshot1 = await page.screenshot();
  
  // Test arrow up (command history)
  await page.click('button:has-text("↑")');
  await page.waitForTimeout(500);
  const screenshot2 = await page.screenshot();
  
  // Screenshots should be different
  expect(screenshot1).not.toEqual(screenshot2);
});
```

## Implementation Order

1. **Phase 1: Backend WebSocket Client** (Priority: Critical)
   - Create GottyWebSocketClient class
   - Test direct connection to GoTTY
   - Verify authentication and initialization

2. **Phase 2: REST API** (Priority: High)
   - Add input endpoint to session routes
   - Update GottyManager to use WebSocket client
   - Test with curl/Postman

3. **Phase 3: Frontend Integration** (Priority: High)
   - Update sessions store to use HTTP POST
   - Remove WebSocket creation code
   - Test virtual keyboard

4. **Phase 4: Testing & Validation** (Priority: Medium)
   - Create Playwright tests
   - Test all meta keys
   - Test special key combinations

5. **Phase 5: Optimization** (Priority: Low)
   - Add connection pooling
   - Implement reconnection logic
   - Add error recovery

## Success Criteria

✅ ENTER key executes commands
✅ Arrow keys navigate history
✅ TAB triggers autocomplete
✅ ESC cancels input
✅ CTRL combinations work
✅ Function keys operate correctly
✅ No WebSocket errors in console
✅ Persistent connection maintained
✅ Multiple sessions work independently
✅ Graceful error handling

## Architecture Benefits

1. **Simplicity**: Frontend only needs to make HTTP requests
2. **Reliability**: Backend maintains persistent connections
3. **Protocol Compliance**: Backend handles GoTTY protocol correctly
4. **Scalability**: Can add connection pooling and optimization
5. **Debugging**: Easier to debug HTTP requests vs WebSocket
6. **Security**: Backend can validate and sanitize input

## Estimated Timeline

- Backend implementation: 2-3 hours
- Frontend updates: 1 hour
- Testing and debugging: 2 hours
- **Total: 5-6 hours**

## Risk Mitigation

1. **Connection drops**: Implement automatic reconnection
2. **Memory leaks**: Proper cleanup of WebSocket clients
3. **Race conditions**: Queue messages during initialization
4. **Security**: Validate all input before sending to terminal
5. **Performance**: Consider connection pooling for multiple sessions