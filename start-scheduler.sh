#!/bin/bash

# Absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
LOG_DIR="$BACKEND_DIR/logs"
PID_FILE="$LOG_DIR/scheduler.pid"

# Create log directory
mkdir -p "$LOG_DIR"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Scheduler already running (PID: $PID)"
        exit 1
    fi
fi

# Start scheduler
cd "$BACKEND_DIR"
nohup node scheduler.js > "$LOG_DIR/scheduler.log" 2>&1 &
PID=$!

# Save PID
echo "$PID" > "$PID_FILE"

echo "Scheduler started (PID: $PID)"
echo "Logs: $LOG_DIR/scheduler.log"
echo "PID file: $PID_FILE"