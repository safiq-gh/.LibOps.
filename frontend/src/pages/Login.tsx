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
      <div className="auth-panel" id="login-panel">
        <h1 className="text-center mb-12">Sign In</h1>
        
        {error && <div className="alert alert-danger text-center" id="login-error">{error}</div>}
        
        <form onSubmit={handleLogin} className="flex flex-col gap-8" id="login-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="input-field"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              id="login-email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="input-field"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              id="login-password"
            />
          </div>
          <button type="submit" className="btn mt-4 w-full" id="login-submit">Continue to Library</button>
        </form>
        
        <p className="text-center text-secondary mt-12 text-sm">
          Don't have an account? <Link to="/register" className="text-primary italic border-b border-text-primary">Create one</Link>
        </p>
      </div>
    </div>
  );
}
