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
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';
import Loading from '../../../src/components/ui/Loading';
import { colors, spacing, typography, borderRadius, shadows } from '../../../src/lib/constants/theme';
import {
  useLocation,
  calculateDistance,
  formatDistance,
  estimateArrivalTime,
  LocationCoords,
} from '../../../src/lib/hooks/useLocation';

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
  status: 'on_way' | 'arrived' | 'in_progress' | 'completed';
}

// Casablanca coordinates for demo
const CASABLANCA_CENTER = {
  latitude: 33.5731,
  longitude: -7.5898,
};

// Mock data
const MOCK_BOOKING: BookingData = {
  id: 1,
  service: {
    id: 1,
    title: 'Coupe femme + Brushing',
  },
  provider: {
    id: 1,
    name: 'Sarah Beauté',
    avatar: 'https://i.pravatar.cc/150?img=5',
    phone: '+212 6 12 34 56 78',
    latitude: 33.5831, // Start position (north of client)
    longitude: -7.5898,
    heading: 180, // Heading south
    lastUpdated: new Date().toISOString(),
  },
  client_location: {
    latitude: 33.5731,
    longitude: -7.5898,
    address: '123 Boulevard Mohammed V, Casablanca',
  },
  scheduled_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min from now
  status: 'on_way',
};

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [providerLocation, setProviderLocation] = useState<ProviderLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eta, setEta] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);

  // Animation for provider marker
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // User's location
  const { location: userLocation, getCurrentLocation } = useLocation();

  // Load booking data
  useEffect(() => {
    loadBooking();
    getCurrentLocation();
  }, [id]);

  // Simulate provider movement
  useEffect(() => {
    if (!booking || booking.status !== 'on_way') return;

    const interval = setInterval(() => {
      setProviderLocation(prev => {
        if (!prev) return prev;

        // Move provider closer to client
        const newLat = prev.latitude - 0.0005; // Move south
        const newLng = prev.longitude + (Math.random() - 0.5) * 0.0002;

        // Check if arrived
        const dist = calculateDistance(
          { latitude: newLat, longitude: newLng },
          booking.client_location
        );

        if (dist < 0.05) {
          // Less than 50m
          clearInterval(interval);
          setBooking(b => b ? { ...b, status: 'arrived' } : null);
        }

        return {
          ...prev,
          latitude: newLat,
          longitude: newLng,
          lastUpdated: new Date().toISOString(),
        };
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [booking?.status]);

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
      // En production, charger depuis l'API
      await new Promise(resolve => setTimeout(resolve, 500));
      setBooking(MOCK_BOOKING);
      setProviderLocation(MOCK_BOOKING.provider);
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (providerLocation?.phone) {
      Linking.openURL(`tel:${providerLocation.phone}`);
    }
  };

  const handleMessage = () => {
    // Navigate to chat
    router.push(`/chat/${booking?.provider.id}` as any);
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
      case 'on_way':
        return {
          label: 'En route',
          color: colors.warning,
          icon: '🚗',
          message: `Arrivée dans environ ${eta} min`,
        };
      case 'arrived':
        return {
          label: 'Arrivé(e)',
          color: colors.success,
          icon: '✅',
          message: 'Le prestataire est arrivé !',
        };
      case 'in_progress':
        return {
          label: 'En cours',
          color: colors.primary,
          icon: '💇',
          message: 'Prestation en cours...',
        };
      case 'completed':
        return {
          label: 'Terminé',
          color: colors.gray[500],
          icon: '🎉',
          message: 'Prestation terminée',
        };
      default:
        return {
          label: 'En attente',
          color: colors.gray[400],
          icon: '⏳',
          message: 'En attente de confirmation',
        };
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Chargement du suivi..." />;
  }

  if (!booking || !providerLocation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorText}>Réservation non trouvée</Text>
        <Button variant="outline" onPress={() => router.back()}>
          Retour
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
          description="Prestataire"
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
          title="Votre adresse"
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suivi en direct</Text>
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
            <Text style={styles.serviceName}>{booking.service.title}</Text>
          </View>

          <View style={styles.providerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Text style={styles.actionIcon}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
              <Text style={styles.actionIcon}>💬</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ETA & Distance */}
        {booking.status === 'on_way' && (
          <View style={styles.etaContainer}>
            <View style={styles.etaItem}>
              <Text style={styles.etaValue}>{eta}</Text>
              <Text style={styles.etaLabel}>min</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaItem}>
              <Text style={styles.etaValue}>{formatDistance(distance)}</Text>
              <Text style={styles.etaLabel}>restant</Text>
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
      </View>
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
  providerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 20,
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
});
