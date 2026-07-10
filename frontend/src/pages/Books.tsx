import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';
import type { User } from '../types/user';

export default function Books() {
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/users/me')
      .then(res => {
        setUser(res.data);
        return apiClient.get('/books/');
      })
      .then(res => setBooks(res.data))
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleBorrow = async (bookId: string) => {
    try {
      await apiClient.post('/borrow/', { book_id: bookId });
      alert('Book borrowed successfully!');
      // Refresh books to update available quantity
      const res = await apiClient.get('/books/');
      setBooks(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to borrow book');
    }
  };

  if (!user) return <p style={{ padding: '32px', textAlign: 'center' }}>Loading...</p>;

  return (
    <div>
      <Navbar user={user} />
      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '24px' }}>Library Catalog</h1>
        <div className="grid-container" id="books-grid">
          {books.map(book => (
            <div key={book.id} className="glass-panel book-card" id={`book-${book.id}`}>
              {book.cover_image_url ? (
                <img 
                  src={book.cover_image_url} 
                  alt={book.title} 
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} 
                />
              ) : (
                <div style={{ width: '100%', height: '200px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                  No Cover Image
                </div>
              )}
              <h3>{book.title}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>by {book.author}</p>
              <p>ISBN: {book.isbn}</p>
              <p>Available: <span style={{ color: book.available_copies > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>{book.available_copies} / {book.total_copies}</span></p>
              <button 
                className="btn" 
                disabled={book.available_copies <= 0}
                onClick={() => handleBorrow(book.id)}
                style={{ marginTop: 'auto', opacity: book.available_copies <= 0 ? 0.5 : 1 }}
                id={`btn-borrow-${book.id}`}
              >
                {book.available_copies > 0 ? 'Borrow Book' : 'Out of Stock'}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
