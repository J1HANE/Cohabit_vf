import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8081/api/notifications/user/${user.id}`);
      if (!res.ok) {
        throw new Error(`Notification request failed (${res.status})`);
      }

      const payload = await res.json();
      if (!Array.isArray(payload)) {
        throw new Error('Notification response was not a list');
      }

      // Accept both the API's camelCase and database-style snake_case fields.
      const data = payload.filter((item) => item && typeof item === 'object').map((item) => ({
        ...item,
        isRead: (item.isRead ?? item.is_read) === true || (item.isRead ?? item.is_read) === 1,
        createdAt: item.createdAt ?? item.created_at ?? null,
      }));
      setNotifications(data);
      setUnreadCount(data.filter((item) => !item.isRead).length);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      setError('Impossible de charger les notifications. Vérifiez que le serveur est démarré, puis réessayez.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Poll every 25 seconds for new notifications
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [user?.id, fetchNotifications]);

  const markAsRead = async (id) => {
    const previous = notifications;
    const item = previous.find((notification) => String(notification.id) === String(id));
    if (!item || item.isRead) return;

    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (String(n.id) === String(id) ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const res = await fetch(`http://localhost:8081/api/notifications/${id}/read`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error(`Mark-read request failed (${res.status})`);
    } catch (err) {
      console.error('Failed to mark notification as read', err);
      await fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      const res = await fetch(`http://localhost:8081/api/notifications/user/${user.id}/read-all`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error(`Mark-all-read request failed (${res.status})`);
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
      await fetchNotifications();
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
