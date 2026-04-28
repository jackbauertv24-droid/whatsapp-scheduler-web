import { getSession, sendMessage } from './whatsapp.js';
import { getPendingMessages, updateMessageStatus } from './db.js';

const POLL_INTERVAL = 30000;

async function processMessages() {
  const pending = getPendingMessages();
  
  for (const msg of pending) {
    const session = getSession(msg.session_id);
    
    if (!session || !session.connected) {
      updateMessageStatus(msg.id, 'failed', 'Session not connected');
      continue;
    }

    try {
      await sendMessage(msg.session_id, msg.chat_jid, msg.content);
      updateMessageStatus(msg.id, 'sent');
      console.log(`Message ${msg.id} sent to ${msg.chat_name}`);
    } catch (error) {
      updateMessageStatus(msg.id, 'failed', error.message);
      console.error(`Failed to send message ${msg.id}:`, error.message);
    }
  }
}

function startScheduler() {
  console.log('Message scheduler started (polling every 30s)');
  processMessages();
  setInterval(processMessages, POLL_INTERVAL);
}

export { startScheduler, processMessages };