import { useEffect, useState, useRef } from 'react';
import { connectToQR, setSessionId } from '../api';

function Login({ onLogin }) {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    setStatus('connecting');
    setError(null);
    setQr(null);

    const cleanup = connectToQR(
      (data) => {
        if (data.type === 'session') {
          sessionIdRef.current = data.sessionId;
          setSessionId(data.sessionId);
        } else if (data.type === 'qr') {
          setQr(data.qr);
          setStatus('ready');
        } else if (data.type === 'connected') {
          setStatus('connected');
          setTimeout(() => {
            onLogin(sessionIdRef.current, data.userPhone);
          }, 500);
        } else if (data.type === 'disconnected') {
          setStatus('expired');
          setError('Session expired. Please scan again.');
        } else if (data.type === 'error') {
          setStatus('error');
          setError(data.message || 'Connection failed.');
        }
      },
      (err) => {
        setStatus('error');
        setError('Connection failed. Please refresh.');
      }
    );

    return cleanup;
  }, [onLogin]);

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>📱 WhatsApp Scheduler</h1>
        
        {status === 'connecting' && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Generating QR code...</p>
          </div>
        )}

        {status === 'ready' && qr && (
          <>
            <div className="qr-container">
              <img src={qr} alt="QR Code" className="qr-code" />
            </div>
            <div className="instructions">
              <p><strong>Scan with WhatsApp</strong></p>
              <ol>
                <li>Open WhatsApp on your phone</li>
                <li>Settings → Linked Devices</li>
                <li>Link a Device</li>
                <li>Scan this QR code</li>
              </ol>
            </div>
          </>
        )}

        {status === 'connected' && (
          <div className="success">
            <div className="checkmark">✓</div>
            <p>Connected!</p>
          </div>
        )}

        {status === 'expired' && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Refresh</button>
          </div>
        )}

        {status === 'error' && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

function getSessionId() {
  return localStorage.getItem('sessionId');
}

export default Login;