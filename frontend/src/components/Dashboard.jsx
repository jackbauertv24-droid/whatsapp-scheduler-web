import { useState, useEffect } from 'react';
import { getContacts, refreshContacts, getMessages, scheduleMessage, cancelMessage, sendPending } from '../api';
import ChatList from './ChatList';
import ScheduleForm from './ScheduleForm';
import MessageQueue from './MessageQueue';

function Dashboard() {
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadContacts();
    loadMessages();
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadContacts() {
    try {
      setLoadingContacts(true);
      const data = await getContacts();
      setContacts(data.contacts || []);
      setError(null);
    } catch (err) {
      setError('Failed to load contacts: ' + err.message);
    } finally {
      setLoadingContacts(false);
    }
  }

  async function loadMessages() {
    try {
      setLoadingMessages(true);
      const data = await getMessages();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleRefreshContacts() {
    try {
      setRefreshing(true);
      setError(null);
      const data = await refreshContacts();
      setContacts(data.contacts || []);
    } catch (err) {
      setError('Failed to refresh contacts: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSchedule(contact, content, scheduledFor) {
    try {
      await scheduleMessage(contact.jid, contact.name, content, scheduledFor);
      await loadMessages();
    } catch (err) {
      setError('Failed to schedule: ' + err.message);
    }
  }

  async function handleCancel(id) {
    try {
      await cancelMessage(id);
      await loadMessages();
    } catch (err) {
      setError('Failed to cancel: ' + err.message);
    }
  }

  async function handleSendPending() {
    try {
      setSending(true);
      setError(null);
      const result = await sendPending();
      await loadMessages();
      if (result.results && result.results.some(r => r.status === 'pending')) {
        setError('Some messages failed to send (will retry)');
      }
    } catch (err) {
      setError('Failed to send: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="dashboard">
      <header className="header">
        <h1>WhatsApp Scheduler</h1>
        <div className="header-right">
          <button 
            className="btn-secondary" 
            onClick={handleRefreshContacts} 
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Contacts'}
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSendPending} 
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Send Pending Now'}
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="main-content">
        <aside className="sidebar">
          <h2>Contacts</h2>
          <ChatList
            contacts={contacts}
            loading={loadingContacts}
            selectedContact={selectedContact}
            onSelect={setSelectedContact}
          />
        </aside>

        <main className="content">
          <ScheduleForm
            selectedContact={selectedContact}
            onSchedule={handleSchedule}
          />
        </main>
      </div>

      <div className="queue-section">
        <MessageQueue
          messages={messages}
          loading={loadingMessages}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

export default Dashboard;