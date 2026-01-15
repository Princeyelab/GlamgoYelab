'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './ProviderNotificationDropdown.module.scss';
import apiClient from '@/lib/apiClient';
import { useLanguage } from '@/contexts/LanguageContext';
import TranslatedText from '@/components/TranslatedText/TranslatedText';

export default function ProviderNotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancellationModal, setCancellationModal] = useState({ show: false, data: null });
  const dropdownRef = useRef(null);
  const { t, toArabicNumerals, isRTL, locale } = useLanguage();

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

    if (diffMins < 1) return isRTL ? "الآن" : "À l'instant";
    if (diffMins < 60) return isRTL ? `منذ ${toArabicNumerals(diffMins)} ${t('common.min')}` : `Il y a ${toArabicNumerals(diffMins)} min`;
    if (diffHours < 24) return isRTL ? `منذ ${toArabicNumerals(diffHours)} س` : `Il y a ${toArabicNumerals(diffHours)}h`;
    if (diffDays < 7) return isRTL ? `منذ ${toArabicNumerals(diffDays)} ي` : `Il y a ${toArabicNumerals(diffDays)}j`;
    return date.toLocaleDateString(locale);
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

  // Traduire le titre de notification (comme le dropdown client)
  const translateNotificationTitle = (title) => {
    if (!title) return title;
    const titleMap = {
      // French titles
      'Nouvelle commande disponible': t('providerNotificationDropdown.newOrderAvailable'),
      'Nouvelle commande': t('providerNotifications.newOrder'),
      'Nouvelle réservation': t('providerNotifications.newOrder'),
      'Nouvelle reservation': t('providerNotifications.newOrder'),
      'Prestation confirmée': t('providerNotificationDropdown.orderConfirmed'),
      'Prestation confirmee': t('providerNotificationDropdown.orderConfirmed'),
      'Service confirmé': t('providerNotificationDropdown.orderConfirmed'),
      'Service confirme': t('providerNotificationDropdown.orderConfirmed'),
      'Client en route': t('providerNotificationDropdown.clientOnWay'),
      'Client arrivé': t('providerNotificationDropdown.clientArrived'),
      'Client arrive': t('providerNotificationDropdown.clientArrived'),
      'Service en cours': t('providerNotificationDropdown.serviceInProgress'),
      'Prestation terminée': t('providerNotificationDropdown.serviceCompleted'),
      'Prestation terminee': t('providerNotificationDropdown.serviceCompleted'),
      'Commande annulée': t('providerNotificationDropdown.orderCancelled'),
      'Commande annulee': t('providerNotificationDropdown.orderCancelled'),
      'Commande annulée par le client': t('providerNotificationDropdown.orderCancelledByClient'),
      'Commande annulee par le client': t('providerNotificationDropdown.orderCancelledByClient'),
      'Commande annulée - Indemnisation': t('providerNotificationDropdown.orderCancelledWithCompensation'),
      'Commande annulee - Indemnisation': t('providerNotificationDropdown.orderCancelledWithCompensation'),
      'Nouveau message': t('providerNotificationDropdown.newMessage'),
      'Paiement reçu': t('providerNotificationDropdown.paymentReceived'),
      'Paiement recu': t('providerNotificationDropdown.paymentReceived'),
      'Nouvel avis': t('providerNotificationDropdown.reviewReceived'),
      'Évaluation reçue': t('providerNotificationDropdown.reviewReceived'),
      'Evaluation reçue': t('providerNotificationDropdown.reviewReceived'),
      'Evaluation recue': t('providerNotificationDropdown.reviewReceived'),
      'Commande manquée': t('providerNotificationDropdown.missedOrder'),
      'Commande manquee': t('providerNotificationDropdown.missedOrder'),

      // English titles (from backend)
      'New order available': t('providerNotificationDropdown.newOrderAvailable'),
      'New order': t('providerNotifications.newOrder'),
      'New booking': t('providerNotifications.newOrder'),
      'Service confirmed': t('providerNotificationDropdown.orderConfirmed'),
      'Order confirmed': t('providerNotificationDropdown.orderConfirmed'),
      'Client on the way': t('providerNotificationDropdown.clientOnWay'),
      'Client on way': t('providerNotificationDropdown.clientOnWay'),
      'Client arrived': t('providerNotificationDropdown.clientArrived'),
      'Service in progress': t('providerNotificationDropdown.serviceInProgress'),
      'Service completed': t('providerNotificationDropdown.serviceCompleted'),
      'Order cancelled': t('providerNotificationDropdown.orderCancelled'),
      'Order canceled': t('providerNotificationDropdown.orderCancelled'),
      'Order cancelled by client': t('providerNotificationDropdown.orderCancelledByClient'),
      'Order canceled by client': t('providerNotificationDropdown.orderCancelledByClient'),
      'Order cancelled - Compensation': t('providerNotificationDropdown.orderCancelledWithCompensation'),
      'Order canceled - Compensation': t('providerNotificationDropdown.orderCancelledWithCompensation'),
      'New message': t('providerNotificationDropdown.newMessage'),
      'Payment received': t('providerNotificationDropdown.paymentReceived'),
      'Review received': t('providerNotificationDropdown.reviewReceived'),
      'New review': t('providerNotificationDropdown.reviewReceived'),
      'Missed order': t('providerNotificationDropdown.missedOrder'),
    };
    // Log pour debug
    if (!titleMap[title]) {
      console.log('ProviderNotificationDropdown: Unknown title:', title);
    }
    return titleMap[title] || null; // null = utiliser TranslatedText
  };

  // Traduire le message de notification (patterns connus)
  const translateNotificationMessage = (message) => {
    if (!message) return message;

    // Pattern: nouvelle commande/réservation pour X est disponible (FR)
    if (message.includes('nouvelle commande pour') || message.includes('Une nouvelle commande pour') ||
        message.includes('nouvelle réservation') || message.includes('nouvelle reservation')) {
      const match = message.match(/(?:nouvelle|Une nouvelle) (?:commande|réservation|reservation) pour (.+?) est disponible/i);
      if (match) {
        return t('providerNotificationDropdown.newOrderMsg', { service: match[1] });
      }
      // Pattern alternatif: Vous avez une nouvelle réservation
      if (message.includes('Vous avez une nouvelle')) {
        return t('providerNotificationDropdown.newBookingMsg');
      }
    }

    // Pattern: new order/booking for X is available (EN)
    if (message.includes('new order for') || message.includes('New order for') ||
        message.includes('new booking for') || message.includes('New booking for')) {
      const match = message.match(/[Nn]ew (?:order|booking) for (.+?) is available/i);
      if (match) {
        return t('providerNotificationDropdown.newOrderMsg', { service: match[1] });
      }
    }

    // Pattern: You have a new booking (EN)
    if (message.includes('You have a new booking') || message.includes('You have a new order')) {
      return t('providerNotificationDropdown.newBookingMsg');
    }

    // Pattern: commande confirmée (FR)
    if (message.includes('a été confirmée') || message.includes('a ete confirmee') ||
        message.includes('client a confirmé') || message.includes('client a confirme')) {
      const orderNum = message.match(/#(\d+)/)?.[1];
      return t('providerNotificationDropdown.orderConfirmedMsg', { orderNum: orderNum || '' });
    }

    // Pattern: order confirmed (EN)
    if (message.includes('has been confirmed') || message.includes('client confirmed') ||
        message.includes('The client confirmed')) {
      const orderNum = message.match(/#(\d+)/)?.[1];
      return t('providerNotificationDropdown.orderConfirmedMsg', { orderNum: orderNum || '' });
    }

    // Pattern: client en route (FR)
    if (message.includes('client est en route') || message.includes('Le client est en route')) {
      return t('providerNotificationDropdown.clientOnWayMsg');
    }

    // Pattern: client on the way (EN)
    if (message.includes('client is on the way') || message.includes('The client is on the way') ||
        message.includes('client is on their way')) {
      return t('providerNotificationDropdown.clientOnWayMsg');
    }

    // Pattern: client arrivé (FR)
    if (message.includes('client est arrivé') || message.includes('client est arrive') || message.includes('Le client est arrivé')) {
      return t('providerNotificationDropdown.clientArrivedMsg');
    }

    // Pattern: client arrived (EN)
    if (message.includes('client has arrived') || message.includes('The client has arrived') ||
        message.includes('client arrived')) {
      return t('providerNotificationDropdown.clientArrivedMsg');
    }

    // Pattern: prestation terminée (FR)
    if (message.includes('marquée comme terminée') || message.includes('marquee comme terminee')) {
      const orderNum = message.match(/#(\d+)/)?.[1];
      return t('providerNotificationDropdown.serviceCompletedMsg', { orderNum: orderNum || '' });
    }

    // Pattern: service completed (EN)
    if (message.includes('marked as completed') || message.includes('has been completed')) {
      const orderNum = message.match(/#(\d+)/)?.[1];
      return t('providerNotificationDropdown.serviceCompletedMsg', { orderNum: orderNum || '' });
    }

    // Pattern: paiement reçu (FR)
    if (message.includes('reçu un paiement') || message.includes('recu un paiement')) {
      const amount = message.match(/(\d+)\s*MAD/)?.[1];
      const orderNum = message.match(/#(\d+)/)?.[1];
      return t('providerNotificationDropdown.paymentReceivedMsg', { amount: amount || '', orderNum: orderNum || '' });
    }

    // Pattern: payment received (EN)
    if (message.includes('received a payment') || message.includes('Payment of')) {
      const amount = message.match(/(\d+)\s*MAD/)?.[1];
      const orderNum = message.match(/#(\d+)/)?.[1];
      return t('providerNotificationDropdown.paymentReceivedMsg', { amount: amount || '', orderNum: orderNum || '' });
    }

    // Pattern: étoiles/évaluation (FR) - multiple formats
    if (message.includes('étoile') || message.includes('etoile')) {
      // Pattern: "Vous avez recu 4/5 etoiles"
      const slashMatch = message.match(/(\d+)\/5\s*(?:étoile|etoile)/i);
      if (slashMatch) {
        return t('providerNotificationDropdown.reviewReceivedMsg', { stars: slashMatch[1] });
      }
      // Pattern: "a donné X étoiles"
      const starsMatch = message.match(/(\d+)\s*(?:étoile|etoile)/i);
      if (starsMatch) {
        return t('providerNotificationDropdown.reviewReceivedMsg', { stars: starsMatch[1] });
      }
    }

    // Pattern: stars/review (EN)
    if (message.includes('star') || message.includes('rating')) {
      // Pattern: "You received 4/5 stars"
      const slashMatch = message.match(/(\d+)\/5\s*star/i);
      if (slashMatch) {
        return t('providerNotificationDropdown.reviewReceivedMsg', { stars: slashMatch[1] });
      }
      // Pattern: "gave you X stars"
      const starsMatch = message.match(/(\d+)\s*star/i);
      if (starsMatch) {
        return t('providerNotificationDropdown.reviewReceivedMsg', { stars: starsMatch[1] });
      }
    }

    // Pattern: commande manquée (FR)
    if (message.includes("n'avez pas répondu") || message.includes("n'avez pas repondu") ||
        message.includes('pas répondu') || message.includes('pas repondu') ||
        message.includes('commande manquée') || message.includes('commande manquee')) {
      return t('providerNotificationDropdown.missedOrderMsg');
    }

    // Pattern: missed order (EN)
    if (message.includes("didn't respond") || message.includes('did not respond') ||
        message.includes('missed order') || message.includes('order expired')) {
      return t('providerNotificationDropdown.missedOrderMsg');
    }

    // Log pour debug
    console.log('ProviderNotificationDropdown: Unknown message:', message);
    return null; // null = utiliser TranslatedText
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
          <span className={styles.badge}>{unreadCount > 99 ? toArabicNumerals(99) + '+' : toArabicNumerals(unreadCount)}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className={styles.dropdownHeader}>
            <h3>{t('providerNotifications.title')}</h3>
            {unreadCount > 0 && (
              <button
                className={styles.markAllRead}
                onClick={handleMarkAllAsRead}
              >
                {t('providerNotifications.markAllRead')}
              </button>
            )}
          </div>

          <div className={styles.dropdownContent}>
            {loading ? (
              <div className={styles.loading}>{t('common.loading')}</div>
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>{t('providerNotifications.noNotifications')}</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''} ${notification.notification_type === 'order_cancelled' ? styles.clickable : ''}`}
                  onClick={() => {
                    if (!notification.is_read) handleMarkAsRead(notification.id);
                    // Ouvrir le modal pour les annulations avec données
                    if (notification.notification_type === 'order_cancelled' && notification.data) {
                      const data = typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data;
                      setCancellationModal({ show: true, data: { ...data, notification } });
                      setIsOpen(false);
                    }
                  }}
                >
                  <span className={styles.icon}>
                    {getNotificationIcon(notification.notification_type)}
                  </span>
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationTitle}>
                      {translateNotificationTitle(notification.title) || (
                        isRTL ? <TranslatedText text={notification.title} /> : notification.title
                      )}
                    </div>
                    <div className={styles.notificationMessage}>
                      {translateNotificationMessage(notification.message) || (
                        isRTL ? <TranslatedText text={notification.message} /> : notification.message
                      )}
                    </div>
                    <div className={styles.notificationTime}>
                      {formatDate(notification.created_at)}
                    </div>
                  </div>
                  {notification.notification_type === 'order_cancelled' && (
                    <span className={styles.detailsArrow}>›</span>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className={styles.dropdownFooter}>
              <Link href="/provider/notifications" onClick={() => setIsOpen(false)}>
                {t('notificationDropdown.viewAll')}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Modal de détails d'annulation */}
      {cancellationModal.show && cancellationModal.data && (
        <div className={styles.modalOverlay} onClick={() => setCancellationModal({ show: false, data: null })}>
          <div className={styles.cancellationModal} onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className={styles.modalHeader}>
              <h3>❌ {t('providerNotificationDropdown.cancellationDetails') || 'Détails de l\'annulation'}</h3>
              <button
                className={styles.closeModal}
                onClick={() => setCancellationModal({ show: false, data: null })}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Informations de la commande */}
              <div className={styles.infoSection}>
                <h4>📋 {t('providerNotificationDropdown.orderInfo') || 'Informations de la commande'}</h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>{t('providerNotificationDropdown.service') || 'Service'}</span>
                    <span className={styles.value}>{cancellationModal.data.service_name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>{t('providerNotificationDropdown.client') || 'Client'}</span>
                    <span className={styles.value}>{cancellationModal.data.client_name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>{t('providerNotificationDropdown.scheduledDate') || 'Date prévue'}</span>
                    <span className={styles.value}>
                      {cancellationModal.data.scheduled_at
                        ? new Date(cancellationModal.data.scheduled_at).toLocaleString(locale)
                        : t('providerNotificationDropdown.notScheduled') || 'Non planifiée'}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>{t('providerNotificationDropdown.orderTotal') || 'Total commande'}</span>
                    <span className={styles.value}>{toArabicNumerals(cancellationModal.data.order_total || 0)} MAD</span>
                  </div>
                </div>
              </div>

              {/* Motif d'annulation */}
              <div className={styles.infoSection}>
                <h4>❓ {t('providerNotificationDropdown.cancellationReason') || 'Motif d\'annulation'}</h4>
                <div className={styles.reasonBox}>
                  {cancellationModal.data.cancellation_reason_text || cancellationModal.data.cancellation_reason || 'Non spécifié'}
                </div>
              </div>

              {/* Détails financiers */}
              <div className={styles.infoSection}>
                <h4>💰 {t('providerNotificationDropdown.financialDetails') || 'Détails financiers'}</h4>
                <div className={styles.financialBox}>
                  {cancellationModal.data.cancellation_fee > 0 ? (
                    <>
                      <div className={styles.financialRow}>
                        <span>{t('providerNotificationDropdown.clientFee') || 'Frais client'}</span>
                        <span>{toArabicNumerals(cancellationModal.data.cancellation_fee)} MAD ({toArabicNumerals(cancellationModal.data.cancellation_fee_percentage)}%)</span>
                      </div>

                      {cancellationModal.data.distance_traveled && (
                        <div className={styles.financialRow}>
                          <span>{t('providerNotificationDropdown.distanceTraveled') || 'Distance parcourue'}</span>
                          <span>{toArabicNumerals(cancellationModal.data.distance_traveled?.toFixed(1) || 0)} km</span>
                        </div>
                      )}

                      {cancellationModal.data.travel_compensation > 0 && (
                        <div className={styles.financialRow}>
                          <span>{t('providerNotificationDropdown.travelCompensation') || 'Indemnité déplacement'}</span>
                          <span>+{toArabicNumerals(cancellationModal.data.travel_compensation)} MAD</span>
                        </div>
                      )}

                      <div className={styles.financialRow}>
                        <span>{t('providerNotificationDropdown.baseCompensation') || 'Indemnité de base (80%)'}</span>
                        <span>{toArabicNumerals(cancellationModal.data.provider_compensation)} MAD</span>
                      </div>

                      <div className={`${styles.financialRow} ${styles.totalRow}`}>
                        <span><strong>{t('providerNotificationDropdown.yourCompensation') || 'Votre indemnisation totale'}</strong></span>
                        <span className={styles.compensationAmount}>
                          {toArabicNumerals(cancellationModal.data.total_provider_compensation)} MAD
                        </span>
                      </div>

                      <div className={styles.compensationNote}>
                        ℹ️ {t('providerNotificationDropdown.compensationNote') || 'Cette indemnisation sera ajoutée à votre prochain paiement.'}
                      </div>
                    </>
                  ) : (
                    <div className={styles.noFeeMessage}>
                      <span className={styles.noFeeIcon}>ℹ️</span>
                      <span>{t('providerNotificationDropdown.noFeeApplied') || 'Annulation sans frais - Pas d\'indemnisation'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statut avant annulation */}
              {cancellationModal.data.order_status_before && (
                <div className={styles.statusInfo}>
                  <span className={styles.statusLabel}>{t('providerNotificationDropdown.statusBeforeCancel') || 'Statut avant annulation'}:</span>
                  <span className={`${styles.statusBadge} ${styles[cancellationModal.data.order_status_before]}`}>
                    {cancellationModal.data.order_status_before === 'pending' && (t('status.pending') || 'En attente')}
                    {cancellationModal.data.order_status_before === 'accepted' && (t('status.accepted') || 'Acceptée')}
                    {cancellationModal.data.order_status_before === 'on_way' && (t('status.on_way') || 'En route')}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.closeButton}
                onClick={() => setCancellationModal({ show: false, data: null })}
              >
                {t('common.close') || 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
