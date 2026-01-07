/**
 * Provider Bookings Management - GlamGo Mobile
 * Design moderne avec gradient header et cartes elegantes
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
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { getServiceTranslation } from '../../src/i18n/translations/services';
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
import { appEvents, EVENTS } from '../../src/lib/utils/eventEmitter';
import CancellationModal from '../../src/components/features/CancellationModal';
import { isOrderCancelled, addCancelledOrderId, initCancelledOrdersCache } from '../../src/lib/utils/cancelledOrdersCache';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Day and month names for date formatting
const dayNamesFr = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const monthNamesFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format date based on language: "Lun 6 Jan - 14:30" (fr), "الإثنين 6 يناير - 14:30" (ar), "Mon 6 Jan - 14:30" (en)
 */
const formatDateTime = (dateStr: string, timeStr: string, lang: 'fr' | 'ar' | 'en' = 'fr'): string => {
  const date = new Date(dateStr);
  const dayNames = lang === 'ar' ? dayNamesAr : lang === 'en' ? dayNamesEn : dayNamesFr;
  const monthNames = lang === 'ar' ? monthNamesAr : lang === 'en' ? monthNamesEn : monthNamesFr;
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const formattedTime = timeStr.substring(0, 5);
  return `${dayName} ${day} ${month} - ${formattedTime}`;
};

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

// Intervalle de polling en ms (10 secondes)
const POLLING_INTERVAL = 10000;

/**
 * Parse une date en format local sans décalage UTC
 * Le backend stocke les dates sans timezone, donc on les parse en local
 */
const parseLocalDateTime = (dateStr: string): { date: string; time: string } => {
  // Format attendu: "2026-01-04 08:00:00" ou "2026-01-04T08:00:00"
  const normalized = dateStr.replace(' ', 'T');
  const d = new Date(normalized);

  // Extraire date et heure en format local
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}:00`
  };
};

// Transformer ProviderOrder en Booking local
const transformOrder = (order: ProviderOrder): Booking => {
  const orderAny = order as any;
  const price = orderAny.price || order.total_amount || orderAny.amount || orderAny.service?.price || 0;

  // Parser la date/heure correctement
  let bookingDate = '';
  let bookingTime = '00:00:00';

  if (order.scheduled_at) {
    const parsed = parseLocalDateTime(order.scheduled_at);
    bookingDate = parsed.date;
    bookingTime = parsed.time;
  } else {
    const now = new Date();
    bookingDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    bookingTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
  }

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
    booking_date: bookingDate,
    booking_time: bookingTime,
    address: order.address || orderAny.address_line || '',
    notes: orderAny.notes || orderAny.client_notes || '',
    created_at: order.created_at,
  };
};

// Tab configuration (labels are translated inside component)
const TAB_CONFIG_BASE: { key: BookingTab; labelKey: string; icon: string; gradient: [string, string] }[] = [
  { key: 'pending', labelKey: 'providerBookings.new', icon: '🆕', gradient: ['#F59E0B', '#D97706'] },
  { key: 'upcoming', labelKey: 'providerBookings.upcoming', icon: '📅', gradient: ['#10B981', '#059669'] },
  { key: 'in_progress', labelKey: 'providerBookings.inProgress', icon: '🔨', gradient: ['#3B82F6', '#1D4ED8'] },
  { key: 'completed', labelKey: 'providerBookings.completed', icon: '✅', gradient: ['#6B7280', '#4B5563'] },
];

export default function ProviderBookingsScreen() {
  const router = useRouter();
  const { t, isRTL, language } = useLanguage();

  // Generate translated tab config
  const TAB_CONFIG = TAB_CONFIG_BASE.map(tab => ({
    ...tab,
    label: t(tab.labelKey as any),
  }));

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

  // State pour le modal d'annulation
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellationBooking, setCancellationBooking] = useState<Booking | null>(null);

  // Refs pour le polling
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  // Ref pour tracker les IDs expirés localement (ne pas re-afficher)
  const localExpiredIdsRef = useRef<Set<number>>(new Set());
  // Note: On utilise maintenant le cache global AsyncStorage (cancelledOrdersCache)
  // au lieu d'un ref local qui se réinitialise à chaque navigation

  // Vérifier si une commande est expirée (> 4 minutes depuis création)
  const isOrderExpired = useCallback((createdAt: string | undefined): boolean => {
    if (!createdAt) return false;
    let createdAtStr = createdAt;
    if (!createdAtStr.endsWith('Z') && !createdAtStr.includes('+')) {
      createdAtStr = createdAtStr.replace(' ', 'T') + 'Z';
    }
    const elapsed = Math.floor((Date.now() - new Date(createdAtStr).getTime()) / 1000);
    return elapsed >= 240;
  }, []);

  // Charger les commandes depuis l'API
  const loadBookings = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);

    try {
      const orders = await getProviderOrders();

      // Debug: Afficher ce que l'API retourne
      console.log('[Bookings] API returned', orders?.length, 'orders');
      console.log('[Bookings] Pending orders:', orders?.filter((o: any) => o.status === 'pending').map((o: any) => ({ id: o.id, status: o.status, service: o.service_name })));

      const validOrders = (orders || []).filter((order: any) => {
        if (order.cancelled_at) return false;
        // Vérifier le cache AsyncStorage global (seule source de vérité)
        if (isOrderCancelled(order.id)) {
          console.log('[Bookings] Filtering cancelled order from cache:', order.id);
          return false;
        }
        // Note: NE PAS filtrer provider_id === null pour les commandes pending
        // car elles n'ont pas encore de prestataire assigné
        if (order.provider_id === null && order.status !== 'pending') return false;
        // Filtrer les commandes pending expirées ou déjà marquées comme expirées localement
        if (order.status === 'pending') {
          if (localExpiredIdsRef.current.has(order.id)) return false;
          if (isOrderExpired(order.created_at)) {
            localExpiredIdsRef.current.add(order.id);
            return false;
          }
        }
        return true;
      });

      const categorized: BookingsState = {
        pending: [],
        upcoming: [],
        in_progress: [],
        completed: [],
      };

      // Set pour tracker les IDs déjà ajoutés et éviter les doublons
      const addedIds = new Set<number>();

      validOrders.forEach((order: any) => {
        // Éviter les doublons
        if (addedIds.has(order.id)) {
          console.log('[Bookings] Duplicate order filtered:', order.id);
          return;
        }
        addedIds.add(order.id);

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
        }
      });

      console.log('[Bookings] Categorized pending count:', categorized.pending.length, 'IDs:', categorized.pending.map(b => b.id));
      setBookings(categorized);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [isOrderExpired]);

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

  // Gerer le changement d'etat de l'app
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        loadBookings(false);
        startPolling();
      } else if (nextAppState.match(/inactive|background/)) {
        stopPolling();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [loadBookings, startPolling, stopPolling]);

  useFocusEffect(
    useCallback(() => {
      // IMPORTANT: Recharger le cache AsyncStorage d'abord pour avoir les IDs annulés à jour
      // (surtout après navigation depuis journey où on a annulé une commande)
      initCancelledOrdersCache().then(() => {
        loadBookings(true);
        startPolling();
      });

      return () => {
        stopPolling();
      };
    }, [loadBookings, startPolling, stopPolling])
  );

  useEffect(() => {
    const unsubscribe = appEvents.on(EVENTS.REFRESH_PROVIDER_BOOKINGS, () => {
      loadBookings(false);
    });
    return unsubscribe;
  }, [loadBookings]);

  // Écouter les annulations (même depuis d'autres écrans comme journey)
  useEffect(() => {
    const unsubscribe = appEvents.on(EVENTS.ORDER_CANCELLED, async (data: { orderId: number; userType: string }) => {
      console.log('[Bookings] Received ORDER_CANCELLED event:', data);
      if (data.userType === 'provider') {
        // Ajouter au cache global AsyncStorage
        await addCancelledOrderId(data.orderId);
        // Rafraîchir immédiatement
        loadBookings(false);
      }
    });
    return unsubscribe;
  }, [loadBookings]);

  const handleRefresh = async () => {
    hapticFeedback.light();
    await loadBookings(true);
  };

  const handleCallClient = (phone: string) => {
    hapticFeedback.light();
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  const handleAcceptBooking = (bookingId: number) => {
    if (hasActiveOrder && activeOrder) {
      hapticFeedback.warning();
      Alert.alert(
        t('providerBookings.waitingForAction'),
        `${t('provider.activeBookings')} (#${activeOrder.order_number}).`,
        [{ text: t('common.ok') }]
      );
      return;
    }

    hapticFeedback.success();
    Alert.alert(
      t('providerBookings.confirmReservation'),
      t('providerBookings.confirmReservation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('provider.accept'),
          onPress: async () => {
            try {
              await acceptOrder(bookingId);
              hapticFeedback.success();
              Alert.alert(t('bookingStatus.accepted'), t('providerBookings.startJourneyQuestion'));
              await loadBookings(false);
            } catch (error: any) {
              hapticFeedback.error();
              const errorMessage = error?.response?.data?.message
                || error?.response?.data?.error
                || t('errors.generic');
              Alert.alert(t('common.error'), errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleRejectBooking = (bookingId: number) => {
    hapticFeedback.warning();
    Alert.alert(
      t('confirm.rejectOrder'),
      t('providerBookings.cancelQuestion'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('provider.reject'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(bookingId, 'Refusée par le prestataire');
              hapticFeedback.success();
              // IMPORTANT: Ajouter au cache AVANT de recharger pour éviter réapparition
              await addCancelledOrderId(bookingId);
              await loadBookings(false);
            } catch (error) {
              hapticFeedback.error();
              Alert.alert(t('common.error'), t('errors.generic'));
            }
          },
        },
      ]
    );
  };

  const handleCancelAcceptedBooking = (bookingId: number) => {
    hapticFeedback.warning();
    Alert.alert(
      t('bookings.cancelBookingTitle'),
      t('providerBookings.cancelQuestion'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('bookings.yesCancel'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(bookingId, 'Annulée par le prestataire');
              hapticFeedback.success();
              // IMPORTANT: Ajouter au cache AVANT de recharger pour éviter réapparition
              await addCancelledOrderId(bookingId);
              await loadBookings(false);
            } catch (error: any) {
              hapticFeedback.error();
              Alert.alert(t('common.error'), error?.response?.data?.message || t('errors.generic'));
            }
          },
        },
      ]
    );
  };

  const handleOpenCancellationModal = (booking: Booking) => {
    hapticFeedback.warning();
    setCancellationBooking(booking);
    setShowCancellationModal(true);
  };

  const handleCancellationSuccess = async () => {
    // Ajouter l'ID au cache global AsyncStorage AVANT de recharger
    if (cancellationBooking) {
      await addCancelledOrderId(cancellationBooking.id);
      console.log('[Bookings] Added to cache:', cancellationBooking.id);
    }
    setShowCancellationModal(false);
    setCancellationBooking(null);
    loadBookings(false);
  };

  const handleStartJourney = async (bookingId: number) => {
    hapticFeedback.medium();
    try {
      await startOrder(bookingId);
      await loadBookings(false);
      router.push(`/(provider)/booking/journey/${bookingId}` as any);
    } catch (error) {
      hapticFeedback.error();
      Alert.alert(t('common.error'), t('errors.generic'));
    }
  };

  const handleArrived = async (bookingId: number) => {
    hapticFeedback.medium();
    try {
      await arriveAtClient(bookingId);
      setBookings(prev => ({
        ...prev,
        in_progress: prev.in_progress.map(b =>
          b.id === bookingId ? { ...b, status: 'arrived' as BookingStatus } : b
        ),
      }));
      hapticFeedback.success();
      Alert.alert(t('provider.statusArrived'), t('notifications.providerArrived'));
    } catch (error: any) {
      hapticFeedback.error();
      Alert.alert(t('common.error'), error?.response?.data?.message || t('errors.generic'));
    }
  };

  const handleCompleteBooking = (bookingId: number) => {
    hapticFeedback.success();
    Alert.alert(
      t('providerBookings.serviceFinished'),
      t('providerBookings.finishServiceQuestion'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          onPress: async () => {
            try {
              await completeOrder(bookingId);
              hapticFeedback.success();
              await loadBookings(false);
            } catch (error) {
              hapticFeedback.error();
              Alert.alert(t('common.error'), t('errors.generic'));
            }
          },
        },
      ]
    );
  };

  const getStatusConfig = (status: BookingStatus) => {
    const config: Record<BookingStatus, { color: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'; label: string; emoji: string }> = {
      pending: { color: 'warning', label: t('providerBookings.new'), emoji: '🆕' },
      accepted: { color: 'success', label: t('provider.statusAccepted'), emoji: '✅' },
      on_way: { color: 'accent', label: t('provider.statusOnWay'), emoji: '🚗' },
      arrived: { color: 'primary', label: t('provider.statusArrived'), emoji: '📍' },
      in_progress: { color: 'primary', label: t('provider.statusInProgress'), emoji: '🔨' },
      completed: { color: 'default', label: t('provider.statusCompleted'), emoji: '✓' },
      cancelled: { color: 'error', label: t('provider.statusCancelled'), emoji: '✕' },
    };
    return config[status];
  };

  // Get translated tab labels
  const getTabLabel = (key: BookingTab): string => {
    switch (key) {
      case 'pending': return t('providerBookings.new');
      case 'upcoming': return t('providerBookings.upcoming');
      case 'in_progress': return t('providerBookings.inProgress');
      case 'completed': return t('providerBookings.completed');
      default: return key;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  // Calculer le temps restant pour repondre (4 minutes = 240 secondes)
  const calculateTimeoutRemaining = (createdAt: string | undefined): number => {
    if (!createdAt) return 240;

    // Le serveur renvoie un timestamp UTC sans 'Z', on l'ajoute pour forcer UTC
    let createdAtStr = createdAt;
    if (!createdAtStr.endsWith('Z') && !createdAtStr.includes('+')) {
      createdAtStr = createdAtStr.replace(' ', 'T') + 'Z';
    }

    const created = new Date(createdAtStr).getTime();
    const elapsed = Math.floor((Date.now() - created) / 1000);
    return Math.max(0, 240 - elapsed);
  };

  // Formater le temps restant en MM:SS
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // State pour forcer le re-render du timer chaque seconde
  const [timerTick, setTimerTick] = useState(0);

  // Ref pour tracker les IDs dont on a déjà montré l'alerte d'expiration
  const expiredAlertShownRef = useRef<Set<number>>(new Set());

  // Effet pour mettre a jour le timer chaque seconde quand il y a des pending
  // ET supprimer automatiquement les commandes expirées
  useEffect(() => {
    if (bookings.pending.length === 0) return;

    const interval = setInterval(() => {
      setTimerTick(prev => prev + 1);

      // Vérifier les commandes expirées et les supprimer automatiquement
      // Utiliser la même logique UTC que calculateTimeoutRemaining
      const now = Date.now();
      const expiredIds: number[] = [];

      bookings.pending.forEach(booking => {
        if (booking.created_at) {
          // Parser correctement en UTC comme calculateTimeoutRemaining
          let createdAtStr = booking.created_at;
          if (!createdAtStr.endsWith('Z') && !createdAtStr.includes('+')) {
            createdAtStr = createdAtStr.replace(' ', 'T') + 'Z';
          }
          const createdAt = new Date(createdAtStr).getTime();
          const elapsed = Math.floor((now - createdAt) / 1000);
          if (elapsed >= 240 && !expiredAlertShownRef.current.has(booking.id)) {
            expiredIds.push(booking.id);
          }
        }
      });

      // Si des commandes ont expiré, les supprimer de la liste
      if (expiredIds.length > 0) {
        console.log('[Bookings] Auto-removing expired orders:', expiredIds);

        // Marquer comme traité pour ne pas re-afficher l'alerte
        expiredIds.forEach(id => expiredAlertShownRef.current.add(id));

        setBookings(prev => ({
          ...prev,
          pending: prev.pending.filter(b => !expiredIds.includes(b.id))
        }));

        // Afficher une notification simple (une seule fois)
        Alert.alert(
          t('provider.orderExpired'),
          t('provider.orderExpiredMessage'),
          [{ text: t('common.ok') }]
        );

        // Rafraîchir depuis le serveur pour synchroniser
        loadBookings(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bookings.pending.length, bookings.pending]);

  const getCardGradient = (status: BookingStatus): [string, string] => {
    switch (status) {
      case 'pending': return ['#FFFBEB', '#FEF3C7'];
      case 'accepted': return ['#F0FDF4', '#DCFCE7'];
      case 'on_way': return ['#F0FDFA', '#CCFBF1'];
      case 'arrived': return ['#EDE9FE', '#DDD6FE'];
      case 'in_progress': return ['#FFF1F2', '#FFE4E6'];
      case 'completed': return ['#F9FAFB', '#F3F4F6'];
      default: return ['#FFFFFF', '#FFFFFF'];
    }
  };

  const renderBookingCard = ({ item: booking }: { item: Booking }) => {
    const statusConfig = getStatusConfig(booking.status);
    const cardGradient = getCardGradient(booking.status);

    return (
      <LinearGradient
        colors={cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bookingCard}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.serviceName}>{getServiceTranslation(booking.service.title, language).title || booking.service.title}</Text>
            <Text style={styles.orderNumber}>#{booking.order_number}</Text>
          </View>
          <Badge color={statusConfig.color} size="sm" variant="soft">
            {statusConfig.emoji} {statusConfig.label}
          </Badge>
        </View>

        {/* Date & Time */}
        <View style={styles.dateTimeRow}>
          <Text style={styles.dateTimeIcon}>📅</Text>
          <Text style={styles.dateTimeText}>
            {formatDateTime(booking.booking_date, booking.booking_time, language)}
          </Text>
          <Text style={styles.durationBadge}>{booking.service.duration_minutes} {t('common.min')}</Text>
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
            {booking.user.phone && (
              <Text style={styles.clientPhone}>{booking.user.phone}</Text>
            )}
          </View>
          {booking.user.phone && (
            <TouchableOpacity
              style={styles.phoneButton}
              onPress={() => handleCallClient(booking.user.phone)}
            >
              <Text style={styles.phoneButtonIcon}>📞</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => router.push(`/chat/${booking.id}` as any)}
          >
            <Text style={styles.chatButtonIcon}>💬</Text>
          </TouchableOpacity>
        </View>

        {/* Details */}
        <View style={styles.detailsSection}>
          <View style={[styles.detailRow, isRTL && styles.rowRTL]}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={[styles.detailText, isRTL && styles.textRTL]} numberOfLines={1}>{booking.address}</Text>
          </View>
          <View style={[styles.priceRow, isRTL && styles.rowRTL]}>
            <Text style={[styles.priceLabel, isRTL && styles.textRTL]}>{t('providerBookings.amount')}</Text>
            <Text style={styles.priceValue}>{booking.service.price} DH</Text>
          </View>
        </View>

        {/* Notes du client */}
        {booking.notes && (
          <View style={styles.notesSection}>
            <Text style={[styles.notesLabel, isRTL && styles.textRTL]}>📝 {t('providerBookings.clientNotes')}:</Text>
            <Text style={[styles.notesText, isRTL && styles.textRTL]}>{booking.notes}</Text>
          </View>
        )}

        {/* Timer Countdown pour pending - Vérifie aussi le cache des annulations */}
        {booking.status === 'pending' && !isOrderCancelled(booking.id) && (() => {
          const remaining = calculateTimeoutRemaining(booking.created_at);
          // Ne pas afficher si temps <= 0
          if (remaining <= 0) return null;
          const isUrgent = remaining < 60;
          const progressPercent = Math.round((remaining / 240) * 100);

          return (
            <View style={[styles.timerContainer, isUrgent && styles.timerContainerUrgent, isRTL && styles.rowRTL]}>
              <Text style={styles.timerIcon}>⏱️</Text>
              <View style={styles.timerContent}>
                <Text style={[styles.timerValue, isUrgent && styles.timerValueUrgent]}>
                  {formatTimeRemaining(remaining)}
                </Text>
                <Text style={[styles.timerLabel, isRTL && styles.textRTL]}>
                  {isUrgent ? t('providerBookings.respondQuickly') : t('providerBookings.toRespond')}
                </Text>
                <View style={styles.timerProgressContainer}>
                  <View
                    style={[
                      styles.timerProgress,
                      { width: `${progressPercent}%` },
                      isUrgent && styles.timerProgressUrgent
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })()}

        {/* Actions */}
        <View style={[styles.actionsSection, isRTL && styles.rowRTL]}>
          {booking.status === 'pending' && (
            <>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleRejectBooking(booking.id)}
              >
                <Text style={styles.rejectBtnText}>{t('provider.reject')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.acceptBtn, hasActiveOrder && styles.btnDisabled]}
                onPress={() => handleAcceptBooking(booking.id)}
              >
                <LinearGradient
                  colors={hasActiveOrder ? ['#9CA3AF', '#6B7280'] : ['#10B981', '#059669']}
                  style={styles.acceptBtnGradient}
                >
                  <Text style={styles.acceptBtnText}>
                    {hasActiveOrder ? t('providerBookings.waitingForAction') : t('provider.accept')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {booking.status === 'accepted' && (
            <>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancelAcceptedBooking(booking.id)}
              >
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => handleStartJourney(booking.id)}
              >
                <LinearGradient
                  colors={[colors.primary, '#8B5CF6']}
                  style={styles.startBtnGradient}
                >
                  <Text style={styles.startBtnText}>🚗 {t('provider.startJourney')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {booking.status === 'on_way' && (
            <>
              <TouchableOpacity
                style={styles.cancelOnWayBtn}
                onPress={() => handleOpenCancellationModal(booking)}
              >
                <Text style={styles.cancelOnWayBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.arrivedBtn}
                onPress={() => handleArrived(booking.id)}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#6D28D9']}
                  style={styles.arrivedBtnGradient}
                >
                  <Text style={styles.arrivedBtnText}>📍 {t('provider.arrived')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {booking.status === 'arrived' && (
            <View style={[styles.waitingCard, isRTL && styles.rowRTL]}>
              <Text style={styles.waitingIcon}>⏳</Text>
              <Text style={[styles.waitingText, isRTL && styles.textRTL]}>{t('providerBookings.waitingForAction')}</Text>
            </View>
          )}

          {booking.status === 'in_progress' && (
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => handleCompleteBooking(booking.id)}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.completeBtnGradient}
              >
                <Text style={styles.completeBtnText}>✅ {t('provider.completeService')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {booking.status === 'completed' && booking.rating && (
            <View style={[styles.ratingCard, isRTL && styles.rowRTL]}>
              <Text style={[styles.ratingLabel, isRTL && styles.textRTL]}>{t('provider.rating')}</Text>
              <Text style={styles.ratingStars}>{'⭐'.repeat(booking.rating)}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    );
  };

  const currentBookings = bookings[activeTab];
  const totalActive = bookings.pending.length + bookings.upcoming.length + bookings.in_progress.length;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[colors.primary, '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={[styles.headerContent, isRTL && styles.rowRTL]}>
          <View style={[styles.headerLeft, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{t('providerBookings.myRequests')}</Text>
            <Text style={[styles.headerSubtitle, isRTL && styles.textRTL]}>{totalActive} {t('providerBookings.activeOrders')}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerRefreshBtn}
            onPress={handleRefresh}
          >
            <Text style={styles.headerRefreshIcon}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Summary */}
        <View style={[styles.statsSummary, isRTL && styles.rowRTL]}>
          {TAB_CONFIG.map((tab) => (
            <View key={tab.key} style={styles.statItem}>
              <Text style={styles.statIcon}>{tab.icon}</Text>
              <Text style={styles.statValue}>{bookings[tab.key].length}</Text>
              <Text style={styles.statLabel}>{getTabLabel(tab.key)}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabsWrapper}>
        <View style={[styles.tabsContainer, isRTL && styles.rowRTL]}>
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = bookings[tab.key].length;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => {
                  hapticFeedback.selection();
                  setActiveTab(tab.key);
                }}
                activeOpacity={0.7}
              >
                {isActive ? (
                  <LinearGradient
                    colors={tab.gradient}
                    style={[styles.tabGradient, isRTL && styles.rowRTL]}
                  >
                    <Text style={styles.tabIcon}>{tab.icon}</Text>
                    <Text style={styles.tabTextActive}>{getTabLabel(tab.key)}</Text>
                    {count > 0 && (
                      <View style={styles.tabBadgeActive}>
                        <Text style={styles.tabBadgeTextActive}>{count}</Text>
                      </View>
                    )}
                  </LinearGradient>
                ) : (
                  <View style={[styles.tabInner, isRTL && styles.rowRTL]}>
                    <Text style={styles.tabText}>{getTabLabel(tab.key)}</Text>
                    {count > 0 && (
                      <View style={styles.tabBadge}>
                        <Text style={styles.tabBadgeText}>{count}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
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
            <View style={styles.emptyIconWrapper}>
              <LinearGradient
                colors={TAB_CONFIG.find(t => t.key === activeTab)?.gradient || ['#6B7280', '#4B5563']}
                style={styles.emptyIconGradient}
              >
                <Text style={styles.emptyIcon}>
                  {TAB_CONFIG.find(t => t.key === activeTab)?.icon}
                </Text>
              </LinearGradient>
            </View>
            <Text style={[styles.emptyTitle, isRTL && styles.textRTL]}>
              {activeTab === 'pending' ? t('providerBookings.noNewRequests') :
               activeTab === 'upcoming' ? t('providerBookings.noUpcoming') :
               activeTab === 'in_progress' ? t('providerBookings.noInProgress') :
               t('providerBookings.noCompleted')}
            </Text>
            <Text style={[styles.emptyText, isRTL && styles.textRTL]}>
              {activeTab === 'pending'
                ? t('provider.goOnlineToReceive')
                : t('bookings.noBookings')}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      {/* Modal d'annulation */}
      {cancellationBooking && (
        <CancellationModal
          visible={showCancellationModal}
          onClose={() => {
            setShowCancellationModal(false);
            setCancellationBooking(null);
          }}
          onSuccess={handleCancellationSuccess}
          orderId={cancellationBooking.id}
          userType="provider"
          orderStatus={cancellationBooking.status}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {},
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerRefreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRefreshIcon: {
    fontSize: 20,
  },

  // Stats Summary
  statsSummary: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },

  // Tabs
  tabsWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: 4,
    ...shadows.md,
  },
  tab: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  tabActive: {},
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 4,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 4,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[600],
  },
  tabTextActive: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.white,
  },
  tabBadge: {
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  tabBadgeTextActive: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },

  // List
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
  },

  // Booking Card
  bookingCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
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
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 2,
  },
  orderNumber: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },

  // Date & Time Row
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  dateTimeIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  dateTimeText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[800],
  },
  durationBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },

  // Client
  clientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: spacing.md,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  clientInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  clientName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  clientTime: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  clientPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  phoneButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  phoneButtonIcon: {
    fontSize: 20,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonIcon: {
    fontSize: 20,
  },

  // Details
  detailsSection: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  detailText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  priceValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Notes
  notesSection: {
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  notesLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[800],
    fontStyle: 'italic',
  },

  // Timestamp
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: spacing.md,
  },

  // Timer Countdown
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  timerContainerUrgent: {
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error + '50',
  },
  timerIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  timerContent: {
    flex: 1,
  },
  timerValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.warning,
  },
  timerValueUrgent: {
    color: colors.error,
  },
  timerLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
  },
  timerProgressContainer: {
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 2,
  },
  timerProgressUrgent: {
    backgroundColor: colors.error,
  },

  // Actions
  actionsSection: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
  },
  acceptBtn: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  acceptBtnGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  cancelBtn: {
    flex: 0.4,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.error + '15',
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.error,
  },
  startBtn: {
    flex: 0.6,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  startBtnGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  startBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.white,
  },
  cancelOnWayBtn: {
    flex: 0.35,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.error + '15',
    borderWidth: 2,
    borderColor: colors.error,
    alignItems: 'center',
  },
  cancelOnWayBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.error,
  },
  arrivedBtn: {
    flex: 0.65,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  arrivedBtnGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  arrivedBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  waitingCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
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
  completeBtn: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  completeBtnGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  completeBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.white,
  },

  // Rating
  ratingCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  ratingLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  ratingStars: {
    fontSize: typography.fontSize.base,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrapper: {
    marginBottom: spacing.lg,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  // RTL Styles
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
});
