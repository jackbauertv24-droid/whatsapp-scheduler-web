#!/bin/bash

# Absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting all services..."

"$SCRIPT_DIR/start-backend.sh"
sleep 2
"$SCRIPT_DIR/start-frontend.sh"
sleep 2
"$SCRIPT_DIR/start-scheduler.sh"

echo ""
echo "All services started. Check status with: ./check-logs.sh"