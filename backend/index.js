import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { listContacts, sendMessage } from './cli-spawn.js';
import { 
  getContacts, updateContacts, 
  getMessages, createMessage, deleteMessage,
  getPendingMessages, updateMessageStatus,
  wipeAllData
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const VALID_API_KEYS = [
  process.env.API_KEY_CURRENT,
  process.env.API_KEY_PREVIOUS
].filter(Boolean);

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!VALID_API_KEYS.includes(key)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/contacts', requireApiKey, (req, res) => {
  const contacts = getContacts();
  res.json({ contacts });
});

app.post('/api/refresh', requireApiKey, async (req, res) => {
  try {
    const contacts = await listContacts();
    const count = updateContacts(contacts);
    res.json({ success: true, contacts_refreshed: count, contacts });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      hint: 'Session may not be connected. Pair via CLI first.'
    });
  }
});

app.get('/api/messages', requireApiKey, (req, res) => {
  const status = req.query.status;
  const messages = getMessages(status);
  res.json({ messages });
});

app.post('/api/messages', requireApiKey, (req, res) => {
  const { contact_jid, contact_name, content, scheduled_for } = req.body;
  
  if (!contact_jid || !content || !scheduled_for) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const id = createMessage(contact_jid, contact_name || contact_jid, content, scheduled_for);
  res.json({ success: true, id });
});

app.delete('/api/messages/:id', requireApiKey, (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = deleteMessage(id);
  res.json({ success: deleted });
});

app.post('/api/send-pending', requireApiKey, async (req, res) => {
  const pending = getPendingMessages();
  const results = [];
  
  for (const msg of pending) {
    try {
      const result = await sendMessage(msg.contact_jid, msg.content);
      if (result.success) {
        updateMessageStatus(msg.id, 'sent');
        results.push({ id: msg.id, status: 'sent' });
      } else {
        results.push({ id: msg.id, status: 'pending', error: result.error });
      }
    } catch (error) {
      results.push({ id: msg.id, status: 'pending', error: error.message });
    }
  }
  
  res.json({ success: true, processed: results.length, results });
});

app.post('/api/wipe-data', requireApiKey, (req, res) => {
  const result = wipeAllData();
  res.json({ 
    success: true, 
    contacts_deleted: result.contactsDeleted,
    messages_deleted: result.messagesDeleted
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('Scheduler not started - run separately: node scheduler.js');
});