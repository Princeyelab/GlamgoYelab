'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/Button';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const isProvider = apiClient.getIsProvider();
      const response = isProvider
        ? await apiClient.getProviderNotifications()
        : await apiClient.getNotifications();

      if (response.success) {
        setNotifications(response.data || []);
      } else {
        setError(response.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const isProvider = apiClient.getIsProvider();
      const response = isProvider
        ? await apiClient.markProviderNotificationAsRead(notificationId)
        : await apiClient.markNotificationAsRead(notificationId);

      if (response.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
        );
      }
    } catch (err) {
      console.error('Erreur marquage lu:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const isProvider = apiClient.getIsProvider();
      const response = isProvider
        ? await apiClient.markAllProviderNotificationsAsRead()
        : await apiClient.markAllNotificationsAsRead();

      if (response.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
      }
    } catch (err) {
      console.error('Erreur marquage tous lus:', err);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'order_accepted': '✅',
      'order_started': '🚗',
      'order_completed': '🎉',
      'order_cancelled': '❌',
      'new_order': '📋',
      'new_bid': '💰',
      'bid_accepted': '🎯',
      'bid_rejected': '👎',
      'satisfaction_request': '⭐',
      'satisfaction_received': '🌟',
      'payment_received': '💳',
      'payment_processed': '💵',
      'message_received': '💬',
      'provider_arrived': '📍',
      'service_started': '🔧',
      'reminder': '⏰',
      'warning': '⚠️',
      'system': '🔔',
    };
    return icons[type] || '🔔';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'A l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationClick = (notification) => {
    // Marquer comme lu
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Rediriger selon le type
    const data = notification.data ? (typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data) : {};

    if (data.order_id) {
      const isProvider = apiClient.getIsProvider();
      if (isProvider) {
        router.push(`/provider/dashboard`);
      } else {
        router.push(`/orders/${data.order_id}`);
      }
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (authLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.notificationsPage} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Notifications</h1>
            {unreadCount > 0 && (
              <span className={styles.unreadBadge}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="small" onClick={handleMarkAllAsRead}>
              Tout marquer comme lu
            </Button>
          )}
        </div>

        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            Toutes ({notifications.length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'unread' ? styles.active : ''}`}
            onClick={() => setFilter('unread')}
          >
            Non lues ({unreadCount})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'read' ? styles.active : ''}`}
            onClick={() => setFilter('read')}
          >
            Lues ({notifications.length - unreadCount})
          </button>
        </div>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Chargement des notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔔</div>
            <h3>Aucune notification</h3>
            <p>
              {filter === 'unread'
                ? 'Vous avez lu toutes vos notifications'
                : 'Vous n\'avez pas encore de notifications'}
            </p>
          </div>
        ) : (
          <div className={styles.notificationsList}>
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`${styles.notificationCard} ${!notification.is_read ? styles.unread : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={styles.notificationIcon}>
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div className={styles.notificationContent}>
                  <h3 className={styles.notificationTitle}>{notification.title}</h3>
                  <p className={styles.notificationMessage}>{notification.message}</p>
                  <span className={styles.notificationTime}>
                    {formatDate(notification.created_at)}
                  </span>
                </div>
                {!notification.is_read && (
                  <div className={styles.unreadDot}></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
