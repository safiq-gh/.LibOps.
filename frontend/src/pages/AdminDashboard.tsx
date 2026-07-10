import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import Navbar from '../components/Navbar';
import type { User } from '../types/user';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
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

  if (!user) return <p className="text-center mt-16 text-secondary italic">Loading...</p>;

  return (
    <div>
      <Navbar user={user} />
      <main className="container">
        <h1 className="mb-12">Librarian Desk</h1>
        
        <div className="grid-container mb-16 gap-12">
          
          {/* Add Book Section */}
          <div id="admin-add-book">
            <h2 className="mb-8" style={{ borderBottom: '1px solid var(--border-dark)', paddingBottom: '16px' }}>Add to Collection</h2>
            <form onSubmit={handleAddBook} className="flex flex-col gap-6">
              
              <div className="form-group">
                <label className="form-label">Title</label>
                <input type="text" placeholder="Title" className="input-field" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Author</label>
                <input type="text" placeholder="Author" className="input-field" value={author} onChange={e => setAuthor(e.target.value)} required />
              </div>
              
              <div className="flex gap-6">
                <div className="form-group w-full">
                  <label className="form-label">ISBN</label>
                  <input type="text" placeholder="ISBN" className="input-field" value={isbn} onChange={e => setIsbn(e.target.value)} required />
                </div>
                <div className="form-group w-full">
                  <label className="form-label">Category</label>
                  <input type="text" placeholder="Category" className="input-field" value={category} onChange={e => setCategory(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Publisher</label>
                <input type="text" placeholder="Publisher" className="input-field" value={publisher} onChange={e => setPublisher(e.target.value)} required />
              </div>
              
              <div className="flex gap-6">
                <div className="form-group w-full">
                  <label className="form-label">Published Year</label>
                  <input type="number" className="input-field" min="1000" max="2100" value={publishedYear} onChange={e => setPublishedYear(Number(e.target.value))} required />
                </div>
                <div className="form-group w-full">
                  <label className="form-label">Total Copies</label>
                  <input type="number" className="input-field" min="1" value={copies} onChange={e => setCopies(Number(e.target.value))} required />
                </div>
              </div>

              <div className="form-group mt-4 mb-4">
                <label className="form-label" htmlFor="cover-file-input">Cover Image (Optional)</label>
                <input 
                  type="file" 
                  id="cover-file-input"
                  accept="image/*" 
                  onChange={e => setCoverFile(e.target.files ? e.target.files[0] : null)} 
                  className="mt-2 text-sm text-secondary"
                  style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}
                />
              </div>
              
              <button type="submit" className="btn w-full mt-4" id="btn-add-book">Add Book</button>
            </form>
          </div>

          {/* System Users Section */}
          <div className="flex flex-col" id="admin-users">
            <h2 className="mb-8" style={{ borderBottom: '1px solid var(--border-dark)', paddingBottom: '16px' }}>Registered Readers</h2>
            <div className="overflow-y-auto pr-4" style={{ maxHeight: '600px' }}>
              <ul className="flex flex-col" style={{ listStyle: 'none' }}>
                {usersList.map(u => (
                  <li key={u.id} className="flex justify-between items-center py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <strong className="text-primary font-medium block">{u.full_name}</strong>
                      <span className="text-sm text-secondary">{u.email}</span>
                    </div>
                    <span className="text-xs text-tertiary">
                      {u.role === 'admin' ? 'Librarian' : 'Reader'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Manage Books Section */}
        <div className="mt-16" id="admin-manage-books">
          <h2 className="mb-8" style={{ borderBottom: '1px solid var(--border-dark)', paddingBottom: '16px' }}>Collection Management</h2>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map(book => (
                  <tr key={book.id}>
                    <td className="font-medium text-primary">{book.title}</td>
                    <td className="text-secondary">{book.author}</td>
                    <td>
                      <span className="text-primary font-medium">
                        {book.available_copies}
                      </span> 
                      <span className="text-tertiary"> of {book.total_copies}</span>
                    </td>
                    <td>
                      <button className="btn btn-text text-sm text-tertiary" onClick={() => handleDeleteBook(book.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
