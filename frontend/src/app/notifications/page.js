'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isRTL, language } = useLanguage();
  const [notificationsData, setNotificationsData] = useState([]);
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
      reviewReceived: 'Nouvel avis reçu',
      // Messages des notifications de démo
      demoMessage1: 'Votre réservation pour Soin du visage a été acceptée',
      demoMessage2: 'Vous avez un nouveau message de Sarah',
      demoMessage3: 'Votre prestation Massage a été complétée. Merci pour votre confiance !',
      minutesAgo: 'Il y a {n} min',
      hoursAgo: 'Il y a {n}h',
      daysAgo: 'Il y a {n} jours'
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
      reviewReceived: 'تقييم جديد',
      // Messages des notifications de démo
      demoMessage1: 'تم قبول طلبك للعناية بالوجه',
      demoMessage2: 'لديك رسالة جديدة من سارة',
      demoMessage3: 'تم إكمال خدمة التدليك. شكراً لثقتك!',
      minutesAgo: 'منذ {n} دقيقة',
      hoursAgo: 'منذ {n} ساعة',
      daysAgo: 'منذ {n} أيام'
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
        // Données brutes des notifications (sans texte traduit)
        const demoNotifications = [
          {
            id: 1,
            type: 'order_accepted',
            titleKey: 'orderAccepted',
            messageKey: 'demoMessage1',
            time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            read: false,
            link: '/orders'
          },
          {
            id: 2,
            type: 'new_message',
            titleKey: 'newMessage',
            messageKey: 'demoMessage2',
            time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            read: false,
            link: '/orders'
          },
          {
            id: 3,
            type: 'order_completed',
            titleKey: 'orderCompleted',
            messageKey: 'demoMessage3',
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
      return txt.minutesAgo.replace('{n}', diffMins);
    } else if (diffHours < 24) {
      return txt.hoursAgo.replace('{n}', diffHours);
    } else if (diffDays === 1) {
      return txt.yesterday;
    } else {
      return txt.daysAgo.replace('{n}', diffDays);
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
            {isRTL ? '→' : '←'} {txt.back}
          </button>
          <h1 className={styles.title}>
            {txt.title}
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount}</span>
            )}
          </h1>
          {notificationsData.length > 0 && unreadCount > 0 && (
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
        ) : notificationsData.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔔</div>
            <h2>{txt.noNotifications}</h2>
            <p>{txt.noNotificationsDesc}</p>
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
                    <span className={styles.notificationTitle}>{txt[notification.titleKey]}</span>
                    <span className={styles.notificationTime}>{getTimeAgo(notification.time)}</span>
                  </div>
                  <p className={styles.notificationMessage}>{txt[notification.messageKey]}</p>
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
