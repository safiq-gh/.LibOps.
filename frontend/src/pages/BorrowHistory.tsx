import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';
import type { User } from '../types/user';

export default function BorrowHistory() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/users/me')
      .then(res => {
        setUser(res.data);
        return apiClient.get('/borrow/me');
      })
      .then(res => setHistory(res.data))
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleReturn = async (recordId: string) => {
    try {
      await apiClient.post(`/borrow/${recordId}/return`);
      alert('Book returned successfully!');
      const res = await apiClient.get('/borrow/me');
      setHistory(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to return book');
    }
  };

  if (!user) return <p className="text-center mt-16 text-secondary italic">Loading...</p>;

  return (
    <div>
      <Navbar user={user} />
      <main className="container max-w-md" style={{ maxWidth: '800px' }}>
        <h1 className="mb-12">Reading History</h1>
        
        {history.length === 0 ? (
          <p className="text-secondary italic">You haven't added any stories to your history yet.</p>
        ) : (
          <div className="flex flex-col border-t border-border-dark" id="history-grid">
            {history.map(record => (
              <div key={record.id} className="ledger-item" id={`record-${record.id}`}>
                <div className="flex-1 pr-6">
                  <h3 className="font-semibold text-primary mb-1">{record.book.title}</h3>
                  <div className="flex flex-col gap-1 mt-2">
                    <p className="text-sm text-secondary">
                      <span className="text-tertiary w-24 inline-block">Borrowed:</span> 
                      {new Date(record.borrowed_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-secondary">
                      <span className="text-tertiary w-24 inline-block">Due Date:</span> 
                      {new Date(record.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 md:mt-0 flex flex-col items-start md:items-end min-w-[140px]">
                  {record.returned_at ? (
                    <p className="text-sm text-secondary italic">
                      Returned on {new Date(record.returned_at).toLocaleDateString()}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-primary font-medium mb-3">Reading</p>
                      <button 
                        className="btn btn-sm" 
                        onClick={() => handleReturn(record.id)}
                        id={`btn-return-${record.id}`}
                      >
                        Return Book
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
