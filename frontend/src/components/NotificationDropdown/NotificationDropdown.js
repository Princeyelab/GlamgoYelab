'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './NotificationDropdown.module.scss';
import apiClient from '@/lib/apiClient';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotificationDropdown() {
  const { t, isRTL } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Vérifier toutes les 30 secondes
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
      const response = await apiClient.getUnreadNotificationsCount();
      if (response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getNotifications(20);
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unread_count);
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
      await apiClient.markNotificationAsRead(notificationId);
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
      await apiClient.markAllNotificationsAsRead();
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

    if (diffMins < 1) return t('notificationDropdown.justNow');
    if (diffMins < 60) return t('notifications.minutesAgo', { n: diffMins });
    if (diffHours < 24) return t('notifications.hoursAgo', { n: diffHours });
    if (diffDays < 7) return t('notifications.daysAgo', { n: diffDays });
    return date.toLocaleDateString(isRTL ? 'ar-MA' : 'fr-FR');
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

  // Traduire le titre de notification si c'est une clé connue
  const translateNotificationTitle = (title) => {
    const titleMap = {
      'Commande acceptée': t('notificationDropdown.orderAccepted'),
      'Prestataire en route': t('notificationDropdown.providerOnWay'),
      'Service en cours': t('notificationDropdown.serviceInProgress'),
      'Service terminé': t('notificationDropdown.serviceCompleted'),
      'Commande annulée': t('notificationDropdown.orderCancelled'),
      'Nouveau message': t('notificationDropdown.newMessage'),
      'Prestation terminee - Evaluez le service': t('notificationDropdown.rateService'),
      'Prestation terminée - Évaluez le service': t('notificationDropdown.rateService'),
    };
    return titleMap[title] || title;
  };

  // Traduire le message de notification
  const translateNotificationMessage = (message) => {
    // Patterns de messages connus
    if (message.includes('est en route pour votre commande')) {
      const orderNum = message.match(/#(\d+)/)?.[1];
      return t('notificationDropdown.providerOnWayMsg', { orderNum: orderNum || '' });
    }
    if (message.includes('a été acceptée par un prestataire')) {
      const orderNum = message.match(/#(\d+)/)?.[1];
      return t('notificationDropdown.orderAcceptedMsg', { orderNum: orderNum || '' });
    }
    if (message.includes('Merci d\'evaluer le service') || message.includes('Merci d\'évaluer le service')) {
      return t('notificationDropdown.rateServiceMsg');
    }
    return message;
  };

  return (
    <div className={styles.notificationDropdown} ref={dropdownRef} dir={isRTL ? 'rtl' : 'ltr'}>
      <button
        className={styles.notificationButton}
        onClick={handleToggle}
        aria-label={t('notifications.title')}
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
            <h3>{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button
                className={styles.markAllRead}
                onClick={handleMarkAllAsRead}
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className={styles.dropdownContent}>
            {loading ? (
              <div className={styles.loading}>{t('common.loading')}</div>
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>{t('notifications.noNotifications')}</div>
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
                      {translateNotificationTitle(notification.title)}
                    </div>
                    <div className={styles.notificationMessage}>
                      {translateNotificationMessage(notification.message)}
                    </div>
                    <div className={styles.notificationTime}>
                      {formatDate(notification.created_at)}
                    </div>
                  </div>
                  {notification.order_id && (
                    <Link
                      href={`/orders/${notification.order_id}`}
                      className={styles.viewOrder}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('notificationDropdown.view')}
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className={styles.dropdownFooter}>
              <Link href="/notifications" onClick={() => setIsOpen(false)}>
                {t('notificationDropdown.viewAll')}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
