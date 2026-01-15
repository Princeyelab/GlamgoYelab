'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Chat from '@/components/Chat';
import Price from '@/components/Price';
import TranslatedText from '@/components/TranslatedText';
import RefusedOrderModal from '@/components/RefusedOrderModal/RefusedOrderModal';

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, language, isRTL, toArabicNumerals, locale } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedOrderForChat, setSelectedOrderForChat] = useState(null);
  const pollingIntervalRef = useRef(null);

  // États pour les actions et toasts
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, orderId: null });

  // État pour le modal de commande refusée
  const [refusedModalOpen, setRefusedModalOpen] = useState(false);
  const [refusedOrderData, setRefusedOrderData] = useState(null);
  const lastRefusedCheckRef = useRef(null);

  // Fonction pour afficher un toast
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  }, []);

  // Vérifier les notifications de refus récentes
  const checkRefusedNotifications = useCallback(async () => {
    try {
      const response = await apiClient.getNotifications(10);
      if (response.success && response.data.notifications) {
        // Chercher une notification de refus non lue récente
        const refusedNotif = response.data.notifications.find(n =>
          (n.notification_type === 'order_refused' || n.notification_type === 'order_rejected') &&
          !n.is_read
        );

        if (refusedNotif && refusedNotif.id !== lastRefusedCheckRef.current) {
          lastRefusedCheckRef.current = refusedNotif.id;

          // Parser les données
          const data = refusedNotif.data
            ? (typeof refusedNotif.data === 'string' ? JSON.parse(refusedNotif.data) : refusedNotif.data)
            : {};

          // Afficher le modal
          setRefusedOrderData({
            orderId: refusedNotif.order_id,
            serviceId: data.service_id,
            serviceName: data.service_name || 'Service',
          });
          setRefusedModalOpen(true);

          // Marquer comme lue
          await apiClient.markNotificationAsRead(refusedNotif.id);
        }
      }
    } catch (err) {
      console.error('Error checking refused notifications:', err);
    }
  }, []);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await apiClient.getMyOrders();
      if (response.success) {
        let filteredOrders = response.data || [];
        if (filter !== 'all') {
          filteredOrders = filteredOrders.filter(order => order.status === filter);
        }
        // Éviter les re-renders inutiles en comparant les données
        setOrders(prev => {
          const prevIds = prev.map(o => `${o.id}-${o.status}`).join(',');
          const newIds = filteredOrders.map(o => `${o.id}-${o.status}`).join(',');
          return prevIds === newIds ? prev : filteredOrders;
        });
      } else {
        setError('errorLoading');
      }
    } catch (err) {
      setError(err.message || 'errorLoading');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [filter]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchOrders();
      checkRefusedNotifications(); // Vérifier immédiatement

      // Démarrer le polling automatique toutes les 5 secondes
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      pollingIntervalRef.current = setInterval(() => {
        fetchOrders(true); // silent = true pour éviter le clignotement
        checkRefusedNotifications(); // Vérifier les notifications de refus
      }, 5000);
    }

    // Nettoyage : arrêter le polling quand le composant est démonté ou le filtre change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [user, fetchOrders, checkRefusedNotifications]);

  const getStatusLabel = (status) => {
    const labels = {
      pending: t('status.pending'),
      accepted: t('status.accepted'),
      on_way: t('status.on_way'),
      in_progress: t('status.in_progress'),
      completed_pending_review: t('status.completed_pending_review'),
      completed: t('status.completed'),
      cancelled: t('status.cancelled')
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      pending: styles.statusPending,
      accepted: styles.statusAccepted,
      on_way: styles.statusOnWay,
      in_progress: styles.statusInProgress,
      completed_pending_review: styles.statusPendingReview,
      completed: styles.statusCompleted,
      cancelled: styles.statusCancelled
    };
    return classes[status] || '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('ordersPage.notPlanned');
    const date = new Date(dateString);

    const formatted = date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Appliquer la conversion des chiffres arabes uniquement pour l'arabe
    return language === 'ar' ? toArabicNumerals(formatted) : formatted;
  };

  const openCancelModal = (orderId) => {
    setConfirmModal({ show: true, orderId });
  };

  const closeCancelModal = () => {
    setConfirmModal({ show: false, orderId: null });
  };

  const handleCancelOrder = async () => {
    const orderId = confirmModal.orderId;
    if (!orderId) return;

    setActionLoading(prev => ({ ...prev, [`cancel_${orderId}`]: true }));
    closeCancelModal();

    try {
      const response = await apiClient.cancelOrder(orderId);
      if (response.success) {
        showToast(t('ordersPage.cancelSuccess'), 'success');
        fetchOrders();
      } else {
        showToast(response.message || t('ordersPage.cancelError'), 'error');
      }
    } catch (err) {
      showToast(err.message || t('ordersPage.cancelError'), 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`cancel_${orderId}`]: false }));
    }
  };

  if (authLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.ordersPage} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>{t('ordersPage.title')}</h1>
          <p className={styles.subtitle}>{t('ordersPage.subtitle')}</p>
        </div>

        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('ordersPage.tabs.all')}
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}
            onClick={() => setFilter('pending')}
          >
            {t('ordersPage.tabs.pending')}
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'in_progress' ? styles.active : ''}`}
            onClick={() => setFilter('in_progress')}
          >
            {t('ordersPage.tabs.inProgress')}
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'completed_pending_review' ? styles.active : ''}`}
            onClick={() => setFilter('completed_pending_review')}
          >
            {t('ordersPage.tabs.toEvaluate')}
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'completed' ? styles.active : ''}`}
            onClick={() => setFilter('completed')}
          >
            {t('ordersPage.tabs.completed')}
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'cancelled' ? styles.active : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            {t('ordersPage.tabs.cancelled')}
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            {error === 'errorLoading' ? t('ordersPage.errorLoading') : error}
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>{t('ordersPage.loadingOrders')}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📦</div>
            <h3>{t('ordersPage.noOrders')}</h3>
            <p>{t('ordersPage.noOrdersDesc')}</p>
            <Link href="/services">
              <Button variant="primary">{t('ordersPage.discoverServices')}</Button>
            </Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderHeaderLeft}>
                    <span className={styles.orderId}>{t('ordersPage.orderNumber', { id: toArabicNumerals(order.id) })}</span>
                    {order.pricing_mode === 'bidding' && (
                      <span className={styles.biddingBadge}>🎯 {t('ordersPage.biddingMode')}</span>
                    )}
                  </div>
                  <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className={styles.orderContent}>
                  <div className={styles.serviceInfo}>
                    <TranslatedText as="h3" className={styles.serviceName} text={order.service_name} fallback="Service" />
                    <TranslatedText as="p" className={styles.categoryName} text={order.category_name} fallback="" />
                  </div>

                  <div className={styles.orderDetails}>
                    {order.pricing_mode === 'bidding' ? (
                      <>
                        <div className={styles.detail}>
                          <span className={styles.detailLabel}>{t('ordersPage.yourProposedPrice')}</span>
                          <span className={styles.detailValue}>
                            <Price amount={order.user_proposed_price} />
                          </span>
                        </div>
                        {order.bid_expiry_time && (
                          <div className={styles.detail}>
                            <span className={styles.detailLabel}>{t('ordersPage.biddingExpiry')}</span>
                            <span className={styles.detailValue}>{formatDate(order.bid_expiry_time)}</span>
                          </div>
                        )}
                        {order.bids_count !== undefined && (
                          <div className={styles.detail}>
                            <span className={styles.detailLabel}>{t('ordersPage.offersReceived')}</span>
                            <span className={styles.detailValue}>
                              {order.bids_count > 0 ? (
                                <strong style={{color: '#28a745'}}>{order.bids_count} {order.bids_count > 1 ? t('ordersPage.offers') : t('ordersPage.offer')}</strong>
                              ) : (
                                <span style={{color: '#6c757d'}}>{t('ordersPage.noOffers')}</span>
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className={styles.detail}>
                          <span className={styles.detailLabel}>{t('ordersPage.scheduledDate')}</span>
                          <span className={styles.detailValue}>{formatDate(order.scheduled_at)}</span>
                        </div>
                        <div className={styles.detail}>
                          <span className={styles.detailLabel}>{t('ordersPage.price')}</span>
                          <span className={styles.detailValue}>
                            <Price amount={order.total || order.price} />
                          </span>
                        </div>
                      </>
                    )}
                    {order.provider_name && (
                      <div className={styles.detail}>
                        <span className={styles.detailLabel}>{t('ordersPage.provider')}</span>
                        <span className={styles.detailValue}>{order.provider_name}</span>
                      </div>
                    )}
                    {/* Indicateur de recherche de prestataire après refus */}
                    {order.status === 'pending' && order.refused_count > 0 && (
                      <div className={styles.refusedIndicator}>
                        <span className={styles.searchingIcon}>🔄</span>
                        <span>{t('ordersPage.searchingNewProvider') || 'Recherche d\'un nouveau prestataire...'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.orderActions}>
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" size="small">
                      {order.pricing_mode === 'bidding' && order.bids_count > 0 ? '💰 ' + t('ordersPage.viewOffers') : t('ordersPage.viewDetails')}
                    </Button>
                  </Link>
                  {order.provider_id && ['accepted', 'on_way', 'in_progress'].includes(order.status) && (
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => setSelectedOrderForChat(order)}
                    >
                      💬 Chat
                    </Button>
                  )}
                  {order.status === 'completed_pending_review' && (
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="primary" size="small">
                        ⭐ {t('ordersPage.rateNow')}
                      </Button>
                    </Link>
                  )}
                  {order.status === 'completed' && (
                    <span className={styles.reviewedBadge}>✓ {t('status.completed')}</span>
                  )}
                  {(order.status === 'pending' || order.status === 'accepted') && (
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => openCancelModal(order.id)}
                      disabled={actionLoading[`cancel_${order.id}`]}
                    >
                      {actionLoading[`cancel_${order.id}`] ? t('ordersPage.cancelling') : t('ordersPage.cancel')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOrderForChat && (
        <div className={styles.chatModal}>
          <div className={styles.chatModalContent}>
            <div className={styles.chatModalHeader}>
              <h3>{t('ordersPage.chatOrder', { id: selectedOrderForChat.id })}</h3>
              <button
                className={styles.closeChat}
                onClick={() => setSelectedOrderForChat(null)}
              >
                ✕
              </button>
            </div>
            <Chat orderId={selectedOrderForChat.id} userType="user" />
          </div>
        </div>
      )}

      {/* Modal de confirmation d'annulation */}
      {confirmModal.show && (
        <div className={styles.modalOverlay} onClick={closeCancelModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalIcon}>⚠️</span>
              <h2>{t('ordersPage.cancelOrder')}</h2>
            </div>
            <div className={styles.modalBody}>
              <p>{t('ordersPage.cancelConfirm')}</p>
              <p className={styles.modalHint}>{t('ordersPage.cancelWarning')}</p>
            </div>
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={closeCancelModal}>
                {t('ordersPage.keepOrder')}
              </Button>
              <Button variant="danger" onClick={handleCancelOrder}>
                {t('ordersPage.yesCancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toast.show && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          <span className={styles.toastIcon}>
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'warning' && '⚠'}
          </span>
          <span className={styles.toastMessage}>{toast.message}</span>
          <button
            className={styles.toastClose}
            onClick={() => setToast({ show: false, message: '', type: 'success' })}
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal de commande refusée */}
      <RefusedOrderModal
        isOpen={refusedModalOpen}
        onClose={() => {
          setRefusedModalOpen(false);
          setRefusedOrderData(null);
        }}
        order={refusedOrderData}
        serviceName={refusedOrderData?.serviceName}
        serviceId={refusedOrderData?.serviceId}
      />
    </div>
  );
}
