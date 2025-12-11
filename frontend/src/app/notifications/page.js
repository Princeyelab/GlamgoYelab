'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Traductions locales
  const content = {
    fr: {
      title: 'Notifications',
      noNotifications: 'Aucune notification pour le moment',
      noNotificationsDesc: 'Vous recevrez ici les mises à jour sur vos commandes et activités.',
      markAllRead: 'Tout marquer comme lu',
      back: 'Retour',
      today: 'Aujourd\'hui',
      yesterday: 'Hier',
      earlier: 'Plus ancien',
      newOrder: 'Nouvelle commande',
      orderAccepted: 'Commande acceptée',
      orderCompleted: 'Commande terminée',
      orderCancelled: 'Commande annulée',
      newMessage: 'Nouveau message',
      paymentReceived: 'Paiement reçu',
      reviewReceived: 'Nouvel avis reçu'
    },
    ar: {
      title: 'الإشعارات',
      noNotifications: 'لا توجد إشعارات في الوقت الحالي',
      noNotificationsDesc: 'ستتلقى هنا التحديثات حول طلباتك وأنشطتك.',
      markAllRead: 'تحديد الكل كمقروء',
      back: 'رجوع',
      today: 'اليوم',
      yesterday: 'أمس',
      earlier: 'سابقاً',
      newOrder: 'طلب جديد',
      orderAccepted: 'تم قبول الطلب',
      orderCompleted: 'تم إكمال الطلب',
      orderCancelled: 'تم إلغاء الطلب',
      newMessage: 'رسالة جديدة',
      paymentReceived: 'تم استلام الدفع',
      reviewReceived: 'تقييم جديد'
    }
  };

  const txt = content[language] || content.fr;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      // Simuler le chargement des notifications (mode démo)
      const timer = setTimeout(() => {
        // Notifications de démo
        const demoNotifications = [
          {
            id: 1,
            type: 'order_accepted',
            title: txt.orderAccepted,
            message: language === 'ar'
              ? 'تم قبول طلبك للعناية بالوجه'
              : 'Votre réservation pour Soin du visage a été acceptée',
            time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
            read: false,
            link: '/orders'
          },
          {
            id: 2,
            type: 'new_message',
            title: txt.newMessage,
            message: language === 'ar'
              ? 'لديك رسالة جديدة من سارة'
              : 'Vous avez un nouveau message de Sarah',
            time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
            read: false,
            link: '/orders'
          },
          {
            id: 3,
            type: 'order_completed',
            title: txt.orderCompleted,
            message: language === 'ar'
              ? 'تم إكمال خدمة التدليك. شكراً لثقتك!'
              : 'Votre prestation Massage a été complétée. Merci pour votre confiance !',
            time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            read: true,
            link: '/orders'
          }
        ];
        setNotifications(demoNotifications);
        setLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user, language, txt]);

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return language === 'ar' ? `منذ ${diffMins} دقيقة` : `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return language === 'ar' ? `منذ ${diffHours} ساعة` : `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return txt.yesterday;
    } else {
      return language === 'ar' ? `منذ ${diffDays} أيام` : `Il y a ${diffDays} jours`;
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
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification) => {
    // Marquer comme lu
    setNotifications(prev =>
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={styles.notificationsPage} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            {isRTL ? '→' : '←'} {txt.back}
          </button>
          <h1 className={styles.title}>
            {txt.title}
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount}</span>
            )}
          </h1>
          {notifications.length > 0 && unreadCount > 0 && (
            <button className={styles.markReadBtn} onClick={markAllAsRead}>
              {txt.markAllRead}
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔔</div>
            <h2>{txt.noNotifications}</h2>
            <p>{txt.noNotificationsDesc}</p>
          </div>
        ) : (
          <div className={styles.notificationsList}>
            {notifications.map((notification) => (
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
                    <span className={styles.notificationTitle}>{notification.title}</span>
                    <span className={styles.notificationTime}>{getTimeAgo(notification.time)}</span>
                  </div>
                  <p className={styles.notificationMessage}>{notification.message}</p>
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
