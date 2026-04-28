import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  createSession,
  getSession,
  isSessionConnected,
  getChats,
  destroySession,
  addStatusCallback,
  restoreSession,
} from './whatsapp.js';
import { createMessage, getMessages, deleteMessage, updateMessageStatus } from './db.js';
import { startScheduler } from './scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  if (sessionId) {
    req.sessionId = sessionId;
  }
  next();
});

app.get('/api/qr', async (req, res) => {
  const sessionId = uuidv4();
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent({ type: 'session', sessionId });

  try {
    const session = await createSession(sessionId, sendEvent);
    
    const cleanup = addStatusCallback(sessionId, sendEvent);

    req.on('close', () => {
      cleanup();
    });
  } catch (error) {
    console.error('Error creating session:', error);
    sendEvent({ type: 'error', message: error.message });
    res.end();
  }
});

app.get('/api/status', async (req, res) => {
  const sessionId = req.sessionId;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'No session ID provided' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const session = getSession(sessionId);
  if (session) {
    sendEvent({ 
      type: session.connected ? 'connected' : 'disconnected',
      userPhone: session.userPhone 
    });
  } else {
    const restored = await restoreSession(sessionId, sendEvent);
    if (!restored) {
      sendEvent({ type: 'disconnected' });
    }
  }

  const cleanup = addStatusCallback(sessionId, sendEvent);

  req.on('close', () => {
    cleanup();
  });
});

app.get('/api/chats', async (req, res) => {
  const sessionId = req.sessionId;
  
  if (!sessionId || !isSessionConnected(sessionId)) {
    return res.status(401).json({ error: 'Not connected' });
  }

  try {
    const chats = await getChats(sessionId);
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/messages', (req, res) => {
  const sessionId = req.sessionId;
  const status = req.query.status;

  if (!sessionId) {
    return res.status(400).json({ error: 'No session ID provided' });
  }

  const messages = getMessages(sessionId, status);
  res.json(messages);
});

app.post('/api/messages', (req, res) => {
  const sessionId = req.sessionId;
  const { chatJid, chatName, isGroup, content, scheduledFor } = req.body;

  if (!sessionId || !isSessionConnected(sessionId)) {
    return res.status(401).json({ error: 'Not connected' });
  }

  if (!chatJid || !chatName || !content || !scheduledFor) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const scheduledDate = new Date(scheduledFor);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return res.status(400).json({ error: 'Invalid scheduled time' });
  }

  const session = getSession(sessionId);
  const userPhone = session?.userPhone;

  const id = createMessage(
    sessionId,
    userPhone,
    chatJid,
    chatName,
    isGroup,
    content,
    scheduledDate.toISOString()
  );

  res.status(201).json({ 
    id, 
    message: 'Message scheduled successfully' 
  });
});

app.delete('/api/messages/:id', (req, res) => {
  const sessionId = req.sessionId;
  const messageId = parseInt(req.params.id, 10);

  if (!sessionId) {
    return res.status(400).json({ error: 'No session ID provided' });
  }

  const deleted = deleteMessage(messageId, sessionId);
  
  if (deleted) {
    res.json({ message: 'Message cancelled' });
  } else {
    res.status(404).json({ error: 'Message not found' });
  }
});

app.post('/api/logout', async (req, res) => {
  const sessionId = req.sessionId;
  
  if (sessionId) {
    await destroySession(sessionId);
  }
  
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../frontend/dist/index.html'));
  });
}

startScheduler();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});