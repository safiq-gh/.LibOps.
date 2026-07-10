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
      const res = await apiClient.get('/books/');
      setBooks(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to borrow book');
    }
  };

  if (!user) return <p className="text-center mt-16 text-secondary italic">Loading...</p>;

  return (
    <div>
      <Navbar user={user} />
      <main className="container">
        <div className="flex justify-between items-center mb-12">
          <h1 className="mb-0">Library Catalog</h1>
        </div>
        
        {books.length === 0 ? (
          <p className="text-secondary italic">The collection is currently empty.</p>
        ) : (
          <div className="grid-container" id="books-grid">
            {books.map(book => (
              <div key={book.id} className="book-card" id={`book-${book.id}`}>
                {book.cover_image_url ? (
                  <img 
                    src={book.cover_image_url} 
                    alt={book.title} 
                    className="book-cover"
                  />
                ) : (
                  <div className="book-cover">
                    No Cover Image
                  </div>
                )}
                
                <div className="flex flex-col flex-1">
                  <h3 className="font-semibold text-primary mb-1">{book.title}</h3>
                  <p className="text-secondary text-sm mb-4">by {book.author}</p>
                  
                  <div className="mt-auto pt-4 border-t border-border-light">
                    <p className="text-xs text-tertiary mb-4">ISBN: {book.isbn}</p>
                    
                    <button 
                      className="btn w-full" 
                      disabled={book.available_copies <= 0}
                      onClick={() => handleBorrow(book.id)}
                      id={`btn-borrow-${book.id}`}
                    >
                      {book.available_copies > 0 ? 'Start Reading' : 'Currently Being Read'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
