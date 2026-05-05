import { sendMessage } from './cli-spawn.js';
import { getPendingMessages, updateMessageStatus } from './db.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const POLL_INTERVAL = process.env.SCHEDULER_INTERVAL || 30000;
const SESSION_DIR = path.join(os.homedir(), '.whatsapp-scheduler', 'sessions', 'default');
const LOCK_FILE = path.join(SESSION_DIR, 'SingletonLock');

function cleanupOrphanedProcesses() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockTarget = fs.readlinkSync(LOCK_FILE);
      const pidMatch = lockTarget.match(/-(\d+)$/);
      
      if (pidMatch) {
        const pid = parseInt(pidMatch[1]);
        
        try {
          process.kill(pid, 0);
          console.log(`Chrome process ${pid} is still running, leaving lock intact`);
        } catch {
          console.log(`Orphaned Chrome process ${pid} detected, cleaning up lock file`);
          fs.unlinkSync(LOCK_FILE);
          
          try {
            execSync(`pkill -f "chrome.*${SESSION_DIR}"`, { stdio: 'ignore' });
            console.log('Killed orphaned Chrome processes');
          } catch {
            // No processes to kill
          }
        }
      }
    }
  } catch (error) {
    console.error(`Cleanup error: ${error.message}`);
  }
}

async function processMessages() {
  const pending = getPendingMessages();
  
  if (pending.length === 0) {
    console.log('No pending messages');
    return;
  }
  
  const msg = pending[0];
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

function startScheduler() {
  cleanupOrphanedProcesses();
  console.log(`Scheduler started (polling every ${POLL_INTERVAL/1000}s)`);
  processMessages();
  setInterval(processMessages, POLL_INTERVAL);
}

startScheduler();