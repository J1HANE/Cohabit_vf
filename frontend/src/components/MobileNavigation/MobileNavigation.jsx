import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './MobileNavigation.css';

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Home' },
  { to: '/expenses', icon: '💰', label: 'Expenses' },
  { to: '/tasks', icon: '🧹', label: 'Tasks' },
  { to: '/shopping', icon: '🛒', label: 'Shopping' },
  { to: '/balances', icon: '⚖️', label: 'Balances' },
];

export default function MobileNavigation() {
  return (
    <nav className="mobile-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `mobile-nav-item${isActive ? ' active' : ''}`
          }
        >
          <span className="mobile-nav-icon">{item.icon}</span>
          <span className="mobile-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
