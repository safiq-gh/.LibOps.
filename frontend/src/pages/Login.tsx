import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await apiClient.post('/login/access-token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('token', response.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }} id="login-panel">
        <h1 style={{ marginBottom: '24px', textAlign: 'center' }}>Login to LibOps</h1>
        {error && <p style={{ color: 'var(--danger-color)', marginBottom: '16px', textAlign: 'center' }} id="login-error">{error}</p>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} id="login-form">
          <input 
            type="email" 
            placeholder="Email" 
            className="input-field"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            id="login-email"
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-field"
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            id="login-password"
          />
          <button type="submit" className="btn" id="login-submit">Login</button>
        </form>
        <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

