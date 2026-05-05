#!/bin/bash

# Absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "=== Backend Log ==="
if [ -f "$BACKEND_DIR/logs/backend.log" ]; then
    tail -20 "$BACKEND_DIR/logs/backend.log"
else
    echo "No backend log"
fi

echo ""
echo "=== Frontend Log ==="
if [ -f "$FRONTEND_DIR/logs/frontend.log" ]; then
    tail -20 "$FRONTEND_DIR/logs/frontend.log"
else
    echo "No frontend log"
fi

echo ""
echo "=== Scheduler Log ==="
if [ -f "$BACKEND_DIR/logs/scheduler.log" ]; then
    tail -20 "$BACKEND_DIR/logs/scheduler.log"
else
    echo "No scheduler log"
fi

echo ""
echo "=== Process Status ==="
ps aux | grep -E 'node|vite' | grep -v grep || echo "No processes running"