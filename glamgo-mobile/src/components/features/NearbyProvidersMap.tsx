/**
 * NearbyProvidersMap Component - GlamGo Mobile
 * Carte native des prestataires avec MapView
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import MapView, { Marker, Circle, Callout, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Card from '../ui/Card';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { hapticFeedback } from '../../lib/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface NearbyProvider {
  id: number;
  name: string;
  initials: string;
  avatar?: string;
  rating: number;
  reviewsCount: number;
  distance: number;
  eta: number;
  specialties: string[];
  isOnline: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface NearbyProvidersMapProps {
  clientLocation: { latitude: number; longitude: number } | null;
  providers?: NearbyProvider[];
  selectedProviderId?: number;
  onProviderSelect?: (provider: NearbyProvider) => void;
  loading?: boolean;
  radius?: number;
  compact?: boolean;
}

const DEFAULT_LOCATION = {
  latitude: 31.6295,
  longitude: -7.9811,
};

const generateApproximateLocation = (
  clientLocation: { latitude: number; longitude: number },
  distance: number,
  index: number
): { latitude: number; longitude: number } => {
  const distanceInDegrees = distance / 111;
  const angle = (index * 60 + 30) * (Math.PI / 180);
  return {
    latitude: clientLocation.latitude + distanceInDegrees * Math.cos(angle),
    longitude: clientLocation.longitude + distanceInDegrees * Math.sin(angle),
  };
};

export default function NearbyProvidersMap({
  clientLocation,
  providers = [],
  selectedProviderId,
  onProviderSelect,
  loading = false,
  radius = 15,
  compact = false,
}: NearbyProvidersMapProps) {
  const [showFullMap, setShowFullMap] = useState(false);
  const mapRef = useRef<MapView>(null);
  const fullMapRef = useRef<MapView>(null);

  const location = clientLocation || DEFAULT_LOCATION;

  const providersWithLocations = useMemo(() => {
    return providers.map((provider, index) => {
      const hasValidLocation = provider.location?.latitude &&
        provider.location?.longitude &&
        Math.abs(provider.location.latitude) > 0.001 &&
        Math.abs(provider.location.longitude) > 0.001;

      return {
        ...provider,
        location: hasValidLocation
          ? provider.location
          : generateApproximateLocation(location, provider.distance || 2, index),
      };
    });
  }, [providers, location]);

  const onlineProviders = providersWithLocations.filter(p => p.isOnline);
  const nearestProvider = onlineProviders.length > 0
    ? onlineProviders.reduce((a, b) => (a.distance || 0) < (b.distance || 0) ? a : b)
    : null;

  // Calculate initial region to fit all markers
  const initialRegion: Region = useMemo(() => {
    if (providersWithLocations.length === 0) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    const allLats = [location.latitude, ...providersWithLocations.map(p => p.location.latitude)];
    const allLngs = [location.longitude, ...providersWithLocations.map(p => p.location.longitude)];

    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);

    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.02);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.02);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [location, providersWithLocations]);

  // Fit to markers when fullscreen opens
  useEffect(() => {
    if (showFullMap && fullMapRef.current && providersWithLocations.length > 0) {
      setTimeout(() => {
        const coordinates = [
          { latitude: location.latitude, longitude: location.longitude },
          ...providersWithLocations.map(p => p.location),
        ];
        fullMapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 80, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }, 300);
    }
  }, [showFullMap]);

  const handleProviderPress = (provider: NearbyProvider) => {
    hapticFeedback.selection();
    onProviderSelect?.(provider);
  };

  if (loading) {
    return (
      <Card style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Recherche des prestataires...</Text>
        </View>
      </Card>
    );
  }

  if (providers.length === 0) {
    return null;
  }

  const renderProviderMarker = (provider: NearbyProvider, isFullscreen: boolean) => {
    const isSelected = selectedProviderId === provider.id;
    const isNearest = nearestProvider?.id === provider.id;

    // Construire l'URL de l'avatar
    const avatarUrl = provider.avatar
      ? (provider.avatar.startsWith('http') ? provider.avatar : `https://glamgo-api.fly.dev${provider.avatar}`)
      : null;

    return (
      <Marker
        key={provider.id}
        coordinate={provider.location}
        onPress={() => !isFullscreen && handleProviderPress(provider)}
        tracksViewChanges={false}
      >
        <View style={[
          styles.markerContainer,
          isSelected && styles.markerSelected,
          isNearest && !isSelected && styles.markerNearest,
          !provider.isOnline && styles.markerOffline,
        ]}>
          {isNearest && !isSelected && (
            <View style={styles.nearestBadgeMarker}>
              <Text style={styles.nearestBadgeMarkerText}>Plus proche</Text>
            </View>
          )}
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.markerAvatar}
            />
          ) : (
            <Text style={[
              styles.markerInitials,
              (isSelected || isNearest) && styles.markerInitialsLight,
            ]}>
              {provider.initials}
            </Text>
          )}
          {provider.isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Callout popup - seulement en fullscreen */}
        {isFullscreen && (
          <Callout
            tooltip
            onPress={() => {
              hapticFeedback.success();
              onProviderSelect?.(provider);
              setShowFullMap(false);
            }}
          >
            <View style={styles.calloutContainer}>
              {/* Badge plus proche */}
              {isNearest && (
                <View style={styles.calloutNearestBadge}>
                  <Text style={styles.calloutNearestText}>Plus proche</Text>
                </View>
              )}

              {/* Nom */}
              <Text style={styles.calloutName}>{provider.name}</Text>

              {/* Rating */}
              {Number(provider.rating) > 0 && (
                <Text style={styles.calloutRating}>
                  ⭐ {Number(provider.rating).toFixed(1)} ({provider.reviewsCount || 0})
                </Text>
              )}

              {/* Distance & ETA */}
              <Text style={styles.calloutDistance}>
                📍 {Number(provider.distance || 0).toFixed(1)} km • ~{provider.eta || Math.round((provider.distance || 0) * 5)} min
              </Text>

              {/* Disponibilité */}
              <Text style={styles.calloutAvailability}>
                {provider.isOnline ? '🟢 Disponible' : '📅 Sur RDV'}
              </Text>

              {/* Bouton */}
              <View style={styles.calloutButton}>
                <Text style={styles.calloutButtonText}>Sélectionner</Text>
              </View>
            </View>
          </Callout>
        )}
      </Marker>
    );
  };

  return (
    <>
      <Card style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.header}>
          <Text style={styles.title}>Prestataires a proximite</Text>
          <Text style={styles.subtitle}>
            {onlineProviders.length} disponible{onlineProviders.length > 1 ? 's' : ''} - Appuyez pour agrandir
          </Text>
        </View>

        {/* Map Preview - Cliquable */}
        <TouchableOpacity
          style={[styles.mapContainer, compact && styles.mapContainerCompact]}
          onPress={() => {
            hapticFeedback.light();
            setShowFullMap(true);
          }}
          activeOpacity={0.9}
        >
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            loadingEnabled={true}
          >
            {/* Radius circle */}
            <Circle
              center={location}
              radius={radius * 1000}
              strokeColor={colors.primary}
              strokeWidth={2}
              fillColor={`${colors.primary}15`}
              lineDashPattern={[10, 10]}
            />

            {/* Client marker */}
            <Marker coordinate={location} tracksViewChanges={false}>
              <View style={styles.clientMarker}>
                <Text style={styles.clientMarkerIcon}>📍</Text>
              </View>
            </Marker>

            {/* Provider markers */}
            {providersWithLocations.map(p => renderProviderMarker(p, false))}
          </MapView>

          {/* Overlay button */}
          <View style={styles.mapOverlay}>
            <View style={styles.expandButton}>
              <Text style={styles.expandButtonText}>Voir la carte</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Card>

      {/* Fullscreen Map Modal */}
      <Modal
        visible={showFullMap}
        animationType="slide"
        onRequestClose={() => setShowFullMap(false)}
      >
        <View style={styles.fullscreenContainer}>
          {/* Header */}
          <View style={styles.fullscreenHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                hapticFeedback.light();
                setShowFullMap(false);
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.fullscreenTitle}>Choisir un prestataire</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Native MapView - Full interactivity */}
          <View style={styles.mapWrapper}>
            <MapView
              ref={fullMapRef}
              style={{ flex: 1 }}
              initialRegion={initialRegion}
              scrollEnabled={true}
              zoomEnabled={true}
              rotateEnabled={true}
              pitchEnabled={false}
              toolbarEnabled={false}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={true}
              loadingEnabled={true}
              moveOnMarkerPress={false}
            >
              {/* Radius circle */}
              <Circle
                center={location}
                radius={radius * 1000}
                strokeColor={colors.primary}
                strokeWidth={2}
                fillColor={`${colors.primary}10`}
                lineDashPattern={[10, 10]}
              />

              {/* Client marker */}
              <Marker coordinate={location} tracksViewChanges={false}>
                <View style={styles.clientMarkerLarge}>
                  <Text style={styles.clientMarkerIconLarge}>📍</Text>
                </View>
              </Marker>

              {/* Provider markers */}
              {providersWithLocations.map(p => renderProviderMarker(p, true))}
            </MapView>

            {/* Zoom Controls */}
            <View style={styles.zoomControls}>
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => {
                  hapticFeedback.light();
                  fullMapRef.current?.getCamera().then(camera => {
                    if (camera) {
                      fullMapRef.current?.animateCamera({
                        ...camera,
                        zoom: (camera.zoom || 12) + 1,
                      }, { duration: 200 });
                    }
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.zoomText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => {
                  hapticFeedback.light();
                  fullMapRef.current?.getCamera().then(camera => {
                    if (camera) {
                      fullMapRef.current?.animateCamera({
                        ...camera,
                        zoom: (camera.zoom || 12) - 1,
                      }, { duration: 200 });
                    }
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.zoomText}>−</Text>
              </TouchableOpacity>
            </View>

            {/* Recenter button */}
            <TouchableOpacity
              style={styles.recenterBtn}
              onPress={() => {
                hapticFeedback.light();
                const coordinates = [
                  { latitude: location.latitude, longitude: location.longitude },
                  ...providersWithLocations.map(p => p.location),
                ];
                fullMapRef.current?.fitToCoordinates(coordinates, {
                  edgePadding: { top: 80, right: 50, bottom: 50, left: 50 },
                  animated: true,
                });
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.recenterText}>⟲</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  containerCompact: {
    marginBottom: spacing.sm,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  mapContainer: {
    height: 160,
    position: 'relative',
  },
  mapContainerCompact: {
    height: 120,
  },
  map: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  expandButton: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  expandButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },

  // Markers
  clientMarker: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  clientMarkerIcon: {
    fontSize: 18,
  },
  clientMarkerLarge: {
    width: 48,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  clientMarkerIconLarge: {
    fontSize: 22,
  },
  markerContainer: {
    width: 48,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  markerSelected: {
    borderColor: colors.primary,
    borderWidth: 4,
    backgroundColor: colors.primary,
  },
  markerNearest: {
    borderColor: colors.warning,
    backgroundColor: colors.warning,
  },
  markerOffline: {
    borderColor: colors.gray[400],
    opacity: 0.7,
  },
  markerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  markerInitials: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray[700],
  },
  markerInitialsLight: {
    color: colors.white,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    backgroundColor: colors.success,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white,
  },
  nearestBadgeMarker: {
    position: 'absolute',
    top: -18,
    backgroundColor: colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  nearestBadgeMarkerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
  },

  // Fullscreen Modal
  fullscreenContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.gray[600],
  },
  fullscreenTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },

  // Zoom Controls
  zoomControls: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    gap: 8,
  },
  zoomBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  zoomText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  recenterBtn: {
    position: 'absolute',
    left: 16,
    bottom: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  recenterText: {
    fontSize: 24,
    color: colors.gray[600],
  },

  // Callout Styles
  calloutContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minWidth: 180,
    maxWidth: 220,
    ...shadows.lg,
  },
  calloutNearestBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  calloutNearestText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  calloutName: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 4,
  },
  calloutRating: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: 4,
  },
  calloutDistance: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginBottom: 4,
  },
  calloutAvailability: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  calloutButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  calloutButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
});
