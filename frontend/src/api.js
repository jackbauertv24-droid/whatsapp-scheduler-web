const API_BASE = '/api';

async function request(endpoint, apiKey, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

async function getContacts(apiKey) {
  return request('/contacts', apiKey);
}

async function refreshContacts(apiKey) {
  return request('/refresh', apiKey, { method: 'POST' });
}

async function getMessages(apiKey, status = null) {
  const query = status ? `?status=${status}` : '';
  return request(`/messages${query}`, apiKey);
}

async function scheduleMessage(apiKey, contactJid, contactName, content, scheduledFor) {
  return request('/messages', apiKey, {
    method: 'POST',
    body: JSON.stringify({
      contact_jid: contactJid,
      contact_name: contactName,
      content,
      scheduled_for: scheduledFor
    })
  });
}

async function cancelMessage(apiKey, id) {
  return request(`/messages/${id}`, apiKey, { method: 'DELETE' });
}

async function sendPending(apiKey) {
  return request('/send-pending', apiKey, { method: 'POST' });
}

export {
  getContacts,
  refreshContacts,
  getMessages,
  scheduleMessage,
  cancelMessage,
  sendPending
};