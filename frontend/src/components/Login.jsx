import { useState } from 'react';

function Login({ onLogin }) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Please enter API key');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey.trim()
        }
      });
      
      if (response.ok) {
        localStorage.setItem('wa_api_key', apiKey.trim());
        onLogin(apiKey.trim());
      } else {
        const data = await response.json().catch(() => ({ error: 'Invalid API key' }));
        setError(data.error || 'Invalid API key');
      }
    } catch (err) {
      setError('Connection failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>WhatsApp Scheduler</h1>
        <p className="login-subtitle">Enter your API key to continue</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>API Key:</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
              disabled={loading}
              autoComplete="off"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Verifying...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;