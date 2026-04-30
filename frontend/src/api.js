const API_BASE = '/api';
const API_KEY = window.__API_KEY__ || '';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

async function getContacts() {
  return request('/contacts');
}

async function refreshContacts() {
  return request('/refresh', { method: 'POST' });
}

async function getMessages(status = null) {
  const query = status ? `?status=${status}` : '';
  return request(`/messages${query}`);
}

async function scheduleMessage(contactJid, contactName, content, scheduledFor) {
  return request('/messages', {
    method: 'POST',
    body: JSON.stringify({
      contact_jid: contactJid,
      contact_name: contactName,
      content,
      scheduled_for: scheduledFor
    })
  });
}

async function cancelMessage(id) {
  return request(`/messages/${id}`, { method: 'DELETE' });
}

async function sendPending() {
  return request('/send-pending', { method: 'POST' });
}

export {
  getContacts,
  refreshContacts,
  getMessages,
  scheduleMessage,
  cancelMessage,
  sendPending
};