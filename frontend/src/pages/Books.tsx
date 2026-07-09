import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';

export default function Books() {
  const [user, setUser] = useState<any>(null);
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
              <h3>{book.title}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>by {book.author}</p>
              <p>ISBN: {book.isbn}</p>
              <p>Available: <span style={{ color: book.available_quantity > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>{book.available_quantity} / {book.total_quantity}</span></p>
              <button 
                className="btn" 
                disabled={book.available_quantity <= 0}
                onClick={() => handleBorrow(book.id)}
                style={{ marginTop: 'auto', opacity: book.available_quantity <= 0 ? 0.5 : 1 }}
                id={`btn-borrow-${book.id}`}
              >
                {book.available_quantity > 0 ? 'Borrow Book' : 'Out of Stock'}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
