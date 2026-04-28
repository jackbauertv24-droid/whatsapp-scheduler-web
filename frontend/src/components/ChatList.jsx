function ChatList({ chats, loading, selectedChat, onSelect }) {
  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (chats.length === 0) {
    return <p className="empty-state">No recent chats found</p>;
  }

  return (
    <ul className="chat-list">
      {chats.map((chat) => (
        <li
          key={chat.id}
          className={`chat-item ${selectedChat?.id === chat.id ? 'selected' : ''}`}
          onClick={() => onSelect(chat)}
        >
          <div className="chat-avatar">
            {chat.isGroup ? '👥' : '👤'}
          </div>
          <div className="chat-info">
            <div className="chat-name">{chat.name}</div>
            {chat.lastMessage && (
              <div className="chat-preview">{chat.lastMessage.slice(0, 30)}...</div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default ChatList;