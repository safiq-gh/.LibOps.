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
      <div className="auth-panel" id="register-panel">
        <h1 className="text-center mb-12">Join the Library</h1>
        
        {error && <div className="alert alert-danger text-center" id="register-error">{error}</div>}
        
        <form onSubmit={handleRegister} className="flex flex-col gap-8" id="register-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="input-field"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              id="register-email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="input-field"
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              required 
              id="register-fullname"
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
              id="register-password"
            />
          </div>
          <button type="submit" className="btn mt-4 w-full" id="register-submit">Create Account</button>
        </form>
        
        <p className="text-center text-secondary mt-12 text-sm">
          Already a reader? <Link to="/login" className="text-primary italic border-b border-text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
