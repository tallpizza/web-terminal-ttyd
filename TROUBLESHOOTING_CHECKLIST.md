# Web Terminal Troubleshooting Checklist

## 1. Backend Server Health Check
- [ ] **Port 4080 is listening**
  ```bash
  lsof -i :4080
  # Expected: node process listening on *:4080
  ```

- [ ] **API responds to health check**
  ```bash
  curl http://localhost:4080/api/sessions
  # Expected: JSON array of sessions
  ```

- [ ] **WebSocket endpoint is accessible**
  ```bash
  curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:4080/ws/terminal/test
  # Expected: HTTP/1.1 426 or WebSocket upgrade response
  ```

## 2. GoTTY Sessions Check
- [ ] **GoTTY processes are running**
  ```bash
  ps aux | grep gotty | grep -v grep
  # Expected: One or more gotty processes on ports 808x
  ```

- [ ] **GoTTY ports are listening**
  ```bash
  lsof -i :8082-8090
  # Expected: gotty processes listening on session ports
  ```

- [ ] **Can connect to GoTTY directly**
  ```bash
  curl -I http://localhost:8082
  # Expected: HTTP/1.1 200 OK
  ```

## 3. Frontend Check
- [ ] **Frontend is accessible**
  ```bash
  curl -I http://localhost:4080/
  # Expected: HTTP/1.1 200 OK
  ```

- [ ] **Terminal proxy page exists**
  ```bash
  curl -I http://localhost:4080/terminal/test
  # Expected: HTTP/1.1 200 OK
  ```

- [ ] **Static assets are served**
  ```bash
  curl -I http://localhost:4080/assets/index.js
  # Expected: HTTP/1.1 200 OK (or similar JS file)
  ```

## 4. Session Management Check
- [ ] **Can create new session**
  ```bash
  curl -X POST http://localhost:4080/api/sessions \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Session"}'
  # Expected: JSON with new session details
  ```

- [ ] **Can get session details**
  ```bash
  curl http://localhost:4080/api/sessions/{session-id}
  # Expected: JSON with session details
  ```

- [ ] **Can send input to session**
  ```bash
  curl -X POST http://localhost:4080/api/sessions/{session-id}/input \
    -H "Content-Type: application/json" \
    -d '{"key":"a"}'
  # Expected: {"success":true}
  ```

## 5. Browser Console Check (Open Developer Tools)
- [ ] **No JavaScript errors in console**
  - Red errors indicate problems
  - Check for WebSocket connection errors
  - Check for 404 errors on resources

- [ ] **WebSocket connection established**
  - Look for: "WebSocket connected"
  - Should see: "Terminal initialized"

- [ ] **Session data loaded**
  - Network tab should show successful /api/sessions call
  - Response should contain session array

## 6. UI Component Check
- [ ] **Session list sidebar visible**
  - Should show "Sessions" header
  - Should list active sessions
  - Should have "New Session" button

- [ ] **Terminal frame loads**
  - Should show iframe with terminal
  - Should not be blank/black screen

- [ ] **Virtual keyboard shows**
  - Mobile: Keyboard button should be visible
  - Desktop: Can be toggled from toolbar

- [ ] **Session status chip shows**
  - Should display session name
  - Should be green for active sessions

## 7. WebSocket Proxy Check
- [ ] **Check backend logs for WebSocket activity**
  ```bash
  # In the backend terminal, look for:
  # ✅ Connected to GoTTY session
  # Client->GoTTY messages
  # GoTTY->Client messages
  ```

- [ ] **Verify proxy authentication**
  - Should see: "Sending authentication to GoTTY"
  - Should see: "Received auth response from GoTTY"

## 8. Terminal Functionality Check
- [ ] **Terminal displays prompt**
  - Should show shell prompt (e.g., `$`, `%`, or custom)

- [ ] **Can type directly in terminal**
  - Click terminal and type
  - Characters should appear

- [ ] **Virtual keyboard works**
  - ENTER key sends command
  - Arrow keys navigate history
  - Letters/numbers type correctly

- [ ] **Terminal output displays**
  - Run `ls` command
  - Should see directory listing

## 9. Common Issues and Solutions

### Issue: Blank/Black Terminal Screen
**Check:**
1. GoTTY process is running for that session
2. WebSocket proxy connected successfully
3. Authentication message was sent
4. No JavaScript errors in console

**Fix:**
```bash
# Restart the backend
pkill -f "npm run dev"
PORT=4080 npm run dev
```

### Issue: Session List Not Showing
**Check:**
1. API endpoint responding
2. Frontend making API calls
3. No CORS errors

**Fix:**
- Check browser console for errors
- Verify API_BASE in frontend config
- Check network tab for failed requests

### Issue: Virtual Keyboard Not Working
**Check:**
1. WebSocket connection active
2. Input API endpoint working
3. PostMessage communication working

**Fix:**
- Check browser console for errors
- Verify session ID is correct
- Check WebSocket proxy logs

### Issue: Cannot Create New Session
**Check:**
1. Backend has GoTTY binary
2. Ports 8080-8099 available
3. Database is accessible

**Fix:**
```bash
# Check for port conflicts
lsof -i :8080-8099
# Kill conflicting processes if needed
```

## 10. Debug Commands

**Full system status:**
```bash
# Check all components
echo "=== Backend ===" && lsof -i :4080 | head -3
echo "=== Sessions ===" && curl -s http://localhost:4080/api/sessions | jq length
echo "=== GoTTY ===" && ps aux | grep gotty | grep -v grep | wc -l
```

**Monitor WebSocket traffic:**
```bash
# Use browser DevTools
# Network tab → WS filter → Click connection → Messages tab
```

**Check backend logs:**
```bash
# Look for these key messages:
# ✅ Web Terminal Backend running
# ✅ Connected to GoTTY session
# Forwarded to client for session
```

## Quick Verification Script

Save this as `check-terminal.sh`:
```bash
#!/bin/bash

echo "🔍 Web Terminal System Check"
echo "============================"

# Check backend
if lsof -i :4080 | grep -q LISTEN; then
    echo "✅ Backend running on port 4080"
else
    echo "❌ Backend not running"
fi

# Check API
if curl -s http://localhost:4080/api/sessions > /dev/null 2>&1; then
    SESSION_COUNT=$(curl -s http://localhost:4080/api/sessions | jq length)
    echo "✅ API responding ($SESSION_COUNT sessions)"
else
    echo "❌ API not responding"
fi

# Check GoTTY
GOTTY_COUNT=$(ps aux | grep gotty | grep -v grep | wc -l)
if [ $GOTTY_COUNT -gt 0 ]; then
    echo "✅ GoTTY processes: $GOTTY_COUNT"
else
    echo "⚠️  No GoTTY processes running"
fi

# Check frontend
if curl -s http://localhost:4080/ | grep -q "</html>"; then
    echo "✅ Frontend accessible"
else
    echo "❌ Frontend not accessible"
fi

echo "============================"
echo "Open http://localhost:4080 to test"
```

Make it executable: `chmod +x check-terminal.sh`
Run it: `./check-terminal.sh`