import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, AppButton } from '../../components/shared/SharedComponents';
import { useNotifications } from '../../context/NotificationContext';
import './Notifications.css';

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
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
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

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading, error } = useNotifications();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="notifications-page page-fade">
      <PageHeader
        title="Notifications"
        subtitle="Restez informé des activités de votre colocation"
        action={
          unreadCount > 0 ? (
            <AppButton variant="ghost" size="md" onClick={markAllAsRead}>
              Tout marquer comme lu
            </AppButton>
          ) : null
        }
      />

      {/* Filter tabs */}
      <div className="notifications-filter-bar">
        <button
          type="button"
          className={`notifications-tab${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Toutes ({notifications.length})
        </button>
        <button
          type="button"
          className={`notifications-tab${filter === 'unread' ? ' active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Non lues ({unreadCount})
        </button>
      </div>

      {/* Notifications list */}
      <div className="notifications-list">
        {error && notifications.length === 0 ? (
          <div className="notifications-loading">{error}</div>
        ) : loading && notifications.length === 0 ? (
          <div className="notifications-loading">
            <p>Chargement des notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="notifications-empty-card app-card">
            <div className="notifications-empty-icon">✨</div>
            <h3>Vous êtes à jour !</h3>
            <p>
              {filter === 'unread'
                ? 'Aucune notification non lue.'
                : 'Aucune notification enregistrée pour le moment.'}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`notification-card app-card${!item.isRead ? ' unread' : ''}`}
              onClick={() => handleNotificationClick(item)}
            >
              <div className="notification-card-icon">{getIcon(item.type)}</div>
              <div className="notification-card-body">
                <div className="notification-card-header">
                  <h4 className="notification-card-title">{item.title}</h4>
                  <span className="notification-card-date">
                    {formatTime(item.createdAt)}
                  </span>
                </div>
                <p className="notification-card-message">{item.message}</p>
                {item.link && (
                  <span className="notification-card-link-hint">
                    Voir les détails →
                  </span>
                )}
              </div>
              <div className="notification-card-actions" onClick={(e) => e.stopPropagation()}>
                {!item.isRead ? (
                  <button
                    type="button"
                    className="notification-card-mark-read"
                    onClick={() => markAsRead(item.id)}
                    title="Marquer comme lu"
                    aria-label="Marquer comme lu"
                  >
                    ✓
                  </button>
                ) : (
                  <span className="notification-card-read-label">Lu</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
