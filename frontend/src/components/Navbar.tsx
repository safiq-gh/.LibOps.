import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { User } from '../types/user';

export default function Navbar({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className="nav-bar" id="main-navbar">
      <div className="nav-mobile-header">
        <Link to="/dashboard" className="nav-brand">
          LibOps
        </Link>
        <button 
          className="hamburger-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      <div className={`nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link" id="nav-dashboard">Reading Room</Link>
          <Link to="/books" className="nav-link" id="nav-books">Library Catalog</Link>
          <Link to="/history" className="nav-link" id="nav-history">Reading History</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="nav-link" id="nav-admin">Librarian Desk</Link>
          )}
        </div>
        <div className="flex items-center gap-6 nav-auth">
          <button 
            className="btn btn-text text-sm" 
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle dark mode"
          >
            {isDark ? 'Light' : 'Dark'}
          </button>
          <span className="text-secondary italic font-medium">{user?.full_name}</span>
          <button className="btn btn-text text-sm" onClick={handleLogout} id="btn-logout">Sign Out</button>
        </div>
      </div>
    </nav>
  );
}
