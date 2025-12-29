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
  service_name: string;
  cancellation_reason?: string;
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

  // Flag pour savoir si les IDs persistés ont été chargés
  const [idsLoaded, setIdsLoaded] = useState(false);

  // Charger les IDs persistés au démarrage
  useEffect(() => {
    const loadPersistedIds = async () => {
      try {
        const [rejectedIds, acceptedIds, satisfactionIds] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_REJECTED),
          AsyncStorage.getItem(STORAGE_KEY_ACCEPTED),
          AsyncStorage.getItem(STORAGE_KEY_SATISFACTION),
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

      if (newlyAcceptedOrder && !showAcceptedModal && !showArrivalModal && !showSatisfactionModal) {
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

      // 2. Prestataire arrivé
      const arrivedOrderData = orders.find(
        (o: any) => o.status === 'arrived' && !checkedOrderIds.has(o.id)
      );

      if (arrivedOrderData && !showArrivalModal && !showAcceptedModal && !showSatisfactionModal) {
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

      if (pendingReviewOrder && !showSatisfactionModal && !showArrivalModal && !showAcceptedModal && !showRejectedModal) {
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
      // Ne montrer que les commandes annulées récemment (< 2 minutes)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const rejectedOrderData = orders.find((o: any) => {
        if (o.status !== 'cancelled' || o.cancelled_by !== 'provider') return false;
        if (shownRejectedModalIds.current.has(o.id)) return false;

        // Vérifier si l'annulation est récente
        const cancelledAt = o.cancelled_at || o.updated_at;
        if (cancelledAt) {
          const cancelDate = new Date(cancelledAt);
          if (cancelDate < twoMinutesAgo) return false;
        }
        return true;
      });

      if (rejectedOrderData && !showRejectedModal && !showSatisfactionModal && !showArrivalModal && !showAcceptedModal) {
        setRejectedOrder({
          id: rejectedOrderData.id,
          service_name: rejectedOrderData.service_name || 'votre prestation',
          cancellation_reason: rejectedOrderData.cancellation_reason,
        });
        persistId(STORAGE_KEY_REJECTED, rejectedOrderData.id, shownRejectedModalIds.current);
        Vibration.vibrate([0, 400, 100, 400, 100, 400]);
        setShowRejectedModal(true);
      }
    } catch (error) {
      // Silently ignore
    }
  }, [user, userRole, showArrivalModal, showSatisfactionModal, showAcceptedModal, showRejectedModal, checkedOrderIds, idsLoaded, persistId]);

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

  // Soumettre satisfaction
  const handleSubmitSatisfaction = async (data: SatisfactionData) => {
    if (!satisfactionOrder) return;

    try {
      await submitSatisfaction(satisfactionOrder.id, data);
      Alert.alert('Merci !', 'Votre avis a été enregistré.', [{ text: 'OK' }]);
      setShowSatisfactionModal(false);
      setSatisfactionOrder(null);
      dispatch(fetchBookings());
    } catch (err: any) {
      throw err;
    }
  };

  // Fermer satisfaction
  const handleCloseSatisfactionModal = () => {
    setShowSatisfactionModal(false);
  };

  // Fermer modal de refus et chercher un autre prestataire
  const handleDismissRejectedModal = () => {
    setShowRejectedModal(false);
    setRejectedOrder(null);
  };

  // Chercher un autre prestataire après refus
  const handleFindAnotherProvider = () => {
    setShowRejectedModal(false);
    setRejectedOrder(null);
    router.push('/(client)/services' as any);
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

      {/* Modal Commande Refusée */}
      <Modal
        visible={showRejectedModal && rejectedOrder !== null}
        transparent
        animationType="fade"
        onRequestClose={handleDismissRejectedModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>😔</Text>
            <Text style={styles.modalTitle}>Commande refusée</Text>
            <Text style={styles.modalMessage}>
              Désolé, le prestataire n'est pas disponible pour {rejectedOrder?.service_name}.
            </Text>
            {rejectedOrder?.cancellation_reason && (
              <Text style={styles.modalSubtext}>
                Raison : {rejectedOrder.cancellation_reason}
              </Text>
            )}
            <Text style={styles.modalSubtext}>
              Vous pouvez chercher un autre prestataire disponible.
            </Text>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleFindAnotherProvider}
            >
              <Text style={styles.confirmButtonText}>🔍 Chercher un autre prestataire</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleDismissRejectedModal}
            >
              <Text style={styles.laterButtonText}>Fermer</Text>
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
});

export default ClientGlobalModals;
