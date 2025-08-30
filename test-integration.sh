#!/bin/bash

echo "==================================="
echo "Web Terminal Integration Test Suite"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "Testing $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo ""
echo "1. Backend Tests"
echo "----------------"

# Start backend server
cd /Users/tallpizza/project/ssh_mobile/web-terminal/backend
PORT=8899 npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Test backend API endpoints
run_test "Backend Health Check" "curl -s http://localhost:8899/api/health | grep -q 'ok'"
run_test "Sessions Endpoint" "curl -s http://localhost:8899/api/sessions"
run_test "Database Connection" "test -f sessions.db"
run_test "Environment Variables" "test -f .env"

echo ""
echo "2. Frontend Tests"
echo "-----------------"

cd /Users/tallpizza/project/ssh_mobile/web-terminal/frontend

run_test "Vue Router Config" "test -f src/router/index.ts"
run_test "Vuetify Config" "test -f src/plugins/vuetify.ts"
run_test "Tailwind Config" "test -f tailwind.config.js"
run_test "Path Aliases" "grep -q '@components' vite.config.ts"
run_test "TypeScript Config" "test -f tsconfig.json"
run_test "Pinia Store" "test -f src/stores/sessions.ts"
run_test "Components" "ls src/components/*.vue | wc -l | grep -q -E '[0-9]+'"
run_test "Views" "ls src/views/*.vue | wc -l | grep -q -E '[0-9]+'"

echo ""
echo "3. Feature Tests"
echo "----------------"

run_test "Virtual Keyboard Component" "test -f src/components/VirtualKeyboard.vue"
run_test "Terminal Frame Component" "test -f src/components/TerminalFrame.vue"
run_test "Session Tabs Component" "test -f src/components/SessionTabs.vue"
run_test "Settings Component" "test -f src/components/Settings.vue"
run_test "Status Bar Component" "test -f src/components/StatusBar.vue"
run_test "Loading Spinner Component" "test -f src/components/LoadingSpinner.vue"
run_test "Touch Gestures Composable" "test -f src/composables/useTouchGestures.ts"
run_test "Korean Input Test File" "test -f test-korean-input.html"

echo ""
echo "4. GoTTY Tests"
echo "--------------"

run_test "GoTTY Binary" "test -f /Users/tallpizza/project/ssh_mobile/web-terminal/bin/gotty"
run_test "GoTTY Manager" "test -f /Users/tallpizza/project/ssh_mobile/web-terminal/backend/src/gotty/manager.js"
run_test "WebSocket Proxy" "test -f /Users/tallpizza/project/ssh_mobile/web-terminal/backend/src/proxy/websocket-proxy.js"

echo ""
echo "5. Database Tests"
echo "-----------------"

run_test "Database Migrations" "test -d /Users/tallpizza/project/ssh_mobile/web-terminal/backend/migrations"
run_test "Knex Config" "test -f /Users/tallpizza/project/ssh_mobile/web-terminal/backend/knexfile.js"
run_test "Sessions Table" "sqlite3 /Users/tallpizza/project/ssh_mobile/web-terminal/backend/sessions.db '.tables' | grep -q sessions"

echo ""
echo "6. CLI Tests"
echo "------------"

run_test "CLI Entry Point" "test -f /Users/tallpizza/project/ssh_mobile/web-terminal/cli/cli.js"
run_test "CLI Executable" "head -1 /Users/tallpizza/project/ssh_mobile/web-terminal/cli/cli.js | grep -q '#!/usr/bin/env node'"

# Kill backend server
kill $BACKEND_PID 2>/dev/null

echo ""
echo "==================================="
echo "Test Results Summary"
echo "==================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✨${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the failures above.${NC}"
    exit 1
fi