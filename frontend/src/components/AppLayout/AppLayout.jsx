import React, { useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { useNotifications } from '../../context/NotificationContext';
import Sidebar from '../Sidebar/Sidebar';
import MobileNavigation from '../MobileNavigation/MobileNavigation';
import './AppLayout.css';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { household } = useHousehold();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.householdId && !user.household_id && !household?.id) {
    return <Navigate to="/household/join" replace />;
  }

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop/tablet sidebar */}
      <div className={`sidebar-wrapper${sidebarOpen ? ' mobile-open' : ''}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="app-main">
        {/* Mobile header */}
        <header className="mobile-header">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
          <div className="mobile-header-logo">
            <div className="sidebar-logo-icon" />
            <span className="sidebar-brand">Cohabit</span>
          </div>
          <button
            type="button"
            className="mobile-notif-btn"
            onClick={() => navigate('/notifications')}
            aria-label="Notifications"
          >
            <span>🔔</span>
            {unreadCount > 0 && (
              <span className="mobile-notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNavigation />
    </div>
  );
}
