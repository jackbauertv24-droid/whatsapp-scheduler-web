import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { spawn } from 'child_process';
import QRCode from 'qrcode';
import { mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sessionsDir = join(__dirname, 'sessions');

const logger = pino({ level: 'debug' });

const sessions = new Map();

console.log('WhatsApp service initialized');

function getSessionPath(sessionId) {
  return join(sessionsDir, sessionId);
}

async function ensureSessionDir(sessionId) {
  const path = getSessionPath(sessionId);
  try {
    await access(path);
  } catch {
    await mkdir(path, { recursive: true });
  }
  return path;
}

async function createSession(sessionId, onStatusUpdate) {
  await ensureSessionDir(sessionId);
  const path = getSessionPath(sessionId);
  const { state, saveCreds } = await useMultiFileAuthState(path);

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger,
    browser: ['WhatsApp Scheduler', 'Chrome', '1.0.0'],
  });

  const sessionData = {
    socket,
    qr: null,
    connected: false,
    userPhone: null,
    chats: [],
    statusCallbacks: new Set([onStatusUpdate]),
  };

  sessions.set(sessionId, sessionData);

  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    console.log(`[${sessionId}] Connection update:`, { connection, hasQr: !!qr, lastDisconnect: lastDisconnect?.error?.output?.statusCode });

    if (qr) {
      try {
        sessionData.qr = await QRCode.toDataURL(qr);
        console.log(`[${sessionId}] QR generated, broadcasting...`);
        broadcastStatus(sessionId, { type: 'qr', qr: sessionData.qr });
      } catch (err) {
        console.error('Error generating QR:', err);
      }
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`[${sessionId}] Connection closed, shouldReconnect:`, shouldReconnect, 'reason:', lastDisconnect?.error?.message);
      
      broadcastStatus(sessionId, { 
        type: 'disconnected', 
        shouldReconnect,
        reason: lastDisconnect?.error?.message 
      });

      if (shouldReconnect) {
        socket.end();
        setTimeout(() => createSession(sessionId, onStatusUpdate), 1000);
      } else {
        sessions.delete(sessionId);
      }
    }

    if (connection === 'open') {
      sessionData.connected = true;
      const user = socket.user;
      if (user) {
        sessionData.userPhone = user.id.split(':')[0];
      }
      console.log(`[${sessionId}] Connected! User phone:`, sessionData.userPhone);
      broadcastStatus(sessionId, { 
        type: 'connected', 
        userPhone: sessionData.userPhone 
      });
    }
  });

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('chats.upsert', (chats) => {
    sessionData.chats.push(...chats);
  });

  socket.ev.on('chats.update', (updates) => {
    updates.forEach(update => {
      const idx = sessionData.chats.findIndex(c => c.id === update.id);
      if (idx !== -1) {
        sessionData.chats[idx] = { ...sessionData.chats[idx], ...update };
      }
    });
  });

  return sessionData;
}

function broadcastStatus(sessionId, status) {
  const session = sessions.get(sessionId);
  if (session) {
    session.statusCallbacks.forEach(callback => callback(status));
  }
}

function addStatusCallback(sessionId, callback) {
  const session = sessions.get(sessionId);
  if (session) {
    session.statusCallbacks.add(callback);
    return () => session.statusCallbacks.delete(callback);
  }
  return () => {};
}

function getSession(sessionId) {
  return sessions.get(sessionId);
}

function isSessionConnected(sessionId) {
  const session = sessions.get(sessionId);
  return session?.connected || false;
}

async function getChats(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || !session.connected) {
    return [];
  }

  const chats = session.chats
    .filter(chat => !chat.id.includes('newsletter') && !chat.id.includes('status@'))
    .sort((a, b) => (b.conversationTimestamp || 0) - (a.conversationTimestamp || 0))
    .slice(0, 50)
    .map(chat => ({
      id: chat.id,
      name: chat.name || chat.id.split('@')[0],
      isGroup: chat.id.endsWith('@g.us'),
      lastMessage: chat.lastMessage?.message?.conversation || '',
      timestamp: chat.conversationTimestamp,
    }));

  return chats;
}

async function sendMessage(sessionId, jid, content) {
  const session = sessions.get(sessionId);
  if (!session || !session.connected) {
    throw new Error('Session not connected');
  }

  const result = await session.socket.sendMessage(jid, { text: content });
  return result;
}

async function destroySession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    if (session.socket) {
      session.socket.end();
    }
    sessions.delete(sessionId);
  }
}

async function restoreSession(sessionId, onStatusUpdate) {
  const path = getSessionPath(sessionId);
  try {
    await access(path);
    return await createSession(sessionId, onStatusUpdate);
  } catch {
    return null;
  }
}

export {
  createSession,
  getSession,
  isSessionConnected,
  getChats,
  sendMessage,
  destroySession,
  addStatusCallback,
  broadcastStatus,
  restoreSession,
};