import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';
import type { User } from '../types/user';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/users/me')
      .then(res => setUser(res.data))
      .catch(() => navigate('/login'));
  }, [navigate]);

  if (!user) return <p className="text-center mt-16 text-secondary italic">Loading...</p>;

  return (
    <div>
      <Navbar user={user} />
      <main className="container">
        <div className="mt-16 mb-16" id="dashboard-welcome">
          <p className="text-xs text-tertiary mb-4">Reading Space</p>
          <h1 className="mb-8" style={{ maxWidth: '15ch', lineHeight: 1 }}>
            Welcome back, {user.full_name.split(' ')[0]}.
          </h1>
          <p className="text-secondary" style={{ fontSize: '1.25rem' }}>
            Every great journey begins with a single page. 
            Explore the catalog to find your next story, or review your reading history.
          </p>
        </div>
      </main>
    </div>
  );
}
