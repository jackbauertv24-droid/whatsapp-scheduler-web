import { useState, useEffect } from 'react';
import { setSessionId, getSessionId, connectToStatus, logout } from './api';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [sessionId, setSessionState] = useState(getSessionId());
  const [connected, setConnected] = useState(false);
  const [userPhone, setUserPhone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const cleanup = connectToStatus(
      (data) => {
        setLoading(false);
        if (data.type === 'connected') {
          setConnected(true);
          setUserPhone(data.userPhone);
        } else {
          setConnected(false);
          setUserPhone(null);
        }
      },
      () => {
        setLoading(false);
        setConnected(false);
      }
    );

    return cleanup;
  }, [sessionId]);

  const handleLogin = (newSessionId, phone) => {
    setSessionId(newSessionId);
    setSessionState(newSessionId);
    setUserPhone(phone);
    setConnected(true);
  };

  const handleLogout = async () => {
    await logout();
    setSessionState(null);
    setConnected(false);
    setUserPhone(null);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Connecting...</p>
      </div>
    );
  }

  if (!sessionId || !connected) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard userPhone={userPhone} onLogout={handleLogout} />;
}

export default App;