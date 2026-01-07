/**
 * Booking Tracking Screen - GlamGo Mobile
 * Suivi en temps réel du prestataire avec carte
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';
import Loading from '../../../src/components/ui/Loading';
import EmergencyButton from '../../../src/components/features/EmergencyButton';
import CancellationModal from '../../../src/components/features/CancellationModal';
import { colors, spacing, typography, borderRadius, shadows } from '../../../src/lib/constants/theme';
import {
  useLocation,
  calculateDistance,
  formatDistance,
  estimateArrivalTime,
  LocationCoords,
} from '../../../src/lib/hooks/useLocation';
import apiClient from '../../../src/lib/api/client';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { getServiceTranslation } from '../../../src/i18n/translations/services';
import { isOrderCancelled } from '../../../src/lib/utils/cancelledOrdersCache';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Mock provider data - En production, vient du backend via WebSocket
interface ProviderLocation {
  id: number;
  name: string;
  avatar?: string;
  phone: string;
  latitude: number;
  longitude: number;
  heading?: number;
  lastUpdated: string;
}

// Mock booking data
interface BookingData {
  id: number;
  service: {
    id: number;
    title: string;
  };
  provider: ProviderLocation;
  client_location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  scheduled_at: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'on_way' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
}

// Casablanca coordinates (fallback)
const CASABLANCA_CENTER = {
  latitude: 33.5731,
  longitude: -7.5898,
};

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, isRTL, language } = useLanguage();
  const mapRef = useRef<MapView>(null);

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [providerLocation, setProviderLocation] = useState<ProviderLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eta, setEta] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [timeoutRemaining, setTimeoutRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Animation for provider marker
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // User's location
  const { location: userLocation, getCurrentLocation } = useLocation();

  // Load booking data
  useEffect(() => {
    loadBooking();
    getCurrentLocation();
  }, [id]);

  // Rafraichir les donnees periodiquement
  useEffect(() => {
    if (!booking) return;

    // Rafraichir toutes les 10 secondes pour les statuts actifs
    // Inclut 'arrived' pour voir la transition vers 'in_progress'
    if (['pending', 'accepted', 'on_way', 'arrived', 'in_progress'].includes(booking.status)) {
      const interval = setInterval(() => {
        loadBooking();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [booking?.status, id]);

  // Calculate distance and ETA
  useEffect(() => {
    if (providerLocation && booking) {
      const dist = calculateDistance(
        { latitude: providerLocation.latitude, longitude: providerLocation.longitude },
        booking.client_location
      );
      setDistance(dist);
      setEta(estimateArrivalTime(dist, 25)); // 25 km/h average in city
    }
  }, [providerLocation, booking]);

  // Pulse animation for provider marker
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const loadBooking = async () => {
    try {
      // Charger les details de la commande depuis l'API
      const response = await apiClient.get(`/api/orders/${id}`);
      const order = response.data?.data || response.data;

      console.log('[Track] Order loaded:', order);

      if (order) {
        // Construire le nom du prestataire
        const providerName = order.provider_name ||
          [order.provider_first_name, order.provider_last_name].filter(Boolean).join(' ') ||
          t('bookingTrack.provider');

        // Construire l'URL de l'avatar du prestataire
        let providerAvatar = order.provider_avatar || order.avatar;
        console.log('[Track] Provider avatar raw:', order.provider_avatar);
        if (providerAvatar && !providerAvatar.startsWith('http')) {
          providerAvatar = `https://glamgo-api.fly.dev${providerAvatar}`;
        }
        console.log('[Track] Provider avatar final:', providerAvatar);

        // Construire l'adresse
        const address = [order.address_line, order.city].filter(Boolean).join(', ') ||
          order.address || t('bookingTrack.addressNotAvailable');

        // Mapper les donnees
        const bookingData: BookingData = {
          id: order.id,
          service: {
            id: order.service_id,
            title: order.service_name || t('common.service'),
          },
          provider: {
            id: order.provider_id || 0,
            name: providerName,
            avatar: providerAvatar,
            phone: order.provider_phone || '',
            latitude: order.provider_latitude || order.latitude || CASABLANCA_CENTER.latitude,
            longitude: order.provider_longitude || order.longitude || CASABLANCA_CENTER.longitude,
            lastUpdated: new Date().toISOString(),
          },
          client_location: {
            latitude: order.latitude || CASABLANCA_CENTER.latitude,
            longitude: order.longitude || CASABLANCA_CENTER.longitude,
            address: address,
          },
          scheduled_at: order.scheduled_at || order.created_at,
          created_at: order.created_at,
          status: order.status as BookingData['status'],
        };

        setBooking(bookingData);
        setProviderLocation(bookingData.provider);
      }
    } catch (error) {
      console.error('[Track] Error loading booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Compter les messages non lus via chat-status (ne marque pas comme lu)
  const fetchUnreadMessages = async () => {
    try {
      const response = await apiClient.get(`/api/orders/${id}/chat-status`);
      const count = response.data?.data?.unread_count ?? 0;
      setUnreadMessages(count);
    } catch (error) {
      console.log('[Track] Error fetching chat status:', error);
    }
  };

  // Charger les messages non lus au demarrage et periodiquement
  useEffect(() => {
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 10000);
    return () => clearInterval(interval);
  }, [id]);

  // Timer countdown pour commandes pending (4 minutes max)
  useEffect(() => {
    // Vérifier si la commande est annulée dans le cache AsyncStorage
    const bookingId = booking?.id || (id ? parseInt(id) : 0);
    if (bookingId && isOrderCancelled(bookingId)) {
      console.log('[TrackingScreen] Timer stopped - order in cancelled cache:', bookingId);
      setTimeoutRemaining(null);
      setIsExpired(false);
      return;
    }

    if (booking?.status !== 'pending') {
      setTimeoutRemaining(null);
      setIsExpired(false);
      return;
    }

    // Calculer le temps restant depuis la creation
    const calculateRemaining = () => {
      if (!booking?.created_at) return 240; // 4 minutes par defaut

      // Le serveur renvoie un timestamp UTC sans 'Z', on l'ajoute pour forcer UTC
      let createdAtStr = booking.created_at;
      if (!createdAtStr.endsWith('Z') && !createdAtStr.includes('+')) {
        createdAtStr = createdAtStr.replace(' ', 'T') + 'Z';
      }

      const createdAt = new Date(createdAtStr).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - createdAt) / 1000);

      console.log('[Timer] created_at:', booking.created_at, '-> parsed:', createdAtStr, '-> elapsed:', elapsed);

      return Math.max(0, 240 - elapsed); // 240 secondes = 4 minutes
    };

    const initialRemaining = calculateRemaining();
    setTimeoutRemaining(initialRemaining);

    // Si deja expire, marquer comme tel
    if (initialRemaining <= 0) {
      setIsExpired(true);
      loadBooking();
      return;
    }

    // Decompte chaque seconde
    const interval = setInterval(() => {
      setTimeoutRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          // Recharger les donnees pour voir le statut cancelled
          setTimeout(() => loadBooking(), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [booking?.status, booking?.created_at]);

  // Formater le temps restant en MM:SS
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMessage = () => {
    // Reinitialiser le badge et naviguer vers le chat
    setUnreadMessages(0);
    router.push(`/chat/${id}` as any);
  };

  const handleCenterMap = () => {
    if (mapRef.current && providerLocation && booking) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: providerLocation.latitude, longitude: providerLocation.longitude },
          booking.client_location,
        ],
        {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        }
      );
    }
  };

  const getStatusInfo = () => {
    switch (booking?.status) {
      case 'pending':
        return {
          label: t('bookingTrack.statusPending'),
          color: timeoutRemaining !== null && timeoutRemaining < 60 ? colors.error : colors.warning,
          icon: '⏳',
          message: timeoutRemaining !== null
            ? t('bookingTrack.providerHasTime', { time: formatTimeRemaining(timeoutRemaining) })
            : t('bookingTrack.waitingConfirmation'),
          showTimer: true,
        };
      case 'accepted':
        return {
          label: t('bookingTrack.statusAccepted'),
          color: colors.success,
          icon: '✅',
          message: t('bookingTrack.providerAccepted'),
        };
      case 'on_way':
        return {
          label: t('bookingTrack.statusOnWay'),
          color: colors.warning,
          icon: '🚗',
          message: t('bookingTrack.arrivalIn', { minutes: eta }),
        };
      case 'arrived':
        return {
          label: t('bookingTrack.statusArrived'),
          color: colors.success,
          icon: '📍',
          message: t('bookingTrack.providerArrived'),
        };
      case 'in_progress':
        return {
          label: t('bookingTrack.statusInProgress'),
          color: colors.primary,
          icon: '💇',
          message: t('bookingTrack.serviceInProgress'),
        };
      case 'completed':
        return {
          label: t('bookingTrack.statusCompleted'),
          color: colors.gray[500],
          icon: '🎉',
          message: t('bookingTrack.serviceCompleted'),
        };
      case 'cancelled':
        return {
          label: t('bookingTrack.statusCancelled'),
          color: colors.error,
          icon: '❌',
          message: t('bookingTrack.bookingCancelled'),
        };
      default:
        return {
          label: t('bookingTrack.statusPending'),
          color: colors.gray[400],
          icon: '⏳',
          message: t('bookingTrack.waitingConfirmation'),
        };
    }
  };

  if (isLoading) {
    return <Loading fullScreen message={t('bookingTrack.loadingTracking')} />;
  }

  if (!booking || !providerLocation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={[styles.errorText, isRTL && styles.rtlText]}>{t('bookingTrack.bookingNotFound')}</Text>
        <Button variant="outline" onPress={() => router.back()}>
          {t('common.back')}
        </Button>
      </View>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: (providerLocation.latitude + booking.client_location.latitude) / 2,
          longitude: (providerLocation.longitude + booking.client_location.longitude) / 2,
          latitudeDelta: LATITUDE_DELTA * 3,
          longitudeDelta: LONGITUDE_DELTA * 3,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Provider Marker */}
        <Marker
          coordinate={{
            latitude: providerLocation.latitude,
            longitude: providerLocation.longitude,
          }}
          title={providerLocation.name}
          description={t('bookingTrack.provider')}
        >
          <View style={styles.providerMarker}>
            <Animated.View
              style={[
                styles.providerMarkerPulse,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            {providerLocation.avatar ? (
              <Image
                source={{ uri: providerLocation.avatar }}
                style={styles.providerMarkerImage}
              />
            ) : (
              <View style={styles.providerMarkerPlaceholder}>
                <Text style={styles.providerMarkerText}>
                  {providerLocation.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>
        </Marker>

        {/* Client Destination Marker */}
        <Marker
          coordinate={booking.client_location}
          title={t('bookingTrack.yourAddress')}
          description={booking.client_location.address}
        >
          <View style={styles.destinationMarker}>
            <Text style={styles.destinationIcon}>📍</Text>
          </View>
        </Marker>

        {/* Route Line */}
        <Polyline
          coordinates={[
            {
              latitude: providerLocation.latitude,
              longitude: providerLocation.longitude,
            },
            booking.client_location,
          ]}
          strokeColor={colors.primary}
          strokeWidth={4}
          lineDashPattern={[10, 5]}
        />
      </MapView>

      {/* Header Overlay */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>{t('bookingTrack.liveTracking')}</Text>
        <TouchableOpacity style={styles.centerButton} onPress={handleCenterMap}>
          <Text style={styles.centerIcon}>◎</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
          <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
          <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        {/* Timer Countdown pour commandes pending - Vérifie aussi le cache des annulations */}
        {booking.status === 'pending' && !isOrderCancelled(booking.id) && timeoutRemaining !== null && timeoutRemaining > 0 && (
          <View style={[
            styles.timerContainer,
            timeoutRemaining < 60 && styles.timerContainerUrgent,
            isRTL && styles.timerContainerRTL
          ]}>
            <Text style={[styles.timerIcon, isRTL && styles.timerIconRTL]}>⏱️</Text>
            <View style={[styles.timerContent, isRTL && styles.timerContentRTL]}>
              <Text style={[
                styles.timerValue,
                timeoutRemaining < 60 && styles.timerValueUrgent
              ]}>
                {formatTimeRemaining(timeoutRemaining)}
              </Text>
              <Text style={[styles.timerLabel, isRTL && styles.rtlText]}>
                {timeoutRemaining < 60
                  ? t('bookingTrack.expirationImminent')
                  : t('bookingTrack.timeRemaining')}
              </Text>
            </View>
          </View>
        )}

        {/* Provider Info */}
        <View style={styles.providerInfo}>
          {providerLocation.avatar ? (
            <Image
              source={{ uri: providerLocation.avatar }}
              style={styles.providerAvatar}
            />
          ) : (
            <View style={[styles.providerAvatar, styles.providerAvatarPlaceholder]}>
              <Text style={styles.providerAvatarText}>
                {providerLocation.name.charAt(0)}
              </Text>
            </View>
          )}

          <View style={styles.providerDetails}>
            <Text style={styles.providerName}>{providerLocation.name}</Text>
            <Text style={styles.serviceName}>{getServiceTranslation(booking.service.title, language).title}</Text>
          </View>

          <TouchableOpacity style={styles.chatButton} onPress={handleMessage}>
            <Text style={styles.chatButtonIcon}>💬</Text>
            <Text style={styles.chatButtonText}>{t('bookingTrack.chat')}</Text>
            {unreadMessages > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>{unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ETA & Distance */}
        {booking.status === 'on_way' && (
          <View style={[styles.etaContainer, isRTL && styles.etaContainerRTL]}>
            <View style={styles.etaItem}>
              <Text style={styles.etaValue}>{eta}</Text>
              <Text style={styles.etaLabel}>{t('bookingTrack.minutes')}</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaItem}>
              <Text style={styles.etaValue}>{formatDistance(distance)}</Text>
              <Text style={styles.etaLabel}>{t('bookingTrack.remaining')}</Text>
            </View>
          </View>
        )}

        {/* Status Message */}
        <Text style={styles.statusMessage}>{statusInfo.message}</Text>

        {/* Address */}
        <View style={styles.addressContainer}>
          <Text style={styles.addressIcon}>📍</Text>
          <Text style={styles.addressText} numberOfLines={2}>
            {booking.client_location.address}
          </Text>
        </View>

        {/* Cancel Button - visible for cancellable statuses */}
        {['pending', 'accepted', 'on_way'].includes(booking.status) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowCancellationModal(true)}
          >
            <Text style={[styles.cancelButtonText, isRTL && styles.rtlText]}>{t('bookingTrack.cancelBooking')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Emergency Button - Position fixe visible */}
      {['on_way', 'arrived', 'in_progress'].includes(booking.status) && (
        <View style={styles.emergencyContainer}>
          <EmergencyButton
            orderId={booking.id}
            providerName={providerLocation.name}
            isProvider={false}
          />
        </View>
      )}

      {/* Cancellation Modal */}
      <CancellationModal
        visible={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        onSuccess={() => {
          setShowCancellationModal(false);
          router.replace('/(client)/bookings');
        }}
        orderId={booking.id}
        userType="client"
        orderStatus={booking.status}
        providerLocation={providerLocation ? {
          lat: providerLocation.latitude,
          lng: providerLocation.longitude,
        } : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  map: {
    flex: 1,
  },

  // Emergency Button Container
  emergencyContainer: {
    position: 'absolute',
    top: 180,
    right: spacing.lg,
    zIndex: 100,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  backIcon: {
    fontSize: 24,
    color: colors.gray[900],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  centerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  centerIcon: {
    fontSize: 22,
    color: colors.primary,
  },

  // Markers
  providerMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerMarkerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + '30',
  },
  providerMarkerImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: colors.white,
  },
  providerMarkerPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  providerMarkerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  destinationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationIcon: {
    fontSize: 32,
  },

  // Bottom Panel
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    ...shadows.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  statusLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },

  // Timer Countdown
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  timerContainerUrgent: {
    backgroundColor: colors.error + '15',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  timerIcon: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  timerContent: {
    flex: 1,
  },
  timerValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.warning,
  },
  timerValueUrgent: {
    color: colors.error,
  },
  timerLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    marginTop: 2,
  },
  timerProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: colors.warning,
    borderRadius: 2,
  },
  timerProgressUrgent: {
    backgroundColor: colors.error,
  },

  // Provider Info
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  providerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.md,
  },
  providerAvatarPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerAvatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  serviceName: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  chatButtonIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  chatButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  chatBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  chatBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },

  // ETA
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  etaItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  etaValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  etaLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  etaDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[300],
  },

  // Status Message
  statusMessage: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // Address
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  addressIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  addressText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: 20,
  },

  // Cancel Button
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontWeight: '500',
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  // RTL Styles
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  etaContainerRTL: {
    flexDirection: 'row-reverse',
  },
  timerContainerRTL: {
    flexDirection: 'row-reverse',
  },
  timerIconRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  timerContentRTL: {
    alignItems: 'flex-end',
  },
});
