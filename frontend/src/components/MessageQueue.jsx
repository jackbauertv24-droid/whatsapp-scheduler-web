function MessageQueue({ messages, loading, onCancel }) {
  const pending = messages.filter(m => m.status === 'pending');
  const sent = messages.filter(m => m.status === 'sent').slice(0, 10);
  const failed = messages.filter(m => m.status === 'failed');

  if (loading) {
    return (
      <div className="queue-section">
        <h2>Scheduled Messages</h2>
        <div className="loading"><div className="spinner"></div></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="queue-section">
        <h2>Scheduled Messages</h2>
        <p className="empty-state">No scheduled messages yet</p>
      </div>
    );
  }

  function formatDateTime(isoString) {
    return new Date(isoString).toLocaleString();
  }

  function renderMessage(msg, showCancel = false) {
    return (
      <div key={msg.id} className={`queue-item ${msg.status}`}>
        <div className="queue-item-info">
          <div className="queue-item-to">
            {msg.is_group ? '👥' : '👤'} {msg.chat_name}
          </div>
          <div className="queue-item-content">
            {msg.content.length > 50 ? msg.content.slice(0, 50) + '...' : msg.content}
          </div>
        </div>
        <div className="queue-item-meta">
          <div className="queue-item-time">{formatDateTime(msg.scheduled_for)}</div>
          <div className={`queue-item-status status-${msg.status}`}>
            {msg.status}
          </div>
          {showCancel && (
            <button
              className="btn-cancel"
              onClick={() => onCancel(msg.id)}
              title="Cancel message"
            >
              ✕
            </button>
          )}
          {msg.error && <div className="queue-item-error">{msg.error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="queue-section">
      <h2>Scheduled Messages ({pending.length} pending)</h2>
      
      {pending.length > 0 && (
        <div className="queue-group">
          <h3>Pending</h3>
          {pending.map(msg => renderMessage(msg, true))}
        </div>
      )}

      {failed.length > 0 && (
        <div className="queue-group">
          <h3>Failed</h3>
          {failed.map(msg => renderMessage(msg))}
        </div>
      )}

      {sent.length > 0 && (
        <div className="queue-group">
          <h3>Recently Sent</h3>
          {sent.map(msg => renderMessage(msg))}
        </div>
      )}
    </div>
  );
}

export default MessageQueue;