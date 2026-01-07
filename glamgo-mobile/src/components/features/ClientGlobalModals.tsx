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
  I18nManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../lib/store/hooks';
import { fetchBookings, updateBookingStatus, removeBooking } from '../../lib/store/slices/bookingsSlice';
import apiClient from '../../lib/api/client';
import { addCancelledOrderId } from '../../lib/utils/cancelledOrdersCache';
import { addSatisfiedOrderId, isOrderSatisfied } from '../../lib/utils/satisfiedOrdersCache';
import { confirmProviderArrival, submitSatisfaction, SatisfactionData } from '../../lib/api/bookingsAPI';
import { SatisfactionModal } from './SatisfactionModal';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { t, isRTL } = useLanguage();
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
        // IMMÉDIATEMENT mettre à jour le statut dans Redux (arrête le timer)
        dispatch(updateBookingStatus({ id: newlyAcceptedOrder.id, status: 'accepted' }));

        setAcceptedOrder({
          id: newlyAcceptedOrder.id,
          provider_name: newlyAcceptedOrder.provider_name ||
            `${newlyAcceptedOrder.provider_first_name || ''} ${newlyAcceptedOrder.provider_last_name || ''}`.trim() ||
            t('modals.aProvider'),
          service_name: newlyAcceptedOrder.service_name || t('modals.yourService'),
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
        // IMMÉDIATEMENT mettre à jour le statut dans Redux
        dispatch(updateBookingStatus({ id: enRouteOrderData.id, status: 'on_way' }));

        setEnRouteOrder({
          id: enRouteOrderData.id,
          provider_name: enRouteOrderData.provider_name ||
            `${enRouteOrderData.provider_first_name || ''} ${enRouteOrderData.provider_last_name || ''}`.trim() ||
            t('modals.yourProvider'),
          service_name: enRouteOrderData.service_name || t('modals.yourService'),
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
        // IMMÉDIATEMENT mettre à jour le statut dans Redux
        dispatch(updateBookingStatus({ id: arrivedOrderData.id, status: 'arrived' }));

        setArrivedOrder({
          id: arrivedOrderData.id,
          provider_name: arrivedOrderData.provider_name ||
            `${arrivedOrderData.provider_first_name || ''} ${arrivedOrderData.provider_last_name || ''}`.trim() ||
            t('modals.yourProvider'),
          service_name: arrivedOrderData.service_name || t('modals.yourService'),
        });
        Vibration.vibrate([0, 500, 200, 500]);
        setShowArrivalModal(true);
      }

      // 3. Fin de service - satisfaction
      const pendingReviewOrder = orders.find(
        (o: any) => o.status === 'completed_pending_review' &&
          !shownSatisfactionModalIds.current.has(o.id) &&
          !isOrderSatisfied(o.id)  // Double vérification avec le cache persisté
      );

      if (pendingReviewOrder && !showSatisfactionModal && !showArrivalModal && !showAcceptedModal && !showRejectedModal && !showEnRouteModal) {
        console.log('🔴 [ClientGlobalModals] FOUND pendingReviewOrder:', pendingReviewOrder.id);

        // VÉRIFIER d'abord si l'évaluation n'a pas déjà été soumise
        try {
          const statusResponse = await apiClient.get(`/api/orders/${pendingReviewOrder.id}/satisfaction-status`);
          const satStatus = statusResponse.data?.data;
          console.log('🔴 [ClientGlobalModals] Satisfaction status:', satStatus);

          if (satStatus?.survey_submitted === true || satStatus?.order_status === 'completed') {
            // Déjà évalué - marquer comme montré et ne pas afficher le modal
            console.log('🟢 [ClientGlobalModals] Order already reviewed - skipping modal');
            persistId(STORAGE_KEY_SATISFACTION, pendingReviewOrder.id, shownSatisfactionModalIds.current);
            dispatch(updateBookingStatus({ id: pendingReviewOrder.id, status: 'completed' }));
            return; // Ne pas afficher le modal
          }
        } catch (statusError: any) {
          // Si erreur 404 ou autre, on continue quand même (l'endpoint peut ne pas exister)
          console.log('🔴 [ClientGlobalModals] Could not check satisfaction status:', statusError?.response?.status);
        }

        // IMMÉDIATEMENT mettre à jour le statut dans Redux
        dispatch(updateBookingStatus({ id: pendingReviewOrder.id, status: 'completed_pending_review' }));

        // Marquer temporairement dans le Set AVANT d'afficher pour éviter double affichage
        // (mais ne PAS persister dans AsyncStorage - ça sera fait APRÈS soumission)
        shownSatisfactionModalIds.current.add(pendingReviewOrder.id);

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
        // NOTE: On ne persiste PAS l'ID ici - seulement APRÈS soumission réussie
        // Cela évite que le modal réapparaisse si l'évaluation échoue puis l'app redémarre
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
              service_name: notifData?.service_name || t('modals.yourService'),
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
            service_name: cancelledOrder.service_name || t('modals.yourService'),
            cancellation_reason: cancelledOrder.cancellation_reason,
          };
          console.log('[ClientGlobalModals] Found rejected order in orders:', rejectedOrderData);
        }
      }

      console.log('[ClientGlobalModals] Final rejectedOrderData:', rejectedOrderData);
      console.log('[ClientGlobalModals] showRejectedModal:', showRejectedModal, 'showSatisfactionModal:', showSatisfactionModal, 'showArrivalModal:', showArrivalModal, 'showAcceptedModal:', showAcceptedModal);

      if (rejectedOrderData && !showRejectedModal && !showSatisfactionModal && !showArrivalModal && !showAcceptedModal && !showEnRouteModal) {
        console.log('[ClientGlobalModals] 🚨 SHOWING REJECTED MODAL for order', rejectedOrderData.id, 'type:', rejectedOrderData.type);

        // IMMÉDIATEMENT ajouter au cache AsyncStorage (plus fiable que Redux)
        addCancelledOrderId(rejectedOrderData.id);

        // IMMÉDIATEMENT mettre à jour le statut dans Redux pour supprimer de "À venir"
        dispatch(updateBookingStatus({ id: rejectedOrderData.id, status: 'cancelled' }));

        setRejectedOrder({
          id: rejectedOrderData.id,
          service_id: rejectedOrderData.service_id,
          service_name: rejectedOrderData.service_name || t('modals.yourService'),
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
  }, [user, userRole, showArrivalModal, showSatisfactionModal, showAcceptedModal, showRejectedModal, showEnRouteModal, checkedOrderIds, idsLoaded, persistId, t]);

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

    const orderId = satisfactionOrder.id;
    console.log('[ClientGlobalModals] Submitting satisfaction for order:', orderId);

    try {
      await submitSatisfaction(orderId, data);

      // Succès - fermer proprement
      await closeSatisfactionModalProperly();

      // Afficher le message et rediriger vers le dashboard
      Alert.alert(
        t('modals.thankYou'),
        t('satisfaction.reviewRecorded'),
        [{
          text: t('satisfaction.backToHome'),
          onPress: () => router.replace('/(client)' as any),
        }]
      );
    } catch (err: any) {
      console.log('[ClientGlobalModals] Error submitting satisfaction:', err);
      const errorMsg = err?.response?.data?.message || '';

      // Si erreur 400 "déjà évalué", fermer proprement et rediriger
      if (err?.response?.status === 400 && errorMsg.toLowerCase().includes('deja')) {
        console.log('[ClientGlobalModals] Already reviewed - closing modal and redirecting');
        // Fermer le modal
        setShowSatisfactionModal(false);
        setSatisfactionOrder(null);
        // Marquer comme montré et persister
        shownSatisfactionModalIds.current.add(orderId);
        await AsyncStorage.setItem(
          STORAGE_KEY_SATISFACTION,
          JSON.stringify(Array.from(shownSatisfactionModalIds.current).slice(-50))
        );
        // IMPORTANT: Ajouter au cache satisfiedOrdersCache (double protection)
        await addSatisfiedOrderId(orderId);
        dispatch(updateBookingStatus({ id: orderId, status: 'completed' }));
        dispatch(fetchBookings());
        // Rediriger immédiatement
        router.replace('/(client)' as any);
        return;
      }

      // Autre erreur 400/422 - fermer aussi pour éviter blocage
      if (err?.response?.status === 400 || err?.response?.status === 422) {
        setShowSatisfactionModal(false);
        setSatisfactionOrder(null);
        dispatch(fetchBookings());
        Alert.alert('Erreur', errorMsg || 'Une erreur est survenue', [{ text: 'OK' }]);
        return;
      }

      // Autres erreurs - propager pour affichage dans le modal
      throw err;
    }
  };

  // Fermer satisfaction proprement (après soumission ou "déjà évalué")
  const closeSatisfactionModalProperly = async () => {
    if (satisfactionOrder) {
      const orderId = satisfactionOrder.id;
      // Marquer comme montré dans le Set mémoire
      shownSatisfactionModalIds.current.add(orderId);
      // Persister dans AsyncStorage (Set local)
      await AsyncStorage.setItem(
        STORAGE_KEY_SATISFACTION,
        JSON.stringify(Array.from(shownSatisfactionModalIds.current).slice(-50))
      );
      // IMPORTANT: Ajouter aussi au cache satisfiedOrdersCache (double protection)
      await addSatisfiedOrderId(orderId);
      // Mettre à jour le statut local
      dispatch(updateBookingStatus({ id: orderId, status: 'completed' }));
    }
    setShowSatisfactionModal(false);
    setSatisfactionOrder(null);
    dispatch(fetchBookings());
  };

  // Fermer satisfaction - permet de fermer si déjà évalué ou erreur
  const handleCloseSatisfactionModal = async () => {
    if (!satisfactionOrder) return;

    const orderId = satisfactionOrder.id;

    // Vérifier si déjà évalué avant de bloquer
    try {
      const statusResponse = await apiClient.get(`/api/orders/${orderId}/satisfaction-status`);
      const satStatus = statusResponse.data?.data;

      if (satStatus?.survey_submitted === true || satStatus?.order_status === 'completed') {
        // Déjà évalué - permettre de fermer
        console.log('[ClientGlobalModals] Already evaluated - allowing close');
        setShowSatisfactionModal(false);
        setSatisfactionOrder(null);
        shownSatisfactionModalIds.current.add(orderId);
        await AsyncStorage.setItem(
          STORAGE_KEY_SATISFACTION,
          JSON.stringify(Array.from(shownSatisfactionModalIds.current).slice(-50))
        );
        // IMPORTANT: Ajouter au cache satisfiedOrdersCache
        await addSatisfiedOrderId(orderId);
        dispatch(updateBookingStatus({ id: orderId, status: 'completed' }));
        dispatch(fetchBookings());
        router.replace('/(client)' as any);
        return;
      }
    } catch (e) {
      console.log('[ClientGlobalModals] Error checking status:', e);
    }

    // Pas encore évalué - afficher le message
    Alert.alert(
      t('satisfaction.mandatoryEvaluation'),
      t('satisfaction.mustEvaluate'),
      [{ text: t('satisfaction.understood'), style: 'default' }]
    );
  };

  // Fermer modal de refus et chercher un autre prestataire
  const handleDismissRejectedModal = () => {
    setShowRejectedModal(false);
    setRejectedOrder(null);
    // Rafraîchir les réservations pour mettre à jour le statut
    dispatch(fetchBookings());
  };

  // Chercher un autre prestataire après refus - rediriger vers nouvelle réservation
  const handleFindAnotherProvider = () => {
    const serviceId = rejectedOrder?.service_id;
    const serviceName = rejectedOrder?.service_name;
    console.log('[ClientGlobalModals] Redirecting - serviceId:', serviceId, 'serviceName:', serviceName);
    console.log('[ClientGlobalModals] Full rejectedOrder:', rejectedOrder);

    setShowRejectedModal(false);
    setRejectedOrder(null);

    // Rafraîchir les réservations pour supprimer la commande annulée de "À venir"
    dispatch(fetchBookings());

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
          <View style={[styles.modalContent, isRTL && styles.modalContentRTL]}>
            <Text style={styles.modalIcon}>🚗</Text>
            <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>{t('modals.providerArrived')}</Text>
            <Text style={[styles.modalMessage, isRTL && styles.textRTL]}>
              {t('modals.arrivedMessage', { providerName: arrivedOrder?.provider_name, serviceName: arrivedOrder?.service_name })}
            </Text>
            <Text style={[styles.modalSubtext, isRTL && styles.textRTL]}>
              {t('modals.confirmArrivalSubtext')}
            </Text>

            <TouchableOpacity
              style={[styles.confirmButton, confirmingArrival && styles.confirmButtonDisabled]}
              onPress={handleConfirmArrival}
              disabled={confirmingArrival}
            >
              {confirmingArrival ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>✓ {t('modals.confirmArrival')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleDismissArrivalModal}
              disabled={confirmingArrival}
            >
              <Text style={styles.laterButtonText}>{t('modals.later')}</Text>
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
          <View style={[styles.modalContent, isRTL && styles.modalContentRTL]}>
            <Text style={styles.modalIcon}>🎉</Text>
            <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>{t('modals.orderAccepted')}</Text>
            <Text style={[styles.modalMessage, isRTL && styles.textRTL]}>
              {t('modals.acceptedMessage', { providerName: acceptedOrder?.provider_name, serviceName: acceptedOrder?.service_name })}
            </Text>
            {acceptedOrder?.booking_time ? (
              <Text style={[styles.modalSubtext, isRTL && styles.textRTL]}>
                {t('modals.appointmentAt', { time: acceptedOrder.booking_time.substring(0, 5) })}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleViewAcceptedOrder}
            >
              <Text style={styles.confirmButtonText}>📍 {t('modals.trackOrder')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleDismissAcceptedModal}
            >
              <Text style={styles.laterButtonText}>{t('modals.close')}</Text>
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
          <View style={[styles.modalContent, styles.enRouteModalContent, isRTL && styles.modalContentRTL]}>
            <View style={styles.enRouteIconContainer}>
              <Text style={styles.enRouteIcon}>🚗</Text>
            </View>
            <Text style={[styles.modalTitle, styles.enRouteTitle, isRTL && styles.textRTL]}>{t('modals.enRoute')}</Text>
            <Text style={[styles.modalMessage, isRTL && styles.textRTL]}>
              {t('modals.enRouteMessage', { providerName: enRouteOrder?.provider_name, serviceName: enRouteOrder?.service_name })}
            </Text>
            {enRouteOrder?.eta_minutes ? (
              <View style={styles.etaContainer}>
                <Text style={[styles.etaLabel, isRTL && styles.textRTL]}>{t('modals.estimatedArrival')}</Text>
                <Text style={styles.etaValue}>{enRouteOrder.eta_minutes} {t('modals.min')}</Text>
              </View>
            ) : null}
            <Text style={[styles.enRouteSubtext, isRTL && styles.textRTL]}>
              {t('modals.prepareForArrival')}
            </Text>

            <TouchableOpacity
              style={styles.trackButton}
              onPress={handleViewEnRouteOrder}
            >
              <Text style={styles.trackButtonText}>📍 {t('modals.trackRealTime')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleDismissEnRouteModal}
            >
              <Text style={styles.laterButtonText}>{t('modals.okUnderstood')}</Text>
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
          <View style={[styles.modalContent, styles.rejectedModalContent, isRTL && styles.modalContentRTL]}>
            <View style={styles.rejectedIconContainer}>
              <Text style={styles.rejectedIcon}>
                {rejectedOrder?.type === 'cancelled' ? '😔' : '❌'}
              </Text>
            </View>
            <Text style={[styles.modalTitle, styles.rejectedTitle, isRTL && styles.textRTL]}>
              {rejectedOrder?.type === 'cancelled'
                ? t('modals.providerUnavailable')
                : t('modals.orderRejected')
              }
            </Text>
            <Text style={[styles.modalMessage, isRTL && styles.textRTL]}>
              {rejectedOrder?.type === 'cancelled' ? (
                <>
                  {rejectedOrder?.provider_name
                    ? t('modals.providerCannotServe', { providerName: rejectedOrder.provider_name, serviceName: rejectedOrder?.service_name })
                    : t('modals.serviceUnavailable', { serviceName: rejectedOrder?.service_name })
                  }
                </>
              ) : (
                <>
                  {t('modals.providerNotAvailable', { serviceName: rejectedOrder?.service_name })}
                </>
              )}
            </Text>
            {rejectedOrder?.cancellation_reason && (
              <View style={[styles.reasonContainer, isRTL && styles.reasonContainerRTL]}>
                <Text style={[styles.reasonLabel, isRTL && styles.textRTL]}>{t('modals.reason')}</Text>
                <Text style={[styles.reasonText, isRTL && styles.textRTL]}>{rejectedOrder.cancellation_reason}</Text>
              </View>
            )}
            <Text style={[styles.encourageText, isRTL && styles.textRTL]}>
              {rejectedOrder?.type === 'cancelled'
                ? t('modals.searchingReplacement')
                : t('modals.otherProvidersAvailable')
              }
            </Text>

            <TouchableOpacity
              style={styles.newBookingButton}
              onPress={handleFindAnotherProvider}
            >
              <Text style={styles.newBookingButtonText}>
                {rejectedOrder?.type === 'cancelled'
                  ? t('modals.findAnotherProvider')
                  : t('modals.newBooking')
                }
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleDismissRejectedModal}
            >
              <Text style={styles.laterButtonText}>{t('modals.later')}</Text>
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
  // RTL Styles
  modalContentRTL: {
    direction: 'rtl',
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  reasonContainerRTL: {
    alignItems: 'flex-end',
  },
});

export default ClientGlobalModals;
