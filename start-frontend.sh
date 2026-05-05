#!/bin/bash

# Absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
LOG_DIR="$FRONTEND_DIR/logs"
PID_FILE="$LOG_DIR/frontend.pid"

# Create log directory
mkdir -p "$LOG_DIR"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Frontend already running (PID: $PID)"
        exit 1
    fi
fi

# Start frontend
cd "$FRONTEND_DIR"
nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
PID=$!

# Save PID
echo "$PID" > "$PID_FILE"

echo "Frontend started (PID: $PID)"
echo "Logs: $LOG_DIR/frontend.log"
echo "PID file: $PID_FILE"