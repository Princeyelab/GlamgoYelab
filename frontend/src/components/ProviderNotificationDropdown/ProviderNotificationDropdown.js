'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './ProviderNotificationDropdown.module.scss';
import apiClient from '@/lib/apiClient';

export default function ProviderNotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // S'assurer que le token provider est chargé
    const providerToken = localStorage.getItem('provider_token');
    if (providerToken && !apiClient.getToken()) {
      apiClient.setToken(providerToken, true);
    }

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000); // Vérifier toutes les 5 secondes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      // Vérifier que le token est bien chargé
      const token = apiClient.getToken();
      if (!token) {
        const providerToken = localStorage.getItem('provider_token');
        if (providerToken) {
          apiClient.setToken(providerToken, true);
        } else {
          console.warn('ProviderNotificationDropdown: No provider token found');
          return;
        }
      }

      const response = await apiClient.getProviderUnreadNotificationsCount();
      console.log('ProviderNotificationDropdown: Unread count response:', response);
      console.log('ProviderNotificationDropdown: response.data:', response.data);
      console.log('ProviderNotificationDropdown: Current token:', apiClient.getToken()?.substring(0, 50));
      if (response.success) {
        console.log('ProviderNotificationDropdown: Setting unread count to', response.data.count);
        setUnreadCount(response.data.count);
      } else {
        console.error('Error fetching unread count:', response.message);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Vérifier que le token est bien chargé
      const token = apiClient.getToken();
      if (!token) {
        const providerToken = localStorage.getItem('provider_token');
        if (providerToken) {
          apiClient.setToken(providerToken, true);
        } else {
          console.warn('ProviderNotificationDropdown: No provider token found');
          setLoading(false);
          return;
        }
      }

      const response = await apiClient.getProviderNotifications(20);
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unread_count || 0);
      } else {
        console.error('Error fetching notifications:', response.message);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiClient.markProviderNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.markAllProviderNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const getNotificationIcon = (type) => {
    const icons = {
      new_order: '📦',
      order_accepted: '✅',
      order_on_way: '🚗',
      order_in_progress: '🔧',
      order_completed: '🎉',
      order_cancelled: '❌',
      new_message: '💬'
    };
    return icons[type] || '🔔';
  };

  return (
    <div className={styles.notificationDropdown} ref={dropdownRef}>
      <button
        className={styles.notificationButton}
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className={styles.markAllRead}
                onClick={handleMarkAllAsRead}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className={styles.dropdownContent}>
            {loading ? (
              <div className={styles.loading}>Chargement...</div>
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>Aucune notification</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''}`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <span className={styles.icon}>
                    {getNotificationIcon(notification.notification_type)}
                  </span>
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationTitle}>
                      {notification.title}
                    </div>
                    <div className={styles.notificationMessage}>
                      {notification.message}
                    </div>
                    <div className={styles.notificationTime}>
                      {formatDate(notification.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className={styles.dropdownFooter}>
              <Link href="/provider/notifications" onClick={() => setIsOpen(false)}>
                Voir toutes les notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
