import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user }: { user: any }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="nav-bar" id="main-navbar">
      <Link to="/dashboard" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
        LibOps
      </Link>
      <div className="nav-links">
        <Link to="/dashboard" id="nav-dashboard">Dashboard</Link>
        <Link to="/books" id="nav-books">Books</Link>
        <Link to="/history" id="nav-history">Borrow History</Link>
        {user?.role === 'admin' && (
          <Link to="/admin" id="nav-admin">Admin Area</Link>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{user?.full_name}</span>
        <button className="btn btn-danger" onClick={handleLogout} id="btn-logout">Logout</button>
      </div>
    </nav>
  );
}
