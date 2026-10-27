import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationPopup from '../NotificationPopup/NotificationPopup';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/expenses', icon: '💰', label: 'Expenses' },
  { to: '/balances', icon: '⚖️', label: 'Balances' },
  { to: '/tasks', icon: '🧹', label: 'Tasks' },
  { to: '/shopping', icon: '🛒', label: 'Shopping' },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const { household } = useHousehold();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.name ? user.name.slice(0, 1).toUpperCase() : '?';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" />
        <span className="sidebar-brand">Cohabit</span>
      </div>

      {/* Household pill */}
      {household && (
        <div className="sidebar-household">
          <span className="household-icon">🏡</span>
          <div className="household-info">
            <span className="household-name">{household.name}</span>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            onClick={onClose}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-label">{item.label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          className={`sidebar-nav-item sidebar-notification-btn${showNotifications ? ' active' : ''}`}
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label="Ouvrir les notifications"
        >
          <span className="nav-item-icon">🔔</span>
          <span className="nav-item-label">Notifications</span>
          {unreadCount > 0 && (
            <span className="sidebar-unread-pill">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </nav>

      <NotificationPopup
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Bottom section */}
      <div className="sidebar-bottom">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `sidebar-nav-item${isActive ? ' active' : ''}`
          }
          onClick={onClose}
        >
          <div
            className="avatar-mini"
            style={{ background: user?.color || '#a8d5c4' }}
          >
            {initials}
          </div>
          <span className="nav-item-label">{user?.name || 'Profile'}</span>
        </NavLink>
        <NavLink
          to="/household/settings"
          className={({ isActive }) =>
            `sidebar-nav-item${isActive ? ' active' : ''}`
          }
          onClick={onClose}
        >
          <span className="nav-item-icon">⚙️</span>
          <span className="nav-item-label">Household</span>
        </NavLink>
        <button className="sidebar-logout" onClick={handleLogout}>
          <span className="nav-item-icon">🚪</span>
          <span className="nav-item-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
