import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const navigate = useNavigate();

  // New book form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');
  const [category, setCategory] = useState('');
  const [publishedYear, setPublishedYear] = useState<number>(new Date().getFullYear());
  const [copies, setCopies] = useState(1);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    apiClient.get('/users/me')
      .then(res => {
        if (res.data.role !== 'admin') {
          navigate('/dashboard');
          return Promise.reject('Not admin');
        }
        setUser(res.data);
        return Promise.all([
          apiClient.get('/books/'),
          apiClient.get('/users/')
        ]);
      })
      .then(([booksRes, usersRes]) => {
        setBooks(booksRes.data);
        setUsersList(usersRes.data);
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Create the book
      const bookRes = await apiClient.post('/books/', {
        title,
        author,
        isbn,
        publisher,
        category,
        published_year: publishedYear,
        total_copies: copies,
        available_copies: copies
      });

      const newBook = bookRes.data;

      // 2. Upload cover if selected
      if (coverFile) {
        const formData = new FormData();
        formData.append('file', coverFile);
        await apiClient.post(`/books/${newBook.id}/cover`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      alert('Book added successfully');
      setTitle('');
      setAuthor('');
      setIsbn('');
      setPublisher('');
      setCategory('');
      setPublishedYear(new Date().getFullYear());
      setCopies(1);
      setCoverFile(null);
      // Reset file input value
      const fileInput = document.getElementById('cover-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh books
      const res = await apiClient.get('/books/');
      setBooks(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add book');
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await apiClient.delete(`/books/${bookId}`);
      // Refresh books
      const res = await apiClient.get('/books/');
      setBooks(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete book');
    }
  };

  if (!user) return <p style={{ padding: '32px', textAlign: 'center' }}>Loading...</p>;

  return (
    <div>
      <Navbar user={user} />
      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '24px' }}>Admin Dashboard</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          
          {/* Add Book Section */}
          <div className="glass-panel" id="admin-add-book">
            <h2 style={{ marginBottom: '16px' }}>Add New Book</h2>
            <form onSubmit={handleAddBook} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" placeholder="Title" className="input-field" value={title} onChange={e => setTitle(e.target.value)} required />
              <input type="text" placeholder="Author" className="input-field" value={author} onChange={e => setAuthor(e.target.value)} required />
              <input type="text" placeholder="ISBN" className="input-field" value={isbn} onChange={e => setIsbn(e.target.value)} required />
              <input type="text" placeholder="Publisher" className="input-field" value={publisher} onChange={e => setPublisher(e.target.value)} required />
              <input type="text" placeholder="Category" className="input-field" value={category} onChange={e => setCategory(e.target.value)} required />
              <input type="number" placeholder="Published Year" className="input-field" min="1000" max="2100" value={publishedYear} onChange={e => setPublishedYear(Number(e.target.value))} required />
              <input type="number" placeholder="Total Copies" className="input-field" min="1" value={copies} onChange={e => setCopies(Number(e.target.value))} required />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Book Cover Image (Optional)</label>
                <input 
                  type="file" 
                  id="cover-file-input"
                  accept="image/*" 
                  onChange={e => setCoverFile(e.target.files ? e.target.files[0] : null)} 
                />
              </div>
              <button type="submit" className="btn" id="btn-add-book">Add Book</button>
            </form>
          </div>

          {/* System Users Section */}
          <div className="glass-panel" id="admin-users">
            <h2 style={{ marginBottom: '16px' }}>System Users</h2>
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {usersList.map(u => (
                  <li key={u.id} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <strong>{u.full_name}</strong> ({u.email})
                    <span style={{ float: 'right', color: u.role === 'admin' ? 'var(--primary-hover)' : 'var(--text-secondary)' }}>
                      {u.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Manage Books Section */}
        <div className="glass-panel" style={{ marginTop: '32px' }} id="admin-manage-books">
          <h2 style={{ marginBottom: '16px' }}>Manage Books Catalog</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px' }}>Title</th>
                <th style={{ padding: '12px' }}>Author</th>
                <th style={{ padding: '12px' }}>Quantity (Avail/Total)</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map(book => (
                <tr key={book.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px' }}>{book.title}</td>
                  <td style={{ padding: '12px' }}>{book.author}</td>
                  <td style={{ padding: '12px' }}>{book.available_copies} / {book.total_copies}</td>
                  <td style={{ padding: '12px' }}>
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.9rem' }} onClick={() => handleDeleteBook(book.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}
