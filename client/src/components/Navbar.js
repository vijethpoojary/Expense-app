import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ theme, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const isActive = (path) => {
    if (path === '/rooms') {
      return location.pathname === '/rooms' || location.pathname.startsWith('/rooms/');
    }
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          💰 Expense Tracker
        </Link>
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/expenses" className={`nav-link ${isActive('/expenses') ? 'active' : ''}`}>
            Expenses
          </Link>
          <Link to="/investments" className={`nav-link ${isActive('/investments') ? 'active' : ''}`}>
            Investments
          </Link>
          <Link to="/summary" className={`nav-link ${isActive('/summary') ? 'active' : ''}`}>
            Summary
          </Link>
          <Link to="/history" className={`nav-link ${isActive('/history') ? 'active' : ''}`}>
            History
          </Link>
          <Link to="/rooms" className={`nav-link ${isActive('/rooms') ? 'active' : ''}`}>
            Rooms
          </Link>
          <span className="user-email">{user?.email}</span>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            Logout
          </button>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

