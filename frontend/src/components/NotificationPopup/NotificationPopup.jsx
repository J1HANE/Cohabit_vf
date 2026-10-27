import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationPopup.css';

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays === 1) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function getIcon(type) {
  switch (type) {
    case 'EXPENSE':
      return '💰';
    case 'TASK':
      return '🧹';
    default:
      return '🔔';
  }
}

export default function NotificationPopup({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const popupRef = useRef(null);

  // Fetch freshest notifications whenever popup opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        if (!event.target.closest('.sidebar-notification-btn')) {
          onClose();
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const recent = notifications.slice(0, 6);

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    onClose();
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleViewAll = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
    navigate('/notifications');
  };

  return (
    <div
      className="notification-popup"
      ref={popupRef}
      style={{ backgroundColor: '#ffffff', opacity: 1, backdropFilter: 'none' }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="notification-popup-header">
        <div className="notification-popup-title-row">
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <span className="notification-popup-unread-badge">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="notification-popup-header-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="notification-mark-all-btn"
              onClick={markAllAsRead}
            >
              Tout marquer comme lu
            </button>
          )}
          <button
            type="button"
            className="notification-close-btn"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="notification-popup-list">
        {error && recent.length === 0 ? (
          <div className="notification-empty notification-error"><p>{error}</p></div>
        ) : loading && recent.length === 0 ? (
          <div className="notification-empty">
            <p>Chargement des notifications...</p>
          </div>
        ) : recent.length === 0 ? (
          <div className="notification-empty">
            <span className="notification-empty-icon">🔔</span>
            <p>Aucune notification pour le moment.</p>
          </div>
        ) : (
          recent.map((item) => (
            <div
              key={item.id}
              className={`notification-item${!item.isRead ? ' unread' : ''}`}
              onClick={() => handleNotificationClick(item)}
            >
              <div className="notification-item-icon">{getIcon(item.type)}</div>
              <div className="notification-item-content">
                <div className="notification-item-header">
                  <span className="notification-item-title">{item.title}</span>
                  <span className="notification-item-time">
                    {formatTime(item.createdAt)}
                  </span>
                </div>
                <p className="notification-item-message">{item.message}</p>
              </div>
              {!item.isRead && <div className="notification-unread-dot" />}
            </div>
          ))
        )}
      </div>

      <div className="notification-popup-footer">
        <button
          type="button"
          className="notification-view-all-btn"
          onClick={handleViewAll}
        >
          Voir toutes les notifications →
        </button>
      </div>
    </div>
  );
}
