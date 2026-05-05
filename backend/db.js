import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'data.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'contact',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_contacts_jid ON contacts(jid);

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_jid TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    content TEXT NOT NULL,
    scheduled_for TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    sent_at TEXT,
    error TEXT,
    session_id TEXT DEFAULT 'default'
  );

  CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
  CREATE INDEX IF NOT EXISTS idx_messages_scheduled ON messages(scheduled_for);
`);

export function getContacts() {
  return db.prepare('SELECT * FROM contacts ORDER BY name ASC').all();
}

export function updateContacts(contacts) {
  db.prepare('DELETE FROM contacts').run();
  
  const stmt = db.prepare('INSERT INTO contacts (jid, name, type) VALUES (?, ?, ?)');
  let count = 0;
  
  for (const c of contacts) {
    try {
      stmt.run(c.jid || c.id, c.name, c.type || 'contact');
      count++;
    } catch {
      console.log(`Skipping duplicate contact: ${c.name}`);
    }
  }
  
  return count;
}

export function getMessages(status = null) {
  if (status) {
    return db.prepare('SELECT * FROM messages WHERE status = ? ORDER BY scheduled_for ASC').all(status);
  }
  return db.prepare('SELECT * FROM messages ORDER BY scheduled_for ASC').all();
}

export function createMessage(contactJid, contactName, content, scheduledFor) {
  const stmt = db.prepare(`
    INSERT INTO messages (contact_jid, contact_name, content, scheduled_for)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(contactJid, contactName || contactJid, content, scheduledFor);
  return result.lastInsertRowid;
}

export function deleteMessage(id) {
  const stmt = db.prepare('UPDATE messages SET status = ? WHERE id = ?');
  const result = stmt.run('cancelled', id);
  return result.changes > 0;
}

export function getPendingMessages() {
  return db.prepare(`
    SELECT * FROM messages 
    WHERE status = 'pending' 
    AND datetime(scheduled_for) <= datetime('now', 'localtime')
    ORDER BY scheduled_for ASC
  `).all();
}

export function updateMessageStatus(id, status, error = null) {
  const stmt = db.prepare(`
    UPDATE messages SET status = ?, sent_at = ?, error = ? WHERE id = ?
  `);
  const sentAt = status === 'sent' ? new Date().toISOString() : null;
  stmt.run(status, sentAt, error, id);
}

export function wipeAllData() {
  const contactsResult = db.prepare('DELETE FROM contacts').run();
  const messagesResult = db.prepare('DELETE FROM messages').run();
  
  return {
    contactsDeleted: contactsResult.changes,
    messagesDeleted: messagesResult.changes
  };
}

export default db;