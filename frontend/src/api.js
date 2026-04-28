const API_BASE = '/api';

let sessionId = localStorage.getItem('sessionId');

function setSessionId(id) {
  sessionId = id;
  if (id) {
    localStorage.setItem('sessionId', id);
  } else {
    localStorage.removeItem('sessionId');
  }
}

function getSessionId() {
  return sessionId;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

function connectToQR(onMessage, onError) {
  const eventSource = new EventSource(`${API_BASE}/qr`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
    
    if (data.type === 'connected' && data.userPhone) {
      eventSource.close();
    }
  };
  
  eventSource.onerror = (err) => {
    onError(err);
    eventSource.close();
  };
  
  return () => eventSource.close();
}

function connectToStatus(onMessage, onError) {
  if (!sessionId) {
    onError(new Error('No session ID'));
    return () => {};
  }

  const eventSource = new EventSource(`${API_BASE}/status?sessionId=${sessionId}`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  
  eventSource.onerror = (err) => {
    onError(err);
    eventSource.close();
  };
  
  return () => eventSource.close();
}

async function getChats() {
  return request('/chats');
}

async function getMessages(status = null) {
  const query = status ? `?status=${status}` : '';
  return request(`/messages${query}`);
}

async function scheduleMessage(chatJid, chatName, isGroup, content, scheduledFor) {
  return request('/messages', {
    method: 'POST',
    body: JSON.stringify({ chatJid, chatName, isGroup, content, scheduledFor }),
  });
}

async function cancelMessage(id) {
  return request(`/messages/${id}`, { method: 'DELETE' });
}

async function logout() {
  try {
    await request('/logout', { method: 'POST' });
  } finally {
    setSessionId(null);
  }
}

export {
  setSessionId,
  getChats,
  getMessages,
  scheduleMessage,
  cancelMessage,
  logout,
  connectToQR,
  connectToStatus,
  getSessionId,
};