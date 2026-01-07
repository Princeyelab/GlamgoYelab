import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Vibration, Alert } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomTabBar from '../../src/components/navigation/CustomTabBar';
import ChatBot from '../../src/components/features/ChatBot';
import GlobalEmergencyButton from '../../src/components/features/GlobalEmergencyButton';
import PendingOrdersBanner from '../../src/components/features/PendingOrdersBanner';
import { useAppSelector } from '../../src/lib/store/hooks';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { getServiceTranslation } from '../../src/i18n/translations/services';
import { getProviderOrders, acceptOrder, getProviderProfile, getProviderNotifications, markNotificationAsRead } from '../../src/lib/api/providerAPI';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { isOrderInRange } from '../../src/lib/utils/geoUtils';
import { appEvents, EVENTS } from '../../src/lib/utils/eventEmitter';

// Intervalle de polling pour vérifier les nouvelles commandes (10 secondes)
const ORDER_CHECK_INTERVAL = 10000;
// Rayon par défaut si non défini (50 km)
const DEFAULT_RADIUS_KM = 50;

// Clés AsyncStorage pour persister les IDs déjà montrés
const STORAGE_KEY_SHOWN_ORDERS = '@glamgo_provider_shown_order_ids';
const STORAGE_KEY_SHOWN_SATISFACTION = '@glamgo_provider_shown_satisfaction_ids';
const STORAGE_KEY_SHOWN_CANCELLATIONS = '@glamgo_provider_shown_cancellation_ids';

interface NewOrder {
  id: number;
  service_name: string;
  client_name: string;
  address: string;
  price: number;
  scheduled_time: string;
  distance?: number;
}

interface ProviderLocation {
  latitude: number;
  longitude: number;
  interventionRadius: number;
}

interface SatisfactionNotification {
  id: number;
  rating: number;
  tip?: number;
  serviceName?: string;
  clientName?: string;
}

interface CancellationNotification {
  id: number;
  orderId: number;
  serviceName?: string;
  clientName?: string;
  reason?: string;
  fee?: number;
  compensation?: number;
}

export default function ProviderLayout() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const { t, language } = useLanguage();

  // State pour le modal de nouvelle commande
  const [newOrder, setNewOrder] = useState<NewOrder | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState(false);
  const shownOrderIds = useRef<Set<number>>(new Set());

  // State pour le modal de satisfaction
  const [satisfactionNotif, setSatisfactionNotif] = useState<SatisfactionNotification | null>(null);
  const [showSatisfactionModal, setShowSatisfactionModal] = useState(false);
  const shownSatisfactionIds = useRef<Set<number>>(new Set());

  // State pour le modal d'annulation client
  const [cancellationNotif, setCancellationNotif] = useState<CancellationNotification | null>(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const shownCancellationIds = useRef<Set<number>>(new Set());

  // Flag pour savoir si les IDs persistés ont été chargés
  const [idsLoaded, setIdsLoaded] = useState(false);

  // Position du prestataire
  const [providerLocation, setProviderLocation] = useState<ProviderLocation | null>(null);

  // Charger les IDs persistés au démarrage
  useEffect(() => {
    const loadPersistedIds = async () => {
      try {
        const [orderIds, satisfactionIds, cancellationIds] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_SHOWN_ORDERS),
          AsyncStorage.getItem(STORAGE_KEY_SHOWN_SATISFACTION),
          AsyncStorage.getItem(STORAGE_KEY_SHOWN_CANCELLATIONS),
        ]);

        if (orderIds) {
          const ids = JSON.parse(orderIds) as number[];
          shownOrderIds.current = new Set(ids);
        }
        if (satisfactionIds) {
          const ids = JSON.parse(satisfactionIds) as number[];
          shownSatisfactionIds.current = new Set(ids);
        }
        if (cancellationIds) {
          const ids = JSON.parse(cancellationIds) as number[];
          shownCancellationIds.current = new Set(ids);
        }
      } catch (error) {
        // Ignorer les erreurs de chargement
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
      // Ignorer les erreurs de sauvegarde
    }
  }, []);

  // Charger la position du prestataire au démarrage
  useEffect(() => {
    const loadProviderLocation = async () => {
      try {
        // 1. Essayer de récupérer depuis le profil
        const profile = await getProviderProfile();
        if (profile?.latitude && profile?.longitude) {
          setProviderLocation({
            latitude: profile.latitude,
            longitude: profile.longitude,
            interventionRadius: profile.intervention_radius || DEFAULT_RADIUS_KM,
          });
          return;
        }

        // 2. Sinon, utiliser la position actuelle du device
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setProviderLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            interventionRadius: profile?.intervention_radius || DEFAULT_RADIUS_KM,
          });
        }
      } catch (error) {
        // Pas de position disponible - on acceptera toutes les commandes
      }
    };

    if (user) {
      loadProviderLocation();
    }
  }, [user]);

  // Vérifier les nouvelles commandes
  const checkNewOrders = useCallback(async () => {
    // Ne pas vérifier tant que les IDs persistés n'ont pas été chargés
    if (!user || !idsLoaded) return;

    try {
      const orders = await getProviderOrders();

      // Filtrer les commandes pending dans le rayon d'intervention (avec déduplication et expiration)
      const seenIds = new Set<number>();
      const now = Date.now();
      const pendingOrders = (orders || []).filter((o: any) => {
        if (o.status !== 'pending') return false;
        if (seenIds.has(o.id)) return false; // Éviter doublons API
        seenIds.add(o.id);
        if (shownOrderIds.current.has(o.id)) return false;

        // Filtrer les commandes expirées (> 4 minutes)
        if (o.created_at) {
          let createdAtStr = o.created_at;
          if (!createdAtStr.endsWith('Z') && !createdAtStr.includes('+')) {
            createdAtStr = createdAtStr.replace(' ', 'T') + 'Z';
          }
          const elapsed = Math.floor((now - new Date(createdAtStr).getTime()) / 1000);
          if (elapsed >= 240) return false; // Expirée
        }

        // Si on a la position du prestataire, filtrer par distance
        if (providerLocation) {
          const orderLat = o.client_latitude || o.latitude;
          const orderLon = o.client_longitude || o.longitude;

          // Si la commande n'a pas de coordonnées, on l'inclut quand même
          if (!orderLat || !orderLon) return true;

          return isOrderInRange(
            providerLocation.latitude,
            providerLocation.longitude,
            orderLat,
            orderLon,
            providerLocation.interventionRadius
          );
        }

        return true; // Pas de position = on montre tout
      });

      const pendingOrder = pendingOrders[0];

      if (pendingOrder && !showNewOrderModal) {
        const orderAny = pendingOrder as any;

        // Vibrer pour alerter le prestataire
        Vibration.vibrate([0, 500, 200, 500]);

        setNewOrder({
          id: pendingOrder.id,
          service_name: pendingOrder.service?.title || orderAny.service_name || 'Service',
          client_name: orderAny.user_name ||
            `${orderAny.user_first_name || ''} ${orderAny.user_last_name || ''}`.trim() ||
            (pendingOrder.client ? `${pendingOrder.client.first_name || ''} ${pendingOrder.client.last_name || ''}`.trim() : '') ||
            'Client',
          address: pendingOrder.address || orderAny.address_line || '',
          price: orderAny.price || pendingOrder.total_amount || 0,
          scheduled_time: pendingOrder.scheduled_at || '',
        });
        persistId(STORAGE_KEY_SHOWN_ORDERS, pendingOrder.id, shownOrderIds.current);
        setShowNewOrderModal(true);
      }
    } catch (error) {
      // Silently ignore errors
    }
  }, [user, showNewOrderModal, providerLocation, idsLoaded, persistId]);

  // Vérifier les notifications de satisfaction
  const checkSatisfactionNotifications = useCallback(async () => {
    // Ne pas vérifier tant que les IDs persistés n'ont pas été chargés
    if (!user || !idsLoaded) return;

    try {
      const notifications = await getProviderNotifications();

      // Filtrer les notifications de satisfaction non vues
      const satisfactionNotifs = (notifications || []).filter((n: any) => {
        const isCorrectType = n.notification_type === 'satisfaction_received';
        const notShown = !shownSatisfactionIds.current.has(n.id);
        const notRead = !n.is_read;
        return isCorrectType && notShown && notRead;
      });

      const newNotif = satisfactionNotifs[0];

      if (newNotif && !showSatisfactionModal) {
        // Vibrer fortement pour alerter
        Vibration.vibrate([0, 300, 100, 300, 100, 300]);

        // Parser data si c'est une string JSON
        let data = newNotif.data || {};
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            // Ignorer
          }
        }

        setSatisfactionNotif({
          id: newNotif.id,
          rating: data.rating || 5,
          tip: data.tip || 0,
          serviceName: data.service_name,
          clientName: data.client_name,
        });
        persistId(STORAGE_KEY_SHOWN_SATISFACTION, newNotif.id, shownSatisfactionIds.current);
        setShowSatisfactionModal(true);

        // Marquer comme lu
        try {
          await markNotificationAsRead(newNotif.id);
        } catch (e) {
          // Ignorer les erreurs
        }
      }
    } catch (error) {
      // Silently ignore errors
    }
  }, [user, showSatisfactionModal, idsLoaded, persistId]);

  // Vérifier les notifications d'annulation client
  const checkCancellationNotifications = useCallback(async () => {
    if (!user || !idsLoaded) return;

    try {
      const notifications = await getProviderNotifications();

      // Filtrer les notifications d'annulation client non vues
      const cancellationNotifs = (notifications || []).filter((n: any) => {
        const isCorrectType = n.notification_type === 'order_cancelled';
        const notShown = !shownCancellationIds.current.has(n.id);
        const notRead = !n.is_read;
        return isCorrectType && notShown && notRead;
      });

      const newNotif = cancellationNotifs[0];

      if (newNotif && !showCancellationModal && !showNewOrderModal && !showSatisfactionModal) {
        // Vibrer pour alerter
        Vibration.vibrate([0, 400, 150, 400]);

        // Parser data si c'est une string JSON
        let data = newNotif.data || {};
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            // Ignorer
          }
        }

        setCancellationNotif({
          id: newNotif.id,
          orderId: data.order_id,
          serviceName: data.service_name,
          clientName: data.client_name,
          reason: data.reason || data.cancellation_reason,
          fee: data.cancellation_fee,
          compensation: data.total_provider_compensation || data.provider_compensation,
        });
        persistId(STORAGE_KEY_SHOWN_CANCELLATIONS, newNotif.id, shownCancellationIds.current);
        setShowCancellationModal(true);

        // Marquer comme lu
        try {
          await markNotificationAsRead(newNotif.id);
        } catch (e) {
          // Ignorer
        }
      }
    } catch (error) {
      // Silently ignore errors
    }
  }, [user, showCancellationModal, showNewOrderModal, showSatisfactionModal, idsLoaded, persistId]);

  // Polling pour détecter les nouvelles commandes et notifications
  useEffect(() => {
    // Ne démarrer le polling qu'une fois les IDs chargés
    if (!user || !idsLoaded) return;

    // Vérifier immédiatement
    checkNewOrders();
    checkSatisfactionNotifications();
    checkCancellationNotifications();

    // Puis toutes les 10 secondes
    const interval = setInterval(() => {
      checkNewOrders();
      checkSatisfactionNotifications();
      checkCancellationNotifications();
    }, ORDER_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user, idsLoaded, checkNewOrders, checkSatisfactionNotifications, checkCancellationNotifications]);

  // Accepter la commande
  const handleAcceptOrder = async () => {
    if (!newOrder) return;

    setAcceptingOrder(true);
    try {
      await acceptOrder(newOrder.id);
      setShowNewOrderModal(false);
      setNewOrder(null);
      // Rester sur le dashboard - le prestataire peut contacter le client
      // ou cliquer sur "En route" quand il est pret
      Alert.alert(
        `✅ ${t('providerModals.orderAccepted')}`,
        t('providerModals.orderAcceptedMessage'),
        [{ text: t('common.ok') }]
      );
    } catch (error: any) {
      // Afficher un message d'erreur approprié
      const errorMessage = error?.response?.data?.message
        || error?.response?.data?.error
        || t('providerModals.orderUnavailableMessage');

      Alert.alert(t('providerModals.orderUnavailable'), errorMessage);

      // Fermer le modal
      setShowNewOrderModal(false);
      setNewOrder(null);
    } finally {
      setAcceptingOrder(false);
    }
  };

  // Fermer le modal nouvelle commande (voir plus tard)
  const handleDismissModal = () => {
    setShowNewOrderModal(false);
    // Garder l'ID dans shownOrderIds pour ne pas la remontrer
    // L'utilisateur peut aller voir la commande dans le dashboard
  };

  // Fermer le modal de satisfaction
  const handleDismissSatisfactionModal = () => {
    setShowSatisfactionModal(false);
    setSatisfactionNotif(null);
  };

  // Fermer le modal d'annulation
  const handleDismissCancellationModal = () => {
    setShowCancellationModal(false);
    setCancellationNotif(null);
    // Déclencher un rafraîchissement des bookings
    appEvents.emit(EVENTS.REFRESH_PROVIDER_BOOKINGS);
  };

  // Générer les étoiles pour la note
  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  // Formater l'heure
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString(language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} mode="provider" />}
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Tabs visibles */}
        <Tabs.Screen name="index" />
        <Tabs.Screen name="bookings" />
        <Tabs.Screen name="booking" />
        <Tabs.Screen name="profile" />

        {/* Ecrans masques (accessibles via navigation) */}
        <Tabs.Screen name="onboarding" options={{ href: null }} />
        <Tabs.Screen name="earnings" options={{ href: null }} />
        <Tabs.Screen name="services" options={{ href: null }} />
        <Tabs.Screen name="formulas" options={{ href: null }} />
        <Tabs.Screen name="custom-services" options={{ href: null }} />
      </Tabs>

      {/* Modal de nouvelle commande - visible sur toutes les pages */}
      <Modal
        visible={showNewOrderModal && newOrder !== null}
        transparent
        animationType="slide"
        onRequestClose={handleDismissModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalIcon}>🔔</Text>
              <Text style={styles.modalTitle}>{t('providerModals.newOrder')}</Text>
            </View>

            <View style={styles.orderDetails}>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>{t('services.service')}</Text>
                <Text style={styles.orderValue}>{getServiceTranslation(newOrder?.service_name || '', language).title}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>{t('booking.client')}</Text>
                <Text style={styles.orderValue}>{newOrder?.client_name}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>{t('booking.address')}</Text>
                <Text style={styles.orderValue} numberOfLines={2}>{newOrder?.address}</Text>
              </View>
              {newOrder?.scheduled_time && (
                <View style={styles.orderRow}>
                  <Text style={styles.orderLabel}>{t('booking.time')}</Text>
                  <Text style={styles.orderValue}>{formatTime(newOrder.scheduled_time)}</Text>
                </View>
              )}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('services.price')}</Text>
                <Text style={styles.priceValue}>{newOrder?.price} DH</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.laterButton}
                onPress={handleDismissModal}
                disabled={acceptingOrder}
              >
                <Text style={styles.laterButtonText}>{t('providerModals.later')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.acceptButton, acceptingOrder && styles.acceptButtonDisabled]}
                onPress={handleAcceptOrder}
                disabled={acceptingOrder}
              >
                {acceptingOrder ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.acceptButtonText}>✓ {t('provider.accept')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de notification de satisfaction */}
      <Modal
        visible={showSatisfactionModal && satisfactionNotif !== null}
        transparent
        animationType="slide"
        onRequestClose={handleDismissSatisfactionModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.satisfactionModalContent}>
            <View style={styles.satisfactionHeader}>
              <Text style={styles.satisfactionIcon}>🎉</Text>
              <Text style={styles.satisfactionTitle}>{t('providerModals.evaluationReceived')}</Text>
              {satisfactionNotif && satisfactionNotif.tip && satisfactionNotif.tip > 0 ? (
                <Text style={styles.satisfactionTipBadge}>+ {t('providerModals.tip')}</Text>
              ) : null}
            </View>

            <View style={styles.satisfactionBody}>
              <Text style={styles.satisfactionStars}>
                {satisfactionNotif ? renderStars(satisfactionNotif.rating) : ''}
              </Text>
              <Text style={styles.satisfactionRatingText}>
                {satisfactionNotif?.rating}/5
              </Text>

              {satisfactionNotif && satisfactionNotif.tip && satisfactionNotif.tip > 0 ? (
                <View style={styles.tipBox}>
                  <Text style={styles.tipIcon}>💝</Text>
                  <Text style={styles.tipText}>
                    {t('providerModals.clientLeftTip')}{' '}
                    <Text style={styles.tipAmount}>{satisfactionNotif.tip} DH</Text>
                  </Text>
                </View>
              ) : null}

              <Text style={styles.satisfactionMessage}>
                {t('providerMessages.thankYouWork')}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.satisfactionCloseButton}
              onPress={handleDismissSatisfactionModal}
            >
              <Text style={styles.satisfactionCloseButtonText}>{t('providerModals.great')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de notification d'annulation client */}
      <Modal
        visible={showCancellationModal && cancellationNotif !== null}
        transparent
        animationType="slide"
        onRequestClose={handleDismissCancellationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cancellationModalContent}>
            <View style={styles.cancellationHeader}>
              <Text style={styles.cancellationIcon}>❌</Text>
              <Text style={styles.cancellationTitle}>{t('providerModals.orderCancelled')}</Text>
            </View>

            <View style={styles.cancellationBody}>
              {cancellationNotif?.serviceName && (
                <Text style={styles.cancellationService}>
                  {getServiceTranslation(cancellationNotif.serviceName, language).title}
                </Text>
              )}

              {cancellationNotif?.clientName && (
                <Text style={styles.cancellationClient}>
                  {t('providerModals.by')}: {cancellationNotif.clientName}
                </Text>
              )}

              {cancellationNotif?.reason && (
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonLabel}>{t('providerModals.reason')}:</Text>
                  <Text style={styles.reasonText}>{cancellationNotif.reason}</Text>
                </View>
              )}

              {/* Barème des frais d'annulation - toujours visible */}
              <View style={styles.policyBox}>
                <Text style={styles.policyTitle}>{t('providerModals.cancellationPolicyTitle')}</Text>
                <View style={styles.policyRow}>
                  <Text style={styles.policyDot}>•</Text>
                  <Text style={styles.policyText}>{t('providerModals.policyMoreThan2h')}</Text>
                </View>
                <View style={styles.policyRow}>
                  <Text style={styles.policyDot}>•</Text>
                  <Text style={styles.policyText}>{t('providerModals.policy1to2h')}</Text>
                </View>
                <View style={styles.policyRow}>
                  <Text style={styles.policyDot}>•</Text>
                  <Text style={styles.policyText}>{t('providerModals.policyLessThan1h')}</Text>
                </View>
                <View style={styles.policyRow}>
                  <Text style={styles.policyDot}>•</Text>
                  <Text style={styles.policyText}>{t('providerModals.policyNoShow')}</Text>
                </View>
              </View>

              {/* Afficher compensation SEULEMENT si le client a payé des frais (fee > 0) */}
              {cancellationNotif?.fee && cancellationNotif.fee > 0 && cancellationNotif?.compensation && cancellationNotif.compensation > 0 ? (
                <View style={styles.compensationBox}>
                  <Text style={styles.compensationIcon}>💰</Text>
                  <Text style={styles.compensationText}>
                    {t('providerModals.willReceiveCompensation')}{' '}
                    <Text style={styles.compensationAmount}>{cancellationNotif.compensation} DH</Text>
                  </Text>
                </View>
              ) : (
                <View style={styles.freeInfoBox}>
                  <Text style={styles.freeInfoIcon}>ℹ️</Text>
                  <Text style={styles.freeInfoText}>
                    {t('providerModals.freeCancellationExplained')}
                  </Text>
                </View>
              )}

              <Text style={styles.cancellationMessage}>
                {t('providerModals.clientCancelledBooking')}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.cancellationCloseButton}
              onPress={handleDismissCancellationModal}
            >
              <Text style={styles.cancellationCloseButtonText}>{t('providerModals.understood')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Banniere timer pour commandes en attente de reponse */}
      <PendingOrdersBanner />

      {/* ChatBot flottant */}
      <ChatBot />

      {/* Bouton d'urgence global - visible si prestation en cours */}
      <GlobalEmergencyButton isProvider={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing['2xl'],
    ...shadows.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold' as const,
    color: colors.gray[900],
    textAlign: 'center',
  },
  orderDetails: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    flex: 1,
  },
  orderValue: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
    fontWeight: '500' as const,
    flex: 2,
    textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  priceLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    fontWeight: '600' as const,
  },
  priceValue: {
    fontSize: typography.fontSize.xl,
    color: colors.success,
    fontWeight: 'bold' as const,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  laterButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: 'center',
  },
  laterButtonText: {
    color: colors.gray[600],
    fontSize: typography.fontSize.base,
    fontWeight: '600' as const,
  },
  acceptButton: {
    flex: 2,
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: '600' as const,
  },

  // Satisfaction Modal Styles
  satisfactionModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
    ...shadows.lg,
  },
  satisfactionHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  satisfactionIcon: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  satisfactionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold' as const,
    color: colors.gray[900],
    textAlign: 'center',
  },
  satisfactionTipBadge: {
    marginTop: spacing.xs,
    backgroundColor: colors.success + '20',
    color: colors.success,
    fontSize: typography.fontSize.sm,
    fontWeight: '600' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  satisfactionBody: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  satisfactionStars: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  satisfactionRatingText: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold' as const,
    color: colors.warning,
    marginBottom: spacing.lg,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  tipIcon: {
    fontSize: 24,
  },
  tipText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    flex: 1,
  },
  tipAmount: {
    fontWeight: 'bold' as const,
    color: colors.success,
  },
  satisfactionMessage: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
  },
  satisfactionCloseButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['3xl'],
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  satisfactionCloseButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: '600' as const,
  },

  // Cancellation Modal Styles
  cancellationModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
    ...shadows.lg,
  },
  cancellationHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cancellationIcon: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  cancellationTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold' as const,
    color: colors.error,
    textAlign: 'center',
  },
  cancellationBody: {
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xl,
  },
  cancellationService: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600' as const,
    color: colors.gray[900],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  cancellationClient: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  reasonBox: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    width: '100%',
  },
  reasonLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  reasonText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
  },
  policyBox: {
    backgroundColor: colors.warning + '15',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  policyTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600' as const,
    color: colors.gray[800],
    marginBottom: spacing.sm,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  policyDot: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginRight: spacing.xs,
    width: 12,
  },
  policyText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    flex: 1,
  },
  compensationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    width: '100%',
  },
  compensationIcon: {
    fontSize: 24,
  },
  compensationText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    flex: 1,
  },
  compensationAmount: {
    fontWeight: 'bold' as const,
    color: colors.success,
  },
  freeInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '15',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    width: '100%',
  },
  freeInfoIcon: {
    fontSize: 24,
  },
  freeInfoText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    flex: 1,
  },
  cancellationMessage: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
  },
  cancellationCloseButton: {
    backgroundColor: colors.gray[700],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['3xl'],
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  cancellationCloseButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: '600' as const,
  },
});
