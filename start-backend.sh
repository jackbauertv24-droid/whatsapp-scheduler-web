#!/bin/bash

# Absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
LOG_DIR="$BACKEND_DIR/logs"
PID_FILE="$LOG_DIR/backend.pid"

# Create log directory
mkdir -p "$LOG_DIR"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Backend already running (PID: $PID)"
        exit 1
    fi
fi

# Start backend
cd "$BACKEND_DIR"
nohup node index.js > "$LOG_DIR/backend.log" 2>&1 &
PID=$!

# Save PID
echo "$PID" > "$PID_FILE"

echo "Backend started (PID: $PID)"
echo "Logs: $LOG_DIR/backend.log"
echo "PID file: $PID_FILE"