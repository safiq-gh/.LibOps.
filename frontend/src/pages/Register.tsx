import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function Register() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/users/', {
        email,
        full_name: fullName,
        password,
        role: 'member'
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }} id="register-panel">
        <h1 style={{ marginBottom: '24px', textAlign: 'center' }}>Register for LibOps</h1>
        {error && <p style={{ color: 'var(--danger-color)', marginBottom: '16px', textAlign: 'center' }} id="register-error">{error}</p>}
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} id="register-form">
          <input 
            type="email" 
            placeholder="Email" 
            className="input-field"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            id="register-email"
          />
          <input 
            type="text" 
            placeholder="Full Name" 
            className="input-field"
            value={fullName} 
            onChange={e => setFullName(e.target.value)} 
            required 
            id="register-fullname"
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-field"
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            id="register-password"
          />
          <button type="submit" className="btn" id="register-submit">Register</button>
        </form>
        <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}
