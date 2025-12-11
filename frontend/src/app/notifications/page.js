'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const [notificationsData, setNotificationsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      // Simuler le chargement des notifications (mode démo)
      const timer = setTimeout(() => {
        // Données brutes des notifications (sans texte traduit)
        const demoNotifications = [
          {
            id: 1,
            type: 'order_accepted',
            titleKey: 'notifications.orderAccepted',
            messageKey: 'notifications.demoMessage1',
            time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            read: false,
            link: '/orders'
          },
          {
            id: 2,
            type: 'new_message',
            titleKey: 'notifications.newMessage',
            messageKey: 'notifications.demoMessage2',
            time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            read: false,
            link: '/orders'
          },
          {
            id: 3,
            type: 'order_completed',
            titleKey: 'notifications.orderCompleted',
            messageKey: 'notifications.demoMessage3',
            time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            read: true,
            link: '/orders'
          }
        ];
        setNotificationsData(demoNotifications);
        setLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return t('notifications.minutesAgo', { n: diffMins });
    } else if (diffHours < 24) {
      return t('notifications.hoursAgo', { n: diffHours });
    } else if (diffDays === 1) {
      return t('notifications.yesterday');
    } else {
      return t('notifications.daysAgo', { n: diffDays });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
        return '🛒';
      case 'order_accepted':
        return '✅';
      case 'order_completed':
        return '🎉';
      case 'order_cancelled':
        return '❌';
      case 'new_message':
        return '💬';
      case 'payment_received':
        return '💰';
      case 'review_received':
        return '⭐';
      default:
        return '🔔';
    }
  };

  const markAllAsRead = () => {
    setNotificationsData(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification) => {
    // Marquer comme lu
    setNotificationsData(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    // Naviguer
    if (notification.link) {
      router.push(notification.link);
    }
  };

  if (authLoading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const unreadCount = notificationsData.filter(n => !n.read).length;

  return (
    <div className={styles.notificationsPage} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            {isRTL ? '→' : '←'} {t('notifications.back')}
          </button>
          <h1 className={styles.title}>
            {t('notifications.title')}
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount}</span>
            )}
          </h1>
          {notificationsData.length > 0 && unreadCount > 0 && (
            <button className={styles.markReadBtn} onClick={markAllAsRead}>
              {t('notifications.markAllRead')}
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
            <h2>{t('notifications.noNotifications')}</h2>
            <p>{t('notifications.noNotificationsDesc')}</p>
          </div>
        ) : (
          <div className={styles.notificationsList}>
            {notificationsData.map((notification) => (
              <div
                key={notification.id}
                className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className={styles.notificationContent}>
                  <div className={styles.notificationHeader}>
                    <span className={styles.notificationTitle}>{t(notification.titleKey)}</span>
                    <span className={styles.notificationTime}>{getTimeAgo(notification.time)}</span>
                  </div>
                  <p className={styles.notificationMessage}>{t(notification.messageKey)}</p>
                </div>
                {!notification.read && <div className={styles.unreadDot}></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
