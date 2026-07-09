import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';

export default function BorrowHistory() {
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/users/me')
      .then(res => {
        setUser(res.data);
        return apiClient.get('/borrow/my-records');
      })
      .then(res => setHistory(res.data))
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleReturn = async (recordId: string) => {
    try {
      await apiClient.post(`/borrow/${recordId}/return`);
      alert('Book returned successfully!');
      // Refresh history
      const res = await apiClient.get('/borrow/my-records');
      setHistory(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to return book');
    }
  };

  if (!user) return <p style={{ padding: '32px', textAlign: 'center' }}>Loading...</p>;

  return (
    <div>
      <Navbar user={user} />
      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '24px' }}>My Borrow History</h1>
        {history.length === 0 ? (
          <div className="glass-panel">
            <p>You haven't borrowed any books yet.</p>
          </div>
        ) : (
          <div className="grid-container" id="history-grid">
            {history.map(record => (
              <div key={record.id} className="glass-panel book-card" id={`record-${record.id}`}>
                <h3>{record.book.title}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Borrowed on: {new Date(record.borrow_date).toLocaleDateString()}</p>
                <p style={{ color: 'var(--text-secondary)' }}>Due date: {new Date(record.due_date).toLocaleDateString()}</p>
                
                {record.return_date ? (
                  <p style={{ color: 'var(--success-color)', fontWeight: 600 }}>
                    Returned on: {new Date(record.return_date).toLocaleDateString()}
                  </p>
                ) : (
                  <>
                    <p style={{ color: 'var(--danger-color)', fontWeight: 600 }}>Status: Not Returned</p>
                    <button 
                      className="btn" 
                      onClick={() => handleReturn(record.id)}
                      style={{ marginTop: 'auto' }}
                      id={`btn-return-${record.id}`}
                    >
                      Return Book
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
