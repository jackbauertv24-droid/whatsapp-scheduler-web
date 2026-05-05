import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [apiKey, setApiKey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedKey = localStorage.getItem('wa_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
    setLoading(false);
  }, []);

  function handleLogin(key) {
    setApiKey(key);
  }

  function handleLogout() {
    localStorage.removeItem('wa_api_key');
    setApiKey(null);
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!apiKey) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard apiKey={apiKey} onLogout={handleLogout} />;
}

export default App;