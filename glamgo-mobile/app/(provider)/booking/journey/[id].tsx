/**
 * Provider Journey Mode - GlamGo Mobile
 * Écran de suivi en temps réel pendant le trajet vers le client
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Card from '../../../../src/components/ui/Card';
import Button from '../../../../src/components/ui/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../src/lib/constants/theme';
import { hapticFeedback } from '../../../../src/lib/utils/haptics';

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

// Demo booking data
const DEMO_BOOKING: BookingDetails = {
  id: 1,
  clientName: 'Sarah Martin',
  clientPhone: '+212 6 12 34 56 78',
  clientAvatar: 'SM',
  service: 'Coiffure à domicile',
  address: '123 Rue Mohammed V, Casablanca',
  scheduledTime: '14:00',
  price: 350,
  notes: 'Appartement 3ème étage, code 1234',
  clientLocation: {
    latitude: 33.5731,
    longitude: -7.5898,
  },
};

export default function JourneyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [status, setStatus] = useState<JourneyStatus>('on_way');
  const [booking] = useState<BookingDetails>(DEMO_BOOKING);
  const [providerLocation, setProviderLocation] = useState({
    latitude: 33.5631, // Slightly south of client
    longitude: -7.5998,
  });
  const [eta, setEta] = useState(12); // minutes
  const [distance, setDistance] = useState(3.5); // km
  const [elapsedTime, setElapsedTime] = useState(0); // for in_progress

  // Pulse animation for current location marker
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

  // Simulate location updates
  useEffect(() => {
    if (status !== 'on_way') return;

    const interval = setInterval(() => {
      setProviderLocation(prev => ({
        latitude: prev.latitude + 0.0005,
        longitude: prev.longitude + 0.0005,
      }));
      setEta(prev => Math.max(0, prev - 0.5));
      setDistance(prev => Math.max(0, prev - 0.2));
    }, 3000);

    return () => clearInterval(interval);
  }, [status]);

  // Elapsed time counter for in_progress
  useEffect(() => {
    if (status !== 'in_progress') return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [status]);

  // Request location permissions
  useEffect(() => {
    (async () => {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la localisation est nécessaire pour le suivi.');
      }
    })();
  }, []);

  const handleCallClient = () => {
    hapticFeedback.light();
    Linking.openURL(`tel:${booking.clientPhone.replace(/\s/g, '')}`);
  };

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
      'Arrivé chez le client',
      'Confirmer votre arrivée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            setStatus('arrived');
            hapticFeedback.success();
          },
        },
      ]
    );
  };

  const handleStartService = () => {
    hapticFeedback.medium();
    Alert.alert(
      'Démarrer la prestation',
      'Le chronomètre va commencer. Confirmer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Démarrer',
          onPress: () => {
            setStatus('in_progress');
            setElapsedTime(0);
            hapticFeedback.success();
          },
        },
      ]
    );
  };

  const handleCompleteService = () => {
    hapticFeedback.medium();
    Alert.alert(
      'Terminer la prestation',
      'Confirmer que la prestation est terminée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: () => {
            setStatus('completed');
            hapticFeedback.success();
            // Navigate back after short delay
            setTimeout(() => {
              router.back();
            }, 2000);
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
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      }
    );
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'on_way':
        return {
          title: 'En route',
          subtitle: `Arrivée estimée dans ${Math.ceil(eta)} min`,
          color: colors.info,
          icon: '🚗',
        };
      case 'arrived':
        return {
          title: 'Arrivé',
          subtitle: 'Vous êtes arrivé chez le client',
          color: colors.warning,
          icon: '📍',
        };
      case 'in_progress':
        return {
          title: 'En cours',
          subtitle: `Temps écoulé: ${elapsedTime} min`,
          color: colors.primary,
          icon: '✂️',
        };
      case 'completed':
        return {
          title: 'Terminé',
          subtitle: 'Prestation terminée avec succès !',
          color: colors.success,
          icon: '✅',
        };
    }
  };

  const statusInfo = getStatusInfo();

  const renderActionButton = () => {
    switch (status) {
      case 'on_way':
        return (
          <Button
            variant="primary"
            size="lg"
            onPress={handleArrivedAtClient}
            style={styles.actionButton}
          >
            Je suis arrivé
          </Button>
        );
      case 'arrived':
        return (
          <Button
            variant="primary"
            size="lg"
            onPress={handleStartService}
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
          >
            Démarrer la prestation
          </Button>
        );
      case 'in_progress':
        return (
          <Button
            variant="primary"
            size="lg"
            onPress={handleCompleteService}
            style={[styles.actionButton, { backgroundColor: colors.success }]}
          >
            Terminer la prestation
          </Button>
        );
      case 'completed':
        return (
          <View style={styles.completedContainer}>
            <Text style={styles.completedText}>Prestation terminée</Text>
            <Text style={styles.completedAmount}>+{booking.price} DH</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
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
        <Marker
          coordinate={providerLocation}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <Animated.View style={[styles.providerMarker, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.providerMarkerInner}>
              <Text style={styles.providerMarkerIcon}>🚗</Text>
            </View>
          </Animated.View>
        </Marker>

        {/* Client Marker */}
        <Marker
          coordinate={booking.clientLocation}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={styles.clientMarker}>
            <View style={styles.clientMarkerInner}>
              <Text style={styles.clientAvatar}>{booking.clientAvatar}</Text>
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

      {/* Center Map Button */}
      <TouchableOpacity style={styles.centerButton} onPress={handleCenterMap}>
        <Text style={styles.centerButtonIcon}>🎯</Text>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonIcon}>←</Text>
      </TouchableOpacity>

      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusInfo.color }]}>
        <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
        <View>
          <Text style={styles.statusTitle}>{statusInfo.title}</Text>
          <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
        </View>
        {status === 'on_way' && (
          <View style={styles.etaContainer}>
            <Text style={styles.etaValue}>{distance.toFixed(1)}</Text>
            <Text style={styles.etaUnit}>km</Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Client Info Card */}
        <Card style={styles.clientCard}>
          <View style={styles.clientInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{booking.clientAvatar}</Text>
            </View>
            <View style={styles.clientDetails}>
              <Text style={styles.clientName}>{booking.clientName}</Text>
              <Text style={styles.serviceName}>{booking.service}</Text>
              <Text style={styles.address} numberOfLines={1}>
                📍 {booking.address}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={styles.priceValue}>{booking.price} DH</Text>
            </View>
          </View>

          {/* Notes */}
          {booking.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>📝 Notes:</Text>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={handleCallClient}>
              <Text style={styles.quickActionIcon}>📞</Text>
              <Text style={styles.quickActionText}>Appeler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={handleOpenMaps}>
              <Text style={styles.quickActionIcon}>🗺️</Text>
              <Text style={styles.quickActionText}>Navigation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => {
                hapticFeedback.light();
                // TODO: Open chat
              }}
            >
              <Text style={styles.quickActionIcon}>💬</Text>
              <Text style={styles.quickActionText}>Message</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Action Button */}
        {renderActionButton()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },

  // Map
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.55,
  },

  // Buttons
  backButton: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  backButtonIcon: {
    fontSize: 24,
    color: colors.gray[700],
  },
  centerButton: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  centerButtonIcon: {
    fontSize: 20,
  },

  // Markers
  providerMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerMarkerInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  providerMarkerIcon: {
    fontSize: 18,
  },
  clientMarker: {
    alignItems: 'center',
  },
  clientMarkerInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.success,
    ...shadows.md,
  },
  clientAvatar: {
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
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.lg,
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
    color: colors.white,
    opacity: 0.9,
  },
  etaContainer: {
    marginLeft: 'auto',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  etaValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
  },
  etaUnit: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    opacity: 0.9,
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    ...shadows.lg,
  },

  // Client Card
  clientCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatar: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  serviceName: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginTop: 2,
  },
  address: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  priceValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.success,
  },

  // Notes
  notesContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  notesLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 4,
  },
  notesText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  quickAction: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
  },

  // Action Button
  actionButton: {
    marginBottom: spacing.sm,
  },

  // Completed State
  completedContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  completedText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.success,
    marginBottom: spacing.xs,
  },
  completedAmount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.success,
  },
});
