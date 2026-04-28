import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'data.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    user_phone TEXT,
    chat_jid TEXT NOT NULL,
    chat_name TEXT NOT NULL,
    is_group INTEGER DEFAULT 0,
    content TEXT NOT NULL,
    scheduled_for TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    sent_at TEXT,
    error TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
  CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
`);

export function createMessage(sessionId, userPhone, chatJid, chatName, isGroup, content, scheduledFor) {
  const stmt = db.prepare(`
    INSERT INTO messages (session_id, user_phone, chat_jid, chat_name, is_group, content, scheduled_for)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(sessionId, userPhone, chatJid, chatName, isGroup ? 1 : 0, content, scheduledFor);
  return result.lastInsertRowid;
}

export function getMessages(sessionId, status = null) {
  let query = 'SELECT * FROM messages WHERE session_id = ?';
  const params = [sessionId];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY scheduled_for ASC';
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
}

export function getPendingMessages() {
  const stmt = db.prepare(`
    SELECT * FROM messages 
    WHERE status = 'pending' 
    AND datetime(scheduled_for) <= datetime('now', 'localtime')
    ORDER BY scheduled_for ASC
  `);
  return stmt.all();
}

export function updateMessageStatus(id, status, error = null) {
  const stmt = db.prepare(`
    UPDATE messages 
    SET status = ?, sent_at = ?, error = ?
    WHERE id = ?
  `);
  const sentAt = status === 'sent' ? new Date().toISOString() : null;
  stmt.run(status, sentAt, error, id);
}

export function deleteMessage(id, sessionId) {
  const stmt = db.prepare('DELETE FROM messages WHERE id = ? AND session_id = ?');
  const result = stmt.run(id, sessionId);
  return result.changes > 0;
}

export function getMessageById(id) {
  const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
  return stmt.get(id);
}

export default db;