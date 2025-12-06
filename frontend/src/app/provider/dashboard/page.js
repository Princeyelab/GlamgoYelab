'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import ProviderNotificationDropdown from '@/components/ProviderNotificationDropdown';
import UnreadBadge from '@/components/UnreadBadge';
import { fixEncoding } from '@/lib/textUtils';
import Chat from '@/components/Chat';
import TranslatedText from '@/components/TranslatedText';
import LiveLocationTracker from '@/components/LiveLocationTracker';
import WelcomePopupProvider from '@/components/WelcomePopup/WelcomePopupProvider';
import EmergencyButtonProvider from '@/components/EmergencyButtonProvider';
import ProviderPriorityBadge from '@/components/ProviderPriorityBadge';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProviderDashboardPage() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const [provider, setProvider] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('available');
  const [selectedOrderForChat, setSelectedOrderForChat] = useState(null);
  const [completeModal, setCompleteModal] = useState({ show: false, order: null });
  const [completeNote, setCompleteNote] = useState('');
  const [completing, setCompleting] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const pollingIntervalRef = useRef(null);

  // État pour le modal d'annulation prestataire
  const [cancelModal, setCancelModal] = useState({ show: false, order: null });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // États pour les actions et les toasts
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    checkAuth();

    // Nettoyage : arrêter le polling quand le composant est démonté
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const checkAuth = async () => {
    // Vérifier provider_token dans localStorage puis sessionStorage
    let token = localStorage.getItem('provider_token');
    let isFromLocalStorage = true;

    // Vérifier sessionStorage si pas dans localStorage
    if (!token) {
      token = sessionStorage.getItem('provider_token');
      isFromLocalStorage = false;
    }

    // Migration : si provider_token n'existe pas mais token existe, copier
    if (!token) {
      const fallbackToken = localStorage.getItem('token');
      if (fallbackToken) {
        localStorage.setItem('provider_token', fallbackToken);
        token = fallbackToken;
        isFromLocalStorage = true;
      }
    }

    if (!token) {
      router.push('/provider/login');
      return;
    }

    // Set the token for API calls - isProvider=true pour prestataire
    // Utiliser isFromLocalStorage pour remember
    apiClient.setToken(token, isFromLocalStorage, true);

    try {
      const response = await apiClient.getProviderProfile();
      if (response.success) {
        setProvider(response.data);
        fetchOrders();

        // Démarrer le polling automatique toutes les 5 secondes
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        pollingIntervalRef.current = setInterval(() => {
          fetchOrders(true); // silent = true pour éviter le clignotement
        }, 5000);
      } else {
        router.push('/provider/login');
      }
    } catch (err) {
      console.error('Auth error:', err);
      router.push('/provider/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (silent = false) => {
    if (!silent) {
      setOrdersLoading(true);
    }
    try {
      const response = await apiClient.getProviderOrders();
      if (response.success) {
        setOrders(response.data || []);
      }
    } catch (err) {
      if (!silent) {
        setError(t('providerDashboard.errorLoadingOrders'));
      }
    } finally {
      if (!silent) {
        setOrdersLoading(false);
      }
    }
  };

  const handleAcceptOrder = async (orderId) => {
    setActionLoading(prev => ({ ...prev, [`accept_${orderId}`]: true }));
    try {
      const response = await apiClient.acceptProviderOrder(orderId);
      if (response.success) {
        showToast(t('providerDashboard.orderAccepted'), 'success');
        fetchOrders();
      } else {
        showToast(response.message || t('providerDashboard.errorAccepting'), 'error');
      }
    } catch (err) {
      showToast(err.message || t('providerDashboard.errorAccepting'), 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`accept_${orderId}`]: false }));
    }
  };

  const handleStartOrder = async (orderId) => {
    setActionLoading(prev => ({ ...prev, [`start_${orderId}`]: true }));
    try {
      const response = await apiClient.startProviderOrder(orderId);
      if (response.success) {
        showToast(t('providerDashboard.onTheWayNow'), 'success');
        fetchOrders();
      } else {
        showToast(response.message || t('providerDashboard.errorStarting'), 'error');
      }
    } catch (err) {
      showToast(err.message || t('providerDashboard.errorStarting'), 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`start_${orderId}`]: false }));
    }
  };

  const handleBeginOrder = async (orderId) => {
    setActionLoading(prev => ({ ...prev, [`begin_${orderId}`]: true }));
    try {
      const response = await apiClient.beginProviderOrder(orderId);
      if (response.success) {
        showToast(t('providerDashboard.serviceStarted'), 'success');
        fetchOrders();
      } else {
        showToast(response.message || t('providerDashboard.errorStartingService'), 'error');
      }
    } catch (err) {
      showToast(err.message || t('providerDashboard.errorStartingService'), 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`begin_${orderId}`]: false }));
    }
  };

  const openCompleteModal = (order) => {
    setCompleteModal({ show: true, order });
    setCompleteNote('');
  };

  const closeCompleteModal = () => {
    setCompleteModal({ show: false, order: null });
    setCompleteNote('');
    setCompleting(false);
  };

  const handleCompleteOrder = async () => {
    if (!completeModal.order) return;

    setCompleting(true);
    const orderId = completeModal.order.id;

    try {
      // Utiliser la nouvelle API qui passe en "completed_pending_review"
      // Le client devra evaluer avant que la commande soit completement terminee
      const response = await apiClient.completeServiceAsProvider(orderId, {
        note: completeNote.trim() || null
      });
      if (response.success) {
        fetchOrders();
        closeCompleteModal();
        showToast(t('providerDashboard.serviceCompletedReview'), 'success');
      } else {
        showToast(response.message || t('providerDashboard.errorCompleting'), 'error');
      }
    } catch (err) {
      showToast(err.message || t('providerDashboard.errorCompleting'), 'error');
    } finally {
      setCompleting(false);
    }
  };

  // ========== Gestion annulation prestataire ==========

  const openCancelModal = (order) => {
    setCancelModal({ show: true, order });
    setCancelReason('');
  };

  const closeCancelModal = () => {
    setCancelModal({ show: false, order: null });
    setCancelReason('');
    setCancelling(false);
  };

  /**
   * Calcule les frais d'annulation selon le délai avant le RDV
   */
  const calculateCancellationFee = (order) => {
    if (!order?.scheduled_at) return { fee: 0, level: 'free', message: t('providerDashboard.cancelFree') };

    const now = new Date();
    const scheduledTime = new Date(order.scheduled_at);
    const hoursUntilService = (scheduledTime - now) / (1000 * 60 * 60);

    if (hoursUntilService > 2) {
      return { fee: 0, level: 'free', message: t('providerDashboard.cancelFreeBefore2h') };
    } else if (hoursUntilService > 1) {
      return { fee: 20, level: 'warning', message: t('providerDashboard.cancelFee1to2h') };
    } else if (hoursUntilService > 0) {
      return { fee: 50, level: 'danger', message: t('providerDashboard.cancelFeeLess1h') };
    } else {
      return { fee: 100, level: 'critical', message: t('providerDashboard.cancelFeeNoShow') };
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelModal.order) return;
    if (!cancelReason.trim()) {
      showToast(t('providerDashboard.selectReasonWarning'), 'warning');
      return;
    }

    setCancelling(true);
    const orderId = cancelModal.order.id;
    const { fee } = calculateCancellationFee(cancelModal.order);

    try {
      const response = await apiClient.cancelOrderAsProvider(orderId, {
        reason: cancelReason,
        cancellation_fee: fee
      });

      if (response.success) {
        fetchOrders();
        closeCancelModal();
        showToast(
          fee > 0
            ? t('providerDashboard.orderCancelledWithFee', { fee })
            : t('providerDashboard.orderCancelledNoFee'),
          fee > 0 ? 'warning' : 'success'
        );
      } else {
        showToast(response.message || t('providerDashboard.errorCancelling'), 'error');
      }
    } catch (err) {
      showToast(err.message || t('providerDashboard.errorCancelling'), 'error');
    } finally {
      setCancelling(false);
    }
  };

  // Fonction pour afficher un toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleLogout = () => {
    // Arrêter le polling avant déconnexion
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    localStorage.removeItem('provider_token');
    apiClient.clearToken();
    router.push('/provider/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('providerDashboard.notDefined');
    const date = new Date(dateString);
    const locale = isRTL ? 'ar-MA' : 'fr-FR';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleAvailability = async () => {
    if (togglingAvailability) return;

    setTogglingAvailability(true);
    try {
      const newStatus = !provider.is_available;
      const response = await apiClient.toggleProviderAvailability(newStatus);

      if (response.success) {
        setProvider(prev => ({ ...prev, is_available: newStatus }));
      } else {
        setError(response.message || t('providerDashboard.errorStatusChange'));
      }
    } catch (err) {
      console.error('Toggle availability error:', err);
      setError(t('providerDashboard.errorStatusChange'));
    } finally {
      setTogglingAvailability(false);
    }
  };

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

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'available') {
      return order.status === 'pending' && !order.provider_id;
    }
    if (activeTab === 'active') {
      // Inclure aussi completed_pending_review car la commande est toujours "active" cote prestataire
      return ['accepted', 'on_way', 'in_progress', 'completed_pending_review'].includes(order.status);
    }
    if (activeTab === 'completed') {
      return order.status === 'completed';
    }
    return true;
  });

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!provider) {
    return null;
  }

  return (
    <div className={styles.dashboardPage} dir={isRTL ? 'rtl' : 'ltr'}>
      <WelcomePopupProvider />
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/provider/dashboard" className={styles.logo}>
            <span>GlamGo</span>
            <span className={styles.providerBadge}>{t('providerDashboard.provider')}</span>
          </Link>

          <div className={styles.headerActions}>
            <LanguageSwitcher compact />
            <div className={styles.messagesIcon} title={t('providerDashboard.unreadMessages')}>
              <UnreadBadge />
            </div>
            <ProviderNotificationDropdown />
            <div className={styles.providerInfo}>
              <Link href="/provider/profile" className={styles.profileLink}>
                {provider.first_name} {provider.last_name}
              </Link>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          <div className={styles.welcomeSection}>
            <div className={styles.welcomeHeader}>
              <div>
                <h1>{t('providerDashboard.hello', { name: provider.first_name })}</h1>
                <p>{t('providerDashboard.manageOrders')}</p>
              </div>
              <div className={styles.headerControls}>
                <ProviderPriorityBadge provider={provider} showDetails={true} />
                <div className={styles.availabilityToggle}>
                  <span className={styles.availabilityLabel}>
                    {provider.is_available ? `🟢 ${t('providerDashboard.available')}` : `🔴 ${t('providerDashboard.unavailable')}`}
                  </span>
                  <button
                    onClick={toggleAvailability}
                    disabled={togglingAvailability}
                    className={`${styles.toggleButton} ${provider.is_available ? styles.toggleActive : styles.toggleInactive}`}
                  >
                    <span className={styles.toggleSlider}></span>
                  </button>
                </div>
              </div>
            </div>
            {!provider.is_available && (
              <div className={styles.availabilityWarning}>
                ⚠️ {t('providerDashboard.unavailableWarning')}
              </div>
            )}
          </div>

          <div className={styles.quickActions}>
            <Link href="/provider/services" className={styles.quickActionCard}>
              <div className={styles.quickActionIcon}>📋</div>
              <div className={styles.quickActionContent}>
                <h3>{t('providerDashboard.myServices')}</h3>
                <p>{t('providerDashboard.manageServicesRates')}</p>
              </div>
            </Link>
            <Link href="/provider/profile" className={styles.quickActionCard}>
              <div className={styles.quickActionIcon}>👤</div>
              <div className={styles.quickActionContent}>
                <h3>{t('providerDashboard.myProfile')}</h3>
                <p>{t('providerDashboard.editInfo')}</p>
              </div>
            </Link>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {orders.filter(o => o.status === 'pending' && !o.provider_id).length}
              </div>
              <div className={styles.statLabel}>{t('providerDashboard.availableOrders')}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {orders.filter(o => ['accepted', 'on_way', 'in_progress'].includes(o.status)).length}
              </div>
              <div className={styles.statLabel}>{t('providerDashboard.activeOrders')}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {orders.filter(o => o.status === 'completed').length}
              </div>
              <div className={styles.statLabel}>{t('providerDashboard.completedOrders')}</div>
            </div>
            <div className={`${styles.statCard} ${styles.earningsCard}`}>
              <div className={styles.statValue}>
                {orders
                  .filter(o => o.status === 'completed')
                  .reduce((sum, o) => {
                    const providerAmount = parseFloat(o.provider_amount);
                    const totalPrice = parseFloat(o.total || o.price || 0);
                    if (providerAmount > 0) return sum + providerAmount;
                    if (totalPrice > 0) return sum + (totalPrice * 0.8);
                    return sum;
                  }, 0)
                  .toFixed(0)} MAD
              </div>
              <div className={styles.statLabel}>{t('providerDashboard.yourEarnings')}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {provider.rating ? parseFloat(provider.rating).toFixed(1) : '0.0'}
              </div>
              <div className={styles.statLabel}>{t('providerDashboard.averageRating')}</div>
            </div>
          </div>

          <div className={styles.ordersSection}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'available' ? styles.active : ''}`}
                onClick={() => setActiveTab('available')}
              >
                {t('providerDashboard.tabAvailable')}
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'active' ? styles.active : ''}`}
                onClick={() => setActiveTab('active')}
              >
                {t('providerDashboard.tabActive')}
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'completed' ? styles.active : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                {t('providerDashboard.tabCompleted')}
              </button>
            </div>

            <div className={styles.ordersList}>
              {ordersLoading ? (
                <div className={styles.ordersLoading}>{t('common.loading')}</div>
              ) : filteredOrders.length === 0 ? (
                <div className={styles.noOrders}>
                  {activeTab === 'available' && t('providerDashboard.noAvailableOrders')}
                  {activeTab === 'active' && t('providerDashboard.noActiveOrders')}
                  {activeTab === 'completed' && t('providerDashboard.noCompletedOrders')}
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <span className={styles.orderId}>{t('providerDashboard.orderNumber', { id: order.id })}</span>
                      <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className={styles.orderDetails}>
                      <TranslatedText as="div" className={styles.serviceName} text={order.service_name} fallback="Service" />
                      <div className={styles.orderInfo}>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>{t('providerDashboard.client')}:</span>
                          <span>{order.user_name || t('providerDashboard.client')}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>{t('providerDashboard.scheduledDate')}:</span>
                          <span>{formatDate(order.scheduled_at)}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>{t('providerDashboard.address')}:</span>
                          <span>{order.address_line || t('providerDashboard.notSpecified')}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>{t('providerDashboard.clientTotal')}:</span>
                          <span className={styles.price}>
                            {(order.total || order.price) ? parseFloat(order.total || order.price).toFixed(0) : '0'} MAD
                          </span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>{t('providerDashboard.yourEarnings')}:</span>
                          <span className={styles.earnings}>
                            {(() => {
                              const providerAmount = parseFloat(order.provider_amount);
                              const totalPrice = parseFloat(order.total || order.price || 0);
                              if (providerAmount > 0) return providerAmount.toFixed(0);
                              if (totalPrice > 0) return (totalPrice * 0.8).toFixed(0);
                              return '0';
                            })()} MAD
                          </span>
                        </div>
                      </div>
                      {order.notes && (
                        <div className={styles.notes}>
                          <strong>{t('providerDashboard.notes')}:</strong> {order.notes}
                        </div>
                      )}
                    </div>

                    {/* LiveLocationTracker pour les commandes en route (seulement si la commande est assignée à ce prestataire) */}
                    {(order.status === 'on_way' || order.status === 'in_progress') && order.provider_id && (
                      <div className={styles.gpsTrackerSection}>
                        <LiveLocationTracker
                          orderId={order.id}
                          autoStart={false}
                          clientAddress={order.address_line}
                          clientLat={order.latitude}
                          clientLng={order.longitude}
                        />
                      </div>
                    )}

                    <div className={styles.orderActions}>
                      {order.status === 'pending' && !order.provider_id && (
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => handleAcceptOrder(order.id)}
                          disabled={actionLoading[`accept_${order.id}`]}
                        >
                          {actionLoading[`accept_${order.id}`] ? t('providerDashboard.accepting') : t('providerDashboard.accept')}
                        </Button>
                      )}
                      {order.status === 'accepted' && (
                        <>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => handleStartOrder(order.id)}
                            disabled={actionLoading[`start_${order.id}`]}
                          >
                            {actionLoading[`start_${order.id}`] ? t('providerDashboard.starting') : t('providerDashboard.onTheWay')}
                          </Button>
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => setSelectedOrderForChat(order)}
                          >
                            Chat
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => openCancelModal(order)}
                            className={styles.cancelBtn}
                          >
                            {t('providerDashboard.cannotProvide')}
                          </Button>
                        </>
                      )}
                      {order.status === 'on_way' && (
                        <>
                          <div className={styles.waitingClient}>
                            ⏳ {t('providerDashboard.waitingClientConfirmation')}
                          </div>
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => setSelectedOrderForChat(order)}
                          >
                            Chat
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => openCancelModal(order)}
                            className={styles.cancelBtn}
                          >
                            {t('providerDashboard.cannotProvide')}
                          </Button>
                        </>
                      )}
                      {order.status === 'in_progress' && (
                        <>
                          <div className={styles.inProgressStatus}>
                            &#128295; {t('providerDashboard.serviceInProgress')}
                          </div>
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => openCompleteModal(order)}
                          >
                            {t('providerDashboard.markAsComplete')}
                          </Button>
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => setSelectedOrderForChat(order)}
                          >
                            Chat
                          </Button>
                        </>
                      )}
                      {order.status === 'completed_pending_review' && (
                        <div className={styles.pendingReviewStatus}>
                          <div className={styles.pendingReviewIcon}>&#11088;</div>
                          <div className={styles.pendingReviewText}>
                            <strong>{t('providerDashboard.pendingReview')}</strong>
                            <p>{t('providerDashboard.clientMustReview')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {selectedOrderForChat && (
        <div className={styles.chatModal}>
          <div className={styles.chatModalContent}>
            <div className={styles.chatModalHeader}>
              <h3>{t('providerDashboard.chatOrder', { id: selectedOrderForChat.id })}</h3>
              <button
                className={styles.closeChat}
                onClick={() => setSelectedOrderForChat(null)}
              >
                ✕
              </button>
            </div>
            <Chat orderId={selectedOrderForChat.id} userType="provider" />
          </div>
        </div>
      )}

      {completeModal.show && completeModal.order && (
        <div className={styles.completeModal}>
          <div className={styles.completeModalContent}>
            <div className={styles.completeModalHeader}>
              <h3>{t('providerDashboard.completeOrder')}</h3>
              <button
                className={styles.closeModal}
                onClick={closeCompleteModal}
                disabled={completing}
              >
                ✕
              </button>
            </div>

            <div className={styles.completeModalBody}>
              <div className={styles.orderSummary}>
                <p className={styles.orderId}>
                  {t('providerDashboard.orderNumber', { id: completeModal.order.id })}
                </p>
                <TranslatedText as="p" className={styles.serviceName} text={completeModal.order.service_name} fallback="Service" />
                <p className={styles.clientName}>
                  {t('providerDashboard.client')}: {completeModal.order.user_name || t('providerDashboard.client')}
                </p>
                <p className={styles.orderTotal}>
                  {t('providerDashboard.total')}: {(completeModal.order.total || completeModal.order.price) ? parseFloat(completeModal.order.total || completeModal.order.price).toFixed(0) : '0'} MAD
                </p>
                <p className={styles.orderEarnings}>
                  {t('providerDashboard.yourEarnings')}: {(completeModal.order.total || completeModal.order.price) ? (parseFloat(completeModal.order.total || completeModal.order.price) * 0.8).toFixed(0) : '0'} MAD
                </p>
              </div>

              <div className={styles.confirmMessage}>
                <div className={styles.checkIcon}>✓</div>
                <p>{t('providerDashboard.confirmComplete')}</p>
                <p className={styles.confirmHint}>
                  {t('providerDashboard.clientWillBeNotified')}
                </p>
              </div>

              <div className={styles.noteSection}>
                <label htmlFor="completeNote">{t('providerDashboard.noteOptional')}:</label>
                <textarea
                  id="completeNote"
                  className={styles.noteInput}
                  value={completeNote}
                  onChange={(e) => setCompleteNote(e.target.value)}
                  placeholder={t('providerDashboard.addNotePlaceholder')}
                  rows={3}
                />
              </div>
            </div>

            <div className={styles.completeModalFooter}>
              <Button
                variant="outline"
                onClick={closeCompleteModal}
                disabled={completing}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleCompleteOrder}
                disabled={completing}
              >
                {completing ? t('providerDashboard.processing') : t('common.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'annulation prestataire */}
      {cancelModal.show && cancelModal.order && (
        <div className={styles.cancelModal}>
          <div className={styles.cancelModalContent}>
            <div className={styles.cancelModalHeader}>
              <h3>{t('providerDashboard.cannotProvideTitle')}</h3>
              <button
                className={styles.closeModal}
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                ✕
              </button>
            </div>

            <div className={styles.cancelModalBody}>
              <div className={styles.orderSummary}>
                <p className={styles.orderId}>
                  {t('providerDashboard.orderNumber', { id: cancelModal.order.id })}
                </p>
                <TranslatedText as="p" className={styles.serviceName} text={cancelModal.order.service_name} fallback="Service" />
                <p className={styles.clientName}>
                  {t('providerDashboard.client')}: {cancelModal.order.user_name || t('providerDashboard.client')}
                </p>
                <p className={styles.scheduledAt}>
                  {t('providerDashboard.scheduled')}: {formatDate(cancelModal.order.scheduled_at)}
                </p>
              </div>

              {/* Affichage des frais d'annulation */}
              {(() => {
                const { fee, level } = calculateCancellationFee(cancelModal.order);
                const message = fee === 0
                  ? t('providerDashboard.cancelFree')
                  : t('providerDashboard.cancelFee', { fee });
                return (
                  <div className={`${styles.cancellationFee} ${styles[level]}`}>
                    <div className={styles.feeIcon}>
                      {level === 'free' ? '✅' : level === 'warning' ? '⚠️' : '🚨'}
                    </div>
                    <div className={styles.feeInfo}>
                      <strong>{message}</strong>
                      {fee > 0 && (
                        <p>{t('providerDashboard.feeDeducted')}</p>
                      )}
                      {fee === 0 && (
                        <p>{t('providerDashboard.noFeeApplied')}</p>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className={styles.reasonSection}>
                <label>{t('providerDashboard.cancelReason')} <span className={styles.required}>*</span></label>
                <select
                  className={styles.reasonSelect}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                >
                  <option value="">{t('providerDashboard.selectReason')}</option>
                  <option value="urgence_personnelle">{t('providerDashboard.personalEmergency')}</option>
                  <option value="probleme_sante">{t('providerDashboard.healthIssue')}</option>
                  <option value="probleme_transport">{t('providerDashboard.transportIssue')}</option>
                  <option value="conflit_horaire">{t('providerDashboard.scheduleConflict')}</option>
                  <option value="autre">{t('providerDashboard.otherReason')}</option>
                </select>
              </div>

              <div className={styles.warningMessage}>
                <p>⚠️ {t('providerDashboard.clientWillBeNotifiedCancel')}</p>
              </div>
            </div>

            <div className={styles.cancelModalFooter}>
              <Button
                variant="outline"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                {t('common.back')}
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelOrder}
                disabled={cancelling || !cancelReason}
              >
                {cancelling ? t('providerDashboard.cancelling') : t('providerDashboard.confirmCancel')}
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

      {/* Bouton d'urgence - visible pendant une prestation active */}
      {orders.filter(o => ['on_way', 'in_progress'].includes(o.status)).map(activeOrder => (
        <EmergencyButtonProvider
          key={`emergency-${activeOrder.id}`}
          orderId={activeOrder.id}
          clientName={activeOrder.user_name}
          onEmergencyReported={(data) => {
            showToast(t('providerDashboard.emergencyReported'), 'success');
          }}
        />
      ))}
    </div>
  );
}
