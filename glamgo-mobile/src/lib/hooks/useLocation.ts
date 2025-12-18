/**
 * useLocation Hook - GlamGo Mobile
 * Gestion de la géolocalisation avec expo-location
 */

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
}

interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  watchPosition?: boolean;
  distanceInterval?: number; // meters
  timeInterval?: number; // milliseconds
}

interface UseLocationReturn {
  location: LocationCoords | null;
  error: string | null;
  loading: boolean;
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationCoords | null>;
  startWatching: () => Promise<void>;
  stopWatching: () => void;
}

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const {
    enableHighAccuracy = true,
    watchPosition = false,
    distanceInterval = 10,
    timeInterval = 5000,
  } = options;

  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [watchSubscription, setWatchSubscription] = useState<Location.LocationSubscription | null>(null);

  // Check and request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Check current status
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

      if (existingStatus === 'granted') {
        setHasPermission(true);
        return true;
      }

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        setHasPermission(true);
        return true;
      }

      setHasPermission(false);
      setError('Permission de localisation refusée');

      // Show alert to open settings
      Alert.alert(
        'Permission requise',
        'GlamGo a besoin d\'accéder à votre position pour suivre le prestataire en temps réel.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Ouvrir les paramètres',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );

      return false;
    } catch (err) {
      console.error('Permission error:', err);
      setError('Erreur lors de la demande de permission');
      setHasPermission(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current location once
  const getCurrentLocation = useCallback(async (): Promise<LocationCoords | null> => {
    try {
      setLoading(true);
      setError(null);

      // Check permission first
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      const result = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
      });

      const coords: LocationCoords = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
        altitude: result.coords.altitude,
        heading: result.coords.heading,
        speed: result.coords.speed,
      };

      setLocation(coords);
      return coords;
    } catch (err: any) {
      console.error('Location error:', err);
      setError(err.message || 'Erreur de localisation');
      return null;
    } finally {
      setLoading(false);
    }
  }, [enableHighAccuracy, requestPermission]);

  // Start watching location
  const startWatching = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check permission
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return;
      }

      // Stop existing subscription
      if (watchSubscription) {
        watchSubscription.remove();
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: enableHighAccuracy
            ? Location.Accuracy.High
            : Location.Accuracy.Balanced,
          distanceInterval,
          timeInterval,
        },
        (newLocation) => {
          const coords: LocationCoords = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy,
            altitude: newLocation.coords.altitude,
            heading: newLocation.coords.heading,
            speed: newLocation.coords.speed,
          };
          setLocation(coords);
        }
      );

      setWatchSubscription(subscription);
    } catch (err: any) {
      console.error('Watch location error:', err);
      setError(err.message || 'Erreur de suivi de position');
    } finally {
      setLoading(false);
    }
  }, [enableHighAccuracy, distanceInterval, timeInterval, requestPermission, watchSubscription]);

  // Stop watching
  const stopWatching = useCallback(() => {
    if (watchSubscription) {
      watchSubscription.remove();
      setWatchSubscription(null);
    }
  }, [watchSubscription]);

  // Check initial permission status
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Auto-start watching if enabled
  useEffect(() => {
    if (watchPosition && hasPermission) {
      startWatching();
    }

    return () => {
      stopWatching();
    };
  }, [watchPosition, hasPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchSubscription) {
        watchSubscription.remove();
      }
    };
  }, []);

  return {
    location,
    error,
    loading,
    hasPermission,
    requestPermission,
    getCurrentLocation,
    startWatching,
    stopWatching,
  };
}

// Calculate distance between two points (Haversine formula)
export function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

// Estimate arrival time based on distance and speed
export function estimateArrivalTime(
  distanceKm: number,
  speedKmh: number = 30 // Default average speed in city
): number {
  return Math.round((distanceKm / speedKmh) * 60); // Minutes
}

export default useLocation;
