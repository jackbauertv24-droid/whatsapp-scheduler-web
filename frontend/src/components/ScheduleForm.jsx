import { useState } from 'react';

function ScheduleForm({ selectedContact, onSchedule }) {
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!selectedContact) {
      setError('Please select a contact');
      return;
    }
    
    if (!content.trim()) {
      setError('Please enter a message');
      return;
    }

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    
    setSubmitting(true);
    setError(null);
    
    try {
      await onSchedule(selectedContact, content, scheduledFor);
      setSuccess(true);
      setContent('');
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function getDefaultDate() {
    return new Date().toISOString().split('T')[0];
  }

  function getDefaultTime() {
    return new Date().toTimeString().slice(0, 5);
  }

  return (
    <div className="schedule-form-container">
      <h2>Schedule Message</h2>
      
      {!selectedContact ? (
        <p className="select-chat-prompt">Select a contact from the list to schedule a message</p>
      ) : (
        <form onSubmit={handleSubmit} className="schedule-form">
          <div className="form-group">
            <label>To:</label>
            <div className="selected-chat">
              {selectedContact.type === 'group' ? '👥' : '👤'} {selectedContact.name}
            </div>
          </div>

          <div className="form-group">
            <label>Message:</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              maxLength={4000}
            />
            <div className="char-count">{content.length}/4000</div>
          </div>

          <div className="form-group">
            <label>Scheduled Time:</label>
            <div className="datetime-inputs">
              <input
                type="date"
                value={scheduledDate || getDefaultDate()}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
              <input
                type="time"
                value={scheduledTime || getDefaultTime()}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Message scheduled!</div>}

          <button type="submit" className="btn-schedule" disabled={submitting}>
            {submitting ? 'Scheduling...' : 'Schedule Message'}
          </button>
        </form>
      )}
    </div>
  );
}

export default ScheduleForm;