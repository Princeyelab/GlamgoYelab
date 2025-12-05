'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { getServiceImageUrl } from '@/lib/serviceImages';
import { fixEncoding } from '@/lib/textUtils';
import Chat from '@/components/Chat';
import ProviderLocationMap from '@/components/ProviderLocationMap';
import ClientLocationSharing from '@/components/ClientLocationSharing';
import Price from '@/components/Price';
import SatisfactionModal from '@/components/SatisfactionModal';
import EmergencyButton from '@/components/EmergencyButton';
import { useSatisfactionModal } from '@/hooks/useSatisfactionModal';

const UPLOADS_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bids, setBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [arrivalConfirmed, setArrivalConfirmed] = useState(false);
  const [confirmingArrival, setConfirmingArrival] = useState(false);
  const pollingIntervalRef = useRef(null);

  // États pour les actions et toasts
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAcceptBidModal, setShowAcceptBidModal] = useState({ show: false, bidId: null });

  // Fonction pour afficher un toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Hook pour le modal de satisfaction
  const {
    showModal: showSatisfactionModal,
    setShowModal: setShowSatisfactionModal,
    handleSubmitSuccess: handleSatisfactionSubmit
  } = useSatisfactionModal();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      fetchOrder();

      // Polling automatique toutes les 15 secondes pour détecter les changements de statut
      // (réduit pour éviter les problèmes de scroll)
      pollingIntervalRef.current = setInterval(() => {
        fetchOrder(true); // silent = true pour éviter le clignotement
      }, 15000);
    }

    // Nettoyage : arrêter le polling quand le composant est démonté
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [user, params.id]);

  const fetchOrder = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    // Sauvegarder la position de scroll avant la mise à jour
    const scrollPosition = silent ? window.scrollY : 0;

    try {
      const response = await apiClient.getOrder(params.id);
      if (response.success) {
        setOrder(response.data);
        // Si c'est une commande bidding, charger les offres
        if (response.data.pricing_mode === 'bidding') {
          fetchBids();
        }

        // Restaurer la position de scroll après une mise à jour silencieuse
        if (silent) {
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollPosition);
          });
        }
      } else {
        setError('Commande non trouvée');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement de la commande');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const fetchBids = async () => {
    setLoadingBids(true);
    try {
      const response = await apiClient.getOrderBids(params.id);
      if (response.success) {
        setBids(response.data.bids || []);
      }
    } catch (err) {
      // Erreur silencieuse pour les bids
    } finally {
      setLoadingBids(false);
    }
  };

  const openAcceptBidModal = (bidId) => {
    setShowAcceptBidModal({ show: true, bidId });
  };

  const closeAcceptBidModal = () => {
    setShowAcceptBidModal({ show: false, bidId: null });
  };

  const handleAcceptBid = async () => {
    const bidId = showAcceptBidModal.bidId;
    if (!bidId) return;

    setActionLoading(prev => ({ ...prev, [`bid_${bidId}`]: true }));
    closeAcceptBidModal();

    try {
      const response = await apiClient.acceptBid(bidId);
      if (response.success) {
        showToast('Offre acceptée avec succès !', 'success');
        fetchOrder();
        fetchBids();
      } else {
        showToast(response.message || 'Erreur lors de l\'acceptation', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erreur lors de l\'acceptation', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`bid_${bidId}`]: false }));
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCancelOrder = async () => {
    setActionLoading(prev => ({ ...prev, cancel: true }));
    setShowCancelModal(false);

    try {
      const response = await apiClient.cancelOrder(params.id);
      if (response.success) {
        showToast('Commande annulée avec succès', 'success');
        fetchOrder();
      } else {
        showToast(response.message || 'Erreur lors de l\'annulation', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erreur lors de l\'annulation', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, cancel: false }));
    }
  };

  const handleConfirmArrival = async () => {
    setConfirmingArrival(true);
    try {
      const response = await apiClient.confirmArrival(params.id);
      if (response.success) {
        setShowArrivalModal(false);
        setArrivalConfirmed(true);
        showToast('Arrivée confirmée ! Le prestataire peut maintenant commencer.', 'success');
        // Masquer le message de succès après 5 secondes
        setTimeout(() => setArrivalConfirmed(false), 5000);
        fetchOrder(false);
      } else {
        showToast(response.message || 'Erreur lors de la confirmation', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Erreur lors de la confirmation', 'error');
    } finally {
      setConfirmingArrival(false);
    }
  };

  if (authLoading || loading) {
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

  if (error || !order) {
    return (
      <div className={styles.errorPage}>
        <h2>{error || 'Commande non trouvée'}</h2>
        <Link href="/orders">
          <Button variant="primary">Retour aux commandes</Button>
        </Link>
      </div>
    );
  }

  // Créer un objet service pour l'image
  const serviceForImage = {
    name: order.service_name || 'Service',
    slug: order.service_slug,
    image: order.service_image
  };
  const imageUrl = getServiceImageUrl(serviceForImage, '600x400');

  return (
    <div className={styles.orderDetailPage}>
      <div className="container">
        <Link href="/orders" className={styles.backLink}>
          ← Retour aux commandes
        </Link>

        <div className={styles.orderHeader}>
          <h1 className={styles.title}>Commande #{order.id}</h1>
          <span className={`${styles.status} ${getStatusClass(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        <div className={styles.orderContent}>
          <div className={styles.serviceSection}>
            <img
              src={imageUrl}
              alt={fixEncoding(order.service_name || 'Service')}
              className={styles.serviceImage}
            />
            <div className={styles.serviceInfo}>
              <h2 className={styles.serviceName}>
                {fixEncoding(order.service_name || 'Service')}
              </h2>
              {order.category_name && (
                <span className={styles.categoryName}>
                  {fixEncoding(order.category_name)}
                </span>
              )}
              {order.service_description && (
                <p className={styles.serviceDescription}>
                  {fixEncoding(order.service_description)}
                </p>
              )}
            </div>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailCard}>
              <h3>Informations de réservation</h3>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Date prévue</span>
                <span className={styles.detailValue}>
                  {formatDate(order.scheduled_at)}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Date de création</span>
                <span className={styles.detailValue}>
                  {formatDate(order.created_at)}
                </span>
              </div>
              {order.accepted_at && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Acceptée le</span>
                  <span className={styles.detailValue}>
                    {formatDate(order.accepted_at)}
                  </span>
                </div>
              )}
              {order.completed_at && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Terminée le</span>
                  <span className={styles.detailValue}>
                    {formatDate(order.completed_at)}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.detailCard}>
              <h3>{order.pricing_mode === 'bidding' ? 'Informations enchères' : 'Prix et paiement'}</h3>
              {order.pricing_mode === 'bidding' ? (
                <>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Mode</span>
                    <span className={styles.detailValue}>
                      <span className={styles.biddingBadge}>🎯 Enchères</span>
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Votre prix proposé</span>
                    <span className={styles.detailValue}>
                      <Price amount={order.user_proposed_price} />
                    </span>
                  </div>
                  {order.bid_expiry_time && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Expiration enchères</span>
                      <span className={styles.detailValue}>
                        {formatDate(order.bid_expiry_time)}
                      </span>
                    </div>
                  )}
                  {order.price > 0 && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Prix accepté</span>
                      <span className={`${styles.detailValue} ${styles.totalPrice}`}>
                        <Price amount={order.price} />
                      </span>
                    </div>
                  )}

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Mode de paiement</span>
                    <span className={styles.detailValue}>
                      {order.payment_method === 'card' ? '💳 Carte bancaire' : '💵 Espèces'}
                    </span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Statut paiement</span>
                    <span className={styles.detailValue}>
                      {order.payment_status === 'paid' ? '✅ Payé' :
                       order.payment_status === 'refunded' ? '🔄 Remboursé' : '⏳ En attente'}
                    </span>
                  </div>

                  {order.payment_status === 'pending' && (
                    <div className={styles.paymentInfo}>
                      <p>
                        {order.payment_method === 'card'
                          ? '💡 Le paiement sera automatiquement effectué à la fin du service.'
                          : '💡 Payez en espèces directement au prestataire à la fin du service.'}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Prix du service</span>
                    <span className={styles.detailValue}>
                      <Price amount={order.base_price || order.price} />
                    </span>
                  </div>
                  {order.formula_fee > 0 && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Formule {order.formula_type}</span>
                      <span className={styles.detailValue}>
                        +<Price amount={order.formula_fee} />
                      </span>
                    </div>
                  )}
                  {order.distance_fee > 0 && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Frais de déplacement</span>
                      <span className={styles.detailValue}>
                        +<Price amount={order.distance_fee} />
                      </span>
                    </div>
                  )}
                  {order.tip > 0 && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Pourboire</span>
                      <span className={styles.detailValue}>
                        +<Price amount={order.tip} />
                      </span>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Total</span>
                    <span className={`${styles.detailValue} ${styles.totalPrice}`}>
                      <Price amount={order.total} />
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Mode de paiement</span>
                    <span className={styles.detailValue}>
                      {order.payment_method === 'card' ? '💳 Carte bancaire' : '💵 Espèces'}
                    </span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Statut paiement</span>
                    <span className={styles.detailValue}>
                      {order.payment_status === 'paid' ? '✅ Payé' :
                       order.payment_status === 'refunded' ? '🔄 Remboursé' : '⏳ En attente'}
                    </span>
                  </div>

                  {order.payment_status === 'pending' && !['completed', 'completed_pending_review'].includes(order.status) && (
                    <div className={styles.paymentInfo}>
                      <p>
                        {order.payment_method === 'card'
                          ? '💡 Le paiement sera automatiquement effectué à la fin du service.'
                          : '💡 Payez en espèces directement au prestataire à la fin du service.'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {order.provider_name && (
              <div className={styles.providerCard}>
                <h3>Votre prestataire</h3>
                <div className={styles.providerProfile}>
                  <div className={styles.providerAvatarLarge}>
                    {order.provider_avatar ? (
                      <img
                        src={`${UPLOADS_BASE_URL}${order.provider_avatar}`}
                        alt={order.provider_name}
                        className={styles.providerAvatarImg}
                      />
                    ) : (
                      <div className={styles.providerAvatarPlaceholder}>
                        {order.provider_name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    {order.provider_rating && (
                      <div className={styles.providerRatingBadge}>
                        ⭐ {parseFloat(order.provider_rating).toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className={styles.providerInfo}>
                    <span className={styles.providerName}>{order.provider_name}</span>
                    <span className={styles.providerVerified}>✓ Vérifié GlamGo</span>
                  </div>
                </div>
              </div>
            )}

            {order.notes && (
              <div className={styles.detailCard}>
                <h3>Notes</h3>
                <p className={styles.notes}>{order.notes}</p>
              </div>
            )}

            {order.cancellation_reason && (
              <div className={styles.detailCard}>
                <h3>Raison de l'annulation</h3>
                <p className={styles.cancellationReason}>{order.cancellation_reason}</p>
              </div>
            )}
          </div>

          {/* Section offres pour commandes bidding */}
          {order.pricing_mode === 'bidding' && order.status === 'pending' && (
            <div className={styles.bidsSection}>
              <div className={styles.bidsSectionHeader}>
                <h2>💰 Offres reçues</h2>
                <Button
                  variant="outline"
                  size="small"
                  onClick={fetchBids}
                  disabled={loadingBids}
                >
                  {loadingBids ? 'Chargement...' : '🔄 Actualiser'}
                </Button>
              </div>

              {loadingBids ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>Chargement des offres...</p>
                </div>
              ) : bids.length === 0 ? (
                <div className={styles.noBids}>
                  <div className={styles.noBidsIcon}>📭</div>
                  <h3>Aucune offre pour le moment</h3>
                  <p>Les prestataires vont commencer à vous envoyer leurs propositions. Revenez plus tard!</p>
                  {order.bid_expiry_time && (
                    <p className={styles.expiryInfo}>
                      Les enchères expirent le {formatDate(order.bid_expiry_time)}
                    </p>
                  )}
                </div>
              ) : (
                <div className={styles.bidsList}>
                  {bids.map((bid) => (
                    <div key={bid.id} className={`${styles.bidCard} ${styles[bid.status]}`}>
                      <div className={styles.bidHeader}>
                        <div className={styles.bidProvider}>
                          <div className={styles.providerAvatar}>
                            {bid.first_name?.[0]}{bid.last_name?.[0]}
                          </div>
                          <div>
                            <h4>{bid.first_name} {bid.last_name}</h4>
                            {bid.rating && (
                              <div className={styles.rating}>
                                ⭐ {bid.rating}/5 ({bid.review_count} avis)
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={styles.bidPrice}>
                          <Price amount={bid.proposed_price} />
                        </div>
                      </div>

                      <div className={styles.bidDetails}>
                        {bid.estimated_arrival_minutes && (
                          <div className={styles.bidDetail}>
                            <span>⏱</span>
                            <span>Arrive dans {bid.estimated_arrival_minutes} minutes</span>
                          </div>
                        )}
                        {bid.message && (
                          <div className={styles.bidMessage}>
                            <strong>Message:</strong> {bid.message}
                          </div>
                        )}
                      </div>

                      <div className={styles.bidActions}>
                        {bid.status === 'pending' && (
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => openAcceptBidModal(bid.id)}
                            disabled={actionLoading[`bid_${bid.id}`]}
                          >
                            {actionLoading[`bid_${bid.id}`] ? 'Acceptation...' : '✅ Accepter cette offre'}
                          </Button>
                        )}
                        {bid.status === 'accepted' && (
                          <span className={styles.acceptedBadge}>✓ Offre acceptée</span>
                        )}
                        {bid.status === 'rejected' && (
                          <span className={styles.rejectedBadge}>✗ Offre rejetée</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Indicateur prestation en cours */}
          {order.status === 'in_progress' && (
            <div className={styles.inProgressSection}>
              <div className={styles.inProgressHeader}>
                <span className={styles.inProgressIcon}>&#128295;</span>
                <div>
                  <h3>Prestation en cours</h3>
                  <p>Le prestataire {order.provider_name} effectue votre service</p>
                </div>
              </div>
              <div className={styles.inProgressInfo}>
                <p>Le prestataire signalera la fin du service une fois terminé. Vous recevrez une notification pour évaluer la prestation.</p>
              </div>
            </div>
          )}

          {/* Section evaluation - Commande en attente de satisfaction */}
          {order.status === 'completed_pending_review' && (
            <div className={styles.satisfactionSection}>
              <div className={styles.satisfactionHeader}>
                <span className={styles.satisfactionIcon}>&#11088;</span>
                <div>
                  <h3>Evaluez votre prestation</h3>
                  <p>Votre avis est important pour ameliorer nos services</p>
                </div>
              </div>
              <div className={styles.satisfactionInfo}>
                <p>Le prestataire a termine le service. Merci de donner votre evaluation pour finaliser la commande et liberer le paiement.</p>
                <Button
                  variant="primary"
                  onClick={() => setShowSatisfactionModal(true)}
                  className={styles.satisfactionButton}
                >
                  &#11088; Evaluer maintenant
                </Button>
              </div>
            </div>
          )}

          {/* Message de succès après confirmation d'arrivée */}
          {arrivalConfirmed && (
            <div className={styles.successMessage}>
              <span className={styles.successIcon}>✅</span>
              <div>
                <h3>Arrivée confirmée !</h3>
                <p>Le prestataire peut maintenant commencer le service.</p>
              </div>
            </div>
          )}

          {/* Bouton confirmer arrivée du prestataire (quand en route) */}
          {order.status === 'on_way' && order.provider_id && (
            <div className={styles.arrivalSection}>
              {/* Photo du prestataire style Uber */}
              <div className={styles.providerArriving}>
                <div className={styles.providerArrivingAvatar}>
                  {order.provider_avatar ? (
                    <img
                      src={`${UPLOADS_BASE_URL}${order.provider_avatar}`}
                      alt={order.provider_name}
                      className={styles.arrivingAvatarImg}
                    />
                  ) : (
                    <div className={styles.arrivingAvatarPlaceholder}>
                      {order.provider_name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className={styles.arrivingPulse}></div>
                </div>
                <div className={styles.providerArrivingInfo}>
                  <h3>{order.provider_name}</h3>
                  <p className={styles.arrivingStatus}>🚗 En route vers vous...</p>
                  {order.provider_rating && (
                    <span className={styles.arrivingRating}>⭐ {parseFloat(order.provider_rating).toFixed(1)}</span>
                  )}
                </div>
              </div>
              <div className={styles.arrivalInfo}>
                <p>Vérifiez que c'est bien cette personne à son arrivée, puis confirmez.</p>
                <Button
                  variant="primary"
                  onClick={() => setShowArrivalModal(true)}
                  className={styles.confirmButton}
                >
                  ✅ Confirmer l'arrivée
                </Button>
              </div>
            </div>
          )}

          {order.provider_id && ['accepted', 'on_way', 'in_progress'].includes(order.status) && (
            <div className={styles.chatSection}>
              <Chat orderId={order.id} userType="user" />
            </div>
          )}

          {order.provider_id && ['on_way', 'in_progress'].includes(order.status) && (
            <div className={styles.locationSharingSection}>
              <ClientLocationSharing orderId={order.id} />
            </div>
          )}

          {order.provider_id && ['on_way', 'in_progress'].includes(order.status) && (
            <div className={styles.trackingSection}>
              <ProviderLocationMap
                orderId={order.id}
                clientAddress={order.address_line}
                clientLat={order.latitude}
                clientLng={order.longitude}
              />
            </div>
          )}

          <div className={styles.actions}>
            {(order.status === 'pending' || order.status === 'accepted') && (
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading.cancel}
              >
                {actionLoading.cancel ? 'Annulation...' : 'Annuler la commande'}
              </Button>
            )}
            <Link href="/orders">
              <Button variant="primary">Retour aux commandes</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de satisfaction */}
      {showSatisfactionModal && order && (
        <SatisfactionModal
          order={order}
          onClose={() => setShowSatisfactionModal(false)}
          onSubmit={(result) => {
            handleSatisfactionSubmit(result);
            fetchOrder(); // Recharger la commande apres soumission
          }}
        />
      )}

      {/* Modal de confirmation d'arrivée */}
      {showArrivalModal && (
        <div className={styles.modalOverlay} onClick={() => setShowArrivalModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalIcon}>🚗</span>
              <h2>Confirmer l'arrivée</h2>
            </div>
            <div className={styles.modalBody}>
              {/* Photo du prestataire pour vérification */}
              <div className={styles.verifyProvider}>
                <div className={styles.verifyAvatar}>
                  {order?.provider_avatar ? (
                    <img
                      src={`${UPLOADS_BASE_URL}${order.provider_avatar}`}
                      alt={order.provider_name}
                      className={styles.verifyAvatarImg}
                    />
                  ) : (
                    <div className={styles.verifyAvatarPlaceholder}>
                      {order?.provider_name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.verifyInfo}>
                  <span className={styles.verifyName}>{order?.provider_name}</span>
                  <span className={styles.verifyLabel}>Votre prestataire</span>
                </div>
              </div>
              <p className={styles.verifyQuestion}>Est-ce bien cette personne qui est arrivée ?</p>
              <p className={styles.modalHint}>
                Vérifiez l'identité du prestataire avant de confirmer.
              </p>
            </div>
            <div className={styles.modalActions}>
              <Button
                variant="outline"
                onClick={() => setShowArrivalModal(false)}
                disabled={confirmingArrival}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmArrival}
                disabled={confirmingArrival}
              >
                {confirmingArrival ? 'Confirmation...' : '✅ Oui, il est arrivé'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'annulation de commande */}
      {showCancelModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
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
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                Non, garder
              </Button>
              <Button variant="danger" onClick={handleCancelOrder}>
                Oui, annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'acceptation d'offre */}
      {showAcceptBidModal.show && (
        <div className={styles.modalOverlay} onClick={closeAcceptBidModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalIcon}>💰</span>
              <h2>Accepter cette offre</h2>
            </div>
            <div className={styles.modalBody}>
              <p>Voulez-vous accepter cette offre ?</p>
              <p className={styles.modalHint}>Les autres offres seront automatiquement rejetées.</p>
            </div>
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={closeAcceptBidModal}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleAcceptBid}>
                ✅ Accepter
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

      {/* Bouton d'urgence - visible pendant la prestation active */}
      {order && ['on_way', 'in_progress'].includes(order.status) && (
        <EmergencyButton
          orderId={order.id}
          providerName={order.provider_name}
          onEmergencyReported={(data) => {
            showToast('Signalement envoye. Notre equipe vous contactera rapidement.', 'success');
          }}
        />
      )}
    </div>
  );
}
