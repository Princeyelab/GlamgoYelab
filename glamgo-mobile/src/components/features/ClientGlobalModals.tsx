/**
 * ClientGlobalModals - Modals globaux pour le client
 *
 * Affiche les popups de notification partout dans l'app:
 * - Commande acceptée par le prestataire
 * - Commande refusée par le prestataire
 * - Prestataire arrivé
 * - Fin de service (satisfaction)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../lib/store/hooks';
import { fetchBookings } from '../../lib/store/slices/bookingsSlice';
import apiClient from '../../lib/api/client';
import { confirmProviderArrival, submitSatisfaction, SatisfactionData } from '../../lib/api/bookingsAPI';
import { SatisfactionModal } from './SatisfactionModal';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';

// Clés AsyncStorage pour persister les IDs déjà montrés
const STORAGE_KEY_REJECTED = '@glamgo_shown_rejected_ids';
const STORAGE_KEY_ACCEPTED = '@glamgo_shown_accepted_ids';
const STORAGE_KEY_SATISFACTION = '@glamgo_shown_satisfaction_ids';
const STORAGE_KEY_EN_ROUTE = '@glamgo_shown_en_route_ids';

// Intervalle de polling (10 secondes)
const CHECK_INTERVAL = 10000;

interface ArrivedOrder {
  id: number;
  provider_name: string;
  service_name: string;
}

interface AcceptedOrder {
  id: number;
  provider_name: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
}

interface EnRouteOrder {
  id: number;
  provider_name: string;
  service_name: string;
  eta_minutes?: number;
}

interface SatisfactionOrder {
  id: number;
  service_name?: string;
  provider_name?: string;
  provider_first_name?: string;
  provider_last_name?: string;
  price?: number;
  total?: number;
  payment_method?: string;
  completed_at?: string;
}

interface RejectedOrder {
  id: number;
  service_id?: number;
  service_name: string;
  cancellation_reason?: string;
  provider_name?: string;
  type?: 'rejected' | 'cancelled'; // rejected = refus avant acceptation, cancelled = annulation après acceptation
}

export const ClientGlobalModals: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const userRole = useAppSelector((state) => state.auth.user?.role);
  const dispatch = useAppDispatch();

  // State pour le modal d'arrivée
  const [arrivedOrder, setArrivedOrder] = useState<ArrivedOrder | null>(null);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [confirmingArrival, setConfirmingArrival] = useState(false);
  const [checkedOrderIds, setCheckedOrderIds] = useState<Set<number>>(new Set());

  // State pour le modal de satisfaction
  const [satisfactionOrder, setSatisfactionOrder] = useState<SatisfactionOrder | null>(null);
  const [showSatisfactionModal, setShowSatisfactionModal] = useState(false);
  const shownSatisfactionModalIds = useRef<Set<number>>(new Set());

  // State pour le modal d'acceptation
  const [acceptedOrder, setAcceptedOrder] = useState<AcceptedOrder | null>(null);
  const [showAcceptedModal, setShowAcceptedModal] = useState(false);
  const shownAcceptedModalIds = useRef<Set<number>>(new Set());

  // State pour le modal de refus
  const [rejectedOrder, setRejectedOrder] = useState<RejectedOrder | null>(null);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const shownRejectedModalIds = useRef<Set<number>>(new Set());

  // State pour le modal "en route"
  const [enRouteOrder, setEnRouteOrder] = useState<EnRouteOrder | null>(null);
  const [showEnRouteModal, setShowEnRouteModal] = useState(false);
  const shownEnRouteModalIds = useRef<Set<number>>(new Set());

  // Flag pour savoir si les IDs persistés ont été chargés
  const [idsLoaded, setIdsLoaded] = useState(false);

  // Charger les IDs persistés au démarrage
  useEffect(() => {
    const loadPersistedIds = async () => {
      try {
        const [rejectedIds, acceptedIds, satisfactionIds, enRouteIds] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_REJECTED),
          AsyncStorage.getItem(STORAGE_KEY_ACCEPTED),
          AsyncStorage.getItem(STORAGE_KEY_SATISFACTION),
          AsyncStorage.getItem(STORAGE_KEY_EN_ROUTE),
        ]);

        if (rejectedIds) {
          const ids = JSON.parse(rejectedIds) as number[];
          shownRejectedModalIds.current = new Set(ids);
        }
        if (acceptedIds) {
          const ids = JSON.parse(acceptedIds) as number[];
          shownAcceptedModalIds.current = new Set(ids);
        }
        if (satisfactionIds) {
          const ids = JSON.parse(satisfactionIds) as number[];
          shownSatisfactionModalIds.current = new Set(ids);
        }
        if (enRouteIds) {
          const ids = JSON.parse(enRouteIds) as number[];
          shownEnRouteModalIds.current = new Set(ids);
        }
      } catch (error) {
        console.log('[ClientGlobalModals] Error loading persisted IDs:', error);
      } finally {
        setIdsLoaded(true);
      }
    };

    loadPersistedIds();
  }, []);

  // Sauvegarder un ID dans AsyncStorage
  const persistId = useCallback(async (storageKey: string, id: number, currentSet: Set<number>) => {
    try {
      currentSet.add(id);
      // Garder seulement les 50 derniers IDs pour éviter une croissance infinie
      const idsArray = Array.from(currentSet).slice(-50);
      await AsyncStorage.setItem(storageKey, JSON.stringify(idsArray));
    } catch (error) {
      console.log('[ClientGlobalModals] Error persisting ID:', error);
    }
  }, []);

  // Vérifier les commandes
  const checkOrders = useCallback(async () => {
    // Ne pas vérifier tant que les IDs persistés n'ont pas été chargés
    if (!user || userRole === 'provider' || !idsLoaded) return;

    try {
      const response = await apiClient.get('/api/orders');
      const orders = response.data?.data || [];

      // 1. Commande acceptée
      const newlyAcceptedOrder = orders.find(
        (o: any) => o.status === 'accepted' && !shownAcceptedModalIds.current.has(o.id)
      );

      if (newlyAcceptedOrder && !showAcceptedModal && !showArrivalModal && !showSatisfactionModal && !showEnRouteModal) {
        setAcceptedOrder({
          id: newlyAcceptedOrder.id,
          provider_name: newlyAcceptedOrder.provider_name ||
            `${newlyAcceptedOrder.provider_first_name || ''} ${newlyAcceptedOrder.provider_last_name || ''}`.trim() ||
            'Un prestataire',
          service_name: newlyAcceptedOrder.service_name || 'votre prestation',
          booking_date: newlyAcceptedOrder.booking_date || '',
          booking_time: newlyAcceptedOrder.booking_time || '',
        });
        persistId(STORAGE_KEY_ACCEPTED, newlyAcceptedOrder.id, shownAcceptedModalIds.current);
        Vibration.vibrate([0, 300, 100, 300]);
        setShowAcceptedModal(true);
      }

      // 2. Prestataire en route
      const enRouteOrderData = orders.find(
        (o: any) => (o.status === 'en_route' || o.status === 'on_way') && !shownEnRouteModalIds.current.has(o.id)
      );

      if (enRouteOrderData && !showEnRouteModal && !showAcceptedModal && !showArrivalModal && !showSatisfactionModal && !showRejectedModal) {
        setEnRouteOrder({
          id: enRouteOrderData.id,
          provider_name: enRouteOrderData.provider_name ||
            `${enRouteOrderData.provider_first_name || ''} ${enRouteOrderData.provider_last_name || ''}`.trim() ||
            'Votre prestataire',
          service_name: enRouteOrderData.service_name || 'votre prestation',
          eta_minutes: enRouteOrderData.eta_minutes || enRouteOrderData.estimated_arrival_minutes,
        });
        persistId(STORAGE_KEY_EN_ROUTE, enRouteOrderData.id, shownEnRouteModalIds.current);
        Vibration.vibrate([0, 400, 150, 400, 150, 400]);
        setShowEnRouteModal(true);
      }

      // 3. Prestataire arrivé
      const arrivedOrderData = orders.find(
        (o: any) => o.status === 'arrived' && !checkedOrderIds.has(o.id)
      );

      if (arrivedOrderData && !showArrivalModal && !showAcceptedModal && !showSatisfactionModal && !showEnRouteModal) {
        setArrivedOrder({
          id: arrivedOrderData.id,
          provider_name: arrivedOrderData.provider_name ||
            `${arrivedOrderData.provider_first_name || ''} ${arrivedOrderData.provider_last_name || ''}`.trim() ||
            'Votre prestataire',
          service_name: arrivedOrderData.service_name || 'votre prestation',
        });
        Vibration.vibrate([0, 500, 200, 500]);
        setShowArrivalModal(true);
      }

      // 3. Fin de service - satisfaction
      const pendingReviewOrder = orders.find(
        (o: any) => o.status === 'completed_pending_review' && !shownSatisfactionModalIds.current.has(o.id)
      );

      if (pendingReviewOrder && !showSatisfactionModal && !showArrivalModal && !showAcceptedModal && !showRejectedModal && !showEnRouteModal) {
        setSatisfactionOrder({
          id: pendingReviewOrder.id,
          service_name: pendingReviewOrder.service_name,
          provider_name: pendingReviewOrder.provider_name ||
            `${pendingReviewOrder.provider_first_name || ''} ${pendingReviewOrder.provider_last_name || ''}`.trim(),
          provider_first_name: pendingReviewOrder.provider_first_name,
          provider_last_name: pendingReviewOrder.provider_last_name,
          price: pendingReviewOrder.price,
          total: pendingReviewOrder.total,
          payment_method: pendingReviewOrder.payment_method || 'card',
          completed_at: pendingReviewOrder.completed_at,
        });
        persistId(STORAGE_KEY_SATISFACTION, pendingReviewOrder.id, shownSatisfactionModalIds.current);
        Vibration.vibrate([0, 200, 100, 200, 100, 200]);
        setShowSatisfactionModal(true);
      }

      // 4. Commande refusée par le prestataire
      // PRIORITÉ AUX NOTIFICATIONS (plus fiable que les ordres)
      // 30 minutes pour les notifications non lues (plus de temps pour réagir)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      console.log('[ClientGlobalModals] Checking for rejected orders...');
      console.log('[ClientGlobalModals] Already shown IDs:', Array.from(shownRejectedModalIds.current));

      let rejectedOrderData: any = null;

      // D'ABORD chercher dans les notifications (source la plus fiable)
      console.log('[ClientGlobalModals] Checking notifications for order_rejected...');
      try {
          const notifResponse = await apiClient.get('/api/notifications');
          const notifications = notifResponse.data?.data?.notifications || notifResponse.data?.data || [];
          console.log('[ClientGlobalModals] Found', notifications.length, 'notifications');

          // Chercher les notifications de refus OU d'annulation après acceptation
          const rejectionNotif = notifications.find((n: any) => {
            console.log('[ClientGlobalModals] Notif:', n.id, 'type:', n.notification_type, 'read:', n.is_read || n.read_at);

            // Accepter order_rejected ET provider_cancelled
            if (n.notification_type !== 'order_rejected' && n.notification_type !== 'provider_cancelled') return false;
            // Si déjà lue, ignorer
            if (n.is_read === true || n.read_at) return false;

            const notifData = typeof n.data === 'string' ? JSON.parse(n.data) : n.data;
            const orderId = notifData?.order_id || n.order_id;
            if (shownRejectedModalIds.current.has(orderId)) {
              console.log('[ClientGlobalModals] Notif order', orderId, 'already shown');
              return false;
            }

            // PAS de vérification de temps - si non lue et non montrée, on l'affiche
            console.log('[ClientGlobalModals] ✅ Found', n.notification_type, 'notification for order', orderId);
            return true;
          });

          if (rejectionNotif) {
            console.log('[ClientGlobalModals] Raw notification data:', rejectionNotif.data);
            const notifData = typeof rejectionNotif.data === 'string'
              ? JSON.parse(rejectionNotif.data)
              : rejectionNotif.data;
            console.log('[ClientGlobalModals] Parsed notifData:', notifData);
            console.log('[ClientGlobalModals] service_id from notifData:', notifData?.service_id);

            // Déterminer le type: rejected (avant acceptation) ou cancelled (après acceptation)
            const notifType = rejectionNotif.notification_type === 'provider_cancelled' ? 'cancelled' : 'rejected';

            rejectedOrderData = {
              id: notifData?.order_id || rejectionNotif.order_id,
              service_id: notifData?.service_id,
              service_name: notifData?.service_name || 'votre prestation',
              cancellation_reason: notifData?.reason,
              provider_name: notifData?.provider_name,
              type: notifType,
              status: 'cancelled',
              cancelled_by: 'provider',
            };
            console.log('[ClientGlobalModals] Built rejectedOrderData:', rejectedOrderData);
          }
      } catch (e) {
        console.log('[ClientGlobalModals] Error fetching notifications:', e);
      }

      // Fallback: chercher dans les ordres si pas trouvé dans les notifications
      if (!rejectedOrderData) {
        console.log('[ClientGlobalModals] Checking orders for cancelled by provider...');
        const cancelledOrder = orders.find((o: any) => {
          if (o.status !== 'cancelled') return false;
          if (shownRejectedModalIds.current.has(o.id)) return false;

          // Vérifier si récent (30 min)
          const cancelledAt = o.cancelled_at || o.updated_at;
          if (cancelledAt) {
            const cancelDate = new Date(cancelledAt);
            if (cancelDate < thirtyMinutesAgo) return false;
          }

          // Accepter si cancelled_by === 'provider' OU si pas de cancelled_by (ancien format)
          return o.cancelled_by === 'provider';
        });

        if (cancelledOrder) {
          rejectedOrderData = {
            id: cancelledOrder.id,
            service_id: cancelledOrder.service_id,
            service_name: cancelledOrder.service_name || 'votre prestation',
            cancellation_reason: cancelledOrder.cancellation_reason,
          };
          console.log('[ClientGlobalModals] Found rejected order in orders:', rejectedOrderData);
        }
      }

      console.log('[ClientGlobalModals] Final rejectedOrderData:', rejectedOrderData);
      console.log('[ClientGlobalModals] showRejectedModal:', showRejectedModal, 'showSatisfactionModal:', showSatisfactionModal, 'showArrivalModal:', showArrivalModal, 'showAcceptedModal:', showAcceptedModal);

      if (rejectedOrderData && !showRejectedModal && !showSatisfactionModal && !showArrivalModal && !showAcceptedModal && !showEnRouteModal) {
        console.log('[ClientGlobalModals] 🚨 SHOWING REJECTED MODAL for order', rejectedOrderData.id, 'type:', rejectedOrderData.type);
        setRejectedOrder({
          id: rejectedOrderData.id,
          service_id: rejectedOrderData.service_id,
          service_name: rejectedOrderData.service_name || 'votre prestation',
          cancellation_reason: rejectedOrderData.cancellation_reason,
          provider_name: rejectedOrderData.provider_name,
          type: rejectedOrderData.type || 'rejected',
        });
        persistId(STORAGE_KEY_REJECTED, rejectedOrderData.id, shownRejectedModalIds.current);
        Vibration.vibrate([0, 500, 150, 500, 150, 500]); // Vibration plus forte
        setShowRejectedModal(true);
      } else if (rejectedOrderData) {
        console.log('[ClientGlobalModals] Cannot show modal - another modal is open');
      }
    } catch (error) {
      // Silently ignore
    }
  }, [user, userRole, showArrivalModal, showSatisfactionModal, showAcceptedModal, showRejectedModal, showEnRouteModal, checkedOrderIds, idsLoaded, persistId]);

  // Polling - ne démarre qu'une fois les IDs chargés
  useEffect(() => {
    if (!user || userRole === 'provider' || !idsLoaded) return;

    checkOrders();
    const interval = setInterval(checkOrders, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [user, userRole, checkOrders, idsLoaded]);

  // Confirmer l'arrivée
  const handleConfirmArrival = async () => {
    if (!arrivedOrder) return;

    setConfirmingArrival(true);
    try {
      await confirmProviderArrival(arrivedOrder.id);
      setCheckedOrderIds(prev => new Set(prev).add(arrivedOrder.id));
      setShowArrivalModal(false);
      setArrivedOrder(null);
    } catch (error) {
      console.log('[ClientGlobalModals] Error confirming arrival:', error);
    } finally {
      setConfirmingArrival(false);
    }
  };

  // Reporter l'arrivée
  const handleDismissArrivalModal = () => {
    if (arrivedOrder) {
      setShowArrivalModal(false);
      setTimeout(() => {
        if (arrivedOrder) {
          setShowArrivalModal(true);
        }
      }, 30000);
    }
  };

  // Voir la commande acceptée
  const handleViewAcceptedOrder = () => {
    if (acceptedOrder) {
      setShowAcceptedModal(false);
      router.push(`/booking/track/${acceptedOrder.id}` as any);
    }
  };

  // Fermer modal acceptation
  const handleDismissAcceptedModal = () => {
    setShowAcceptedModal(false);
    setAcceptedOrder(null);
  };

  // Voir la commande en route
  const handleViewEnRouteOrder = () => {
    if (enRouteOrder) {
      setShowEnRouteModal(false);
      router.push(`/booking/track/${enRouteOrder.id}` as any);
    }
  };

  // Fermer modal en route
  const handleDismissEnRouteModal = () => {
    setShowEnRouteModal(false);
    setEnRouteOrder(null);
  };

  // Soumettre satisfaction
  const handleSubmitSatisfaction = async (data: SatisfactionData) => {
    if (!satisfactionOrder) return;

    try {
      await submitSatisfaction(satisfactionOrder.id, data);
      setShowSatisfactionModal(false);
      setSatisfactionOrder(null);
      dispatch(fetchBookings());

      // Afficher le message et rediriger vers le dashboard
      Alert.alert(
        'Merci ! 🎉',
        'Votre avis a été enregistré avec succès.',
        [{
          text: 'Retour à l\'accueil',
          onPress: () => router.replace('/(client)' as any),
        }]
      );
    } catch (err: any) {
      throw err;
    }
  };

  // Fermer satisfaction - BLOQUÉ car obligatoire
  const handleCloseSatisfactionModal = () => {
    // Ne pas permettre de fermer - l'evaluation est obligatoire
    Alert.alert(
      'Évaluation obligatoire',
      'Vous devez évaluer votre prestation pour que le paiement soit déclenché. Vous ne pourrez pas faire de nouvelle réservation avant d\'avoir évalué.',
      [{ text: 'Compris', style: 'default' }]
    );
  };

  // Fermer modal de refus et chercher un autre prestataire
  const handleDismissRejectedModal = () => {
    setShowRejectedModal(false);
    setRejectedOrder(null);
  };

  // Chercher un autre prestataire après refus - rediriger vers nouvelle réservation
  const handleFindAnotherProvider = () => {
    const serviceId = rejectedOrder?.service_id;
    const serviceName = rejectedOrder?.service_name;
    console.log('[ClientGlobalModals] Redirecting - serviceId:', serviceId, 'serviceName:', serviceName);
    console.log('[ClientGlobalModals] Full rejectedOrder:', rejectedOrder);

    setShowRejectedModal(false);
    setRejectedOrder(null);

    // Rediriger vers la page de création de réservation avec le même service
    // IMPORTANT: Le paramètre doit être 'service_id' (snake_case) pour booking/create.tsx
    if (serviceId) {
      console.log('[ClientGlobalModals] Navigating to /booking/create?service_id=' + serviceId);
      router.push(`/booking/create?service_id=${serviceId}` as any);
    } else {
      // Fallback vers les services si pas de service_id
      console.log('[ClientGlobalModals] No serviceId, navigating to services');
      router.push('/(client)/services' as any);
    }
  };

  // Ne rien rendre si pas de user ou si c'est un provider
  if (!user || userRole === 'provider') {
    return null;
  }

  return (
    <>
      {/* Modal Prestataire Arrivé */}
      <Modal
        visible={showArrivalModal && arrivedOrder !== null}
        transparent
        animationType="fade"
        onRequestClose={handleDismissArrivalModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>🚗</Text>
            <Text style={styles.modalTitle}>Prestataire arrivé !</Text>
            <Text style={styles.modalMessage}>
              {arrivedOrder?.provider_name} est arrivé pour {arrivedOrder?.service_name}.
            </Text>
            <Text style={styles.modalSubtext}>
              Confirmez son arrivée pour démarrer la prestation.
            </Text>

            <TouchableOpacity
              style={[styles.confirmButton, confirmingArrival && styles.confirmButtonDisabled]}
              onPress={handleConfirmArrival}
              disabled={confirmingArrival}
            >
              {confirmingArrival ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>✓ Confirmer l'arrivée</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleDismissArrivalModal}
              disabled={confirmingArrival}
            >
              <Text style={styles.laterButtonText}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Commande Acceptée */}
      <Modal
        visible={showAcceptedModal && acceptedOrder !== null}
        transparent
        animationType="fade"
        onRequestClose={handleDismissAcceptedModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>🎉</Text>
            <Text style={styles.modalTitle}>Commande acceptée !</Text>
            <Text style={styles.modalMessage}>
              {acceptedOrder?.provider_name} a accepté votre demande pour {acceptedOrder?.service_name}.
            </Text>
            {acceptedOrder?.booking_time ? (
              <Text style={styles.modalSubtext}>
                Rendez-vous prévu à {acceptedOrder.booking_time.substring(0, 5)}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleViewAcceptedOrder}
            >
              <Text style={styles.confirmButtonText}>📍 Suivre ma commande</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleDismissAcceptedModal}
            >
              <Text style={styles.laterButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Prestataire En Route */}
      <Modal
        visible={showEnRouteModal && enRouteOrder !== null}
        transparent
        animationType="fade"
        onRequestClose={handleDismissEnRouteModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.enRouteModalContent]}>
            <View style={styles.enRouteIconContainer}>
              <Text style={styles.enRouteIcon}>🚗</Text>
            </View>
            <Text style={[styles.modalTitle, styles.enRouteTitle]}>En route !</Text>
            <Text style={styles.modalMessage}>
              {enRouteOrder?.provider_name} est en chemin pour{'\n'}
              <Text style={styles.serviceName}>{enRouteOrder?.service_name}</Text>
            </Text>
            {enRouteOrder?.eta_minutes ? (
              <View style={styles.etaContainer}>
                <Text style={styles.etaLabel}>Arrivée estimée dans</Text>
                <Text style={styles.etaValue}>{enRouteOrder.eta_minutes} min</Text>
              </View>
            ) : null}
            <Text style={styles.enRouteSubtext}>
              Préparez-vous, votre prestataire arrive bientôt !
            </Text>

            <TouchableOpacity
              style={styles.trackButton}
              onPress={handleViewEnRouteOrder}
            >
              <Text style={styles.trackButtonText}>📍 Suivre en temps réel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleDismissEnRouteModal}
            >
              <Text style={styles.laterButtonText}>OK, compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Satisfaction */}
      {satisfactionOrder && (
        <SatisfactionModal
          visible={showSatisfactionModal}
          order={{
            id: satisfactionOrder.id,
            service_name: satisfactionOrder.service_name,
            provider_name: satisfactionOrder.provider_name,
            provider_first_name: satisfactionOrder.provider_first_name,
            provider_last_name: satisfactionOrder.provider_last_name,
            price: satisfactionOrder.price,
            total: satisfactionOrder.total,
            payment_method: satisfactionOrder.payment_method,
            completed_at: satisfactionOrder.completed_at,
          }}
          onClose={handleCloseSatisfactionModal}
          onSubmit={handleSubmitSatisfaction}
        />
      )}

      {/* Modal Commande Refusée / Annulée */}
      <Modal
        visible={showRejectedModal && rejectedOrder !== null}
        transparent
        animationType="fade"
        onRequestClose={handleDismissRejectedModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.rejectedModalContent]}>
            <View style={styles.rejectedIconContainer}>
              <Text style={styles.rejectedIcon}>
                {rejectedOrder?.type === 'cancelled' ? '😔' : '❌'}
              </Text>
            </View>
            <Text style={[styles.modalTitle, styles.rejectedTitle]}>
              {rejectedOrder?.type === 'cancelled'
                ? 'Prestataire indisponible'
                : 'Commande refusée'
              }
            </Text>
            <Text style={styles.modalMessage}>
              {rejectedOrder?.type === 'cancelled' ? (
                <>
                  {rejectedOrder?.provider_name
                    ? `${rejectedOrder.provider_name} ne peut plus assurer`
                    : 'Le prestataire ne peut plus assurer'
                  }{'\n'}
                  <Text style={styles.serviceName}>{rejectedOrder?.service_name}</Text>
                </>
              ) : (
                <>
                  Désolé, le prestataire n'est pas disponible pour{'\n'}
                  <Text style={styles.serviceName}>{rejectedOrder?.service_name}</Text>
                </>
              )}
            </Text>
            {rejectedOrder?.cancellation_reason && (
              <View style={styles.reasonContainer}>
                <Text style={styles.reasonLabel}>Raison :</Text>
                <Text style={styles.reasonText}>{rejectedOrder.cancellation_reason}</Text>
              </View>
            )}
            <Text style={styles.encourageText}>
              {rejectedOrder?.type === 'cancelled'
                ? '🔍 Nous recherchons un remplaçant pour vous !'
                : 'Ne vous inquiétez pas ! D\'autres prestataires sont disponibles.'
              }
            </Text>

            <TouchableOpacity
              style={styles.newBookingButton}
              onPress={handleFindAnotherProvider}
            >
              <Text style={styles.newBookingButtonText}>
                {rejectedOrder?.type === 'cancelled'
                  ? '🔄 Trouver un autre prestataire'
                  : '🔄 Nouvelle réservation'
                }
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleDismissRejectedModal}
            >
              <Text style={styles.laterButtonText}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...shadows.lg,
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  confirmButton: {
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  laterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  laterButtonText: {
    color: colors.gray[500],
    fontSize: typography.fontSize.sm,
  },

  // Styles spécifiques au modal "en route"
  enRouteModalContent: {
    borderTopWidth: 4,
    borderTopColor: colors.info,
  },
  enRouteIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.info + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  enRouteIcon: {
    fontSize: 40,
  },
  enRouteTitle: {
    color: colors.info,
  },
  enRouteSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  etaContainer: {
    backgroundColor: colors.info + '10',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.md,
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: 4,
  },
  etaValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.info,
  },
  trackButton: {
    backgroundColor: colors.info,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  trackButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },

  // Styles spécifiques au modal de refus
  rejectedModalContent: {
    borderTopWidth: 4,
    borderTopColor: colors.error,
  },
  rejectedIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rejectedIcon: {
    fontSize: 36,
  },
  rejectedTitle: {
    color: colors.error,
  },
  serviceName: {
    fontWeight: typography.fontWeight.bold as any,
    color: colors.gray[900],
  },
  reasonContainer: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
    width: '100%',
  },
  reasonLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: 2,
  },
  reasonText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontStyle: 'italic',
  },
  encourageText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '500',
  },
  newBookingButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  newBookingButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold as any,
  },
});

export default ClientGlobalModals;
