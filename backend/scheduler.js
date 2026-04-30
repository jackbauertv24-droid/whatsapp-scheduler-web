import { sendMessage } from './cli-spawn.js';
import { getPendingMessages, updateMessageStatus } from './db.js';

const POLL_INTERVAL = process.env.SCHEDULER_INTERVAL || 30000;

async function processMessages() {
  const pending = getPendingMessages();
  
  if (pending.length === 0) {
    console.log('No pending messages');
    return;
  }
  
  console.log(`Processing ${pending.length} pending messages`);
  
  for (const msg of pending) {
    console.log(`Sending message ${msg.id} to ${msg.contact_name}`);
    
    try {
      const result = await sendMessage(msg.contact_jid, msg.content);
      
      if (result.success) {
        updateMessageStatus(msg.id, 'sent');
        console.log(`Message ${msg.id} sent successfully`);
      } else {
        console.log(`Message ${msg.id} failed: ${result.error} (will retry)`);
      }
    } catch (error) {
      console.error(`Message ${msg.id} error: ${error.message} (will retry)`);
    }
  }
}

function startScheduler() {
  console.log(`Scheduler started (polling every ${POLL_INTERVAL/1000}s)`);
  processMessages();
  setInterval(processMessages, POLL_INTERVAL);
}

startScheduler();