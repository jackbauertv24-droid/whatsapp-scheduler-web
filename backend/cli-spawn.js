import { spawn } from 'child_process';
import { resolve } from 'path';

const CLI_PATH = process.env.CLI_PATH || resolve('../../whatsapp-scheduler-tui/cli.js');
const SESSION_ID = 'default';

function spawnCli(args, timeout = 120000) {
  return new Promise((resolvePromise, reject) => {
    const fullArgs = [CLI_PATH, ...args, `--session=${SESSION_ID}`];
    const proc = spawn('node', fullArgs, { timeout });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    
    proc.on('close', code => {
      if (code === 0) {
        try {
          resolvePromise(JSON.parse(stdout));
        } catch {
          reject(new Error('Invalid JSON output from CLI'));
        }
      } else {
        reject(new Error(stderr || stdout || 'CLI process failed'));
      }
    });
    
    proc.on('error', err => {
      reject(new Error(`CLI spawn error: ${err.message}`));
    });
  });
}

async function listContacts() {
  const result = await spawnCli(['list', '--timeout=15']);
  return result.chats || [];
}

async function sendMessage(to, content) {
  return spawnCli(['send', `--to=${to}`, `--message=${content}`, '--timeout=15']);
}

async function checkSession() {
  return spawnCli(['check', '--timeout=10']);
}

export { listContacts, sendMessage, checkSession, CLI_PATH, SESSION_ID };