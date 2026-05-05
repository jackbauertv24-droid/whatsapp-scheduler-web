#!/bin/bash
# Wipe all contacts and messages from database
# Run this after re-pairing WhatsApp session via TUI

cd "$(dirname "$0")"

API_KEY=$(grep API_KEY_CURRENT backend/.env | cut -d'=' -f2)
API_URL="http://localhost:3001/api/wipe-data"

echo "Wiping all contacts and messages..."
curl -s -X POST "$API_URL" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json"

echo ""
echo "Database wiped. Refresh contacts via frontend UI."