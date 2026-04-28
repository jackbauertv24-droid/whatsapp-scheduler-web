import { useState } from 'react';

function ScheduleForm({ selectedChat, onSchedule }) {
  const [content, setContent] = useState('');
  const [timeMode, setTimeMode] = useState('specific');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [delayHours, setDelayHours] = useState(0);
  const [delayMinutes, setDelayMinutes] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  function getScheduledTime() {
    if (timeMode === 'specific') {
      return new Date(`${scheduledDate}T${scheduledTime}`);
    } else {
      const now = new Date();
      now.setHours(now.getHours() + parseInt(delayHours));
      now.setMinutes(now.getMinutes() + parseInt(delayMinutes));
      return now;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!selectedChat) {
      setError('Please select a chat');
      return;
    }
    
    if (!content.trim()) {
      setError('Please enter a message');
      return;
    }

    const scheduledFor = getScheduledTime();
    if (isNaN(scheduledFor.getTime()) || scheduledFor <= new Date()) {
      setError('Please select a future time');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      await onSchedule(selectedChat, content, scheduledFor.toISOString());
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
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().split('T')[0];
  }

  function getDefaultTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toTimeString().slice(0, 5);
  }

  return (
    <div className="schedule-form-container">
      <h2>Schedule Message</h2>
      
      {!selectedChat ? (
        <p className="select-chat-prompt">Select a chat from the list to schedule a message</p>
      ) : (
        <form onSubmit={handleSubmit} className="schedule-form">
          <div className="form-group">
            <label>To:</label>
            <div className="selected-chat">
              {selectedChat.isGroup ? '👥' : '👤'} {selectedChat.name}
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
            <label>When:</label>
            <div className="time-options">
              <label className="radio-label">
                <input
                  type="radio"
                  name="timeMode"
                  value="specific"
                  checked={timeMode === 'specific'}
                  onChange={(e) => setTimeMode(e.target.value)}
                />
                Send at specific time
              </label>
              {timeMode === 'specific' && (
                <div className="datetime-inputs">
                  <input
                    type="date"
                    value={scheduledDate || getDefaultDate()}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <input
                    type="time"
                    value={scheduledTime || getDefaultTime()}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="time-options">
              <label className="radio-label">
                <input
                  type="radio"
                  name="timeMode"
                  value="delay"
                  checked={timeMode === 'delay'}
                  onChange={(e) => setTimeMode(e.target.value)}
                />
                Send after delay
              </label>
              {timeMode === 'delay' && (
                <div className="delay-inputs">
                  <input
                    type="number"
                    value={delayHours}
                    onChange={(e) => setDelayHours(e.target.value)}
                    min="0"
                    max="720"
                  />
                  <span>hours</span>
                  <input
                    type="number"
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(e.target.value)}
                    min="0"
                    max="59"
                  />
                  <span>minutes</span>
                </div>
              )}
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