'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';

export default function ProviderNotificationsPage() {
  const router = useRouter();
  const { t, isRTL, toArabicNumerals } = useLanguage();
  const [notificationsData, setNotificationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Vérifier l'authentification provider
  useEffect(() => {
    const token = localStorage.getItem('provider_token') || sessionStorage.getItem('provider_token');
    if (!token) {
      router.push('/provider/login');
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  // Charger les notifications réelles depuis l'API
  useEffect(() => {
    if (authChecked) {
      loadNotifications();
    }
  }, [authChecked]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/provider/notifications');
      if (response.success && response.data) {
        // L'API retourne les notifications avec structure:
        // { id, type, title, message, data, read_at, created_at }
        const notifications = Array.isArray(response.data)
          ? response.data
          : (response.data.notifications || []);
        setNotificationsData(notifications);
      } else {
        setNotificationsData([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotificationsData([]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return t('notifications.minutesAgo', { n: toArabicNumerals(diffMins) });
    } else if (diffHours < 24) {
      return t('notifications.hoursAgo', { n: toArabicNumerals(diffHours) });
    } else if (diffDays === 1) {
      return t('notifications.yesterday');
    } else {
      return t('notifications.daysAgo', { n: toArabicNumerals(diffDays) });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
      case 'order_request':
        return '🛒';
      case 'order_accepted':
        return '✅';
      case 'order_completed':
        return '🎉';
      case 'order_cancelled':
        return '❌';
      case 'new_message':
      case 'message':
        return '💬';
      case 'payment_received':
      case 'payment':
        return '💰';
      case 'review_received':
      case 'review':
        return '⭐';
      case 'client_on_way':
        return '🚗';
      case 'client_arrived':
        return '📍';
      case 'bid_accepted':
        return '🎯';
      case 'bid_rejected':
        return '🚫';
      default:
        return '🔔';
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiClient.patch(`/provider/notifications/${notificationId}/read`);
      // Mettre à jour l'état local
      setNotificationsData(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch('/provider/notifications/read-all');
      // Mettre à jour l'état local
      setNotificationsData(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Fallback: marquer localement si l'API échoue
      setNotificationsData(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    }
  };

  const handleNotificationClick = async (notification) => {
    // Marquer comme lu si pas encore lu
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }

    // Naviguer vers le lien approprié basé sur le type ou les données
    const link = notification.data?.link || notification.link;
    if (link) {
      router.push(link);
    } else if (notification.data?.order_id) {
      router.push(`/provider/orders/${notification.data.order_id}`);
    } else {
      router.push('/provider/dashboard');
    }
  };

  // Affichage loading pendant vérification auth
  if (!authChecked) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  const unreadCount = notificationsData.filter(n => !n.read_at).length;

  return (
    <div className={styles.notificationsPage} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.push('/provider/dashboard')}>
            {isRTL ? '→' : '←'} {t('providerNotifications.backToDashboard')}
          </button>
          <h1 className={styles.title}>
            {t('providerNotifications.title')}
            {unreadCount > 0 && (
              <span className={styles.badge}>{toArabicNumerals(unreadCount)}</span>
            )}
          </h1>
          {notificationsData.length > 0 && unreadCount > 0 && (
            <button className={styles.markReadBtn} onClick={markAllAsRead}>
              {t('providerNotifications.markAllRead')}
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
          </div>
        ) : notificationsData.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔔</div>
            <h2>{t('providerNotifications.noNotifications')}</h2>
            <p>{t('providerNotifications.noNotificationsDesc')}</p>
          </div>
        ) : (
          <div className={styles.notificationsList}>
            {notificationsData.map((notification) => (
              <div
                key={notification.id}
                className={`${styles.notificationItem} ${!notification.read_at ? styles.unread : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className={styles.notificationContent}>
                  <div className={styles.notificationHeader}>
                    <span className={styles.notificationTitle}>
                      {notification.title || t(`providerNotifications.${notification.type}`) || t('providerNotifications.notification')}
                    </span>
                    <span className={styles.notificationTime}>
                      {getTimeAgo(notification.created_at || notification.time)}
                    </span>
                  </div>
                  <p className={styles.notificationMessage}>
                    {notification.message || notification.body || ''}
                  </p>
                </div>
                {!notification.read_at && <div className={styles.unreadDot}></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
