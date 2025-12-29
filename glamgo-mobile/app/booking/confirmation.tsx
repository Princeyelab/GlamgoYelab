/**
 * Booking Confirmation Screen - GlamGo Mobile
 * Ecran de confirmation apres creation de reservation
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  TouchableOpacity,
  Share,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { hapticFeedback } from '../../src/lib/utils/haptics';

export default function BookingConfirmationScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Extract params with defaults
  const bookingId = params.booking_id as string || '12345';
  const serviceName = params.service_name as string || 'Service';
  const providerName = params.provider_name as string || '';
  const bookingDate = params.date as string || new Date().toISOString().split('T')[0];
  const bookingTime = params.time as string || '10:00';
  const bookingAddress = params.address as string || 'Adresse';
  const totalPrice = params.total as string || '0';
  const formula = params.formula as string || 'Standard';

  // Animations
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Play success haptic
    hapticFeedback.success();

    // Animate checkmark
    Animated.spring(checkmarkScale, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animate content
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 400,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleViewBookings = () => {
    hapticFeedback.light();
    router.replace('/(client)/bookings');
  };

  const handleGoHome = () => {
    hapticFeedback.light();
    router.replace('/(client)');
  };

  const handleShare = async () => {
    hapticFeedback.light();
    try {
      await Share.share({
        message: `J'ai reserve ${serviceName} avec GlamGo pour le ${bookingDate} a ${bookingTime}. Telechargez GlamGo pour reserver vos services beaute a domicile !`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleAddToCalendar = () => {
    hapticFeedback.light();
    // TODO: Implement calendar integration
  };

  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Success Animation */}
          <Animated.View style={[
            styles.checkmarkContainer,
            { transform: [{ scale: checkmarkScale }] }
          ]}>
            <View style={styles.checkmarkCircle}>
              <Text style={styles.checkmarkIcon}>✓</Text>
            </View>
          </Animated.View>

          {/* Content */}
          <Animated.View style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            }
          ]}>
        <Text style={styles.title}>Reservation confirmee !</Text>
        <Text style={styles.subtitle}>
          Votre reservation a ete creee avec succes
        </Text>

        {/* Booking Details Card */}
        <Card style={styles.detailsCard}>
          {/* Booking ID */}
          <View style={styles.bookingIdRow}>
            <Text style={styles.bookingIdLabel}>N de reservation</Text>
            <Text style={styles.bookingId}>#{bookingId}</Text>
          </View>

          <View style={styles.divider} />

          {/* Service */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>💇</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{serviceName}</Text>
            </View>
          </View>

          {/* Provider */}
          {providerName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>👤</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Prestataire</Text>
                <Text style={styles.detailValue}>{providerName}</Text>
              </View>
            </View>
          )}

          {/* Date & Time */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date et heure</Text>
              <Text style={styles.detailValue}>
                {formatDate(bookingDate)} a {bookingTime}
              </Text>
            </View>
          </View>

          {/* Address */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Adresse</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {bookingAddress}
              </Text>
            </View>
          </View>

          {/* Formula */}
          {formula && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📋</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Formule</Text>
                <Text style={styles.detailValue}>{formula}</Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{totalPrice} DH</Text>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={handleAddToCalendar}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>📅</Text>
            </View>
            <Text style={styles.quickActionText}>Ajouter au calendrier</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={handleShare}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>📤</Text>
            </View>
            <Text style={styles.quickActionText}>Partager</Text>
          </TouchableOpacity>
        </View>

        {/* Info Message */}
        <View style={styles.infoMessage}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Le prestataire vous contactera pour confirmer les details de la reservation. Vous recevrez une notification avant le rendez-vous.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Button
            variant="primary"
            onPress={handleViewBookings}
            fullWidth
            style={styles.primaryButton}
          >
            Voir mes reservations
          </Button>

          <Button
            variant="outline"
            onPress={handleGoHome}
            fullWidth
          >
            Retour a l'accueil
          </Button>
        </View>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },

  // Checkmark Animation
  checkmarkContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  checkmarkIcon: {
    fontSize: 40,
    color: colors.white,
    fontWeight: 'bold',
  },

  // Content
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // Details Card
  detailsCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  bookingIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bookingIdLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  bookingId: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  detailIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: 2,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  totalValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.success,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickActionEmoji: {
    fontSize: 20,
  },
  quickActionText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
  },

  // Info Message
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.info + '15',
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.info,
    lineHeight: 20,
  },

  // Buttons
  buttons: {
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: 20,
  },
  primaryButton: {
    marginBottom: spacing.sm,
  },
});
