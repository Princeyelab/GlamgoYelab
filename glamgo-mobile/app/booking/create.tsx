/**
 * Create Booking Screen - GlamGo Mobile
 * Ecran de reservation complet avec formules, prix et paiement
 */

import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
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
import RadiusSelector, { calculateDistanceFee } from '../../src/components/features/RadiusSelector';
import GuestSelector from '../../src/components/features/GuestSelector';
import PackSelector, { COACH_PACKS, Pack } from '../../src/components/features/PackSelector';
import { usePriceCalculation } from '../../src/lib/hooks/usePriceCalculation';
import { getNearbyProviders } from '../../src/lib/api/servicesAPI';
import apiClient, { API_BASE_URL } from '../../src/lib/api/client';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { getServiceTranslation, getCategoryTranslation } from '../../src/i18n/translations/services';
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

// Type pour service personnalisé
interface CustomServiceData {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  provider_id: number;
  provider_name?: string;
  images?: string[];
}

export default function CreateBookingScreen() {
  const { service_id, custom_service_id, provider_id: preselectedProviderId } = useLocalSearchParams<{
    service_id?: string;
    custom_service_id?: string;
    provider_id?: string;
  }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, language, isRTL } = useLanguage();

  const services = useAppSelector(selectServices);
  const currentService = useAppSelector(selectCurrentService);
  const user = useAppSelector(selectUser);

  // State pour service personnalisé
  const [customServiceData, setCustomServiceData] = useState<CustomServiceData | null>(null);

  // Déterminer si c'est un service personnalisé
  const isCustomService = !!custom_service_id;

  // Find service from list or use current (pour services standards)
  const service = isCustomService ? null : (services.find(s => String(s.id) === String(service_id)) || currentService);

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
  const submissionLockRef = useRef(false); // Verrou synchrone anti double-tap
  const [isLoading, setIsLoading] = useState(!service);
  const [selectedRadius, setSelectedRadius] = useState<number>(15);
  const [numberOfGuests, setNumberOfGuests] = useState<number>(2); // Pour service chef
  const [selectedPackId, setSelectedPackId] = useState<string>('decouverte'); // Pour service coach

  // Providers state
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Errors
  const [dateTimeError, setDateTimeError] = useState('');
  const [addressError, setAddressError] = useState('');

  // Pending review check
  const [hasPendingReview, setHasPendingReview] = useState(false);
  const [pendingReviewOrder, setPendingReviewOrder] = useState<any>(null);
  const [checkingPendingReview, setCheckingPendingReview] = useState(true);

  // Use provider's distance for pricing
  const distanceKm = selectedProvider?.distance || 0;

  // Calculate CGU distance fee
  const distanceFeeInfo = calculateDistanceFee(distanceKm);

  // Detecter si c'est un service type "chef" (prix par personne)
  const isChefService = service?.service_type === 'chef' || (service as any)?.price_per_person;
  const pricePerPerson = (service as any)?.price_per_person || 250;
  const minGuests = (service as any)?.min_guests || 2;
  const maxGuests = (service as any)?.max_guests || 12;

  // Detecter si c'est un service type "coach" (packs de seances)
  const isCoachService = service?.service_type === 'coach' ||
    (service?.slug === 'coach-sportif') ||
    (service?.title?.toLowerCase().includes('coach'));
  const servicePacks: Pack[] = Array.isArray((service as any)?.packs)
    ? (service as any).packs
    : COACH_PACKS;
  const selectedPack = servicePacks.find(p => p.id === selectedPackId) || servicePacks[0] || COACH_PACKS[0];

  // Price calculation - utilise le prix du service standard ou personnalisé
  // Pour chef: prix = nombre_personnes × prix_par_personne
  // Pour coach: prix = prix du pack selectionne
  const basePrice = isCustomService
    ? (customServiceData?.price || 0)
    : isChefService
      ? (numberOfGuests * pricePerPerson)
      : isCoachService
        ? (selectedPack?.price || 700)
        : (service?.price || 0);

  const priceBreakdown = usePriceCalculation({
    basePrice: basePrice,
    formula: selectedFormula,
    selectedDateTime: selectedDateTime,
    distance: distanceKm,
    includeServiceFee: true,
    distanceFee: distanceFeeInfo.fee,
  });

  // Handle address selection
  const handleAddressSelect = (data: AddressData) => {
    setAddressData(data);
    setAddressError('');
    // Reset provider when address changes - sauf pour services personnalisés
    if (!isCustomService) {
      setSelectedProvider(null);
    }
  };

  // Vérifier s'il y a une évaluation en attente (bloque nouvelle réservation)
  useEffect(() => {
    checkPendingReviews();
  }, [user]);

  const checkPendingReviews = async () => {
    if (!user) {
      setCheckingPendingReview(false);
      return;
    }

    try {
      setCheckingPendingReview(true);
      const response = await apiClient.get('/api/orders');
      const orders = response.data?.data || [];

      // Chercher une commande avec statut completed_pending_review
      const pendingReview = orders.find(
        (o: any) => o.status === 'completed_pending_review'
      );

      if (pendingReview) {
        console.log('[Booking] Found pending review for order:', pendingReview.id);
        setHasPendingReview(true);
        setPendingReviewOrder(pendingReview);
      } else {
        setHasPendingReview(false);
        setPendingReviewOrder(null);
      }
    } catch (error) {
      console.log('[Booking] Error checking pending reviews:', error);
      setHasPendingReview(false);
    } finally {
      setCheckingPendingReview(false);
    }
  };

  // Charger les infos du service personnalisé si custom_service_id est fourni
  useEffect(() => {
    console.log('[Booking] useEffect custom_service_id:', custom_service_id, 'provider_id:', preselectedProviderId);
    if (custom_service_id && preselectedProviderId) {
      loadCustomService();
    }
  }, [custom_service_id, preselectedProviderId]);

  const loadCustomService = async () => {
    if (!preselectedProviderId) {
      console.error('[Booking] No provider_id provided for custom service');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[Booking] Loading custom service:', custom_service_id, 'from provider:', preselectedProviderId);

      // Récupérer les infos du service personnalisé via l'API publique
      const response = await apiClient.get(`/api/providers/${preselectedProviderId}/custom-services`);
      console.log('[Booking] Custom services API response:', JSON.stringify(response.data, null, 2));

      // Gérer différentes structures de réponse
      let services = [];
      if (response.data?.success && response.data.data?.services) {
        services = response.data.data.services;
      } else if (response.data?.data?.services) {
        services = response.data.data.services;
      } else if (response.data?.services) {
        services = response.data.services;
      } else if (Array.isArray(response.data)) {
        services = response.data;
      }

      console.log('[Booking] Extracted services:', services.length, 'services found');
      console.log('[Booking] Looking for service ID:', custom_service_id, 'type:', typeof custom_service_id);

      if (services.length > 0) {
        services.forEach((s: any) => {
          console.log('[Booking] Service in list - ID:', s.id, 'type:', typeof s.id, 'name:', s.name);
        });
      }

      const customService = services.find(
        (s: any) => String(s.id) === String(custom_service_id)
      );
      console.log('[Booking] Found custom service:', customService);

      if (customService) {
        setCustomServiceData({
          id: customService.id,
          name: customService.name,
          price: parseFloat(customService.price),
          duration_minutes: customService.duration_minutes,
          provider_id: parseInt(preselectedProviderId || '0'),
          images: customService.images || [],
        });
        console.log('[Booking] Custom service data set successfully');
      } else {
        console.error('[Booking] Custom service ID', custom_service_id, 'not found in provider', preselectedProviderId, 'services');
      }
    } catch (error: any) {
      console.error('[Booking] Error loading custom service:', error.message || error);
      console.error('[Booking] Error details:', error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pour services personnalisés, pré-sélectionner le prestataire
  useEffect(() => {
    console.log('[Booking] Provider selection useEffect - isCustomService:', isCustomService, 'customServiceData:', !!customServiceData, 'preselectedProviderId:', preselectedProviderId);
    if (isCustomService && customServiceData && preselectedProviderId) {
      console.log('[Booking] Setting selectedProvider for custom service');
      // Créer un provider minimal pour la sélection
      setSelectedProvider({
        id: parseInt(preselectedProviderId),
        name: customServiceData.name ? `Prestataire` : 'Prestataire',
        initials: 'PR',
        rating: 0,
        reviewsCount: 0,
        specialties: [],
        isOnline: true,
        isVerified: true,
        completedServices: 0,
      });
    }
  }, [isCustomService, customServiceData, preselectedProviderId]);

  // Fetch nearby providers when address is selected or radius changes (services standards uniquement)
  useEffect(() => {
    if (addressData?.coords && service_id && !isCustomService) {
      fetchNearbyProviders();
    }
  }, [addressData, service_id, selectedRadius, isCustomService]);

  const fetchNearbyProviders = async () => {
    if (!addressData?.coords || isCustomService) return;

    setLoadingProviders(true);
    setAvailableProviders([]);

    try {
      console.log('[Booking] Searching providers for service:', service_id, 'at:', addressData.coords, 'radius:', selectedRadius);
      const providersResponse = await getNearbyProviders({
        latitude: addressData.coords.latitude,
        longitude: addressData.coords.longitude,
        service_id: Number(service_id),
        radius: selectedRadius,
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

        // Convertir les spécialités en tableau (peut venir comme string ou array)
        let specialtiesArray: string[] = [];
        if (typeof p.specialties === 'string' && p.specialties) {
          specialtiesArray = p.specialties.split(', ').filter(Boolean);
        } else if (Array.isArray(p.specialties)) {
          specialtiesArray = p.specialties;
        }

        // Calculer le temps de réponse estimé basé sur les commandes
        const completedOrders = p.completed_orders || p.completed_services || 0;
        let responseTime = '< 30 min';
        if (completedOrders > 100) {
          responseTime = '< 5 min';
        } else if (completedOrders > 50) {
          responseTime = '< 10 min';
        } else if (completedOrders > 20) {
          responseTime = '< 15 min';
        }

        return {
          id: p.id,
          name,
          initials,
          avatar: p.avatar || p.profile_image,
          rating: p.rating || p.average_rating || 0,
          reviewsCount: p.reviews_count || p.total_reviews || 0,
          distance: p.distance || 0,
          price: service?.price || 0,
          specialties: specialtiesArray,
          isOnline: p.is_online ?? p.is_available ?? true,
          isVerified: p.is_verified ?? true,
          completedServices: completedOrders,
          responseTime: p.response_time || responseTime,
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
        t('createBooking.nightHoursDetected'),
        t('createBooking.nightHoursMessage'),
        [
          { text: t('createBooking.keepStandard'), style: 'cancel' },
          {
            text: t('createBooking.applyNight'),
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
    if (date <= minTime) return t('createBooking.minAdvance');
    // Verifier les heures de service (8h-23h30)
    const hour = date.getHours();
    if (hour < 8) return t('createBooking.availableFrom8');
    return '';
  };

  const validateAddress = (value: string): string => {
    if (!value) return t('createBooking.addressRequired');
    if (value.length < 10) return t('createBooking.addressTooShort');
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
    return date.toLocaleDateString(language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR', options);
  };

  // Format time for display
  const formatTimeForDisplay = (date: Date): string => {
    return date.toLocaleTimeString(language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR', {
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
    console.log('[Booking] isCustomService:', isCustomService);
    console.log('[Booking] customServiceData:', customServiceData);
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

    if (!service && !customServiceData) {
      Alert.alert(t('common.error'), t('createBooking.serviceNotFound'));
      return;
    }

    // Nom du service pour l'affichage
    const serviceName = isCustomService ? customServiceData?.name : service?.title;

    if (!selectedProvider) {
      console.log('[Booking] No provider selected, showing alert');
      Alert.alert(
        t('createBooking.providerRequired'),
        t('createBooking.selectProvider')
      );
      hapticFeedback.warning();
      return;
    }

    if (!user) {
      console.log('[Booking] No user, redirecting to login');
      dispatch(showToast({
        message: t('createBooking.loginRequired'),
        type: 'error',
      }));
      router.push('/auth/login');
      return;
    }

    // Empêcher double soumission (verrou synchrone + state)
    if (isSubmitting || submissionLockRef.current) {
      console.log('[Booking] Already submitting, ignoring');
      return;
    }

    console.log('[Booking] Showing confirmation dialog');
    // Confirmation dialog
    const providerInfo = selectedProvider ? `\n${t('createBooking.provider')}: ${selectedProvider.name}` : '';
    const serviceTypeLabel = isCustomService ? ` (${t('createBooking.exclusiveService')})` : '';
    const guestsInfo = isChefService ? `\n${t('createBooking.numberOfPeople')}: ${numberOfGuests}` : '';
    const packInfo = isCoachService ? `\n${t('createBooking.program')}: Pack ${selectedPack?.name} (${selectedPack?.sessions} ${t('createBooking.sessions')})` : '';
    Alert.alert(
      t('createBooking.confirmBooking'),
      `${t('services.service')}: ${serviceName}${serviceTypeLabel}${guestsInfo}${packInfo}\n${t('createBooking.formula')}: ${getFormulaById(selectedFormula).name}${providerInfo}\n${t('common.total')}: ${priceBreakdown.total} DH\n\n${t('createBooking.confirmQuestion')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            // VERROU SYNCHRONE: empêche double-tap immédiatement
            if (submissionLockRef.current) {
              console.log('[Booking] LOCK: Double tap blocked by ref');
              return;
            }
            submissionLockRef.current = true; // Verrouillage immédiat
            setIsSubmitting(true);

            // Format date and time for API
            const formattedDate = `${selectedDateTime.getFullYear()}-${String(selectedDateTime.getMonth() + 1).padStart(2, "0")}-${String(selectedDateTime.getDate()).padStart(2, "0")}`;
            const formattedTime = `${selectedDateTime.getHours().toString().padStart(2, '0')}:${selectedDateTime.getMinutes().toString().padStart(2, '0')}`;

            try {
              // Format scheduled_at for backend en heure LOCALE (pas UTC!)
              // Format: "2026-01-04 08:00:00" sans timezone
              const scheduledAt = `${formattedDate} ${formattedTime}:00`;

              // Préparer les données de réservation
              const bookingData: any = {
                provider_id: selectedProvider?.id || (isCustomService ? customServiceData?.provider_id : service?.provider?.id) || 1,
                date: formattedDate,
                start_time: formattedTime,
                scheduled_at: scheduledAt,
                address: address,
                latitude: addressData?.coords?.latitude,
                longitude: addressData?.coords?.longitude,
                notes: notes || undefined,
                formula: selectedFormula,
                payment_method: paymentMethod,
                total_price: priceBreakdown.total,
                // Pour service chef: nombre de personnes
                ...(isChefService && { number_of_guests: numberOfGuests }),
                // Pour service coach: pack selectionne
                ...(isCoachService && selectedPack && {
                  pack_id: selectedPack.id,
                  pack_name: selectedPack.name,
                  pack_sessions: selectedPack.sessions,
                }),
              };

              // Ajouter l'ID approprié selon le type de service
              if (isCustomService && customServiceData) {
                bookingData.custom_service_id = customServiceData.id;
              } else if (service_id) {
                bookingData.service_id = Number(service_id);
              }

              console.log('[Booking] Submitting bookingData:', JSON.stringify(bookingData));

              const result = await dispatch(createBooking(bookingData)).unwrap();

              // Libérer le verrou APRÈS succès confirmé
              submissionLockRef.current = false;
              setIsSubmitting(false);
              hapticFeedback.success();

              // Navigate to confirmation screen
              const bookingId = result?.id || Date.now();
              router.push({
                pathname: '/booking/confirmation',
                params: {
                  booking_id: String(bookingId),
                  service_name: serviceName || 'Service',
                  provider_name: selectedProvider?.name || 'Prestataire',
                  date: formattedDate,
                  time: formattedTime,
                  address: address,
                  total: String(priceBreakdown.total),
                  formula: getFormulaById(selectedFormula).name,
                },
              });
            } catch (error: any) {
              // Libérer le verrou en cas d'erreur
              submissionLockRef.current = false;
              setIsSubmitting(false);
              hapticFeedback.warning();
              dispatch(showToast({
                message: error?.message || error || t('createBooking.bookingError'),
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

  if (isLoading || checkingPendingReview) {
    return <Loading fullScreen message={t('common.loading')} />;
  }

  // Bloquer si évaluation en attente
  if (hasPendingReview && pendingReviewOrder) {
    return (
      <View style={styles.blockedContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.blockedContent}>
          <Text style={styles.blockedIcon}>⚠️</Text>
          <Text style={[styles.blockedTitle, isRTL && styles.rtlText]}>{t('createBooking.pendingReview')}</Text>
          <Text style={[styles.blockedMessage, isRTL && styles.rtlText]}>
            {t('createBooking.mustReviewFirst')}
          </Text>
          <View style={styles.blockedOrderInfo}>
            <Text style={[styles.blockedOrderLabel, isRTL && styles.rtlText]}>{t('createBooking.serviceToReview')}:</Text>
            <Text style={[styles.blockedOrderService, isRTL && styles.rtlText]}>
              {pendingReviewOrder.service_name || t('services.service')}
            </Text>
            <Text style={[styles.blockedOrderProvider, isRTL && styles.rtlText]}>
              {t('createBooking.with')} {pendingReviewOrder.provider_name ||
                `${pendingReviewOrder.provider_first_name || ''} ${pendingReviewOrder.provider_last_name || ''}`.trim() ||
                t('createBooking.theProvider')}
            </Text>
          </View>
          <Text style={[styles.blockedNote, isRTL && styles.rtlText]}>
            💳 {t('createBooking.paymentAfterReview')}
          </Text>
          <Button
            variant="primary"
            onPress={() => router.replace('/(client)' as any)}
            fullWidth
            style={styles.blockedButton}
          >
            {t('createBooking.returnToReview')}
          </Button>
          <TouchableOpacity onPress={handleBack} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Pour services personnalisés, on attend que customServiceData soit chargé
  if (isCustomService && !customServiceData) {
    return <Loading fullScreen message={t('createBooking.loadingService')} />;
  }

  // Pour services standards, vérifier que service existe
  if (!isCustomService && !service) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={[styles.errorText, isRTL && styles.rtlText]}>{t('createBooking.serviceNotFound')}</Text>
        <Button variant="outline" onPress={handleBack}>
          {t('common.back')}
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
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('createBooking.newBooking')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Service Summary - Style Web App */}
        {isCustomService && customServiceData ? (
          // Affichage pour service personnalisé
          <Card style={styles.serviceCard}>
            {customServiceData.images && customServiceData.images.length > 0 ? (
              <Image
                source={{ uri: customServiceData.images[0].startsWith('http')
                  ? customServiceData.images[0]
                  : `${API_BASE_URL}${customServiceData.images[0]}`
                }}
                style={styles.serviceImageLarge}
              />
            ) : (
              <View style={[styles.serviceImageLarge, styles.serviceImagePlaceholder]}>
                <Text style={styles.serviceImagePlaceholderText}>✨</Text>
              </View>
            )}

            <View style={styles.serviceContent}>
              {/* Badge Service Exclusif */}
              <View style={[styles.categoryBadge, { backgroundColor: colors.warning }]}>
                <Text style={styles.categoryBadgeText}>{t('createBooking.exclusiveService')}</Text>
              </View>

              {/* Title */}
              <Text style={[styles.serviceName, isRTL && styles.rtlText]}>{customServiceData.name}</Text>

              {/* Price & Duration */}
              <View style={[styles.detailsRow, isRTL && styles.detailsRowRTL]}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>{t('createBooking.price')}</Text>
                  <Text style={[styles.detailValue, isRTL && styles.rtlText]}>{customServiceData.price} DH</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>{t('createBooking.estimatedDuration')}</Text>
                  <Text style={[styles.detailValue, isRTL && styles.rtlText]}>⏱ {customServiceData.duration_minutes} {t('common.min')}</Text>
                </View>
              </View>
            </View>
          </Card>
        ) : service ? (
          // Affichage pour service standard
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
                    {getCategoryTranslation((service.category as any).name || 'Service', language)}
                  </Text>
                </View>
              )}

              {/* Title */}
              <Text style={[styles.serviceName, isRTL && styles.rtlText]}>
                {getServiceTranslation(service.title || service.name || '', language).title || service.title || service.name}
              </Text>

              {/* Rating */}
              {service.rating > 0 && (
                <View style={[styles.ratingRow, isRTL && styles.ratingRowRTL]}>
                  <Text style={styles.ratingStar}>★</Text>
                  <Text style={styles.ratingValue}>{service.rating.toFixed(1)}</Text>
                  <Text style={styles.reviewsCount}>
                    ({service.reviews_count || service.reviewsCount || 0} {t('createBooking.reviews')})
                  </Text>
                </View>
              )}

              {/* Price & Duration */}
              <View style={[styles.detailsRow, isRTL && styles.detailsRowRTL]}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>{t('createBooking.basePrice')}</Text>
                  <Text style={[styles.detailValue, isRTL && styles.rtlText]}>{service.price} DH</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>{t('createBooking.estimatedDuration')}</Text>
                  <Text style={[styles.detailValue, isRTL && styles.rtlText]}>⏱ {service.duration_minutes} {t('common.min')}</Text>
                </View>
              </View>
            </View>
          </Card>
        ) : (
          // Loading state
          <Card style={styles.serviceCard}>
            <View style={[styles.serviceImageLarge, styles.serviceImagePlaceholder]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <View style={styles.serviceContent}>
              <Text style={[styles.serviceName, isRTL && styles.rtlText]}>{t('createBooking.loadingService')}</Text>
            </View>
          </Card>
        )}

        {/* ETAPE CHEF: Nombre de personnes (uniquement pour service chef) */}
        {isChefService && !isCustomService && (
          <Card style={styles.formCard}>
            <View style={[styles.stepHeader, isRTL && styles.stepHeaderRTL]}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('createBooking.howManyPeople')}</Text>
            </View>
            <GuestSelector
              value={numberOfGuests}
              onChange={setNumberOfGuests}
              minGuests={minGuests}
              maxGuests={maxGuests}
              pricePerPerson={pricePerPerson}
              disabled={isSubmitting}
            />
          </Card>
        )}

        {/* ETAPE COACH: Selection du pack (uniquement pour service coach) */}
        {isCoachService && !isCustomService && (
          <Card style={styles.formCard}>
            <View style={[styles.stepHeader, isRTL && styles.stepHeaderRTL]}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('createBooking.yourProgram')}</Text>
            </View>
            <PackSelector
              packs={servicePacks}
              selectedPackId={selectedPackId}
              onChange={setSelectedPackId}
              disabled={isSubmitting}
            />
          </Card>
        )}

        {/* ETAPE 1/2: Date & Time */}
        <Card style={styles.formCard}>
          <View style={[styles.stepHeader, isRTL && styles.stepHeaderRTL]}>
            <Text style={styles.stepNumber}>{(isChefService || isCoachService) ? '2' : '1'}</Text>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('createBooking.when')}</Text>
          </View>
          <DateTimePicker
            mode="datetime"
            value={selectedDateTime}
            onChange={handleDateTimeChange}
            minDate={getMinDate()}
            maxDate={getMaxDate()}
            placeholder={t('createBooking.chooseDateAndTime')}
            error={dateTimeError}
          />

          {/* Night hours warning */}
          {isNightHours && (
            <View style={[styles.nightWarning, isRTL && styles.nightWarningRTL]}>
              <Text style={styles.nightWarningIcon}>🌙</Text>
              <Text style={[styles.nightWarningText, isRTL && styles.rtlText]}>
                {t('createBooking.nightHoursWarning')}
              </Text>
            </View>
          )}
        </Card>

        {/* ETAPE 2/3: Address */}
        <Card style={[styles.formCard, { zIndex: 100, overflow: 'visible' }]}>
          <View style={[styles.stepHeader, isRTL && styles.stepHeaderRTL]}>
            <Text style={styles.stepNumber}>{(isChefService || isCoachService) ? '3' : '2'}</Text>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('createBooking.where')}</Text>
          </View>
          <AddressAutocomplete
            value={address}
            onChangeText={(v) => {
              setAddress(v);
              if (addressError) setAddressError(validateAddress(v));
            }}
            onAddressSelect={handleAddressSelect}
            placeholder={t('createBooking.addressPlaceholder')}
            error={addressError}
            disabled={isSubmitting}
          />
        </Card>

        {/* ETAPE 3/4: Choix du perimetre - Shown only after address is selected */}
        {addressData?.coords ? (
          <Card style={styles.formCard}>
            <View style={[styles.stepHeader, isRTL && styles.stepHeaderRTL]}>
              <Text style={styles.stepNumber}>{(isChefService || isCoachService) ? '4' : '3'}</Text>
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('createBooking.searchRadius')}</Text>
            </View>
            <RadiusSelector
              selectedRadius={selectedRadius}
              onRadiusChange={(radius: number) => {
                setSelectedRadius(radius);
                setSelectedProvider(null);
              }}
              disabled={isSubmitting}
            />
          </Card>
        ) : null}

        {/* ETAPE 4: Provider Selection - Shown only after address is selected */}
        {addressData?.coords ? (
          <>
            {/* Carte des prestataires */}
            <NearbyProvidersMap
              clientLocation={addressData.coords}
              providers={availableProviders.map(p => ({
                id: p.id,
                name: p.name || 'Prestataire',
                initials: p.initials || 'PR',
                avatar: p.avatar,
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
              radius={selectedRadius}
              compact={false}
            />

            {/* Liste des prestataires - caché pour services personnalisés */}
            {isCustomService ? (
              <Card style={styles.formCard}>
                <View style={[styles.stepHeader, isRTL && styles.stepHeaderRTL]}>
                  <Text style={styles.stepNumber}>{(isChefService || isCoachService) ? '5' : '4'}</Text>
                  <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('createBooking.provider')}</Text>
                </View>
                <View style={styles.customServiceProviderInfo}>
                  <Text style={[styles.customServiceProviderText, isRTL && styles.rtlText]}>
                    ✅ {t('createBooking.exclusiveServiceByCreator')}
                  </Text>
                </View>
              </Card>
            ) : (
              <Card style={styles.formCard}>
                <View style={[styles.stepHeader, isRTL && styles.stepHeaderRTL]}>
                  <Text style={styles.stepNumber}>{(isChefService || isCoachService) ? '5' : '4'}</Text>
                  <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('createBooking.chooseProvider')}</Text>
                </View>
                {loadingProviders ? (
                  <View style={styles.providersLoading}>
                    <Text style={[styles.providersLoadingText, isRTL && styles.rtlText]}>
                      {t('createBooking.searchingProviders')}
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
                    <Text style={[styles.noProvidersText, isRTL && styles.rtlText]}>
                      {t('createBooking.noProvidersAvailable')}
                    </Text>
                    <Text style={[styles.noProvidersHint, isRTL && styles.rtlText]}>
                      {t('createBooking.tryOtherAddress')}
                    </Text>
                  </View>
                )}
              </Card>
            )}
          </>
        ) : (
          <Card style={[styles.formCard, styles.formCardDisabled]}>
            <View style={[styles.stepHeader, isRTL && styles.stepHeaderRTL]}>
              <Text style={[styles.stepNumber, styles.stepNumberDisabled]}>{(isChefService || isCoachService) ? '4' : '3'}</Text>
              <Text style={[styles.sectionTitle, styles.sectionTitleDisabled, isRTL && styles.rtlText]}>{t('createBooking.radiusAndProvider')}</Text>
            </View>
            <Text style={[styles.stepHint, isRTL && styles.rtlText]}>
              {t('createBooking.enterAddressFirst')}
            </Text>
          </Card>
        )}

        {/* ETAPE 5/6: Formula Selection */}
        <View style={styles.formulaSection}>
          <View style={styles.stepHeaderInline}>
            <Text style={styles.stepNumber}>{(isChefService || isCoachService) ? '6' : '5'}</Text>
          </View>
          <FormulaSelector
            selectedFormula={selectedFormula}
            onSelect={setSelectedFormula}
            basePrice={basePrice}
            disabled={isSubmitting}
          />
        </View>

        {/* Notes */}
        <Card style={styles.formCard}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('createBooking.notesOptional')}</Text>
          <Input
            placeholder={t('createBooking.notesPlaceholder')}
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
          loading={isSubmitting || (isCustomService && isLoading)}
          disabled={isSubmitting || !selectedProvider || (isCustomService && !customServiceData)}
          fullWidth
          style={styles.submitButton}
        >
          {isCustomService && !customServiceData
            ? t('createBooking.loadingService')
            : selectedProvider
              ? `${t('createBooking.bookWith')} ${selectedProvider.name} - ${priceBreakdown.total} DH`
              : t('createBooking.selectProviderButton')
          }
        </Button>

        {/* Cancel Link */}
        <TouchableOpacity
          onPress={handleBack}
          style={styles.cancelLink}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelLinkText}>{t('common.cancel')}</Text>
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

  // Custom Service Provider Info
  customServiceProviderInfo: {
    padding: spacing.md,
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.md,
  },
  customServiceProviderText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '500',
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

  // Blocked (pending review)
  blockedContainer: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  blockedContent: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  blockedIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  blockedTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.warning,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  blockedMessage: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  blockedOrderInfo: {
    width: '100%',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  blockedOrderLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  blockedOrderService: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    textAlign: 'center',
  },
  blockedOrderProvider: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  blockedNote: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '500',
  },
  blockedButton: {
    marginBottom: spacing.md,
  },
  // RTL support
  rtlText: {
    textAlign: 'right',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  stepHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  detailsRowRTL: {
    flexDirection: 'row-reverse',
  },
  ratingRowRTL: {
    flexDirection: 'row-reverse',
  },
  nightWarningRTL: {
    flexDirection: 'row-reverse',
  },
});
