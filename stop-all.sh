#!/bin/bash

# Absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Kill backend
if [ -f "$BACKEND_DIR/logs/backend.pid" ]; then
    PID=$(cat "$BACKEND_DIR/logs/backend.pid")
    kill "$PID" 2>/dev/null
    rm -f "$BACKEND_DIR/logs/backend.pid"
fi

# Kill frontend
if [ -f "$FRONTEND_DIR/logs/frontend.pid" ]; then
    PID=$(cat "$FRONTEND_DIR/logs/frontend.pid")
    kill "$PID" 2>/dev/null
    rm -f "$FRONTEND_DIR/logs/frontend.pid"
fi

# Kill scheduler
if [ -f "$BACKEND_DIR/logs/scheduler.pid" ]; then
    PID=$(cat "$BACKEND_DIR/logs/scheduler.pid")
    kill "$PID" 2>/dev/null
    rm -f "$BACKEND_DIR/logs/scheduler.pid"
fi

# Force kill any remaining
pkill -9 -f 'node index.js'
pkill -9 -f 'node scheduler.js'
pkill -9 -f vite

echo "All services stopped"