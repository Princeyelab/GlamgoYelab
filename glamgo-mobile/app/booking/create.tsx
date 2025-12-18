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

export default function CreateBookingScreen() {
  const { service_id } = useLocalSearchParams<{ service_id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const services = useAppSelector(selectServices);
  const currentService = useAppSelector(selectCurrentService);
  const user = useAppSelector(selectUser);

  // Find service from list or use current
  const service = services.find(s => s.id === Number(service_id)) || currentService;

  // Form state
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!service);

  // Errors
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [addressError, setAddressError] = useState('');

  useEffect(() => {
    if (!service && service_id) {
      loadService();
    }
  }, [service_id]);

  const loadService = async () => {
    try {
      setIsLoading(true);
      await dispatch(fetchServiceById(Number(service_id))).unwrap();
    } catch (error) {
      console.error('Error loading service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get tomorrow's date as default minimum
  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Validation functions
  const validateDate = (value: string): string => {
    if (!value) return 'Date requise';

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) return 'Format: AAAA-MM-JJ';

    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(selectedDate.getTime())) return 'Date invalide';
    if (selectedDate < today) return 'Date passee';

    return '';
  };

  const validateTime = (value: string): string => {
    if (!value) return 'Heure requise';

    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(value)) return 'Format: HH:MM';

    const [hours, minutes] = value.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return 'Heure invalide';
    }

    // Check working hours (8h - 20h)
    if (hours < 8 || hours >= 20) {
      return 'Heures: 08:00 - 20:00';
    }

    return '';
  };

  const validateAddress = (value: string): string => {
    if (!value) return 'Adresse requise';
    if (value.length < 10) return 'Adresse trop courte';
    return '';
  };

  // Format date for display
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return date.toLocaleDateString('fr-FR', options);
    } catch {
      return dateStr;
    }
  };

  const handleDateChange = (value: string) => {
    // Auto-format as user types
    let formatted = value.replace(/[^0-9]/g, '');
    if (formatted.length > 4) {
      formatted = formatted.slice(0, 4) + '-' + formatted.slice(4);
    }
    if (formatted.length > 7) {
      formatted = formatted.slice(0, 7) + '-' + formatted.slice(7, 9);
    }
    setDate(formatted);
    if (dateError) setDateError(validateDate(formatted));
  };

  const handleTimeChange = (value: string) => {
    // Auto-format as user types
    let formatted = value.replace(/[^0-9]/g, '');
    if (formatted.length > 2) {
      formatted = formatted.slice(0, 2) + ':' + formatted.slice(2, 4);
    }
    setTime(formatted);
    if (timeError) setTimeError(validateTime(formatted));
  };

  const handleSubmit = async () => {
    // Validate all fields
    const dateErr = validateDate(date);
    const timeErr = validateTime(time);
    const addressErr = validateAddress(address);

    setDateError(dateErr);
    setTimeError(timeErr);
    setAddressError(addressErr);

    if (dateErr || timeErr || addressErr) {
      return;
    }

    if (!service) {
      Alert.alert('Erreur', 'Service non trouve');
      return;
    }

    if (!user) {
      dispatch(showToast({
        message: 'Veuillez vous connecter pour reserver',
        type: 'error',
      }));
      router.push('/auth/login');
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(createBooking({
        service_id: Number(service_id),
        provider_id: service.provider?.id || 1, // Default if no provider
        date: date,
        start_time: time,
        address: address,
        notes: notes || undefined,
      })).unwrap();

      dispatch(showToast({
        message: 'Reservation creee avec succes !',
        type: 'success',
      }));

      // Navigate to bookings
      router.replace('/(tabs)/bookings');
    } catch (error: any) {
      dispatch(showToast({
        message: error || 'Erreur lors de la reservation',
        type: 'error',
      }));
    } finally {
      setIsSubmitting(false);
    }
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
        {/* Service Summary */}
        <Card style={styles.serviceCard}>
          <Text style={styles.sectionTitle}>Service selectionne</Text>
          <View style={styles.serviceRow}>
            {service.images?.[0] || service.thumbnail ? (
              <Image
                source={{ uri: service.images?.[0] || service.thumbnail }}
                style={styles.serviceImage}
              />
            ) : (
              <View style={[styles.serviceImage, styles.serviceImagePlaceholder]}>
                <Text style={styles.serviceImagePlaceholderText}>💇</Text>
              </View>
            )}
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.title}</Text>
              <Text style={styles.serviceDetails}>
                ⏱️ {service.duration_minutes} min
              </Text>
              <Text style={styles.servicePrice}>{service.price} DH</Text>
            </View>
          </View>
        </Card>

        {/* Booking Form */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Details de la reservation</Text>

          {/* Date Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <Input
              placeholder="2024-12-25"
              value={date}
              onChangeText={handleDateChange}
              error={!!dateError}
              errorMessage={dateError}
              keyboardType="numeric"
              maxLength={10}
              editable={!isSubmitting}
            />
            <Text style={styles.inputHelper}>
              Format: AAAA-MM-JJ (ex: {getTomorrowDate()})
            </Text>
          </View>

          {/* Time Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Heure</Text>
            <Input
              placeholder="14:30"
              value={time}
              onChangeText={handleTimeChange}
              error={!!timeError}
              errorMessage={timeError}
              keyboardType="numeric"
              maxLength={5}
              editable={!isSubmitting}
            />
            <Text style={styles.inputHelper}>
              Horaires: 08:00 - 20:00
            </Text>
          </View>

          {/* Address Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Adresse</Text>
            <Input
              placeholder="Rue, Quartier, Ville"
              value={address}
              onChangeText={(v) => {
                setAddress(v);
                if (addressError) setAddressError(validateAddress(v));
              }}
              error={!!addressError}
              errorMessage={addressError}
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
            />
          </View>

          {/* Notes Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (optionnel)</Text>
            <Input
              placeholder="Instructions speciales, interphone, etage..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
            />
          </View>
        </Card>

        {/* Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Recapitulatif</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service</Text>
            <Text style={styles.summaryValue}>{service.title}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duree estimee</Text>
            <Text style={styles.summaryValue}>{service.duration_minutes} min</Text>
          </View>

          {date && !dateError && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{formatDateForDisplay(date)}</Text>
            </View>
          )}

          {time && !timeError && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Heure</Text>
              <Text style={styles.summaryValue}>{time}</Text>
            </View>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Total</Text>
            <Text style={styles.summaryValueBold}>{service.price} DH</Text>
          </View>
        </Card>

        {/* Submit Button */}
        <Button
          variant="primary"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          fullWidth
          style={styles.submitButton}
        >
          Confirmer la reservation
        </Button>

        {/* Cancel Link */}
        <TouchableOpacity
          onPress={handleBack}
          style={styles.cancelLink}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelLinkText}>Annuler</Text>
        </TouchableOpacity>
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
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  headerSpacer: {
    width: 40,
  },

  // Scroll Content
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },

  // Section Title
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },

  // Service Card
  serviceCard: {
    marginBottom: spacing.md,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[200],
  },
  serviceImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
  serviceImagePlaceholderText: {
    fontSize: 32,
  },
  serviceInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 4,
  },
  serviceDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },

  // Form Card
  formCard: {
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  inputHelper: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },

  // Summary Card
  summaryCard: {
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  summaryLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
  summaryLabelBold: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  summaryValueBold: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.gray[300],
    marginVertical: spacing.sm,
  },

  // Submit Button
  submitButton: {
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
