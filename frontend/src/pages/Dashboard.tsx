import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/users/me')
      .then(res => setUser(res.data))
      .catch(() => navigate('/login'));
  }, [navigate]);

  if (!user) return <p style={{ padding: '32px', textAlign: 'center' }}>Loading...</p>;

  return (
    <div>
      <Navbar user={user} />
      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="glass-panel" id="dashboard-welcome">
          <h1 style={{ marginBottom: '16px' }}>Welcome back, {user.full_name}!</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            This is your LibOps dashboard. Use the navigation above to browse books or check your borrow history.
          </p>
        </div>
      </main>
    </div>
  );
}

