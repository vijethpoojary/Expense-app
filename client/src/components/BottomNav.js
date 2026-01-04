import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

const BottomNav = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/rooms') {
      return location.pathname === '/rooms' || location.pathname.startsWith('/rooms/');
    }
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/expenses', label: 'Expenses', icon: '💸' },
    { path: '/investments', label: 'Investments', icon: '📈' },
    { path: '/rooms', label: 'Rooms', icon: '🏠' },
    { path: '/summary', label: 'Summary', icon: '📋' },
  ];

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
          aria-label={item.label}
        >
          <span className="bottom-nav-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="bottom-nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;

