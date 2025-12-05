'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import Chat from '@/components/Chat';
import Price from '@/components/Price';

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
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

  // Fonction pour afficher un toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchOrders();

      // Démarrer le polling automatique toutes les 5 secondes
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      pollingIntervalRef.current = setInterval(() => {
        fetchOrders(true); // silent = true pour éviter le clignotement
      }, 5000);
    }

    // Nettoyage : arrêter le polling quand le composant est démonté ou le filtre change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [user, filter]);

  const fetchOrders = async (silent = false) => {
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
        setOrders(filteredOrders);
      } else {
        setError('Erreur lors du chargement des commandes');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des commandes');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      accepted: 'Acceptee',
      on_way: 'En route',
      in_progress: 'En cours',
      completed_pending_review: 'A evaluer',
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Non planifiée';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        showToast('Commande annulée avec succès', 'success');
        fetchOrders();
      } else {
        showToast(response.message || 'Erreur lors de l\'annulation', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erreur lors de l\'annulation', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`cancel_${orderId}`]: false }));
    }
  };

  if (authLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.ordersPage}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Mes Commandes</h1>
          <p className={styles.subtitle}>Gérez et suivez vos réservations</p>
        </div>

        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            Toutes
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}
            onClick={() => setFilter('pending')}
          >
            En attente
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'in_progress' ? styles.active : ''}`}
            onClick={() => setFilter('in_progress')}
          >
            En cours
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'completed_pending_review' ? styles.active : ''}`}
            onClick={() => setFilter('completed_pending_review')}
          >
            À évaluer
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'completed' ? styles.active : ''}`}
            onClick={() => setFilter('completed')}
          >
            Terminées
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'cancelled' ? styles.active : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Annulées
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Chargement des commandes...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📦</div>
            <h3>Aucune commande</h3>
            <p>Vous n'avez pas encore passé de commande.</p>
            <Link href="/services">
              <Button variant="primary">Découvrir nos services</Button>
            </Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderHeaderLeft}>
                    <span className={styles.orderId}>Commande #{order.id}</span>
                    {order.pricing_mode === 'bidding' && (
                      <span className={styles.biddingBadge}>🎯 Mode enchères</span>
                    )}
                  </div>
                  <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className={styles.orderContent}>
                  <div className={styles.serviceInfo}>
                    <h3 className={styles.serviceName}>{order.service_name || 'Service'}</h3>
                    <p className={styles.categoryName}>{order.category_name || ''}</p>
                  </div>

                  <div className={styles.orderDetails}>
                    {order.pricing_mode === 'bidding' ? (
                      <>
                        <div className={styles.detail}>
                          <span className={styles.detailLabel}>Votre prix proposé</span>
                          <span className={styles.detailValue}>
                            <Price amount={order.user_proposed_price} />
                          </span>
                        </div>
                        {order.bid_expiry_time && (
                          <div className={styles.detail}>
                            <span className={styles.detailLabel}>Expiration enchères</span>
                            <span className={styles.detailValue}>{formatDate(order.bid_expiry_time)}</span>
                          </div>
                        )}
                        {order.bids_count !== undefined && (
                          <div className={styles.detail}>
                            <span className={styles.detailLabel}>Offres reçues</span>
                            <span className={styles.detailValue}>
                              {order.bids_count > 0 ? (
                                <strong style={{color: '#28a745'}}>{order.bids_count} offre{order.bids_count > 1 ? 's' : ''}</strong>
                              ) : (
                                <span style={{color: '#6c757d'}}>Aucune offre</span>
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className={styles.detail}>
                          <span className={styles.detailLabel}>Date prévue</span>
                          <span className={styles.detailValue}>{formatDate(order.scheduled_at)}</span>
                        </div>
                        <div className={styles.detail}>
                          <span className={styles.detailLabel}>Prix</span>
                          <span className={styles.detailValue}>
                            <Price amount={order.total || order.price} />
                          </span>
                        </div>
                      </>
                    )}
                    {order.provider_name && (
                      <div className={styles.detail}>
                        <span className={styles.detailLabel}>Prestataire</span>
                        <span className={styles.detailValue}>{order.provider_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.orderActions}>
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" size="small">
                      {order.pricing_mode === 'bidding' && order.bids_count > 0 ? '💰 Voir les offres' : 'Voir détails'}
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
                        ⭐ Évaluer maintenant
                      </Button>
                    </Link>
                  )}
                  {order.status === 'completed' && (
                    <span className={styles.reviewedBadge}>✓ Terminée</span>
                  )}
                  {(order.status === 'pending' || order.status === 'accepted') && (
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => openCancelModal(order.id)}
                      disabled={actionLoading[`cancel_${order.id}`]}
                    >
                      {actionLoading[`cancel_${order.id}`] ? 'Annulation...' : 'Annuler'}
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
              <h3>Chat - Commande #{selectedOrderForChat.id}</h3>
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
              <h2>Annuler la commande</h2>
            </div>
            <div className={styles.modalBody}>
              <p>Êtes-vous sûr de vouloir annuler cette commande ?</p>
              <p className={styles.modalHint}>Cette action est irréversible.</p>
            </div>
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={closeCancelModal}>
                Non, garder
              </Button>
              <Button variant="danger" onClick={handleCancelOrder}>
                Oui, annuler
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
    </div>
  );
}
