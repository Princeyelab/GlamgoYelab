'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getServiceImageUrl } from '@/lib/serviceImages';
import { fixEncoding } from '@/lib/textUtils';
import Chat from '@/components/Chat';
import TranslatedText from '@/components/TranslatedText';
import { useTranslatedTexts } from '@/hooks/useDeepLTranslation';
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
  const { t, language } = useLanguage();
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
        setError(t('orderDetail.orderNotFound'));
      }
    } catch (err) {
      setError(err.message || t('orderDetail.loadError'));
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
        showToast(t('orderDetail.bidAccepted'), 'success');
        fetchOrder();
        fetchBids();
      } else {
        showToast(response.message || t('orderDetail.acceptError'), 'error');
      }
    } catch (err) {
      showToast(err.message || t('orderDetail.acceptError'), 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`bid_${bidId}`]: false }));
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

  const formatDate = (dateString) => {
    if (!dateString) return t('orderDetail.notDefined');
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'fr-FR', {
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
        showToast(t('orderDetail.orderCancelled'), 'success');
        fetchOrder();
      } else {
        showToast(response.message || t('orderDetail.cancelError'), 'error');
      }
    } catch (err) {
      showToast(err.message || t('orderDetail.cancelError'), 'error');
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
        showToast(t('orderDetail.arrivalConfirmed'), 'success');
        // Masquer le message de succès après 5 secondes
        setTimeout(() => setArrivalConfirmed(false), 5000);
        fetchOrder(false);
      } else {
        showToast(response.message || t('orderDetail.confirmError'), 'error');
      }
    } catch (err) {
      showToast(err.message || t('orderDetail.confirmError'), 'error');
    } finally {
      setConfirmingArrival(false);
    }
  };

  if (authLoading || loading) {
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

  if (error || !order) {
    return (
      <div className={styles.errorPage}>
        <h2>{error || t('orderDetail.orderNotFound')}</h2>
        <Link href="/orders">
          <Button variant="primary">{t('orderDetail.backToOrders')}</Button>
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
          {t('orderDetail.backToOrders')}
        </Link>

        <div className={styles.orderHeader}>
          <h1 className={styles.title}>{t('orderDetail.orderNumber', { id: order.id })}</h1>
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
              <TranslatedText as="h2" className={styles.serviceName} text={order.service_name} fallback="Service" />
              {order.category_name && (
                <TranslatedText as="span" className={styles.categoryName} text={order.category_name} />
              )}
              {order.service_description && (
                <TranslatedText as="p" className={styles.serviceDescription} text={order.service_description} />
              )}
            </div>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailCard}>
              <h3>{t('orderDetail.reservationInfo')}</h3>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>{t('orderDetail.scheduledDate')}</span>
                <span className={styles.detailValue}>
                  {formatDate(order.scheduled_at)}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>{t('orderDetail.createdDate')}</span>
                <span className={styles.detailValue}>
                  {formatDate(order.created_at)}
                </span>
              </div>
              {order.accepted_at && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>{t('orderDetail.acceptedOn')}</span>
                  <span className={styles.detailValue}>
                    {formatDate(order.accepted_at)}
                  </span>
                </div>
              )}
              {order.completed_at && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>{t('orderDetail.completedOn')}</span>
                  <span className={styles.detailValue}>
                    {formatDate(order.completed_at)}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.detailCard}>
              <h3>{order.pricing_mode === 'bidding' ? t('orderDetail.biddingInfo') : t('orderDetail.priceAndPayment')}</h3>
              {order.pricing_mode === 'bidding' ? (
                <>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>{t('orderDetail.mode')}</span>
                    <span className={styles.detailValue}>
                      <span className={styles.biddingBadge}>🎯 {t('orderDetail.bidding')}</span>
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>{t('orderDetail.yourProposedPrice')}</span>
                    <span className={styles.detailValue}>
                      <Price amount={order.user_proposed_price} />
                    </span>
                  </div>
                  {order.bid_expiry_time && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>{t('orderDetail.biddingExpiry')}</span>
                      <span className={styles.detailValue}>
                        {formatDate(order.bid_expiry_time)}
                      </span>
                    </div>
                  )}
                  {order.price > 0 && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>{t('orderDetail.acceptedPrice')}</span>
                      <span className={`${styles.detailValue} ${styles.totalPrice}`}>
                        <Price amount={order.price} />
                      </span>
                    </div>
                  )}

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>{t('orderDetail.paymentMethod')}</span>
                    <span className={styles.detailValue}>
                      {order.payment_method === 'card' ? '💳 ' + t('orderDetail.cardPayment') : '💵 ' + t('orderDetail.cashPayment')}
                    </span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>{t('orderDetail.paymentStatus')}</span>
                    <span className={styles.detailValue}>
                      {order.payment_status === 'paid' ? '✅ ' + t('orderDetail.paid') : order.payment_status === 'refunded' ? '🔄 ' + t('orderDetail.refunded') : '⏳ ' + t('orderDetail.paymentPending')}
                    </span>
                  </div>

                  {order.payment_status === 'pending' && (
                    <div className={styles.paymentInfo}>
                      <p>
                        {order.payment_method === 'card' ? '💡 ' + t('orderDetail.cardPaymentInfo') : '💡 ' + t('orderDetail.cashPaymentInfo')}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>{t('orderDetail.servicePrice')}</span>
                    <span className={styles.detailValue}>
                      <Price amount={order.base_price || order.price} />
                    </span>
                  </div>
                  {order.formula_fee > 0 && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>{t('orderDetail.formula')} {order.formula_type}</span>
                      <span className={styles.detailValue}>
                        +<Price amount={order.formula_fee} />
                      </span>
                    </div>
                  )}
                  {order.distance_fee > 0 && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>{t('orderDetail.travelFee')}</span>
                      <span className={styles.detailValue}>
                        +<Price amount={order.distance_fee} />
                      </span>
                    </div>
                  )}
                  {order.tip > 0 && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>{t('orderDetail.tip')}</span>
                      <span className={styles.detailValue}>
                        +<Price amount={order.tip} />
                      </span>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>{t('orderDetail.total')}</span>
                    <span className={`${styles.detailValue} ${styles.totalPrice}`}>
                      <Price amount={order.total} />
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>{t('orderDetail.paymentMethod')}</span>
                    <span className={styles.detailValue}>
                      {order.payment_method === 'card' ? '💳 ' + t('orderDetail.cardPayment') : '💵 ' + t('orderDetail.cashPayment')}
                    </span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>{t('orderDetail.paymentStatus')}</span>
                    <span className={styles.detailValue}>
                      {order.payment_status === 'paid' ? '✅ ' + t('orderDetail.paid') : order.payment_status === 'refunded' ? '🔄 ' + t('orderDetail.refunded') : '⏳ ' + t('orderDetail.paymentPending')}
                    </span>
                  </div>

                  {order.payment_status === 'pending' && !['completed', 'completed_pending_review'].includes(order.status) && (
                    <div className={styles.paymentInfo}>
                      <p>
                        {order.payment_method === 'card' ? '💡 ' + t('orderDetail.cardPaymentInfo') : '💡 ' + t('orderDetail.cashPaymentInfo')}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {order.provider_name && (
              <div className={styles.providerCard}>
                <h3>{t('orderDetail.yourProvider')}</h3>
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
                    <span className={styles.providerVerified}>✓ {t('orderDetail.verifiedGlamGo')}</span>
                  </div>
                </div>
              </div>
            )}

            {order.notes && (
              <div className={styles.detailCard}>
                <h3>{t('orderDetail.notes')}</h3>
                <p className={styles.notes}>{order.notes}</p>
              </div>
            )}

            {order.cancellation_reason && (
              <div className={styles.detailCard}>
                <h3>{t('orderDetail.cancellationReason')}</h3>
                <p className={styles.cancellationReason}>{order.cancellation_reason}</p>
              </div>
            )}
          </div>

          {/* Section offres pour commandes bidding */}
          {order.pricing_mode === 'bidding' && order.status === 'pending' && (
            <div className={styles.bidsSection}>
              <div className={styles.bidsSectionHeader}>
                <h2>💰 {t('orderDetail.receivedOffers')}</h2>
                <Button
                  variant="outline"
                  size="small"
                  onClick={fetchBids}
                  disabled={loadingBids}
                >
                  {loadingBids ? t('common.loading') : '🔄 ' + t('orderDetail.refresh')}
                </Button>
              </div>

              {loadingBids ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>{t('orderDetail.loadingOffers')}</p>
                </div>
              ) : bids.length === 0 ? (
                <div className={styles.noBids}>
                  <div className={styles.noBidsIcon}>📭</div>
                  <h3>{t('orderDetail.noOffersYet')}</h3>
                  <p>{t('orderDetail.noOffersDesc')}</p>
                  {order.bid_expiry_time && (
                    <p className={styles.expiryInfo}>
                      {t('orderDetail.bidsExpireOn')} {formatDate(order.bid_expiry_time)}
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
                            <span>{t('orderDetail.arrivesIn', { minutes: bid.estimated_arrival_minutes })}</span>
                          </div>
                        )}
                        {bid.message && (
                          <div className={styles.bidMessage}>
                            <strong>{t('orderDetail.message')}:</strong> {bid.message}
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
                            {actionLoading[`bid_${bid.id}`] ? t('orderDetail.accepting') : '✅ ' + t('orderDetail.acceptOffer')}
                          </Button>
                        )}
                        {bid.status === 'accepted' && (
                          <span className={styles.acceptedBadge}>✓ {t('orderDetail.offerAccepted')}</span>
                        )}
                        {bid.status === 'rejected' && (
                          <span className={styles.rejectedBadge}>✗ {t('orderDetail.offerRejected')}</span>
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
                  <h3>{t('orderDetail.serviceInProgress')}</h3>
                  <p>{t('orderDetail.providerWorking', { name: order.provider_name })}</p>
                </div>
              </div>
              <div className={styles.inProgressInfo}>
                <p>{t('orderDetail.willNotifyWhenDone')}</p>
              </div>
            </div>
          )}

          {/* Section evaluation - Commande en attente de satisfaction */}
          {order.status === 'completed_pending_review' && (
            <div className={styles.satisfactionSection}>
              <div className={styles.satisfactionHeader}>
                <span className={styles.satisfactionIcon}>&#11088;</span>
                <div>
                  <h3>{t('orderDetail.rateService')}</h3>
                  <p>{t('orderDetail.rateServiceDesc')}</p>
                </div>
              </div>
              <div className={styles.satisfactionInfo}>
                <p>{t('orderDetail.rateServiceInfo')}</p>
                <Button
                  variant="primary"
                  onClick={() => setShowSatisfactionModal(true)}
                  className={styles.satisfactionButton}
                >
                  &#11088; {t('orderDetail.rateNow')}
                </Button>
              </div>
            </div>
          )}

          {/* Message de succès après confirmation d'arrivée */}
          {arrivalConfirmed && (
            <div className={styles.successMessage}>
              <span className={styles.successIcon}>✅</span>
              <div>
                <h3>{t('orderDetail.arrivalConfirmedTitle')}</h3>
                <p>{t('orderDetail.providerCanStart')}</p>
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
                  <p className={styles.arrivingStatus}>🚗 {t('orderDetail.onTheWay')}</p>
                  {order.provider_rating && (
                    <span className={styles.arrivingRating}>⭐ {parseFloat(order.provider_rating).toFixed(1)}</span>
                  )}
                </div>
              </div>
              <div className={styles.arrivalInfo}>
                <p>{t('orderDetail.verifyAndConfirm')}</p>
                <Button
                  variant="primary"
                  onClick={() => setShowArrivalModal(true)}
                  className={styles.confirmButton}
                >
                  ✅ {t('orderDetail.confirmArrival')}
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
                {actionLoading.cancel ? t('orderDetail.cancelling') : t('orderDetail.cancelOrder')}
              </Button>
            )}
            <Link href="/orders">
              <Button variant="primary">{t('orderDetail.backToOrders')}</Button>
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
              <h2>{t('orderDetail.confirmArrival')}</h2>
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
                  <span className={styles.verifyLabel}>{t('orderDetail.yourProvider')}</span>
                </div>
              </div>
              <p className={styles.verifyQuestion}>{t('orderDetail.isThisProvider')}</p>
              <p className={styles.modalHint}>
                {t('orderDetail.verifyIdentity')}
              </p>
            </div>
            <div className={styles.modalActions}>
              <Button
                variant="outline"
                onClick={() => setShowArrivalModal(false)}
                disabled={confirmingArrival}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmArrival}
                disabled={confirmingArrival}
              >
                {confirmingArrival ? t('orderDetail.confirming') : '✅ ' + t('orderDetail.yesArrived')}
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
              <h2>{t('orderDetail.cancelOrder')}</h2>
            </div>
            <div className={styles.modalBody}>
              <p>{t('orderDetail.cancelConfirm')}</p>
              <p className={styles.modalHint}>{t('orderDetail.cancelWarning')}</p>
            </div>
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                {t('orderDetail.keepOrder')}
              </Button>
              <Button variant="danger" onClick={handleCancelOrder}>
                {t('orderDetail.yesCancel')}
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
              <h2>{t('orderDetail.acceptThisOffer')}</h2>
            </div>
            <div className={styles.modalBody}>
              <p>{t('orderDetail.wantToAccept')}</p>
              <p className={styles.modalHint}>{t('orderDetail.otherOffersRejected')}</p>
            </div>
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={closeAcceptBidModal}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={handleAcceptBid}>
                ✅ {t('orderDetail.accept')}
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
            showToast(t('orderDetail.emergencyReported'), 'success');
          }}
        />
      )}
    </div>
  );
}
