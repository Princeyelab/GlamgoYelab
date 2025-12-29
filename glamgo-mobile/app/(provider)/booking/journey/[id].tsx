/**
 * Provider Journey Mode - GlamGo Mobile
 * Écran de suivi en temps réel pendant le trajet vers le client
 * Connecte aux vraies donnees de reservation via API
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
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import Card from '../../../../src/components/ui/Card';
import Button from '../../../../src/components/ui/Button';
import EmergencyButton from '../../../../src/components/features/EmergencyButton';
import CancellationModal from '../../../../src/components/features/CancellationModal';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../src/lib/constants/theme';
import { hapticFeedback } from '../../../../src/lib/utils/haptics';
import {
  getProviderOrderDetail,
  arriveAtClient,
  completeOrder,
  updateProviderLocation,
  ProviderOrder,
} from '../../../../src/lib/api/providerAPI';

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

// Donnees initiales vides pour la reservation
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
    latitude: 33.5731, // Default Casablanca
    longitude: -7.5898,
  },
};

export default function JourneyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [status, setStatus] = useState<JourneyStatus>('on_way');
  const [booking, setBooking] = useState<BookingDetails>(INITIAL_BOOKING);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
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

        // Convertir les donnees API vers le format BookingDetails
        const clientLat = orderData.client_latitude || orderData.latitude || 33.5731;
        const clientLng = orderData.client_longitude || orderData.longitude || -7.5898;

        // Extraire le nom du client (API retourne user_name, user_first_name, user_last_name)
        const clientName = orderData.user_name
          || (orderData.user_first_name && orderData.user_last_name
              ? `${orderData.user_first_name} ${orderData.user_last_name}`
              : orderData.user_first_name)
          || orderData.client?.name
          || orderData.client_name
          || 'Client';

        // Extraire le prix (API retourne price, pas total)
        const price = orderData.price || orderData.total || orderData.amount || orderData.service?.price || 0;

        const bookingData: BookingDetails = {
          id: orderData.id,
          clientName: clientName,
          clientPhone: orderData.user_phone || orderData.client?.phone || orderData.client_phone || '',
          clientAvatar: clientName.substring(0, 2).toUpperCase(),
          service: orderData.service?.title || orderData.service_name || 'Service',
          address: orderData.address || orderData.client_address || 'Adresse non specifiee',
          scheduledTime: orderData.start_time || orderData.scheduled_time || '',
          price: price,
          notes: orderData.notes || orderData.client_notes,
          clientLocation: {
            latitude: clientLat,
            longitude: clientLng,
          },
        };

        setBooking(bookingData);

        // Mettre a jour le statut selon l'etat de la commande
        if (orderData.status === 'in_progress' || orderData.status === 'started') {
          setStatus('in_progress');
        } else if (orderData.status === 'completed') {
          setStatus('completed');
        } else if (orderData.status === 'arrived') {
          setStatus('arrived');
        }
      } catch (error) {
        console.error('Erreur chargement reservation:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingData();
  }, [id]);

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


  // Elapsed time counter for in_progress
  useEffect(() => {
    if (status !== 'in_progress') return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [status]);

  // Polling pour detecter quand le client confirme l'arrivee
  useEffect(() => {
    if (status !== 'arrived' || !id) return;

    const checkClientConfirmation = async () => {
      try {
        const orderData = await getProviderOrderDetail(parseInt(id, 10));
        if (orderData?.status === 'in_progress') {
          setStatus('in_progress');
          setElapsedTime(0);
          hapticFeedback.success();
          Alert.alert(
            '✅ Client a confirmé',
            'Le client a confirmé votre arrivée. La prestation peut commencer !',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.log('Error checking confirmation:', error);
      }
    };

    // Verifier toutes les 5 secondes
    const interval = setInterval(checkClientConfirmation, 5000);
    return () => clearInterval(interval);
  }, [status, id]);

  // Get real GPS location
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la localisation est nécessaire pour le suivi.');
        return;
      }

      // Get initial position
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setProviderLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.log('Error getting initial location:', error);
      }

      // Watch position updates
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

  // Recalculer distance et ETA en temps reel
  useEffect(() => {
    if (!booking.clientLocation || !providerLocation) return;

    const clientLat = booking.clientLocation.latitude;
    const clientLng = booking.clientLocation.longitude;

    // Calculer la distance en km (formule Haversine simplifiee)
    const distKm = Math.sqrt(
      Math.pow((clientLat - providerLocation.latitude) * 111, 2) +
      Math.pow((clientLng - providerLocation.longitude) * 111 * Math.cos(clientLat * Math.PI / 180), 2)
    );

    setDistance(Math.round(distKm * 10) / 10);
    setEta(Math.max(1, Math.round(distKm * 2))); // ~2 min par km en ville, minimum 1 min
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
      'Arrivé chez le client',
      'Confirmer votre arrivée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            console.log('[JOURNEY] handleArrivedAtClient - Starting API call for order:', id);
            try {
              if (id) {
                console.log('[JOURNEY] Calling arriveAtClient with id:', parseInt(id, 10));
                const result = await arriveAtClient(parseInt(id, 10));
                console.log('[JOURNEY] arriveAtClient success:', result);
              }
              setStatus('arrived');
              hapticFeedback.success();
              Alert.alert('✅ Arrivée confirmée', 'En attente de la confirmation du client.');
            } catch (error: any) {
              console.error('[JOURNEY] arriveAtClient error:', error);
              console.error('[JOURNEY] Error details:', error?.response?.data || error?.message);
              hapticFeedback.error();
              Alert.alert('Erreur', error?.response?.data?.message || 'Impossible de signaler votre arrivée. Réessayez.');
            }
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
          onPress: async () => {
            try {
              // Appeler l'API pour terminer la commande
              if (id) {
                await completeOrder(parseInt(id, 10));
              }
              setStatus('completed');
              hapticFeedback.success();
              // Navigate back after short delay
              setTimeout(() => {
                router.back();
              }, 2000);
            } catch (error) {
              console.error('Erreur completion:', error);
              // Mettre a jour l'etat local meme si l'API echoue
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

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          Chargement de la reservation...
        </Text>
      </View>
    );
  }

  // Afficher une erreur si la reservation n'est pas trouvee
  if (hasError || !booking.id) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Reservation introuvable</Text>
        <Text style={styles.errorText}>
          Cette reservation n'existe pas ou a ete annulee.
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          <View style={styles.waitingConfirmation}>
            <Text style={styles.waitingIcon}>⏳</Text>
            <Text style={styles.waitingText}>
              En attente de confirmation du client
            </Text>
            <Text style={styles.waitingSubtext}>
              Le client doit confirmer votre arrivée pour démarrer la prestation
            </Text>
          </View>
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
            <TouchableOpacity style={styles.quickAction} onPress={handleOpenMaps}>
              <Text style={styles.quickActionIcon}>🗺️</Text>
              <Text style={styles.quickActionText}>Navigation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => {
                hapticFeedback.light();
                router.push(`/chat/${booking.id}` as any);
              }}
            >
              <Text style={styles.quickActionIcon}>💬</Text>
              <Text style={styles.quickActionText}>Message</Text>
            </TouchableOpacity>
            {status === 'on_way' && (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => {
                  hapticFeedback.light();
                  setShowCancellationModal(true);
                }}
              >
                <Text style={styles.quickActionIcon}>❌</Text>
                <Text style={[styles.quickActionText, { color: colors.error }]}>Annuler</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Action Button */}
        {renderActionButton()}
      </View>

      {/* Emergency Button - visible during active service */}
      {['on_way', 'arrived', 'in_progress'].includes(status) && (
        <EmergencyButton
          orderId={booking.id}
          clientName={booking.clientName}
          isProvider={true}
        />
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  errorButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.white,
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

  // Waiting Confirmation
  waitingConfirmation: {
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  waitingIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  waitingText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#6B21A8',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  waitingSubtext: {
    fontSize: typography.fontSize.sm,
    color: '#7C3AED',
    textAlign: 'center',
  },
});
