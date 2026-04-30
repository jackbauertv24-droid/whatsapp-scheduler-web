function ChatList({ contacts, loading, selectedContact, onSelect }) {
  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (contacts.length === 0) {
    return <p className="empty-state">No contacts. Click "Refresh Contacts" to load from WhatsApp.</p>;
  }

  return (
    <ul className="chat-list">
      {contacts.map((contact) => (
        <li
          key={contact.id}
          className={`chat-item ${selectedContact?.id === contact.id ? 'selected' : ''}`}
          onClick={() => onSelect(contact)}
        >
          <div className="chat-avatar">
            {contact.type === 'group' ? '👥' : '👤'}
          </div>
          <div className="chat-info">
            <div className="chat-name">{contact.name}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default ChatList;