import { useState, useEffect } from 'react';
import { getChats, getMessages, scheduleMessage, cancelMessage, logout } from '../api';
import ChatList from './ChatList';
import ScheduleForm from './ScheduleForm';
import MessageQueue from './MessageQueue';

function Dashboard({ userPhone, onLogout }) {
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadChats();
    loadMessages();
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadChats() {
    try {
      setLoadingChats(true);
      const data = await getChats();
      setChats(data);
      setError(null);
    } catch (err) {
      setError('Failed to load chats: ' + err.message);
    } finally {
      setLoadingChats(false);
    }
  }

  async function loadMessages() {
    try {
      setLoadingMessages(true);
      const data = await getMessages();
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSchedule(chat, content, scheduledFor) {
    await scheduleMessage(chat.id, chat.name, chat.isGroup, content, scheduledFor);
    await loadMessages();
  }

  async function handleCancel(id) {
    await cancelMessage(id);
    await loadMessages();
  }

  async function handleLogout() {
    await logout();
    onLogout();
  }

  return (
    <div className="dashboard">
      <header className="header">
        <h1>📱 WhatsApp Scheduler</h1>
        <div className="header-right">
          <span className="user-phone">{userPhone}</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="main-content">
        <aside className="sidebar">
          <h2>Recent Chats</h2>
          <ChatList
            chats={chats}
            loading={loadingChats}
            selectedChat={selectedChat}
            onSelect={setSelectedChat}
          />
        </aside>

        <main className="content">
          <ScheduleForm
            selectedChat={selectedChat}
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