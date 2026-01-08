/**
 * Provider Dashboard - GlamGo Mobile
 * Tableau de bord moderne du prestataire
 * Design elegant avec gradients et cartes flottantes
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
  Platform,
  Linking,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { getServiceTranslation } from '../../src/i18n/translations/services';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import CancellationModal from '../../src/components/features/CancellationModal';
import { LanguageSelectorCompact } from '../../src/components/features/LanguageSelector';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import { selectUser, switchRole } from '../../src/lib/store/slices/authSlice';
import { hapticFeedback } from '../../src/lib/utils/haptics';
import {
  getProviderServices,
  getProviderProfile,
  updateProviderProfile,
  getProviderOrders,
  acceptOrder,
  startOrder,
  arriveAtClient,
  cancelOrder,
  completeOrder,
  getProviderEarnings,
  getUnreadNotificationsCount,
  updateProviderLocation,
  ProviderOrder,
} from '../../src/lib/api/providerAPI';
import * as Location from 'expo-location';
import apiClient, { API_BASE_URL } from '../../src/lib/api/client';
import { isOrderInRange } from '../../src/lib/utils/geoUtils';
import { addCancelledOrderId } from '../../src/lib/utils/cancelledOrdersCache';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_RADIUS_KM = 50;

// Day and month names for date formatting
const dayNamesFr = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const monthNamesFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayNamesEs = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const dayNamesDe = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const monthNamesDe = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/**
 * Format date based on language: "Lun 6 Jan - 14:30" (fr), "الإثنين 6 يناير - 14:30" (ar), "Mon 6 Jan - 14:30" (en), "Mo 6 Jan - 14:30" (de)
 */
const formatDateTime = (dateStr: string, timeStr: string, lang: 'fr' | 'ar' | 'en' | 'es' | 'de' = 'fr'): string => {
  const date = new Date(dateStr);
  const dayNames = lang === 'ar' ? dayNamesAr :
                    lang === 'en' ? dayNamesEn :
                    lang === 'es' ? dayNamesEs :
                    lang === 'de' ? dayNamesDe : dayNamesFr;
  const monthNames = lang === 'ar' ? monthNamesAr :
                     lang === 'en' ? monthNamesEn :
                     lang === 'es' ? monthNamesEs :
                     lang === 'de' ? monthNamesDe : monthNamesFr;
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const formattedTime = timeStr.substring(0, 5);
  return `${dayName} ${day} ${month} - ${formattedTime}`;
};

type PeriodType = 'today' | 'week' | 'month';
type BookingStatus = 'pending' | 'accepted' | 'on_way' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

interface BookingService {
  title: string;
  duration_minutes: number;
  price: number;
}

interface BookingUser {
  name: string;
  id: number;
  phone?: string;
}

interface TodayBooking {
  id: number;
  order_number: string;
  status: BookingStatus;
  service: BookingService;
  user: BookingUser;
  booking_date: string;
  booking_time: string;
  address: string;
}

const INITIAL_STATS = {
  today: { bookings: 0, earnings: 0, completed: 0 },
  week: { bookings: 0, earnings: 0, completed: 0 },
  month: { bookings: 0, earnings: 0, completed: 0 },
  rating: 0,
  reviews_count: 0,
  completion_rate: 0,
};

const INITIAL_BOOKINGS: TodayBooking[] = [];

export default function ProviderDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const { t, isRTL, language } = useLanguage();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('today');
  const [bookings, setBookings] = useState<TodayBooking[]>(INITIAL_BOOKINGS);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [isAvailable, setIsAvailable] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeOrderWithMessages, setActiveOrderWithMessages] = useState<number | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellationBooking, setCancellationBooking] = useState<TodayBooking | null>(null);

  const [providerCoords, setProviderCoords] = useState<{ lat: number; lon: number; radius: number } | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const handleUpdateLocation = async () => {
    hapticFeedback.medium();
    setIsUpdatingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('provider.permissionDenied'), t('provider.enableLocation'));
        setIsUpdatingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      await updateProviderLocation(latitude, longitude);

      const reverseGeo = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverseGeo.length > 0) {
        const place = reverseGeo[0];
        const locationName = place.city || place.district || place.region || t('provider.locationUpdated');
        setCurrentLocation(locationName);
      }
      hapticFeedback.success();
    } catch (error) {
      Alert.alert(t('common.error'), t('provider.locationError'));
      hapticFeedback.warning();
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const loadDashboardData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const [ordersData, todayEarnings, weekEarnings, monthEarnings, notifCount, providerProfile] = await Promise.all([
        getProviderOrders().catch(() => []),
        getProviderEarnings('week').catch(() => ({ total: 0, bookings: 0, net: 0 })),
        getProviderEarnings('week').catch(() => ({ total: 0, bookings: 0, net: 0 })),
        getProviderEarnings('month').catch(() => ({ total: 0, bookings: 0, net: 0 })),
        getUnreadNotificationsCount().catch(() => 0),
        getProviderProfile().catch(() => null),
      ]);

      setUnreadNotifications(notifCount);

      const validOrders = (ordersData || []).filter((order: any) => {
        if (order.cancelled_at || order.status === 'cancelled') return false;
        if (order.status === 'pending') {
          if (providerCoords) {
            const orderLat = order.client_latitude || order.latitude;
            const orderLon = order.client_longitude || order.longitude;
            if (orderLat && orderLon) {
              return isOrderInRange(providerCoords.lat, providerCoords.lon, orderLat, orderLon, providerCoords.radius);
            }
          }
          return true;
        }
        if (!order.provider_id) return false;
        return true;
      });

      if (validOrders && validOrders.length > 0) {
        const formattedBookings: TodayBooking[] = validOrders.map((order: ProviderOrder) => {
          const orderAny = order as any;
          const price = orderAny.price || order.total_amount || orderAny.service?.price || 0;

          // Parser scheduled_at correctement (format: "2026-01-04 08:00:00" ou "2026-01-04T08:00:00")
          let bookingDate = new Date().toISOString().split('T')[0];
          let bookingTime = '00:00:00';
          if (order.scheduled_at) {
            // Normaliser: remplacer espace par T
            const normalized = order.scheduled_at.replace(' ', 'T');
            const parts = normalized.split('T');
            if (parts.length >= 2) {
              bookingDate = parts[0];
              bookingTime = parts[1].substring(0, 8);
            }
          }

          return {
            id: order.id,
            order_number: `BK-${order.id}`,
            status: order.status as BookingStatus,
            service: {
              title: order.service?.title || orderAny.service_name || 'Service',
              duration_minutes: 60,
              price: price,
            },
            user: {
              name: orderAny.user_name
                || (orderAny.user_first_name ? `${orderAny.user_first_name} ${orderAny.user_last_name || ''}`.trim() : null)
                || (order.client ? `${order.client.first_name || ''} ${order.client.last_name || ''}`.trim() : null)
                || 'Client',
              id: orderAny.user_id || order.client?.id || 0,
              phone: orderAny.user_phone || order.client?.phone,
            },
            booking_date: bookingDate,
            booking_time: bookingTime,
            address: order.address || orderAny.address_line || '',
          };
        });
        setBookings(formattedBookings);
      } else {
        setBookings([]);
      }

      const today = new Date().toDateString();
      const todayOrders = validOrders.filter((o: ProviderOrder) => {
        if (o.status === 'pending') return true;
        const orderAny = o as any;
        if (o.status === 'completed') {
          const completedDate = new Date(orderAny.completed_at || orderAny.updated_at || o.scheduled_at).toDateString();
          return completedDate === today;
        }
        const orderDate = new Date(o.scheduled_at).toDateString();
        return orderDate === today;
      });

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekOrders = validOrders.filter((o: ProviderOrder) => {
        if (o.status === 'pending') return true;
        const orderAny = o as any;
        if (o.status === 'completed') {
          const completedDate = new Date(orderAny.completed_at || orderAny.updated_at || o.scheduled_at);
          return completedDate >= weekAgo;
        }
        const orderDate = new Date(o.scheduled_at);
        return orderDate >= weekAgo;
      });

      setStats({
        today: {
          bookings: todayOrders.length,
          earnings: todayEarnings.net || 0,
          completed: todayOrders.filter((o: ProviderOrder) => o.status === 'completed').length,
        },
        week: {
          bookings: weekOrders.length,
          earnings: weekEarnings.net || 0,
          completed: weekOrders.filter((o: ProviderOrder) => o.status === 'completed').length,
        },
        month: {
          bookings: validOrders.length,
          earnings: monthEarnings.net || 0,
          completed: validOrders.filter((o: ProviderOrder) => o.status === 'completed').length,
        },
        rating: parseFloat(String(providerProfile?.rating || providerProfile?.average_rating || 0)) || 0,
        reviews_count: parseInt(String(providerProfile?.total_reviews || 0), 10) || 0,
        completion_rate: (() => {
          const acceptedOrders = validOrders.filter((o: ProviderOrder) =>
            o.status !== 'pending' && o.status !== 'cancelled'
          );
          const completedOrders = validOrders.filter((o: ProviderOrder) => o.status === 'completed');
          return acceptedOrders.length > 0
            ? Math.round((completedOrders.length / acceptedOrders.length) * 100)
            : 0;
        })(),
      });
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [providerCoords]);

  const fetchUnreadMessages = useCallback(async () => {
    const timeSinceClick = Date.now() - lastClickTimeRef.current;
    if (timeSinceClick < 10000) return;

    try {
      const ordersData = await getProviderOrders().catch(() => []);
      const ordersWithChat = (ordersData || []).filter((o: any) =>
        ['accepted', 'on_way', 'arrived', 'in_progress', 'completed'].includes(o.status)
      );

      let orderWithUnread: number | null = null;
      for (const order of ordersWithChat) {
        try {
          const chatStatus = await apiClient.get(`/api/orders/${order.id}/chat-status`);
          const unreadCount = chatStatus.data?.data?.unread_count ?? 0;
          if (unreadCount > 0) {
            orderWithUnread = order.id;
            break;
          }
        } catch (e) {}
      }

      setActiveOrderWithMessages(orderWithUnread || (ordersWithChat.length > 0 ? ordersWithChat[0].id : null));

      const response = await apiClient.get('/api/chat/unread-count');
      const count = response.data?.data?.unread_count ?? 0;
      setUnreadMessages(count);
    } catch (error) {}
  }, []);

  const handleMessagesPress = () => {
    if (activeOrderWithMessages) {
      lastClickTimeRef.current = Date.now();
      router.push(`/chat/${activeOrderWithMessages}` as any);
    } else {
      router.push('/(provider)/bookings');
    }
  };

  useFocusEffect(
    useCallback(() => {
      lastClickTimeRef.current = 0;
      loadDashboardData();
      fetchUnreadMessages();

      const ordersInterval = setInterval(() => loadDashboardData(false), 15000);
      const messagesInterval = setInterval(fetchUnreadMessages, 15000);

      return () => {
        clearInterval(ordersInterval);
        clearInterval(messagesInterval);
      };
    }, [loadDashboardData, fetchUnreadMessages])
  );

  const currentStats = stats[selectedPeriod];

  const activeOrder = bookings.find(b =>
    b.status === 'accepted' || b.status === 'on_way' || b.status === 'arrived' || b.status === 'in_progress'
  );
  const hasActiveOrder = !!activeOrder;

  useEffect(() => {
    if (isAvailable) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isAvailable]);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const profile = await getProviderProfile();
        setIsAvailable(profile?.is_available ?? false);

        // Charger la photo de profil
        const photo = profile?.avatar
          || profile?.profile_image
          || (profile as any)?.photo
          || (profile as any)?.profile_photo
          || (profile as any)?.image_url
          || null;

        if (photo) {
          const fullPhotoUrl = photo.startsWith('http') ? photo : `${API_BASE_URL}${photo}`;
          setProfilePhoto(fullPhotoUrl);
        }

        if (profile?.latitude && profile?.longitude) {
          setProviderCoords({
            lat: profile.latitude,
            lon: profile.longitude,
            radius: profile.intervention_radius || DEFAULT_RADIUS_KM,
          });
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setProviderCoords({
              lat: location.coords.latitude,
              lon: location.coords.longitude,
              radius: profile?.intervention_radius || DEFAULT_RADIUS_KM,
            });
          }
        }
      } catch (error) {}
    };
    loadProfileData();
  }, []);

  const handleToggleAvailability = async () => {
    const newStatus = !isAvailable;
    hapticFeedback.medium();
    setIsTogglingAvailability(true);

    try {
      await updateProviderProfile({ is_available: newStatus });
      setIsAvailable(newStatus);
      hapticFeedback.success();
    } catch (error) {
      hapticFeedback.error();
      Alert.alert(t('common.error'), t('provider.availabilityError'));
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const { getToken } = await import('../../src/lib/api/client');
        const token = await getToken();

        if (!token) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const retryToken = await getToken();
          if (!retryToken) {
            Alert.alert('Session non valide', 'Veuillez vous reconnecter.',
              [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
            );
            return;
          }
        }

        const services = await getProviderServices();
        if (!services || services.length === 0) {
          Alert.alert('Configuration requise',
            'Veuillez configurer vos services pour commencer a recevoir des reservations.',
            [{ text: 'Configurer', onPress: () => router.push('/(provider)/onboarding' as any) }]
          );
        }
      } catch (error: any) {
        if (error?.response?.status === 401) {
          Alert.alert('Erreur d\'authentification', 'Votre session semble invalide.',
            [
              { text: 'Reessayer', onPress: () => setHasCheckedOnboarding(false) },
              { text: 'Reconnecter', onPress: () => router.replace('/auth/login') },
            ]
          );
          return;
        }
      } finally {
        setHasCheckedOnboarding(true);
      }
    };

    if (!hasCheckedOnboarding) checkOnboarding();
  }, [hasCheckedOnboarding]);

  const handleSwitchToClient = () => {
    hapticFeedback.medium();
    Alert.alert(t('providerProfile.clientSpace'), t('providerProfile.switchToClientMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), onPress: () => { dispatch(switchRole('user')); router.replace('/(client)'); } },
    ]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    hapticFeedback.light();
    await loadDashboardData(false);
    setIsRefreshing(false);
  };

  const getStatusColor = (status: BookingStatus): 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'on_way': return 'accent';
      case 'arrived': return 'primary';
      case 'in_progress': return 'primary';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: BookingStatus): string => {
    switch (status) {
      case 'pending': return t('provider.statusPending');
      case 'accepted': return t('provider.statusAccepted');
      case 'on_way': return t('provider.statusOnWay');
      case 'arrived': return t('provider.statusArrived');
      case 'in_progress': return t('provider.statusInProgress');
      case 'completed': return t('provider.statusCompleted');
      case 'cancelled': return t('provider.statusCancelled');
      default: return status;
    }
  };

  const handleAcceptBooking = async (id: number) => {
    if (hasActiveOrder && activeOrder) {
      hapticFeedback.warning();
      Alert.alert(t('providerBookings.waitingForAction'),
        `${t('provider.activeBookings')} (#${activeOrder.order_number}).`
      );
      return;
    }

    hapticFeedback.medium();
    try {
      await acceptOrder(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'accepted' as BookingStatus } : b));
      hapticFeedback.success();
      Alert.alert(t('bookingStatus.accepted'), t('providerBookings.startJourneyQuestion'));
    } catch (error: any) {
      hapticFeedback.error();
      Alert.alert(t('common.error'), error?.response?.data?.message || t('errors.generic'));
    }
  };

  const handleRejectBooking = (id: number) => {
    hapticFeedback.warning();
    Alert.alert(t('confirm.rejectOrder'), t('providerBookings.cancelQuestion'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('provider.reject'), style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder(id, 'Refuse par le prestataire');
            // Ajouter au cache pour éviter réapparition
            await addCancelledOrderId(id);
            setBookings(prev => prev.filter(b => b.id !== id));
            hapticFeedback.success();
          } catch (error) {
            Alert.alert(t('common.error'), t('errors.generic'));
          }
        },
      },
    ]);
  };

  const handleCancelAccepted = (id: number) => {
    hapticFeedback.warning();
    Alert.alert(t('bookings.cancelBookingTitle'),
      t('providerBookings.cancelQuestion'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('bookings.yesCancel'), style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(id, 'Annulee par le prestataire');
              // Ajouter au cache pour éviter réapparition
              await addCancelledOrderId(id);
              setBookings(prev => prev.filter(b => b.id !== id));
              hapticFeedback.success();
            } catch (error: any) {
              hapticFeedback.error();
              Alert.alert(t('common.error'), error?.response?.data?.message || t('errors.generic'));
            }
          },
        },
      ]
    );
  };

  const handleOpenCancellationModal = (booking: TodayBooking) => {
    hapticFeedback.warning();
    setCancellationBooking(booking);
    setShowCancellationModal(true);
  };

  const handleCancellationSuccess = async () => {
    if (cancellationBooking) {
      // Ajouter au cache pour éviter réapparition
      await addCancelledOrderId(cancellationBooking.id);
      setBookings(prev => prev.filter(b => b.id !== cancellationBooking.id));
    }
    setShowCancellationModal(false);
    setCancellationBooking(null);
    loadDashboardData(false);
  };

  const handleStartRoute = async (id: number) => {
    hapticFeedback.medium();
    try {
      await startOrder(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'on_way' as BookingStatus } : b));
      router.push(`/(provider)/booking/journey/${id}` as any);
    } catch (error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'on_way' as BookingStatus } : b));
      router.push(`/(provider)/booking/journey/${id}` as any);
    }
  };

  const handleArrived = async (id: number) => {
    hapticFeedback.medium();
    try {
      await arriveAtClient(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'arrived' as BookingStatus } : b));
      hapticFeedback.success();
      Alert.alert(t('provider.statusArrived'), t('notifications.providerArrived'));
    } catch (error: any) {
      hapticFeedback.error();
      Alert.alert(t('common.error'), error?.response?.data?.message || t('errors.generic'));
    }
  };

  const handleCompleteService = async (id: number) => {
    hapticFeedback.medium();
    try {
      await completeOrder(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'completed' as BookingStatus } : b));
      hapticFeedback.success();
    } catch (error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'completed' as BookingStatus } : b));
      hapticFeedback.success();
    }
  };

  const activeBookings = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled');
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

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
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.push('/(provider)/profile')}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(user?.first_name || user?.name || 'P').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={[styles.headerInfo, isRTL && styles.headerInfoRTL]}>
            <Text style={[styles.greeting, isRTL && styles.textRTL]}>{t('provider.hello')},</Text>
            <Text style={[styles.userName, isRTL && styles.textRTL]}>{user?.first_name || user?.name || t('auth.provider')}</Text>
          </View>
          <View style={styles.headerActions}>
            {/* Language Selector */}
            <LanguageSelectorCompact />
            <TouchableOpacity style={styles.headerBtn} onPress={handleMessagesPress}>
              <Text style={styles.headerBtnIcon}>💬</Text>
              {unreadMessages > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{unreadMessages}</Text></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/notifications')}>
              <Text style={styles.headerBtnIcon}>🔔</Text>
              {unreadNotifications > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{unreadNotifications}</Text></View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Availability Toggle */}
        <Animated.View style={[styles.availabilityWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={[styles.availabilityBtn, isAvailable ? styles.availabilityOnline : styles.availabilityOffline]}
            onPress={handleToggleAvailability}
            disabled={isTogglingAvailability}
            activeOpacity={0.8}
          >
            {isTogglingAvailability ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <View style={[styles.statusDot, isAvailable ? styles.dotOnline : styles.dotOffline]} />
                <View style={[styles.availabilityInfo, isRTL && styles.availabilityInfoRTL]}>
                  <Text style={[styles.availabilityStatus, isRTL && styles.textRTL]}>{isAvailable ? t('provider.online') : t('provider.offline')}</Text>
                  <Text style={[styles.availabilityHint, isRTL && styles.textRTL]}>
                    {isAvailable ? t('provider.receivingRequests') : t('provider.tapToGoOnline')}
                  </Text>
                </View>
                <Text style={styles.availabilityEmoji}>{isAvailable ? '🟢' : '⚫'}</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Floating Stats */}
        <View style={[styles.floatingStats, isRTL && styles.rowRTL]}>
          <View style={styles.statItem}>
            <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.statGradient}>
              <Text style={styles.statEmoji}>📋</Text>
              <Text style={styles.statValue}>{activeBookings.length}</Text>
              <Text style={styles.statLabel}>{t('provider.activeBookings')}</Text>
            </LinearGradient>
          </View>
          <View style={styles.statItem}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.statGradient}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>{currentStats.earnings}</Text>
              <Text style={styles.statLabel}>DH</Text>
            </LinearGradient>
          </View>
          <View style={styles.statItem}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.statGradient}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>{stats.reviews_count} {t('provider.reviews')}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Period Selector */}
        <View style={[styles.periodSelector, isRTL && styles.rowRTL]}>
          {(['today', 'week', 'month'] as PeriodType[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodBtn, selectedPeriod === period && styles.periodBtnActive]}
              onPress={() => { hapticFeedback.selection(); setSelectedPeriod(period); }}
            >
              <Text style={[styles.periodBtnText, selectedPeriod === period && styles.periodBtnTextActive]}>
                {period === 'today' ? t('time.today') : period === 'week' ? t('providerEarnings.week') : t('providerEarnings.month')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location Update */}
        <TouchableOpacity
          style={[styles.locationBtn, isRTL && styles.rowRTL]}
          onPress={handleUpdateLocation}
          disabled={isUpdatingLocation}
        >
          {isUpdatingLocation ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <View style={styles.locationIconBg}>
                <Text style={styles.locationIcon}>📍</Text>
              </View>
              <Text style={[styles.locationText, isRTL && styles.textRTL]}>{currentLocation || t('provider.updateLocation')}</Text>
              <Text style={styles.locationArrow}>{isRTL ? '←' : '→'}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Performance Card */}
        <View style={styles.performanceCard}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('provider.performance')}</Text>
          <View style={[styles.performanceGrid, isRTL && styles.rowRTL]}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{stats.completion_rate}%</Text>
              <Text style={styles.performanceLabel}>{t('provider.completion')}</Text>
            </View>
            <View style={styles.performanceDivider} />
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{currentStats.completed}</Text>
              <Text style={styles.performanceLabel}>{t('provider.completed')}</Text>
            </View>
            <View style={styles.performanceDivider} />
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{stats.reviews_count}</Text>
              <Text style={styles.performanceLabel}>{t('provider.reviews')}</Text>
            </View>
          </View>
        </View>

        {/* Active Bookings */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && styles.rowRTL]}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('provider.activeBookings')}</Text>
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount} {t('providerBookings.new')}</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => router.push('/(provider)/bookings')}>
              <Text style={styles.sectionLink}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {activeBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={[styles.emptyTitle, isRTL && styles.textRTL]}>{t('provider.noActiveBooking')}</Text>
              <Text style={[styles.emptySubtext, isRTL && styles.textRTL]}>{t('provider.goOnlineToReceive')}</Text>
            </View>
          ) : (
            activeBookings.map((booking) => (
              <View key={booking.id} style={[styles.bookingCard, styles[`card_${booking.status}`] || {}]}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingTitleRow}>
                    <Text style={styles.bookingService}>{getServiceTranslation(booking.service.title, language).title || booking.service.title}</Text>
                    <Badge color={getStatusColor(booking.status)} size="sm" variant="soft">
                      {getStatusLabel(booking.status)}
                    </Badge>
                  </View>
                  <Text style={styles.bookingOrder}>#{booking.order_number}</Text>
                </View>

                {/* Date & Time */}
                <View style={styles.dateTimeRow}>
                  <Text style={styles.dateTimeIcon}>📅</Text>
                  <Text style={styles.dateTimeText}>
                    {formatDateTime(booking.booking_date, booking.booking_time, language)}
                  </Text>
                </View>

                <View style={styles.bookingClient}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>{booking.user.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{booking.user.name}</Text>
                    {booking.user.phone && (
                      <Text style={styles.clientPhone}>{booking.user.phone}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() => router.push(`/chat/${booking.id}` as any)}
                  >
                    <Text style={styles.chatBtnText}>💬</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.bookingDetails}>
                  <Text style={styles.bookingDetail}>📍 {booking.address}</Text>
                  <Text style={styles.bookingPrice}>💰 {booking.service.price} DH</Text>
                </View>

                <View style={[styles.bookingActions, isRTL && styles.rowRTL]}>
                  {booking.status === 'pending' && (
                    <>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectBooking(booking.id)}>
                        <Text style={styles.rejectBtnText}>{t('provider.reject')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.acceptBtn, hasActiveOrder && styles.btnDisabled]}
                        onPress={() => handleAcceptBooking(booking.id)}
                      >
                        <LinearGradient colors={[colors.success, '#059669']} style={styles.acceptBtnGradient}>
                          <Text style={styles.acceptBtnText}>{hasActiveOrder ? t('providerBookings.waitingForAction') : t('provider.accept')}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  )}

                  {booking.status === 'accepted' && (
                    <View style={styles.acceptedActions}>
                      <View style={[styles.acceptedBtns, isRTL && styles.rowRTL]}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelAccepted(booking.id)}>
                          <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        {booking.user.phone && (
                          <TouchableOpacity
                            style={styles.callBtn}
                            onPress={() => Linking.openURL(`tel:${booking.user.phone}`)}
                          >
                            <Text style={styles.callBtnText}>📞 {t('chat.call') || 'Appeler'}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <TouchableOpacity style={styles.startBtn} onPress={() => handleStartRoute(booking.id)}>
                        <LinearGradient colors={[colors.primary, '#8B5CF6']} style={styles.startBtnGradient}>
                          <Text style={styles.startBtnText}>🚗 {t('provider.startJourney')}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}

                  {booking.status === 'on_way' && (
                    <>
                      <TouchableOpacity style={styles.cancelOnWayBtn} onPress={() => handleOpenCancellationModal(booking)}>
                        <Text style={styles.cancelOnWayBtnText}>{t('common.cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.arrivedBtn} onPress={() => handleArrived(booking.id)}>
                        <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.arrivedBtnGradient}>
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
                    <TouchableOpacity style={styles.completeBtn} onPress={() => handleCompleteService(booking.id)}>
                      <LinearGradient colors={[colors.success, '#059669']} style={styles.completeBtnGradient}>
                        <Text style={styles.completeBtnText}>✅ {t('provider.completeService')}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('provider.quickActions')}</Text>
          <View style={[styles.quickGrid, isRTL && styles.rowRTL]}>
            <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(provider)/bookings')}>
              <View style={[styles.quickIconBg, { backgroundColor: '#3B82F6' + '20' }]}>
                <Text style={styles.quickIcon}>📋</Text>
              </View>
              <Text style={styles.quickLabel}>{t('provider.orders')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(provider)/earnings')}>
              <View style={[styles.quickIconBg, { backgroundColor: colors.success + '20' }]}>
                <Text style={styles.quickIcon}>💰</Text>
              </View>
              <Text style={styles.quickLabel}>{t('provider.revenues')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/settings')}>
              <View style={[styles.quickIconBg, { backgroundColor: '#8B5CF6' + '20' }]}>
                <Text style={styles.quickIcon}>⚙️</Text>
              </View>
              <Text style={styles.quickLabel}>{t('provider.settings')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => Alert.alert(t('provider.help'), 'support@glamgo.ma')}>
              <View style={[styles.quickIconBg, { backgroundColor: '#F59E0B' + '20' }]}>
                <Text style={styles.quickIcon}>❓</Text>
              </View>
              <Text style={styles.quickLabel}>{t('provider.help')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {cancellationBooking && (
        <CancellationModal
          visible={showCancellationModal}
          onClose={() => { setShowCancellationModal(false); setCancellationBooking(null); }}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  greeting: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnIcon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Availability
  availabilityWrapper: {
    marginBottom: spacing.lg,
  },
  availabilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  availabilityOnline: {
    backgroundColor: 'rgba(16,185,129,0.9)',
  },
  availabilityOffline: {
    backgroundColor: 'rgba(75,85,99,0.9)',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  dotOnline: {
    backgroundColor: colors.white,
    shadowColor: colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  dotOffline: {
    backgroundColor: colors.gray[400],
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityStatus: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 1,
  },
  availabilityHint: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  availabilityEmoji: {
    fontSize: 20,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // Floating Stats
  floatingStats: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
  },
  statGradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.md,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: 4,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  periodBtnActive: {
    backgroundColor: colors.primary,
  },
  periodBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[600],
  },
  periodBtnTextActive: {
    color: colors.white,
  },

  // Location
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  locationIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  locationIcon: {
    fontSize: 18,
  },
  locationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontWeight: '500',
  },
  locationArrow: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },

  // Performance
  performanceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  performanceGrid: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  performanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  performanceDivider: {
    width: 1,
    backgroundColor: colors.gray[200],
  },
  performanceValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.primary,
  },
  performanceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },

  // Section
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
    flex: 1,
  },
  sectionLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  pendingBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontWeight: '600',
  },

  // Empty
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },

  // Booking Card
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  card_pending: {
    borderLeftColor: colors.warning,
    backgroundColor: '#FFFBEB',
  },
  card_accepted: {
    borderLeftColor: colors.success,
    backgroundColor: '#F0FDF4',
  },
  card_on_way: {
    borderLeftColor: colors.accent,
    backgroundColor: '#F0FDFA',
  },
  card_arrived: {
    borderLeftColor: '#8B5CF6',
    backgroundColor: '#EDE9FE',
  },
  card_in_progress: {
    borderLeftColor: colors.primary,
    backgroundColor: '#FFF1F2',
  },
  bookingHeader: {
    marginBottom: spacing.md,
  },
  bookingTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookingService: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.gray[900],
  },
  bookingOrder: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
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
    fontSize: 14,
    marginRight: spacing.sm,
  },
  dateTimeText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[800],
  },
  bookingClient: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: spacing.md,
  },
  clientName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  clientPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  bookingTime: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnText: {
    fontSize: 18,
  },
  bookingDetails: {
    marginBottom: spacing.md,
  },
  bookingDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: 4,
  },
  bookingPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  // Buttons
  rejectBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[300],
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
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  acceptedActions: {
    flex: 1,
  },
  acceptedBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
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
  callBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  callBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.gray[700],
  },
  startBtn: {
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
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.error + '15',
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
  },
  cancelOnWayBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.error,
  },
  arrivedBtn: {
    flex: 0.65,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  arrivedBtnGradient: {
    paddingVertical: spacing.sm,
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
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  waitingIcon: {
    fontSize: 20,
  },
  waitingText: {
    fontSize: typography.fontSize.sm,
    color: '#6B21A8',
    fontWeight: '600',
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

  // Quick Actions
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  quickCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickIconBg: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickIcon: {
    fontSize: 24,
  },
  quickLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
  },
  // RTL Styles
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  headerInfoRTL: {
    marginLeft: 0,
    marginRight: spacing.md,
    alignItems: 'flex-end',
  },
  availabilityInfoRTL: {
    alignItems: 'flex-end',
  },
});
