/**
 * Provider Journey Mode - GlamGo Mobile
 * Ecran de suivi en temps reel pendant le trajet vers le client
 * Design moderne avec gradients et cartes elegantes
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import EmergencyButton from '../../../../src/components/features/EmergencyButton';
import CancellationModal from '../../../../src/components/features/CancellationModal';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../src/lib/constants/theme';
import { hapticFeedback } from '../../../../src/lib/utils/haptics';
import { useLanguage } from '../../../../src/contexts/LanguageContext';
import { getServiceTranslation } from '../../../../src/i18n/translations/services';
import {
  getProviderOrderDetail,
  arriveAtClient,
  completeOrder,
  updateProviderLocation,
  ProviderOrder,
} from '../../../../src/lib/api/providerAPI';
import { appEvents, EVENTS } from '../../../../src/lib/utils/eventEmitter';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type JourneyStatus = 'on_way' | 'arrived' | 'in_progress' | 'completed';

interface BookingDetails {
  id: number;
  clientName: string;
  clientPhone: string;
  clientAvatar: string;
  service: string;
  address: string;
  scheduledTime: string;
  price: number;
  notes?: string;
  clientLocation: {
    latitude: number;
    longitude: number;
  };
}

const INITIAL_BOOKING: BookingDetails = {
  id: 0,
  clientName: '',
  clientPhone: '',
  clientAvatar: '',
  service: '',
  address: '',
  scheduledTime: '',
  price: 0,
  notes: '',
  clientLocation: {
    latitude: 33.5731,
    longitude: -7.5898,
  },
};

// Status configuration gradients (titles are in translations)
const STATUS_GRADIENTS: Record<JourneyStatus, {
  icon: string;
  gradient: [string, string];
}> = {
  on_way: {
    icon: '🚗',
    gradient: ['#3B82F6', '#1D4ED8'],
  },
  arrived: {
    icon: '📍',
    gradient: ['#8B5CF6', '#6D28D9'],
  },
  in_progress: {
    icon: '✂️',
    gradient: [colors.primary, '#BE185D'],
  },
  completed: {
    icon: '✅',
    gradient: ['#10B981', '#059669'],
  },
};

export default function JourneyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, isRTL, language } = useLanguage();
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get status title from translations
  const getStatusTitle = (statusKey: JourneyStatus): string => {
    const titles: Record<JourneyStatus, string> = {
      on_way: t('journeyScreen.statusOnWay'),
      arrived: t('journeyScreen.statusArrived'),
      in_progress: t('journeyScreen.statusInProgress'),
      completed: t('journeyScreen.statusCompleted'),
    };
    return titles[statusKey];
  };

  const [status, setStatus] = useState<JourneyStatus>('on_way');
  const [booking, setBooking] = useState<BookingDetails>(INITIAL_BOOKING);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [providerLocation, setProviderLocation] = useState({
    latitude: 33.5631,
    longitude: -7.5998,
  });
  const [eta, setEta] = useState(0);
  const [distance, setDistance] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  // Charger les donnees de la reservation depuis l'API
  useEffect(() => {
    const loadBookingData = async () => {
      if (!id) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      try {
        const orderData = await getProviderOrderDetail(parseInt(id, 10));

        if (!orderData || !orderData.id) {
          setHasError(true);
          setIsLoading(false);
          return;
        }

        const clientLat = orderData.client_latitude || orderData.latitude || 33.5731;
        const clientLng = orderData.client_longitude || orderData.longitude || -7.5898;

        const clientName = orderData.user_name
          || (orderData.user_first_name && orderData.user_last_name
              ? `${orderData.user_first_name} ${orderData.user_last_name}`
              : orderData.user_first_name)
          || orderData.client?.name
          || orderData.client_name
          || 'Client';

        const price = orderData.price || orderData.total || orderData.amount || orderData.service?.price || 0;

        const bookingData: BookingDetails = {
          id: orderData.id,
          clientName: clientName,
          clientPhone: orderData.user_phone || orderData.client?.phone || orderData.client_phone || '',
          clientAvatar: clientName.substring(0, 2).toUpperCase(),
          service: orderData.service?.title || orderData.service_name || 'Service',
          address: orderData.address || orderData.client_address || t('journeyScreen.addressNotSpecified'),
          scheduledTime: orderData.start_time || orderData.scheduled_time || '',
          price: price,
          notes: orderData.notes || orderData.client_notes,
          clientLocation: {
            latitude: clientLat,
            longitude: clientLng,
          },
        };

        setBooking(bookingData);

        if (orderData.status === 'cancelled') {
          setIsCancelled(true);
        } else if (orderData.status === 'in_progress' || orderData.status === 'started') {
          setStatus('in_progress');
        } else if (orderData.status === 'completed' || orderData.status === 'completed_pending_review') {
          setStatus('completed');
        } else if (orderData.status === 'arrived') {
          setStatus('arrived');
        } else if (orderData.status === 'on_way') {
          setStatus('on_way');
        }
      } catch (error: any) {
        console.error('Erreur chargement reservation:', error);

        if (error?.response?.status === 403) {
          Alert.alert(
            t('journeyScreen.orderUnavailable'),
            t('journeyScreen.orderNoLongerAccessible'),
            [{ text: t('journeyScreen.back'), onPress: () => router.back() }]
          );
        }

        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingData();
  }, [id, router]);

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
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

  // Elapsed time counter
  useEffect(() => {
    if (status !== 'in_progress') return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, [status]);

  // Event listener
  useEffect(() => {
    const unsubscribe = appEvents.on(EVENTS.REFRESH_PROVIDER_BOOKINGS, async () => {
      if (!id) return;
      try {
        const orderData = await getProviderOrderDetail(parseInt(id, 10));
        if (orderData?.status === 'cancelled') {
          setIsCancelled(true);
        }
      } catch (error) {}
    });
    return unsubscribe;
  }, [id]);

  // Status polling
  useEffect(() => {
    if (!id || status === 'completed' || isCancelled) return;

    const checkOrderStatus = async () => {
      try {
        const orderData = await getProviderOrderDetail(parseInt(id, 10));

        if (orderData?.status === 'cancelled') {
          setIsCancelled(true);
          return;
        }

        if (status === 'arrived' && orderData?.status === 'in_progress') {
          setStatus('in_progress');
          setElapsedTime(0);
          hapticFeedback.success();
          Alert.alert(
            t('journeyScreen.clientConfirmed'),
            t('journeyScreen.clientConfirmedMessage'),
            [{ text: 'OK' }]
          );
        }
      } catch (error: any) {
        if (error?.response?.status === 403) {
          setIsCancelled(true);
          Alert.alert(
            t('journeyScreen.orderUnavailable'),
            t('journeyScreen.orderNoLongerAccessible'),
            [{ text: t('journeyScreen.back'), onPress: () => router.back() }]
          );
        }
      }
    };

    const interval = setInterval(checkOrderStatus, 5000);
    return () => clearInterval(interval);
  }, [status, id, isCancelled]);

  // Location tracking
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert(t('journeyScreen.permissionRequired'), t('journeyScreen.locationRequired'));
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setProviderLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {}

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          setProviderLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Distance and ETA calculation
  useEffect(() => {
    if (!booking.clientLocation || !providerLocation) return;

    const clientLat = booking.clientLocation.latitude;
    const clientLng = booking.clientLocation.longitude;

    const distKm = Math.sqrt(
      Math.pow((clientLat - providerLocation.latitude) * 111, 2) +
      Math.pow((clientLng - providerLocation.longitude) * 111 * Math.cos(clientLat * Math.PI / 180), 2)
    );

    setDistance(Math.round(distKm * 10) / 10);
    setEta(Math.max(1, Math.round(distKm * 2)));
  }, [providerLocation, booking.clientLocation]);

  const handleOpenMaps = () => {
    hapticFeedback.light();
    const { latitude, longitude } = booking.clientLocation;
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleArrivedAtClient = () => {
    hapticFeedback.medium();
    Alert.alert(
      t('journeyScreen.arrivedAtClient'),
      t('journeyScreen.confirmArrival'),
      [
        { text: t('journeyScreen.cancel'), style: 'cancel' },
        {
          text: t('journeyScreen.confirm'),
          onPress: async () => {
            try {
              if (id) {
                await arriveAtClient(parseInt(id, 10));
              }
              setStatus('arrived');
              hapticFeedback.success();
              Alert.alert(t('journeyScreen.arrivalConfirmed'), t('journeyScreen.waitingClientConfirmation'));
            } catch (error: any) {
              hapticFeedback.error();
              Alert.alert(t('journeyScreen.error'), error?.response?.data?.message || t('journeyScreen.arrivalError'));
            }
          },
        },
      ]
    );
  };

  const handleCompleteService = () => {
    hapticFeedback.medium();
    Alert.alert(
      t('journeyScreen.completeService'),
      t('journeyScreen.confirmCompletion'),
      [
        { text: t('journeyScreen.cancel'), style: 'cancel' },
        {
          text: t('journeyScreen.finish'),
          onPress: async () => {
            try {
              if (id) {
                await completeOrder(parseInt(id, 10));
              }
              setStatus('completed');
              hapticFeedback.success();
              setTimeout(() => {
                router.back();
              }, 2000);
            } catch (error) {
              setStatus('completed');
              hapticFeedback.success();
              setTimeout(() => {
                router.back();
              }, 2000);
            }
          },
        },
      ]
    );
  };

  const handleCenterMap = () => {
    hapticFeedback.light();
    mapRef.current?.fitToCoordinates(
      [providerLocation, booking.clientLocation],
      {
        edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
        animated: true,
      }
    );
  };

  const statusGradient = STATUS_GRADIENTS[status];
  const statusTitle = getStatusTitle(status);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LinearGradient
          colors={[colors.primary, '#8B5CF6']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color={colors.white} />
        </LinearGradient>
        <Text style={[styles.loadingText, isRTL && styles.textRTL]}>{t('journeyScreen.loading')}</Text>
      </View>
    );
  }

  // Error state
  if (hasError || !booking.id) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          style={styles.stateIconGradient}
        >
          <Text style={styles.stateIcon}>❌</Text>
        </LinearGradient>
        <Text style={[styles.stateTitle, isRTL && styles.textRTL]}>{t('journeyScreen.bookingNotFound')}</Text>
        <Text style={[styles.stateText, isRTL && styles.textRTL]}>
          {t('journeyScreen.bookingNotFoundText')}
        </Text>
        <TouchableOpacity style={styles.stateButton} onPress={() => router.back()}>
          <LinearGradient
            colors={[colors.gray[600], colors.gray[700]]}
            style={styles.stateButtonGradient}
          >
            <Text style={[styles.stateButtonText, isRTL && styles.textRTL]}>{t('journeyScreen.back')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // Cancelled state
  if (isCancelled) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          style={styles.stateIconGradient}
        >
          <Text style={styles.stateIcon}>❌</Text>
        </LinearGradient>
        <Text style={[styles.stateTitle, isRTL && styles.textRTL]}>{t('journeyScreen.orderCancelled')}</Text>
        <Text style={[styles.stateText, isRTL && styles.textRTL]}>
          {t('journeyScreen.orderCancelledByClient')}
        </Text>
        <TouchableOpacity
          style={styles.stateButton}
          onPress={() => router.replace('/(provider)/bookings')}
        >
          <LinearGradient
            colors={[colors.gray[600], colors.gray[700]]}
            style={styles.stateButtonGradient}
          >
            <Text style={[styles.stateButtonText, isRTL && styles.textRTL]}>{t('journeyScreen.backToOrders')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // Completed state
  if (status === 'completed') {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.stateIconGradient}
        >
          <Text style={styles.stateIcon}>✅</Text>
        </LinearGradient>
        <Text style={[styles.stateTitle, isRTL && styles.textRTL]}>{t('journeyScreen.serviceCompleted')}</Text>
        <Text style={[styles.stateText, isRTL && styles.textRTL]}>
          {t('journeyScreen.serviceCompletedSuccess')}
        </Text>
        <View style={styles.completedEarnings}>
          <Text style={[styles.completedEarningsLabel, isRTL && styles.textRTL]}>{t('journeyScreen.earnings')}</Text>
          <Text style={styles.completedEarningsValue}>+{booking.price} DH</Text>
        </View>
        <TouchableOpacity
          style={styles.stateButton}
          onPress={() => router.replace('/(provider)')}
        >
          <LinearGradient
            colors={[colors.primary, '#8B5CF6']}
            style={styles.stateButtonGradient}
          >
            <Text style={[styles.stateButtonText, isRTL && styles.textRTL]}>{t('journeyScreen.backToDashboard')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: (providerLocation.latitude + booking.clientLocation.latitude) / 2,
          longitude: (providerLocation.longitude + booking.clientLocation.longitude) / 2,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
        showsCompass={false}
      >
        {/* Provider Marker */}
        <Marker coordinate={providerLocation} anchor={{ x: 0.5, y: 0.5 }}>
          <Animated.View style={[styles.providerMarker, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={statusGradient.gradient}
              style={styles.providerMarkerInner}
            >
              <Text style={styles.providerMarkerIcon}>🚗</Text>
            </LinearGradient>
          </Animated.View>
        </Marker>

        {/* Client Marker */}
        <Marker coordinate={booking.clientLocation} anchor={{ x: 0.5, y: 1 }}>
          <View style={styles.clientMarker}>
            <View style={styles.clientMarkerInner}>
              <Text style={styles.clientAvatarMarker}>{booking.clientAvatar}</Text>
            </View>
            <View style={styles.clientMarkerTail} />
          </View>
        </Marker>

        {/* Route Line */}
        {status === 'on_way' && (
          <Polyline
            coordinates={[providerLocation, booking.clientLocation]}
            strokeWidth={4}
            strokeColor={colors.primary}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapControlBtn} onPress={() => router.back()}>
          <Text style={styles.mapControlIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapControlBtn} onPress={handleCenterMap}>
          <Text style={styles.mapControlIcon}>🎯</Text>
        </TouchableOpacity>
      </View>

      {/* Status Banner */}
      <LinearGradient
        colors={statusGradient.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.statusBanner}
      >
        <View style={[styles.statusBannerLeft, isRTL && styles.statusBannerLeftRTL]}>
          <Text style={[styles.statusIcon, isRTL && styles.statusIconRTL]}>{statusGradient.icon}</Text>
          <View>
            <Text style={[styles.statusTitle, isRTL && styles.textRTL]}>{statusTitle}</Text>
            <Text style={[styles.statusSubtitle, isRTL && styles.textRTL]}>
              {status === 'on_way' && t('journeyScreen.arrivalIn').replace('{min}', Math.ceil(eta).toString())}
              {status === 'arrived' && t('journeyScreen.waitingForClient')}
              {status === 'in_progress' && t('journeyScreen.elapsedTime').replace('{min}', elapsedTime.toString())}
            </Text>
          </View>
        </View>
        {status === 'on_way' && (
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceValue}>{distance.toFixed(1)}</Text>
            <Text style={styles.distanceUnit}>km</Text>
          </View>
        )}
      </LinearGradient>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Handle */}
        <View style={styles.sheetHandle} />

        {/* Client Card */}
        <View style={styles.clientCard}>
          <View style={[styles.clientCardHeader, isRTL && styles.clientCardHeaderRTL]}>
            <LinearGradient
              colors={[colors.primary, '#8B5CF6']}
              style={styles.clientAvatar}
            >
              <Text style={styles.clientAvatarText}>{booking.clientAvatar}</Text>
            </LinearGradient>
            <View style={[styles.clientInfo, isRTL && styles.clientInfoRTL]}>
              <Text style={[styles.clientName, isRTL && styles.textRTL]}>{booking.clientName}</Text>
              <Text style={[styles.serviceName, isRTL && styles.textRTL]}>{getServiceTranslation(booking.service, language).title}</Text>
            </View>
            <View style={[styles.priceTag, isRTL && styles.priceTagRTL]}>
              <Text style={styles.priceTagValue}>{booking.price}</Text>
              <Text style={styles.priceTagUnit}>DH</Text>
            </View>
          </View>

          <View style={[styles.addressRow, isRTL && styles.addressRowRTL]}>
            <Text style={[styles.addressIcon, isRTL && styles.addressIconRTL]}>📍</Text>
            <Text style={[styles.addressText, isRTL && styles.textRTL]} numberOfLines={1}>{booking.address}</Text>
          </View>

          {/* Notes */}
          {booking.notes && (
            <View style={[styles.notesContainer, isRTL && styles.notesContainerRTL]}>
              <Text style={[styles.notesLabel, isRTL && styles.textRTL]}>📝 {t('journeyScreen.notes')}</Text>
              <Text style={[styles.notesText, isRTL && styles.textRTL]}>{booking.notes}</Text>
            </View>
          )}

          {/* Quick Actions */}
          <View style={[styles.quickActions, isRTL && styles.quickActionsRTL]}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleOpenMaps}>
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>🗺️</Text>
              </LinearGradient>
              <Text style={[styles.quickActionLabel, isRTL && styles.textRTL]}>{t('journeyScreen.gps')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => {
                hapticFeedback.light();
                router.push(`/chat/${booking.id}` as any);
              }}
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>💬</Text>
              </LinearGradient>
              <Text style={[styles.quickActionLabel, isRTL && styles.textRTL]}>{t('journeyScreen.chat')}</Text>
            </TouchableOpacity>

            {status === 'on_way' && (
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => {
                  hapticFeedback.light();
                  setShowCancellationModal(true);
                }}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.quickActionGradient}
                >
                  <Text style={styles.quickActionIcon}>❌</Text>
                </LinearGradient>
                <Text style={[styles.quickActionLabel, { color: colors.error }, isRTL && styles.textRTL]}>{t('journeyScreen.cancel')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action Button */}
        {status === 'on_way' && (
          <TouchableOpacity style={styles.mainActionBtn} onPress={handleArrivedAtClient}>
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              style={[styles.mainActionGradient, isRTL && styles.mainActionGradientRTL]}
            >
              <Text style={styles.mainActionIcon}>📍</Text>
              <Text style={[styles.mainActionText, isRTL && styles.textRTL]}>{t('journeyScreen.iArrived')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {status === 'arrived' && (
          <View style={styles.waitingCard}>
            <LinearGradient
              colors={['#EDE9FE', '#DDD6FE']}
              style={[styles.waitingCardGradient, isRTL && styles.waitingCardGradientRTL]}
            >
              <Text style={[styles.waitingIcon, isRTL && styles.waitingIconRTL]}>⏳</Text>
              <View style={styles.waitingTextContainer}>
                <Text style={[styles.waitingTitle, isRTL && styles.textRTL]}>{t('journeyScreen.waitingConfirmation')}</Text>
                <Text style={[styles.waitingSubtext, isRTL && styles.textRTL]}>
                  {t('journeyScreen.clientMustConfirm')}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {status === 'in_progress' && (
          <TouchableOpacity style={styles.mainActionBtn} onPress={handleCompleteService}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={[styles.mainActionGradient, isRTL && styles.mainActionGradientRTL]}
            >
              <Text style={styles.mainActionIcon}>✅</Text>
              <Text style={[styles.mainActionText, isRTL && styles.textRTL]}>{t('journeyScreen.finishService')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Emergency Button - Position fixe en haut à droite */}
      {['on_way', 'arrived', 'in_progress'].includes(status) && (
        <View style={styles.emergencyContainer}>
          <EmergencyButton
            orderId={booking.id}
            clientName={booking.clientName}
            isProvider={true}
          />
        </View>
      )}

      {/* Cancellation Modal */}
      <CancellationModal
        visible={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        onSuccess={() => {
          setShowCancellationModal(false);
          router.replace('/(provider)/bookings');
        }}
        orderId={booking.id}
        userType="provider"
        orderStatus={status}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },

  // Loading State
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },

  // State Screens
  stateIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  stateIcon: {
    fontSize: 48,
  },
  stateTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  stateText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  stateButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  stateButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  stateButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.white,
  },
  completedEarnings: {
    backgroundColor: colors.success + '15',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  completedEarningsLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  completedEarningsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.success,
  },

  // Map
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
  },

  // Map Controls
  mapControls: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Emergency Button Container
  emergencyContainer: {
    position: 'absolute',
    top: 220,
    right: spacing.lg,
    zIndex: 100,
  },
  mapControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  mapControlIcon: {
    fontSize: 22,
    color: colors.gray[700],
  },

  // Markers
  providerMarker: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerMarkerInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  providerMarkerIcon: {
    fontSize: 20,
  },
  clientMarker: {
    alignItems: 'center',
  },
  clientMarkerInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.success,
    ...shadows.md,
  },
  clientAvatarMarker: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray[700],
  },
  clientMarkerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.success,
    marginTop: -2,
  },

  // Status Banner
  statusBanner: {
    position: 'absolute',
    top: 120,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  statusTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.white,
  },
  statusSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  distanceContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
  },
  distanceUnit: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    ...shadows.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },

  // Client Card
  clientCard: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  clientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  clientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
  },
  serviceName: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginTop: 2,
  },
  priceTag: {
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceTagValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.success,
  },
  priceTagUnit: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    marginLeft: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  addressIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  addressText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  notesContainer: {
    backgroundColor: colors.warning + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    marginBottom: spacing.md,
  },
  notesLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionBtn: {
    alignItems: 'center',
  },
  quickActionGradient: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickActionIcon: {
    fontSize: 22,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    fontWeight: '500',
  },

  // Main Action Button
  mainActionBtn: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  mainActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  mainActionIcon: {
    fontSize: 24,
  },
  mainActionText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },

  // Waiting Card
  waitingCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  waitingCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  waitingIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  waitingTextContainer: {
    flex: 1,
  },
  waitingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#6B21A8',
    marginBottom: 2,
  },
  waitingSubtext: {
    fontSize: typography.fontSize.sm,
    color: '#7C3AED',
  },

  // RTL Styles
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statusBannerLeftRTL: {
    flexDirection: 'row-reverse',
  },
  statusIconRTL: {
    marginRight: 0,
    marginLeft: spacing.md,
  },
  clientCardHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  clientInfoRTL: {
    marginLeft: 0,
    marginRight: spacing.md,
    alignItems: 'flex-end',
  },
  priceTagRTL: {
    flexDirection: 'row-reverse',
  },
  addressRowRTL: {
    flexDirection: 'row-reverse',
  },
  addressIconRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  notesContainerRTL: {
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderRightColor: colors.warning,
  },
  quickActionsRTL: {
    flexDirection: 'row-reverse',
  },
  mainActionGradientRTL: {
    flexDirection: 'row-reverse',
  },
  waitingCardGradientRTL: {
    flexDirection: 'row-reverse',
  },
  waitingIconRTL: {
    marginRight: 0,
    marginLeft: spacing.md,
  },
});
