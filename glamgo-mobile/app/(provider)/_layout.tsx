import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Vibration, Alert } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import CustomTabBar from '../../src/components/navigation/CustomTabBar';
import ChatBot from '../../src/components/features/ChatBot';
import GlobalEmergencyButton from '../../src/components/features/GlobalEmergencyButton';
import { useAppSelector } from '../../src/lib/store/hooks';
import { getProviderOrders, acceptOrder, getProviderProfile, getProviderNotifications, markNotificationAsRead } from '../../src/lib/api/providerAPI';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { isOrderInRange } from '../../src/lib/utils/geoUtils';

// Intervalle de polling pour vérifier les nouvelles commandes (10 secondes)
const ORDER_CHECK_INTERVAL = 10000;
// Rayon par défaut si non défini (50 km)
const DEFAULT_RADIUS_KM = 50;

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

export default function ProviderLayout() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  // State pour le modal de nouvelle commande
  const [newOrder, setNewOrder] = useState<NewOrder | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState(false);
  const shownOrderIds = useRef<Set<number>>(new Set());

  // State pour le modal de satisfaction
  const [satisfactionNotif, setSatisfactionNotif] = useState<SatisfactionNotification | null>(null);
  const [showSatisfactionModal, setShowSatisfactionModal] = useState(false);
  const shownSatisfactionIds = useRef<Set<number>>(new Set());

  // Position du prestataire
  const [providerLocation, setProviderLocation] = useState<ProviderLocation | null>(null);

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
    if (!user) return;

    try {
      const orders = await getProviderOrders();

      // Filtrer les commandes pending dans le rayon d'intervention
      const pendingOrders = (orders || []).filter((o: any) => {
        if (o.status !== 'pending') return false;
        if (shownOrderIds.current.has(o.id)) return false;

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
        shownOrderIds.current.add(pendingOrder.id);
        setShowNewOrderModal(true);
      }
    } catch (error) {
      // Silently ignore errors
    }
  }, [user, showNewOrderModal, providerLocation]);

  // Vérifier les notifications de satisfaction
  const checkSatisfactionNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const notifications = await getProviderNotifications();

      // Filtrer les notifications de satisfaction non vues
      const satisfactionNotifs = (notifications || []).filter((n: any) => {
        if (n.notification_type !== 'satisfaction_received') return false;
        if (shownSatisfactionIds.current.has(n.id)) return false;
        if (n.is_read) return false;
        return true;
      });

      const newNotif = satisfactionNotifs[0];

      if (newNotif && !showSatisfactionModal) {
        // Vibrer fortement pour alerter
        Vibration.vibrate([0, 300, 100, 300, 100, 300]);

        const data = newNotif.data || {};
        setSatisfactionNotif({
          id: newNotif.id,
          rating: data.rating || 5,
          tip: data.tip || 0,
          serviceName: data.service_name,
          clientName: data.client_name,
        });
        shownSatisfactionIds.current.add(newNotif.id);
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
  }, [user, showSatisfactionModal]);

  // Polling pour détecter les nouvelles commandes et notifications
  useEffect(() => {
    if (!user) return;

    // Vérifier immédiatement
    checkNewOrders();
    checkSatisfactionNotifications();

    // Puis toutes les 10 secondes
    const interval = setInterval(() => {
      checkNewOrders();
      checkSatisfactionNotifications();
    }, ORDER_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user, checkNewOrders, checkSatisfactionNotifications]);

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
        '✅ Commande acceptée',
        'Vous pouvez maintenant contacter le client ou cliquer sur "En route" quand vous êtes prêt à partir.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      // Afficher un message d'erreur approprié
      const errorMessage = error?.response?.data?.message
        || error?.response?.data?.error
        || 'Cette commande n\'est plus disponible (déjà prise ou annulée)';

      Alert.alert('Commande indisponible', errorMessage);

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

  // Générer les étoiles pour la note
  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  // Formater l'heure
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
              <Text style={styles.modalTitle}>Nouvelle commande !</Text>
            </View>

            <View style={styles.orderDetails}>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Service</Text>
                <Text style={styles.orderValue}>{newOrder?.service_name}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Client</Text>
                <Text style={styles.orderValue}>{newOrder?.client_name}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Adresse</Text>
                <Text style={styles.orderValue} numberOfLines={2}>{newOrder?.address}</Text>
              </View>
              {newOrder?.scheduled_time && (
                <View style={styles.orderRow}>
                  <Text style={styles.orderLabel}>Heure</Text>
                  <Text style={styles.orderValue}>{formatTime(newOrder.scheduled_time)}</Text>
                </View>
              )}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Prix</Text>
                <Text style={styles.priceValue}>{newOrder?.price} DH</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.laterButton}
                onPress={handleDismissModal}
                disabled={acceptingOrder}
              >
                <Text style={styles.laterButtonText}>Plus tard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.acceptButton, acceptingOrder && styles.acceptButtonDisabled]}
                onPress={handleAcceptOrder}
                disabled={acceptingOrder}
              >
                {acceptingOrder ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.acceptButtonText}>✓ Accepter</Text>
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
              <Text style={styles.satisfactionTitle}>Evaluation recue !</Text>
              {satisfactionNotif?.tip && satisfactionNotif.tip > 0 && (
                <Text style={styles.satisfactionTipBadge}>+ Pourboire</Text>
              )}
            </View>

            <View style={styles.satisfactionBody}>
              <Text style={styles.satisfactionStars}>
                {satisfactionNotif ? renderStars(satisfactionNotif.rating) : ''}
              </Text>
              <Text style={styles.satisfactionRatingText}>
                {satisfactionNotif?.rating}/5
              </Text>

              {satisfactionNotif?.tip && satisfactionNotif.tip > 0 && (
                <View style={styles.tipBox}>
                  <Text style={styles.tipIcon}>💝</Text>
                  <Text style={styles.tipText}>
                    Le client vous a laisse un pourboire de{' '}
                    <Text style={styles.tipAmount}>{satisfactionNotif.tip} DH</Text>
                  </Text>
                </View>
              )}

              <Text style={styles.satisfactionMessage}>
                Merci pour votre excellent travail !
              </Text>
            </View>

            <TouchableOpacity
              style={styles.satisfactionCloseButton}
              onPress={handleDismissSatisfactionModal}
            >
              <Text style={styles.satisfactionCloseButtonText}>Super !</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
});
