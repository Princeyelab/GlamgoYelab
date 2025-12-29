/**
 * Create Booking Screen - GlamGo Mobile
 * Ecran de reservation complet avec formules, prix et paiement
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import Loading from '../../src/components/ui/Loading';
import DateTimePicker from '../../src/components/ui/DateTimePicker';
import FormulaSelector, { FormulaType, getFormulaById } from '../../src/components/features/FormulaSelector';
import PaymentMethodSelector, { PaymentMethod } from '../../src/components/features/PaymentMethodSelector';
import PriceBreakdownCard from '../../src/components/features/PriceBreakdownCard';
import AddressAutocomplete, { AddressData } from '../../src/components/features/AddressAutocomplete';
import ProviderSelector, { Provider } from '../../src/components/features/ProviderSelector';
import NearbyProvidersMap, { NearbyProvider } from '../../src/components/features/NearbyProvidersMap';
import { usePriceCalculation } from '../../src/lib/hooks/usePriceCalculation';
import { getNearbyProviders } from '../../src/lib/api/servicesAPI';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import { createBooking } from '../../src/lib/store/slices/bookingsSlice';
import {
  selectServices,
  selectCurrentService,
  fetchServiceById,
} from '../../src/lib/store/slices/servicesSlice';
import { selectUser } from '../../src/lib/store/slices/authSlice';
import { showToast } from '../../src/lib/store/slices/uiSlice';
import { hapticFeedback } from '../../src/lib/utils/haptics';

export default function CreateBookingScreen() {
  const { service_id } = useLocalSearchParams<{ service_id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const services = useAppSelector(selectServices);
  const currentService = useAppSelector(selectCurrentService);
  const user = useAppSelector(selectUser);

  // Find service from list or use current
  const service = services.find(s => String(s.id) === String(service_id)) || currentService;

  // Form state
  const [selectedFormula, setSelectedFormula] = useState<FormulaType>('standard');
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(() => {
    const now = new Date();
    // Si apres 19h, proposer demain a 10h, sinon aujourd'hui dans 1h (arrondi a 30min)
    if (now.getHours() >= 19) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      return tomorrow;
    }
    // Proposer dans 1h minimum, arrondi a 30min
    const suggested = new Date();
    suggested.setHours(suggested.getHours() + 1);
    suggested.setMinutes(suggested.getMinutes() >= 30 ? 30 : 0, 0, 0);
    // Minimum 8h
    if (suggested.getHours() < 8) {
      suggested.setHours(8, 0, 0, 0);
    }
    return suggested;
  });
  const [address, setAddress] = useState('');
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!service);

  // Providers state
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Errors
  const [dateTimeError, setDateTimeError] = useState('');
  const [addressError, setAddressError] = useState('');

  // Use provider's distance for pricing
  const distanceKm = selectedProvider?.distance || 0;

  // Price calculation
  const priceBreakdown = usePriceCalculation({
    basePrice: service?.price || 0,
    formula: selectedFormula,
    selectedDateTime: selectedDateTime,
    distance: distanceKm,
    includeServiceFee: true,
  });

  // Handle address selection
  const handleAddressSelect = (data: AddressData) => {
    setAddressData(data);
    setAddressError('');
    // Reset provider when address changes
    setSelectedProvider(null);
  };

  // Fetch nearby providers when address is selected
  useEffect(() => {
    if (addressData?.coords && service_id) {
      fetchNearbyProviders();
    }
  }, [addressData, service_id]);

  const fetchNearbyProviders = async () => {
    if (!addressData?.coords) return;

    setLoadingProviders(true);
    setAvailableProviders([]);

    try {
      console.log('[Booking] Searching providers for service:', service_id, 'at:', addressData.coords);
      const providersResponse = await getNearbyProviders({
        latitude: addressData.coords.latitude,
        longitude: addressData.coords.longitude,
        service_id: Number(service_id),
        radius: 100, // 100km radius for testing
      });
      console.log('[Booking] Providers response:', providersResponse);

      // Ensure providers is an array
      const providers = Array.isArray(providersResponse) ? providersResponse : [];

      if (providers.length === 0) {
        console.log('[Booking] No providers found for this service/location');
        setAvailableProviders([]);
        return;
      }

      // Transform API response to Provider type
      const formattedProviders: Provider[] = providers.map((p: any) => {
        const name = p.name || p.business_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Prestataire';
        // Generate initials from name
        const nameParts = name.split(' ').filter(Boolean);
        const initials = nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
          : name.substring(0, 2).toUpperCase();

        return {
          id: p.id,
          name,
          initials,
          avatar: p.avatar || p.profile_image,
          rating: p.rating || p.average_rating || 0,
          reviewsCount: p.reviews_count || p.total_reviews || 0,
          distance: p.distance || 0,
          price: service?.price || 0,
          specialties: p.specialties || [],
          isOnline: p.is_online ?? p.is_available ?? true,
          isVerified: p.is_verified ?? true,
          completedServices: p.completed_orders || p.completed_services || 0,
          responseTime: p.response_time,
          location: (p.latitude && p.longitude) ? {
            latitude: parseFloat(p.latitude),
            longitude: parseFloat(p.longitude),
          } : undefined,
        };
      });

      setAvailableProviders(formattedProviders);
    } catch (error) {
      console.error('Error fetching nearby providers:', error);
      // Fallback: show empty state with message
      setAvailableProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  // Handle provider selection
  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    hapticFeedback.selection();
  };

  // Check if night hours
  const isNightHours = selectedDateTime.getHours() >= 20 || selectedDateTime.getHours() < 8;

  // Auto-select night formula if night hours selected
  useEffect(() => {
    if (isNightHours && selectedFormula !== 'night' && selectedFormula !== 'urgent') {
      Alert.alert(
        'Horaire de nuit detecte',
        'Vous avez selectionne un horaire de nuit (20h-8h). Voulez-vous appliquer la formule Nuit (+25%) ?',
        [
          { text: 'Non, garder Standard', style: 'cancel' },
          {
            text: 'Oui, appliquer Nuit',
            onPress: () => setSelectedFormula('night'),
          },
        ]
      );
    }
  }, [selectedDateTime]);

  useEffect(() => {
    // Si le service est deja dans le store, pas besoin de charger
    if (service) {
      setIsLoading(false);
      return;
    }

    // Sinon, essayer de charger depuis l'API
    if (service_id) {
      loadService();
    }
  }, [service_id, service]);

  const loadService = async () => {
    try {
      setIsLoading(true);
      await dispatch(fetchServiceById(service_id!)).unwrap();
    } catch (error) {
      console.error('Error loading service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = (): Date => {
    const today = new Date();
    today.setHours(8, 0, 0, 0);
    return today;
  };

  // Get maximum date (30 days from now)
  const getMaxDate = (): Date => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate;
  };

  // Validation function for date/time
  const validateDateTime = (date: Date): string => {
    const now = new Date();
    // Minimum 30 minutes dans le futur
    const minTime = new Date(now.getTime() + 30 * 60 * 1000);
    if (date <= minTime) return 'Reservation minimum 30 min a l\'avance';
    // Verifier les heures de service (8h-23h30)
    const hour = date.getHours();
    if (hour < 8) return 'Horaire disponible a partir de 8h';
    return '';
  };

  const validateAddress = (value: string): string => {
    if (!value) return 'Adresse requise';
    if (value.length < 10) return 'Adresse trop courte (min 10 caracteres)';
    return '';
  };

  // Format date for display
  const formatDateForDisplay = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  // Format time for display
  const formatTimeForDisplay = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle date/time selection
  const handleDateTimeChange = (date: Date) => {
    setSelectedDateTime(date);
    if (dateTimeError) setDateTimeError(validateDateTime(date));
  };

  const handleSubmit = async () => {
    console.log('[Booking] handleSubmit called');
    console.log('[Booking] selectedProvider:', selectedProvider);
    console.log('[Booking] service:', service);
    console.log('[Booking] address:', address);
    console.log('[Booking] addressData:', addressData);

    hapticFeedback.medium();

    // Validate all fields
    const dateTimeErr = validateDateTime(selectedDateTime);
    const addressErr = validateAddress(address);

    setDateTimeError(dateTimeErr);
    setAddressError(addressErr);

    if (dateTimeErr || addressErr) {
      hapticFeedback.warning();
      return;
    }

    if (!service) {
      Alert.alert('Erreur', 'Service non trouve');
      return;
    }

    if (!selectedProvider) {
      console.log('[Booking] No provider selected, showing alert');
      Alert.alert(
        'Prestataire requis',
        'Veuillez selectionner un prestataire pour continuer.'
      );
      hapticFeedback.warning();
      return;
    }

    if (!user) {
      console.log('[Booking] No user, redirecting to login');
      dispatch(showToast({
        message: 'Veuillez vous connecter pour reserver',
        type: 'error',
      }));
      router.push('/auth/login');
      return;
    }

    console.log('[Booking] Showing confirmation dialog');
    // Confirmation dialog
    const providerInfo = selectedProvider ? `\nPrestataire: ${selectedProvider.name}` : '';
    Alert.alert(
      'Confirmer la reservation',
      `Service: ${service.title}\nFormule: ${getFormulaById(selectedFormula).name}${providerInfo}\nTotal: ${priceBreakdown.total} DH\n\nConfirmer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setIsSubmitting(true);

            // Format date and time for API
            const formattedDate = selectedDateTime.toISOString().split('T')[0];
            const formattedTime = `${selectedDateTime.getHours().toString().padStart(2, '0')}:${selectedDateTime.getMinutes().toString().padStart(2, '0')}`;

            try {
              const result = await dispatch(createBooking({
                service_id: Number(service_id),
                provider_id: selectedProvider?.id || Number(service.provider?.id || 1),
                date: formattedDate,
                start_time: formattedTime,
                address: address,
                latitude: addressData?.coords?.latitude,
                longitude: addressData?.coords?.longitude,
                notes: notes || undefined,
                formula: selectedFormula,
                payment_method: paymentMethod,
                total_price: priceBreakdown.total,
              })).unwrap();

              setIsSubmitting(false);
              hapticFeedback.success();

              // Navigate to confirmation screen
              const bookingId = result?.id || Date.now();
              router.push({
                pathname: '/booking/confirmation',
                params: {
                  booking_id: String(bookingId),
                  service_name: service.title,
                  provider_name: selectedProvider?.name || 'Prestataire',
                  date: formattedDate,
                  time: formattedTime,
                  address: address,
                  total: String(priceBreakdown.total),
                  formula: getFormulaById(selectedFormula).name,
                },
              });
            } catch (error: any) {
              setIsSubmitting(false);
              hapticFeedback.warning();
              dispatch(showToast({
                message: error?.message || error || 'Erreur lors de la reservation',
                type: 'error',
              }));
              console.error('Booking error:', error);
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return <Loading fullScreen message="Chargement..." />;
  }

  if (!service) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorText}>Service non trouve</Text>
        <Button variant="outline" onPress={handleBack}>
          Retour
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle reservation</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Service Summary - Style Web App */}
        <Card style={styles.serviceCard}>
          {/* Image */}
          {service.images?.[0] || service.thumbnail ? (
            <Image
              source={{ uri: service.images?.[0] || service.thumbnail }}
              style={styles.serviceImageLarge}
            />
          ) : (
            <View style={[styles.serviceImageLarge, styles.serviceImagePlaceholder]}>
              <Text style={styles.serviceImagePlaceholderText}>💇</Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.serviceContent}>
            {/* Category Badge */}
            {service.category && (
              <View style={[styles.categoryBadge, { backgroundColor: (service.category as any).color || colors.primary }]}>
                <Text style={styles.categoryBadgeText}>
                  {(service.category as any).name || 'Service'}
                </Text>
              </View>
            )}

            {/* Title */}
            <Text style={styles.serviceName}>{service.title || service.name}</Text>

            {/* Rating */}
            {service.rating > 0 && (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingStar}>★</Text>
                <Text style={styles.ratingValue}>{service.rating.toFixed(1)}</Text>
                <Text style={styles.reviewsCount}>
                  ({service.reviews_count || service.reviewsCount || 0} avis)
                </Text>
              </View>
            )}

            {/* Price & Duration */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Prix de base</Text>
                <Text style={styles.detailValue}>{service.price} DH</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Duree estimee</Text>
                <Text style={styles.detailValue}>⏱ {service.duration_minutes} min</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* ETAPE 1: Date & Time */}
        <Card style={styles.formCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.sectionTitle}>Quand ?</Text>
          </View>
          <DateTimePicker
            mode="datetime"
            value={selectedDateTime}
            onChange={handleDateTimeChange}
            minDate={getMinDate()}
            maxDate={getMaxDate()}
            placeholder="Choisir une date et heure"
            error={dateTimeError}
          />

          {/* Night hours warning */}
          {isNightHours && (
            <View style={styles.nightWarning}>
              <Text style={styles.nightWarningIcon}>🌙</Text>
              <Text style={styles.nightWarningText}>
                Horaire de nuit (20h-8h) - Majoration +25%
              </Text>
            </View>
          )}
        </Card>

        {/* ETAPE 2: Address */}
        <Card style={[styles.formCard, { zIndex: 100, overflow: 'visible' }]}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.sectionTitle}>Ou ?</Text>
          </View>
          <AddressAutocomplete
            value={address}
            onChangeText={(v) => {
              setAddress(v);
              if (addressError) setAddressError(validateAddress(v));
            }}
            onAddressSelect={handleAddressSelect}
            placeholder="Numero, Rue, Quartier, Ville"
            error={addressError}
            disabled={isSubmitting}
          />
        </Card>

        {/* ETAPE 3: Provider Selection - Shown only after address is selected */}
        {addressData?.coords ? (
          <>
            {/* Carte des prestataires */}
            <NearbyProvidersMap
              clientLocation={addressData.coords}
              providers={availableProviders.map(p => ({
                id: p.id,
                name: p.name || 'Prestataire',
                initials: p.initials || 'PR',
                rating: Number(p.rating) || 0,
                reviewsCount: Number(p.reviewsCount) || 0,
                distance: Number(p.distance) || 0,
                eta: Math.round((Number(p.distance) || 0) * 5), // ~5 min/km
                specialties: p.specialties || [],
                isOnline: p.isOnline ?? true,
                location: p.location || { latitude: 0, longitude: 0 },
              }))}
              selectedProviderId={selectedProvider?.id}
              onProviderSelect={(mapProvider) => {
                const provider = availableProviders.find(p => p.id === mapProvider.id);
                if (provider) handleProviderSelect(provider);
              }}
              loading={loadingProviders}
              radius={15}
              compact={false}
            />

            {/* Liste des prestataires */}
            <Card style={styles.formCard}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.sectionTitle}>Choisir un prestataire</Text>
              </View>
              {loadingProviders ? (
                <View style={styles.providersLoading}>
                  <Text style={styles.providersLoadingText}>
                    Recherche des prestataires disponibles...
                  </Text>
                </View>
              ) : availableProviders.length > 0 ? (
                <ProviderSelector
                  providers={availableProviders}
                  selectedProviderId={selectedProvider?.id}
                  onSelect={handleProviderSelect}
                  showDistance={true}
                />
              ) : (
                <View style={styles.noProvidersContainer}>
                  <Text style={styles.noProvidersIcon}>😕</Text>
                  <Text style={styles.noProvidersText}>
                    Aucun prestataire disponible dans cette zone.
                  </Text>
                  <Text style={styles.noProvidersHint}>
                    Essayez une autre adresse ou date.
                  </Text>
                </View>
              )}
            </Card>
          </>
        ) : (
          <Card style={[styles.formCard, styles.formCardDisabled]}>
            <View style={styles.stepHeader}>
              <Text style={[styles.stepNumber, styles.stepNumberDisabled]}>3</Text>
              <Text style={[styles.sectionTitle, styles.sectionTitleDisabled]}>Avec qui ?</Text>
            </View>
            <Text style={styles.stepHint}>
              Renseignez d'abord l'adresse pour voir les prestataires disponibles
            </Text>
          </Card>
        )}

        {/* ETAPE 4: Formula Selection */}
        <View style={styles.formulaSection}>
          <View style={styles.stepHeaderInline}>
            <Text style={styles.stepNumber}>4</Text>
          </View>
          <FormulaSelector
            selectedFormula={selectedFormula}
            onSelect={setSelectedFormula}
            basePrice={service.price}
            disabled={isSubmitting}
          />
        </View>

        {/* Notes */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Notes (optionnel)</Text>
          <Input
            placeholder="Instructions speciales, code interphone, etage..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            editable={!isSubmitting}
          />
        </Card>

        {/* Payment Method */}
        <PaymentMethodSelector
          selectedMethod={paymentMethod}
          onSelect={setPaymentMethod}
          disabled={isSubmitting}
        />

        {/* Price Breakdown */}
        <PriceBreakdownCard
          breakdown={priceBreakdown}
          showDetails={true}
        />

        {/* Submit Button */}
        <Button
          variant="primary"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || !selectedProvider}
          fullWidth
          style={styles.submitButton}
        >
          {selectedProvider
            ? `Reserver avec ${selectedProvider.name} - ${priceBreakdown.total} DH`
            : 'Selectionnez un prestataire'
          }
        </Button>

        {/* Cancel Link */}
        <TouchableOpacity
          onPress={handleBack}
          style={styles.cancelLink}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelLinkText}>Annuler</Text>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: colors.gray[900],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  headerSpacer: {
    width: 40,
  },

  // Scroll Content
  scrollContent: {
    padding: spacing.lg,
  },

  // Section Title
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },

  // Service Card - Web App Style
  serviceCard: {
    marginBottom: spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  serviceImageLarge: {
    width: '100%',
    height: 200,
    backgroundColor: colors.gray[200],
  },
  serviceImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
  serviceImagePlaceholderText: {
    fontSize: 48,
  },
  serviceContent: {
    padding: spacing.lg,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  categoryBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.white,
    textTransform: 'uppercase',
  },
  serviceName: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ratingStar: {
    fontSize: typography.fontSize.base,
    color: '#FBBF24',
    marginRight: 4,
  },
  ratingValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginRight: 4,
  },
  reviewsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  serviceDescription: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  detailsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: spacing.md,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginBottom: 4,
  },
  detailValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },

  // Form Card
  formCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    overflow: 'visible',
    zIndex: 1,
  },
  formCardDisabled: {
    opacity: 0.6,
  },

  // Step Header
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  stepNumberDisabled: {
    backgroundColor: colors.gray[300],
  },
  sectionTitleDisabled: {
    color: colors.gray[400],
  },
  stepHint: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[400],
    fontStyle: 'italic',
  },

  // Providers Loading
  providersLoading: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  providersLoadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },

  // No Providers
  noProvidersContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  noProvidersIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  noProvidersText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  noProvidersHint: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
  },

  // Formula Section
  formulaSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  stepHeaderInline: {
    marginRight: spacing.sm,
    marginTop: spacing.md,
  },

  // Night Warning
  nightWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
  },
  nightWarningIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  nightWarningText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: '500',
  },

  // Submit Button
  submitButton: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },

  // Cancel Link
  cancelLink: {
    alignItems: 'center',
    padding: spacing.md,
  },
  cancelLinkText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textDecorationLine: 'underline',
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
