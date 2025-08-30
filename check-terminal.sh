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
    SESSION_COUNT=$(curl -s http://localhost:4080/api/sessions | jq length 2>/dev/null || echo "?")
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

# Check WebSocket endpoint
if curl -s -o /dev/null -w "%{http_code}" -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:4080/ws/terminal/test 2>/dev/null | grep -q "426\|101"; then
    echo "✅ WebSocket endpoint available"
else
    echo "⚠️  WebSocket endpoint may have issues"
fi

# Check terminal proxy page
if curl -s http://localhost:4080/terminal/test | grep -q "xterm"; then
    echo "✅ Terminal proxy page working"
else
    echo "❌ Terminal proxy page not working"
fi

echo "============================"
echo "Open http://localhost:4080 to test"
echo ""
echo "Quick diagnostics:"
echo "- Sessions in DB: $(curl -s http://localhost:4080/api/sessions 2>/dev/null | jq length 2>/dev/null || echo 'API error')"
echo "- GoTTY ports: $(lsof -i :8080-8099 2>/dev/null | grep LISTEN | awk '{print $9}' | cut -d: -f2 | tr '\n' ' ' || echo 'none')"
echo ""
echo "For detailed troubleshooting, see TROUBLESHOOTING_CHECKLIST.md"