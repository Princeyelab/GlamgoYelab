/**
 * Provider Bookings Management - GlamGo Mobile
 * Gestion complète des commandes du prestataire
 * Connecte aux vraies APIs avec polling pour synchronisation
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { hapticFeedback } from '../../src/lib/utils/haptics';
import {
  getProviderOrders,
  acceptOrder,
  startOrder,
  arriveAtClient,
  completeOrder,
  cancelOrder,
  ProviderOrder,
} from '../../src/lib/api/providerAPI';

// Types
type BookingTab = 'pending' | 'upcoming' | 'in_progress' | 'completed';
type BookingStatus = 'pending' | 'accepted' | 'on_way' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

interface BookingService {
  title: string;
  duration_minutes: number;
  price: number;
}

interface BookingUser {
  name: string;
  phone: string;
  avatar: string | null;
}

interface Booking {
  id: number;
  order_number: string;
  status: BookingStatus;
  service: BookingService;
  user: BookingUser;
  booking_date: string;
  booking_time: string;
  address: string;
  notes?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  rating?: number;
}

interface BookingsState {
  pending: Booking[];
  upcoming: Booking[];
  in_progress: Booking[];
  completed: Booking[];
}

// Donnees initiales vides pour nouveau prestataire
const INITIAL_BOOKINGS: BookingsState = {
  pending: [],
  upcoming: [],
  in_progress: [],
  completed: [],
};

// Intervalle de polling en ms (10 secondes)
const POLLING_INTERVAL = 10000;

// Transformer ProviderOrder en Booking local
const transformOrder = (order: ProviderOrder): Booking => {
  const scheduledDate = order.scheduled_at ? new Date(order.scheduled_at) : new Date();
  // Prix: priorite a 'price' (champ DB), puis total_amount, puis service.price
  const orderAny = order as any;
  const price = orderAny.price || order.total_amount || orderAny.amount || orderAny.service?.price || 0;

  return {
    id: order.id,
    order_number: `BK-${order.id}`,
    status: order.status as BookingStatus,
    service: {
      title: order.service?.title || orderAny.service_name || 'Service',
      duration_minutes: orderAny.duration || 60,
      price: price,
    },
    user: {
      name: orderAny.user_name
        || (order.client ? `${order.client.first_name || ''} ${order.client.last_name || ''}`.trim() : '')
        || (orderAny.user_first_name ? `${orderAny.user_first_name} ${orderAny.user_last_name || ''}`.trim() : '')
        || 'Client',
      phone: order.client?.phone || orderAny.user_phone || '',
      avatar: null,
    },
    booking_date: scheduledDate.toISOString().split('T')[0],
    booking_time: scheduledDate.toTimeString().substring(0, 8),
    address: order.address || orderAny.address_line || '',
    created_at: order.created_at,
  };
};

export default function ProviderBookingsScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<BookingTab>('pending');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingsState>({
    pending: [],
    upcoming: [],
    in_progress: [],
    completed: [],
  });

  // Verifier si le prestataire a deja une commande active
  const activeOrder = [...bookings.upcoming, ...bookings.in_progress].find(b =>
    b.status === 'accepted' || b.status === 'on_way' || b.status === 'in_progress'
  );
  const hasActiveOrder = !!activeOrder;

  // Refs pour le polling
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  // Charger les commandes depuis l'API
  const loadBookings = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);

    try {
      const orders = await getProviderOrders();

      // Filtrer les commandes valides (non annulees et assignees a ce prestataire)
      const validOrders = (orders || []).filter((order: any) => {
        // Exclure les commandes annulees (cancelled_at renseigne)
        if (order.cancelled_at) return false;
        // Exclure les commandes sans provider_id (pas encore assignees)
        if (order.provider_id === null) return false;
        return true;
      });

      // Categoriser les commandes par statut
      const categorized: BookingsState = {
        pending: [],
        upcoming: [],
        in_progress: [],
        completed: [],
      };

      validOrders.forEach((order: any) => {
        const booking = transformOrder(order);
        switch (order.status) {
          case 'pending':
            categorized.pending.push(booking);
            break;
          case 'accepted':
            categorized.upcoming.push(booking);
            break;
          case 'on_way':
          case 'arrived':
          case 'in_progress':
            categorized.in_progress.push(booking);
            break;
          case 'completed':
            categorized.completed.push(booking);
            break;
          // Les 'cancelled' sont deja exclues par le filtre
        }
      });

      setBookings(categorized);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      // Garder les donnees vides en cas d'erreur
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  // Demarrer le polling
  const startPolling = useCallback(() => {
    if (pollingInterval.current) return;
    pollingInterval.current = setInterval(() => {
      loadBookings(false);
    }, POLLING_INTERVAL);
  }, [loadBookings]);

  // Arreter le polling
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  // Gerer le changement d'etat de l'app (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App revient en foreground - recharger et redemarrer le polling
        loadBookings(false);
        startPolling();
      } else if (nextAppState.match(/inactive|background/)) {
        // App passe en background - arreter le polling
        stopPolling();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [loadBookings, startPolling, stopPolling]);

  // Charger au montage et quand l'ecran devient actif
  useFocusEffect(
    useCallback(() => {
      loadBookings(true);
      startPolling();

      return () => {
        stopPolling();
      };
    }, [loadBookings, startPolling, stopPolling])
  );

  const handleRefresh = async () => {
    hapticFeedback.light();
    await loadBookings(true);
  };

  const handleCallClient = (phone: string) => {
    hapticFeedback.light();
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  const handleAcceptBooking = (bookingId: number) => {
    // Bloquer si une commande est deja active
    if (hasActiveOrder && activeOrder) {
      hapticFeedback.warning();
      Alert.alert(
        '⚠️ Commande en cours',
        `Vous avez déjà une commande active (#${activeOrder.order_number} - ${activeOrder.service.title}).\n\nTerminez-la avant d'en accepter une nouvelle.`,
        [{ text: 'Compris' }]
      );
      return;
    }

    hapticFeedback.success();
    Alert.alert(
      'Accepter la réservation',
      'Confirmez-vous cette réservation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            try {
              // Appel API reel
              await acceptOrder(bookingId);
              hapticFeedback.success();
              Alert.alert('✅ Commande acceptée', 'Vous pouvez maintenant démarrer le trajet.');
              // Recharger les donnees
              await loadBookings(false);
            } catch (error: any) {
              console.error('Erreur acceptation:', error);
              hapticFeedback.error();

              // Afficher le message d'erreur du backend
              const errorMessage = error?.response?.data?.message
                || error?.response?.data?.error
                || 'Impossible d\'accepter la commande. Elle a peut-être déjà été prise.';

              Alert.alert('Erreur', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleRejectBooking = (bookingId: number) => {
    hapticFeedback.warning();
    Alert.alert(
      'Refuser la réservation',
      'Êtes-vous sûr ? Le client sera notifié.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              // Appel API reel - utiliser cancelOrder pour refuser
              await cancelOrder(bookingId, 'Refusee par le prestataire');
              hapticFeedback.success();
              // Recharger les donnees
              await loadBookings(false);
            } catch (error) {
              console.error('Erreur refus:', error);
              hapticFeedback.error();
              Alert.alert('Erreur', 'Impossible de refuser la commande. Reessayez.');
              // Fallback local
              setBookings(prev => ({
                ...prev,
                pending: prev.pending.filter(b => b.id !== bookingId),
              }));
            }
          },
        },
      ]
    );
  };

  const handleStartJourney = async (bookingId: number) => {
    hapticFeedback.medium();
    try {
      // Appel API reel
      await startOrder(bookingId);
      // Recharger les donnees
      await loadBookings(false);
      // Navigate to journey tracking screen
      router.push(`/(provider)/booking/journey/${bookingId}` as any);
    } catch (error) {
      console.error('Erreur demarrage trajet:', error);
      hapticFeedback.error();
      Alert.alert('Erreur', 'Impossible de demarrer le trajet. Reessayez.');
      // Fallback local
      const booking = bookings.upcoming.find(b => b.id === bookingId);
      if (booking) {
        setBookings(prev => ({
          ...prev,
          upcoming: prev.upcoming.filter(b => b.id !== bookingId),
          in_progress: [...prev.in_progress, {
            ...booking,
            status: 'on_way' as BookingStatus,
            started_at: new Date().toISOString(),
          }],
        }));
        router.push(`/(provider)/booking/journey/${bookingId}` as any);
      }
    }
  };

  const handleArrived = async (bookingId: number) => {
    console.log('[BOOKINGS] handleArrived called for booking:', bookingId);
    hapticFeedback.medium();
    try {
      console.log('[BOOKINGS] Calling arriveAtClient...');
      await arriveAtClient(bookingId);
      console.log('[BOOKINGS] arriveAtClient success');
      // Mettre a jour le statut local vers 'arrived'
      setBookings(prev => ({
        ...prev,
        in_progress: prev.in_progress.map(b =>
          b.id === bookingId ? { ...b, status: 'arrived' as BookingStatus } : b
        ),
      }));
      hapticFeedback.success();
      Alert.alert(
        '📍 Arrivée signalée',
        'Le client a été notifié. Attendez sa confirmation pour démarrer la prestation.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('[BOOKINGS] arriveAtClient error:', error);
      hapticFeedback.error();
      Alert.alert('Erreur', error?.response?.data?.message || 'Impossible de signaler votre arrivée');
    }
  };

  const handleCompleteBooking = (bookingId: number) => {
    hapticFeedback.success();
    Alert.alert(
      'Terminer le service',
      'Le service est-il terminé ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, terminer',
          onPress: async () => {
            try {
              // Appel API reel
              await completeOrder(bookingId);
              hapticFeedback.success();
              // Recharger les donnees
              await loadBookings(false);
            } catch (error) {
              console.error('Erreur completion:', error);
              hapticFeedback.error();
              Alert.alert('Erreur', 'Impossible de terminer la commande. Reessayez.');
              // Fallback local
              const booking = bookings.in_progress.find(b => b.id === bookingId);
              if (booking) {
                setBookings(prev => ({
                  ...prev,
                  in_progress: prev.in_progress.filter(b => b.id !== bookingId),
                  completed: [...prev.completed, {
                    ...booking,
                    status: 'completed' as BookingStatus,
                    completed_at: new Date().toISOString(),
                  }],
                }));
              }
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: BookingStatus) => {
    const config: Record<BookingStatus, { color: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'; label: string }> = {
      pending: { color: 'warning', label: '⏳ Nouveau' },
      accepted: { color: 'success', label: '✅ Accepté' },
      on_way: { color: 'accent', label: '🚗 En route' },
      arrived: { color: 'success', label: '📍 Arrivé' },
      in_progress: { color: 'primary', label: '🔨 En cours' },
      completed_pending_review: { color: 'warning', label: '⭐ Avis en attente' },
      completed: { color: 'default', label: '✓ Terminé' },
      cancelled: { color: 'error', label: '✕ Annulé' },
    };
    return config[status];
  };

  const formatRelativeTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  const getCardStyle = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return styles.cardPending;
      case 'accepted':
        return styles.cardAccepted;
      case 'on_way':
        return styles.cardOnWay;
      case 'arrived':
        return styles.cardArrived;
      case 'in_progress':
        return styles.cardInProgress;
      case 'completed':
        return styles.cardCompleted;
      default:
        return {};
    }
  };

  const renderBookingCard = ({ item: booking }: { item: Booking }) => {
    const statusConfig = getStatusBadge(booking.status);

    return (
      <Card style={[styles.bookingCard, getCardStyle(booking.status)]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.serviceName}>{booking.service.title}</Text>
            <Text style={styles.orderNumber}>#{booking.order_number}</Text>
          </View>
          <Badge color={statusConfig.color} size="sm" variant="soft">
            {statusConfig.label}
          </Badge>
        </View>

        {/* Client */}
        <View style={styles.clientSection}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientAvatarText}>
              {booking.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{booking.user.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => router.push(`/chat/${booking.id}` as any)}
          >
            <Text style={styles.chatButtonText}>💬 Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Details - Compact */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailRow}>
            🕐 {booking.booking_time.substring(0, 5)} • {booking.service.duration_minutes} min
          </Text>
          <Text style={styles.detailRow} numberOfLines={1}>📍 {booking.address}</Text>
          <Text style={styles.price}>💰 {booking.service.price} DH</Text>
        </View>

        {/* Timestamps */}
        {booking.created_at && activeTab === 'pending' && (
          <Text style={styles.timestamp}>
            Reçue {formatRelativeTime(booking.created_at)}
          </Text>
        )}
        {booking.started_at && activeTab === 'in_progress' && (
          <Text style={styles.timestamp}>
            Démarré {formatRelativeTime(booking.started_at)}
          </Text>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          {booking.status === 'pending' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => handleRejectBooking(booking.id)}
                style={styles.rejectButton}
                textStyle={styles.rejectButtonText}
              >
                Refuser
              </Button>
              <Button
                variant="primary"
                size="sm"
                onPress={() => handleAcceptBooking(booking.id)}
                style={[styles.acceptButton, hasActiveOrder && styles.buttonDisabled]}
              >
                {hasActiveOrder ? '🔒 Terminez d\'abord' : 'Accepter'}
              </Button>
            </>
          )}

          {booking.status === 'accepted' && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => handleStartJourney(booking.id)}
              fullWidth
            >
              🚗 Démarrer le trajet
            </Button>
          )}

          {booking.status === 'on_way' && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => handleArrived(booking.id)}
              fullWidth
            >
              📍 Je suis arrivé
            </Button>
          )}

          {booking.status === 'arrived' && (
            <View style={styles.waitingConfirmation}>
              <Text style={styles.waitingIcon}>⏳</Text>
              <Text style={styles.waitingText}>En attente de confirmation du client</Text>
            </View>
          )}

          {booking.status === 'in_progress' && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => handleCompleteBooking(booking.id)}
              fullWidth
            >
              ✅ Terminer le service
            </Button>
          )}

          {booking.status === 'completed' && booking.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Note client :</Text>
              <Text style={styles.ratingStars}>{'⭐'.repeat(booking.rating)}</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const tabs: { key: BookingTab; label: string; count: number }[] = [
    { key: 'pending', label: 'Nouveaux', count: bookings.pending.length },
    { key: 'upcoming', label: 'À venir', count: bookings.upcoming.length },
    { key: 'in_progress', label: 'En cours', count: bookings.in_progress.length },
    { key: 'completed', label: 'Terminés', count: bookings.completed.length },
  ];

  const currentBookings = bookings[activeTab];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes Commandes</Text>
        <Text style={styles.subtitle}>
          {bookings.pending.length + bookings.upcoming.length + bookings.in_progress.length} actives
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => {
              hapticFeedback.selection();
              setActiveTab(tab.key);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[
                styles.tabBadge,
                activeTab === tab.key && styles.tabBadgeActive,
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  activeTab === tab.key && styles.tabBadgeTextActive,
                ]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={currentBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'pending' ? '⏳' :
               activeTab === 'upcoming' ? '📅' :
               activeTab === 'in_progress' ? '🔨' : '✓'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'pending' ? 'Aucune nouvelle demande' :
               activeTab === 'upcoming' ? 'Aucune réservation à venir' :
               activeTab === 'in_progress' ? 'Aucun service en cours' :
               'Aucun service terminé'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'pending'
                ? 'Les nouvelles demandes apparaîtront ici'
                : 'Cette section est vide pour le moment'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 4,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    gap: 4,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[600],
  },
  tabTextActive: {
    color: colors.white,
  },
  tabBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: colors.white,
  },
  tabBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabBadgeTextActive: {
    color: colors.primary,
  },

  // List
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  // Booking Card
  bookingCard: {
    marginBottom: spacing.md,
  },
  cardPending: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  cardAccepted: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  cardOnWay: {
    backgroundColor: '#F0FDFA',
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  cardArrived: {
    backgroundColor: '#EDE9FE',
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  cardInProgress: {
    backgroundColor: '#FFF1F2',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cardCompleted: {
    backgroundColor: colors.gray[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.gray[400],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },

  // Client
  clientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray[100],
    marginBottom: spacing.md,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  chatButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  chatButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: '600',
  },

  // Details
  detailsSection: {
    gap: 6,
    marginBottom: spacing.md,
  },
  detailRow: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
  notesContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  notesLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    marginBottom: 4,
    fontWeight: '600',
  },
  notesText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[800],
    fontStyle: 'italic',
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.sm,
  },

  // Timestamp
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: spacing.md,
  },

  // Actions
  actionsSection: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  rejectButtonText: {
    color: colors.gray[700],
  },
  acceptButton: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: colors.gray[400],
  },

  // Rating
  ratingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
  },
  ratingLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginRight: spacing.sm,
  },
  ratingStars: {
    fontSize: typography.fontSize.base,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
  },

  // Waiting Confirmation
  waitingConfirmation: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  waitingIcon: {
    fontSize: 20,
  },
  waitingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: '#6B21A8',
  },
});
