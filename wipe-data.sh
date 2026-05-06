#!/bin/bash
# Wipe all contacts and messages from database
# Run this after re-pairing WhatsApp session via TUI

cd "$(dirname "$0")"

DB_PATH="backend/data.db"

echo "Wiping all contacts and messages from database..."
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
  echo "Error: Database file not found at $DB_PATH"
  exit 1
fi

# Wipe contacts
CONTACTS_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM contacts;")
sqlite3 "$DB_PATH" "DELETE FROM contacts;"
echo "Deleted $CONTACTS_COUNT contacts"

# Wipe messages
MESSAGES_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM messages;")
sqlite3 "$DB_PATH" "DELETE FROM messages;"
echo "Deleted $MESSAGES_COUNT messages"

echo ""
echo "Database wiped successfully. Refresh contacts via frontend UI after pairing."