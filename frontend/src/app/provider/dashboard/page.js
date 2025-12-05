'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import ProviderNotificationDropdown from '@/components/ProviderNotificationDropdown';
import UnreadBadge from '@/components/UnreadBadge';
import { fixEncoding } from '@/lib/textUtils';
import Chat from '@/components/Chat';
import LiveLocationTracker from '@/components/LiveLocationTracker';
import WelcomePopupProvider from '@/components/WelcomePopup/WelcomePopupProvider';
import EmergencyButtonProvider from '@/components/EmergencyButtonProvider';
import ProviderPriorityBadge from '@/components/ProviderPriorityBadge';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function ProviderDashboardPage() {
  const router = useRouter();
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
        setError('Erreur lors du chargement des commandes');
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
        showToast('Commande acceptée avec succès !', 'success');
        fetchOrders();
      } else {
        showToast(response.message || 'Erreur lors de l\'acceptation', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erreur lors de l\'acceptation', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`accept_${orderId}`]: false }));
    }
  };

  const handleStartOrder = async (orderId) => {
    setActionLoading(prev => ({ ...prev, [`start_${orderId}`]: true }));
    try {
      const response = await apiClient.startProviderOrder(orderId);
      if (response.success) {
        showToast('Vous êtes maintenant en route !', 'success');
        fetchOrders();
      } else {
        showToast(response.message || 'Erreur lors du démarrage', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erreur lors du démarrage', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`start_${orderId}`]: false }));
    }
  };

  const handleBeginOrder = async (orderId) => {
    setActionLoading(prev => ({ ...prev, [`begin_${orderId}`]: true }));
    try {
      const response = await apiClient.beginProviderOrder(orderId);
      if (response.success) {
        showToast('Prestation démarrée !', 'success');
        fetchOrders();
      } else {
        showToast(response.message || 'Erreur lors du démarrage de la prestation', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erreur lors du démarrage de la prestation', 'error');
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
        showToast('Prestation signalée comme terminée ! Le client va recevoir une demande d\'évaluation.', 'success');
      } else {
        showToast(response.message || 'Erreur lors de la complétion', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erreur lors de la complétion', 'error');
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
    if (!order?.scheduled_at) return { fee: 0, level: 'free', message: 'Annulation gratuite' };

    const now = new Date();
    const scheduledTime = new Date(order.scheduled_at);
    const hoursUntilService = (scheduledTime - now) / (1000 * 60 * 60);

    if (hoursUntilService > 2) {
      return { fee: 0, level: 'free', message: 'Annulation gratuite (plus de 2h avant le RDV)' };
    } else if (hoursUntilService > 1) {
      return { fee: 20, level: 'warning', message: 'Frais de 20 MAD (1-2h avant le RDV)' };
    } else if (hoursUntilService > 0) {
      return { fee: 50, level: 'danger', message: 'Frais de 50 MAD (moins d\'1h avant le RDV)' };
    } else {
      return { fee: 100, level: 'critical', message: 'Frais de 100 MAD (No-Show)' };
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelModal.order) return;
    if (!cancelReason.trim()) {
      showToast('Veuillez sélectionner une raison d\'annulation', 'warning');
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
            ? `Commande annulée. Des frais de ${fee} MAD seront prélevés.`
            : 'Commande annulée. Le client sera notifié et nous rechercherons un prestataire de remplacement.',
          fee > 0 ? 'warning' : 'success'
        );
      } else {
        showToast(response.message || 'Erreur lors de l\'annulation', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erreur lors de l\'annulation', 'error');
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
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
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
        setError(response.message || 'Erreur lors du changement de statut');
      }
    } catch (err) {
      console.error('Toggle availability error:', err);
      setError('Erreur lors du changement de statut');
    } finally {
      setTogglingAvailability(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      accepted: 'Acceptee',
      on_way: 'En route',
      in_progress: 'En cours',
      completed_pending_review: 'En attente evaluation',
      completed: 'Terminee',
      cancelled: 'Annulee'
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
        <p>Chargement...</p>
      </div>
    );
  }

  if (!provider) {
    return null;
  }

  return (
    <div className={styles.dashboardPage}>
      <WelcomePopupProvider />
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/provider/dashboard" className={styles.logo}>
            <span>GlamGo</span>
            <span className={styles.providerBadge}>Prestataire</span>
          </Link>

          <div className={styles.headerActions}>
            <LanguageSwitcher compact />
            <div className={styles.messagesIcon} title="Messages non lus">
              <UnreadBadge />
            </div>
            <ProviderNotificationDropdown />
            <div className={styles.providerInfo}>
              <Link href="/provider/profile" className={styles.profileLink}>
                {provider.first_name} {provider.last_name}
              </Link>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Déconnexion
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
                <h1>Bonjour, {provider.first_name} !</h1>
                <p>Gérez vos commandes et suivez votre activité</p>
              </div>
              <div className={styles.headerControls}>
                <ProviderPriorityBadge provider={provider} showDetails={true} />
                <div className={styles.availabilityToggle}>
                  <span className={styles.availabilityLabel}>
                    {provider.is_available ? '🟢 Disponible' : '🔴 Indisponible'}
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
                ⚠️ Vous êtes actuellement <strong>indisponible</strong>. Les clients ne peuvent pas vous voir dans les recherches.
                Activez votre disponibilité pour recevoir des commandes.
              </div>
            )}
          </div>

          <div className={styles.quickActions}>
            <Link href="/provider/services" className={styles.quickActionCard}>
              <div className={styles.quickActionIcon}>📋</div>
              <div className={styles.quickActionContent}>
                <h3>Mes Services</h3>
                <p>Gérez vos services et tarifs</p>
              </div>
            </Link>
            <Link href="/provider/profile" className={styles.quickActionCard}>
              <div className={styles.quickActionIcon}>👤</div>
              <div className={styles.quickActionContent}>
                <h3>Mon Profil</h3>
                <p>Modifiez vos informations</p>
              </div>
            </Link>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {orders.filter(o => o.status === 'pending' && !o.provider_id).length}
              </div>
              <div className={styles.statLabel}>Commandes disponibles</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {orders.filter(o => ['accepted', 'on_way', 'in_progress'].includes(o.status)).length}
              </div>
              <div className={styles.statLabel}>Commandes en cours</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {orders.filter(o => o.status === 'completed').length}
              </div>
              <div className={styles.statLabel}>Commandes terminées</div>
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
              <div className={styles.statLabel}>Vos gains (80%)</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {provider.rating ? parseFloat(provider.rating).toFixed(1) : '0.0'}
              </div>
              <div className={styles.statLabel}>Note moyenne</div>
            </div>
          </div>

          <div className={styles.ordersSection}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'available' ? styles.active : ''}`}
                onClick={() => setActiveTab('available')}
              >
                Disponibles
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'active' ? styles.active : ''}`}
                onClick={() => setActiveTab('active')}
              >
                En cours
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'completed' ? styles.active : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                Terminées
              </button>
            </div>

            <div className={styles.ordersList}>
              {ordersLoading ? (
                <div className={styles.ordersLoading}>Chargement...</div>
              ) : filteredOrders.length === 0 ? (
                <div className={styles.noOrders}>
                  {activeTab === 'available' && 'Aucune commande disponible pour le moment'}
                  {activeTab === 'active' && 'Aucune commande en cours'}
                  {activeTab === 'completed' && 'Aucune commande terminée'}
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <span className={styles.orderId}>Commande #{order.id}</span>
                      <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className={styles.orderDetails}>
                      <div className={styles.serviceName}>
                        {fixEncoding(order.service_name || 'Service')}
                      </div>
                      <div className={styles.orderInfo}>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Client:</span>
                          <span>{order.user_name || 'Client'}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Date prévue:</span>
                          <span>{formatDate(order.scheduled_at)}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Adresse:</span>
                          <span>{order.address_line || 'Non spécifiée'}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Total client:</span>
                          <span className={styles.price}>
                            {(order.total || order.price) ? parseFloat(order.total || order.price).toFixed(0) : '0'} MAD
                          </span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Vos gains (80%):</span>
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
                          <strong>Notes:</strong> {order.notes}
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
                          {actionLoading[`accept_${order.id}`] ? 'Acceptation...' : 'Accepter'}
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
                            {actionLoading[`start_${order.id}`] ? 'Démarrage...' : 'En route'}
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
                            Je ne peux pas assurer
                          </Button>
                        </>
                      )}
                      {order.status === 'on_way' && (
                        <>
                          <div className={styles.waitingClient}>
                            ⏳ En attente de confirmation client
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
                            Je ne peux pas assurer
                          </Button>
                        </>
                      )}
                      {order.status === 'in_progress' && (
                        <>
                          <div className={styles.inProgressStatus}>
                            &#128295; Prestation en cours
                          </div>
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => openCompleteModal(order)}
                          >
                            Marquer comme termine
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
                            <strong>En attente d evaluation</strong>
                            <p>Le client doit evaluer le service pour finaliser la commande</p>
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
              <h3>Chat - Commande #{selectedOrderForChat.id}</h3>
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
              <h3>Terminer la commande</h3>
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
                  Commande #{completeModal.order.id}
                </p>
                <p className={styles.serviceName}>
                  {fixEncoding(completeModal.order.service_name || 'Service')}
                </p>
                <p className={styles.clientName}>
                  Client: {completeModal.order.user_name || 'Client'}
                </p>
                <p className={styles.orderTotal}>
                  Total: {(completeModal.order.total || completeModal.order.price) ? parseFloat(completeModal.order.total || completeModal.order.price).toFixed(0) : '0'} MAD
                </p>
                <p className={styles.orderEarnings}>
                  Vos gains (80%): {(completeModal.order.total || completeModal.order.price) ? (parseFloat(completeModal.order.total || completeModal.order.price) * 0.8).toFixed(0) : '0'} MAD
                </p>
              </div>

              <div className={styles.confirmMessage}>
                <div className={styles.checkIcon}>✓</div>
                <p>Êtes-vous sûr d'avoir terminé ce service ?</p>
                <p className={styles.confirmHint}>
                  Le client sera notifié et pourra laisser un avis.
                </p>
              </div>

              <div className={styles.noteSection}>
                <label htmlFor="completeNote">Note (optionnelle) :</label>
                <textarea
                  id="completeNote"
                  className={styles.noteInput}
                  value={completeNote}
                  onChange={(e) => setCompleteNote(e.target.value)}
                  placeholder="Ajoutez une note sur le service effectué..."
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
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleCompleteOrder}
                disabled={completing}
              >
                {completing ? 'En cours...' : 'Confirmer'}
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
              <h3>Je ne peux pas assurer cette prestation</h3>
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
                  Commande #{cancelModal.order.id}
                </p>
                <p className={styles.serviceName}>
                  {fixEncoding(cancelModal.order.service_name || 'Service')}
                </p>
                <p className={styles.clientName}>
                  Client: {cancelModal.order.user_name || 'Client'}
                </p>
                <p className={styles.scheduledAt}>
                  Prévu: {formatDate(cancelModal.order.scheduled_at)}
                </p>
              </div>

              {/* Affichage des frais d'annulation */}
              {(() => {
                const { fee, level, message } = calculateCancellationFee(cancelModal.order);
                return (
                  <div className={`${styles.cancellationFee} ${styles[level]}`}>
                    <div className={styles.feeIcon}>
                      {level === 'free' ? '✅' : level === 'warning' ? '⚠️' : '🚨'}
                    </div>
                    <div className={styles.feeInfo}>
                      <strong>{message}</strong>
                      {fee > 0 && (
                        <p>Ces frais seront prélevés sur votre solde prestataire.</p>
                      )}
                      {fee === 0 && (
                        <p>Merci de prévenir à l'avance ! Aucun frais ne sera appliqué.</p>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className={styles.reasonSection}>
                <label>Raison de l'annulation <span className={styles.required}>*</span></label>
                <select
                  className={styles.reasonSelect}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                >
                  <option value="">Sélectionnez une raison</option>
                  <option value="urgence_personnelle">Urgence personnelle</option>
                  <option value="probleme_sante">Problème de santé</option>
                  <option value="probleme_transport">Problème de transport</option>
                  <option value="conflit_horaire">Conflit d'horaire</option>
                  <option value="autre">Autre raison</option>
                </select>
              </div>

              <div className={styles.warningMessage}>
                <p>⚠️ Le client sera immédiatement notifié et nous rechercherons un prestataire de remplacement.</p>
              </div>
            </div>

            <div className={styles.cancelModalFooter}>
              <Button
                variant="outline"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                Retour
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelOrder}
                disabled={cancelling || !cancelReason}
              >
                {cancelling ? 'Annulation...' : 'Confirmer l\'annulation'}
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
            showToast('Signalement envoye. Notre equipe vous contactera rapidement.', 'success');
          }}
        />
      ))}
    </div>
  );
}
