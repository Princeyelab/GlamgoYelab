/**
 * AddressAutocomplete Component - GlamGo Mobile
 * Saisie d'adresse avec geolocalisation et suggestions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { hapticFeedback } from '../../lib/utils/haptics';
import { useLocation, LocationCoords } from '../../lib/hooks/useLocation';

export interface AddressData {
  formatted: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  coords?: LocationCoords;
}

interface AddressAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onAddressSelect: (address: AddressData) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

// Cities with coordinates (Morocco + France for testing)
const CITIES: { name: string; lat: number; lng: number }[] = [
  // France - Test cities
  { name: 'Villeurbanne', lat: 45.7676, lng: 4.8799 },
  { name: 'Lyon', lat: 45.7640, lng: 4.8357 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Marseille', lat: 43.2965, lng: 5.3698 },
  { name: 'Toulouse', lat: 43.6047, lng: 1.4442 },
  { name: 'Nice', lat: 43.7102, lng: 7.2620 },
  { name: 'Nantes', lat: 47.2184, lng: -1.5536 },
  { name: 'Strasbourg', lat: 48.5734, lng: 7.7521 },
  { name: 'Bordeaux', lat: 44.8378, lng: -0.5792 },
  // Morocco
  { name: 'Casablanca', lat: 33.5731, lng: -7.5898 },
  { name: 'Rabat', lat: 34.0209, lng: -6.8416 },
  { name: 'Marrakech', lat: 31.6295, lng: -7.9811 },
  { name: 'Fes', lat: 34.0181, lng: -5.0078 },
  { name: 'Tanger', lat: 35.7595, lng: -5.8340 },
  { name: 'Agadir', lat: 30.4278, lng: -9.5981 },
  { name: 'Meknes', lat: 33.8935, lng: -5.5547 },
  { name: 'Oujda', lat: 34.6867, lng: -1.9114 },
  { name: 'Kenitra', lat: 34.2610, lng: -6.5802 },
  { name: 'Tetouan', lat: 35.5889, lng: -5.3626 },
];

// Common street types
const STREET_TYPES = [
  'Avenue', 'Boulevard', 'Rue', 'Place', 'Quartier', 'Residence',
];

export default function AddressAutocomplete({
  value,
  onChangeText,
  onAddressSelect,
  placeholder = 'Entrez votre adresse',
  label,
  error,
  disabled = false,
}: AddressAutocompleteProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressData[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { getCurrentLocation, hasPermission, requestPermission, loading: locationLoading } = useLocation();

  // Generate suggestions based on input
  const generateSuggestions = useCallback((text: string): AddressData[] => {
    if (!text || text.length < 2) return [];

    const lowerText = text.toLowerCase();
    const results: AddressData[] = [];

    // French cities (first 9 in the list)
    const frenchCities = ['Villeurbanne', 'Lyon', 'Paris', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Bordeaux'];

    // Match cities with coordinates
    CITIES.forEach(cityData => {
      if (cityData.name.toLowerCase().includes(lowerText)) {
        const isFrance = frenchCities.includes(cityData.name);
        results.push({
          formatted: `${cityData.name}, ${isFrance ? 'France' : 'Maroc'}`,
          city: cityData.name,
          country: isFrance ? 'France' : 'Maroc',
          coords: { latitude: cityData.lat, longitude: cityData.lng },
        });
      }
    });

    // Generate street suggestions for matched cities (use first 3 cities - French ones for testing)
    CITIES.slice(0, 3).forEach(cityData => {
      STREET_TYPES.slice(0, 2).forEach(type => {
        if (lowerText.length > 2 && !cityData.name.toLowerCase().includes(lowerText)) {
          results.push({
            formatted: `${type} ${text.charAt(0).toUpperCase() + text.slice(1)}, ${cityData.name}`,
            street: `${type} ${text}`,
            city: cityData.name,
            country: 'Maroc',
            coords: { latitude: cityData.lat, longitude: cityData.lng },
          });
        }
      });
    });

    return results.slice(0, 6);
  }, []);

  // Update suggestions when text changes
  useEffect(() => {
    const newSuggestions = generateSuggestions(value);
    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0 && isFocused);
  }, [value, isFocused, generateSuggestions]);

  // Reverse geocoding
  const reverseGeocode = async (coords: LocationCoords): Promise<string> => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (results.length > 0) {
        const place = results[0];
        const parts = [
          place.streetNumber,
          place.street,
          place.district,
          place.city,
          place.region,
        ].filter(Boolean);

        return parts.join(', ') || `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
      }

      return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
    } catch (err) {
      console.error('Reverse geocode error:', err);
      return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
    }
  };

  // Handle use current location
  const handleUseCurrentLocation = async () => {
    hapticFeedback.medium();
    setIsLoadingLocation(true);

    try {
      // Check/request permission
      if (hasPermission === false) {
        const granted = await requestPermission();
        if (!granted) {
          setIsLoadingLocation(false);
          return;
        }
      }

      const coords = await getCurrentLocation();

      if (coords) {
        const address = await reverseGeocode(coords);
        const addressData: AddressData = {
          formatted: address,
          coords: coords,
        };

        onChangeText(address);
        onAddressSelect(addressData);
        setShowSuggestions(false);
        hapticFeedback.success();
      }
    } catch (err) {
      console.error('Error getting location:', err);
      hapticFeedback.warning();
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle suggestion select
  const handleSuggestionSelect = (suggestion: AddressData) => {
    hapticFeedback.selection();
    onChangeText(suggestion.formatted);
    onAddressSelect(suggestion);
    setShowSuggestions(false);
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow tap
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const isLoading = isLoadingLocation || locationLoading;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>
          {label}
        </Text>
      )}

      <View style={styles.inputWrapper}>
        {/* Input Container */}
        <View style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}>
          <Text style={styles.inputIcon}>📍</Text>

          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={colors.gray[400]}
            editable={!disabled && !isLoading}
            multiline
            numberOfLines={2}
          />

          {isLoading && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
        </View>

        {/* Use Current Location Button */}
        <TouchableOpacity
          style={[
            styles.locationButton,
            isLoading && styles.locationButtonLoading,
          ]}
          onPress={handleUseCurrentLocation}
          disabled={disabled || isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.locationButtonIcon}>📌</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Location Helper Text */}
      <TouchableOpacity
        onPress={handleUseCurrentLocation}
        disabled={disabled || isLoading}
        style={styles.helperButton}
      >
        <Text style={styles.helperText}>
          {isLoading ? 'Localisation en cours...' : 'Utiliser ma position actuelle'}
        </Text>
      </TouchableOpacity>

      {/* Suggestions List - Using ScrollView instead of FlatList to avoid nesting issues */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionSelect(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionIcon}>📍</Text>
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionText} numberOfLines={1}>
                    {item.formatted}
                  </Text>
                  {item.city && (
                    <Text style={styles.suggestionSubtext}>
                      {item.city}, Maroc
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Error Text */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    zIndex: 1000,
    position: 'relative',
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  labelError: {
    color: colors.error,
  },

  // Input Wrapper
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },

  // Input Container
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[200],
  },
  inputIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    paddingVertical: Platform.OS === 'ios' ? spacing.xs : 0,
  },

  // Location Button
  locationButton: {
    width: 56,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  locationButtonLoading: {
    opacity: 0.7,
  },
  locationButtonIcon: {
    fontSize: 24,
  },

  // Helper
  helperButton: {
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },

  // Suggestions
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 56 + spacing.sm, // Account for location button width
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    maxHeight: 280,
    zIndex: 9999,
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    ...shadows.lg,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
  },
  suggestionSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },

  // Error
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
