import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';
import { BookingCardProps, BookingStatus, BOOKING_STATUS_CONFIG } from '../../types/booking';
import { getBookingStatusConfig, getAvailableActions } from '../../lib/helpers/bookingStatus';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';
import { useCurrency } from '../../contexts/CurrencyContext';

// French day names
const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// French month names
const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

/**
 * Format date to French format: "Lun 18 Déc - 14:30"
 */
function formatDateFrench(dateStr: string, time: string): string {
  const date = new Date(dateStr);
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  // Format time (remove seconds if present)
  const formattedTime = time.substring(0, 5);

  return `${dayName} ${day} ${month} - ${formattedTime}`;
}

export default function BookingCard(props: BookingCardProps) {
  const { formatPrice } = useCurrency();
  const {
    id,
    service,
    provider,
    status,
    currency = 'MAD',
    address,
    notes,
    variant = 'upcoming',
    onCancel,
    onContact,
    onViewDetails,
    onTrackProvider,
    onReview,
  } = props;

  // Timer state pour commandes pending
  const [timeoutRemaining, setTimeoutRemaining] = useState<number | null>(null);

  // Timer countdown pour pending (4 minutes)
  useEffect(() => {
    if (status !== 'pending') {
      setTimeoutRemaining(null);
      return;
    }

    const created_at = (props as any).created_at;

    const calculateRemaining = () => {
      if (!created_at) return 240;
      let createdAtStr = created_at;
      if (!createdAtStr.endsWith('Z') && !createdAtStr.includes('+')) {
        createdAtStr = createdAtStr.replace(' ', 'T') + 'Z';
      }
      const createdTime = new Date(createdAtStr).getTime();
      const elapsed = Math.floor((Date.now() - createdTime) / 1000);
      return Math.max(0, 240 - elapsed);
    };

    setTimeoutRemaining(calculateRemaining());

    const interval = setInterval(() => {
      setTimeoutRemaining(prev => {
        if (prev === null || prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, (props as any).created_at]);

  // Formater le temps restant
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  // Support both new and legacy field names
  const booking_date = props.booking_date || props.date || '';
  const booking_time = props.booking_time || props.time || '';
  const total = props.total ?? props.price ?? 0;
  // Normalize legacy status (confirmed -> accepted)
  const normalizedStatus: BookingStatus = status === 'confirmed' ? 'accepted' : status as BookingStatus;
  const statusConfig = getBookingStatusConfig(normalizedStatus);
  const actions = getAvailableActions(normalizedStatus);

  const handlePress = () => {
    if (onViewDetails) {
      onViewDetails(id);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(id);
    }
  };

  const handleContact = () => {
    if (onContact && provider) {
      onContact(provider.id);
    }
  };

  const handleTrack = () => {
    if (onTrackProvider) {
      onTrackProvider(id);
    }
  };

  // Get service display name - support both new and legacy fields
  const serviceName = service?.title || service?.name || 'Service';
  const serviceImage = service?.thumbnail || service?.image;

  // Get provider display name
  const providerName = provider?.name || 'Prestataire';
  const providerAvatar = provider?.avatar || provider?.profile_photo;

  return (
    <Card
      variant="elevated"
      padding="none"
      onPress={onViewDetails ? handlePress : undefined}
    >
      <View style={styles.container}>
        {/* Order Number */}
        <View style={styles.orderNumberRow}>
          <Text style={styles.orderNumberLabel}>Commande</Text>
          <Text style={styles.orderNumber}>#{id}</Text>
        </View>

        {/* Header: Service Image + Info */}
        <View style={styles.header}>
          {/* Service Image */}
          {serviceImage ? (
            <Image
              source={{ uri: serviceImage }}
              style={styles.serviceImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.serviceImage, styles.serviceImagePlaceholder]}>
              <Text style={styles.serviceImagePlaceholderText}>💇</Text>
            </View>
          )}

          {/* Service & Provider Info */}
          <View style={styles.mainInfo}>
            <Text style={styles.serviceName} numberOfLines={1}>
              {serviceName}
            </Text>

            {/* Provider Row */}
            <View style={styles.providerRow}>
              {providerAvatar ? (
                <Image
                  source={{ uri: providerAvatar }}
                  style={styles.providerAvatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.providerAvatar, styles.providerAvatarPlaceholder]}>
                  <Text style={styles.providerAvatarInitial}>
                    {providerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.providerName} numberOfLines={1}>
                {providerName}
              </Text>
            </View>
          </View>

          {/* Status Badge + Description */}
          <View style={styles.statusContainer}>
            <Badge
              color={statusConfig.color}
              variant="soft"
              size="sm"
            >
              {statusConfig.label}
            </Badge>
            {(normalizedStatus === 'on_way' || normalizedStatus === 'in_progress') && (
              <Text style={styles.statusDescription}>
                {statusConfig.description}
              </Text>
            )}
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.dateTimeRow}>
          <Text style={styles.dateTimeIcon}>📅</Text>
          <Text style={styles.dateTimeText}>
            {formatDateFrench(booking_date, booking_time)}
          </Text>
        </View>

        {/* Address */}
        <View style={styles.addressRow}>
          <Text style={styles.addressIcon}>📍</Text>
          <Text style={styles.addressText} numberOfLines={2}>
            {address}
          </Text>
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Prix</Text>
          <Text style={styles.priceValue}>{formatPrice(total)}</Text>
        </View>

        {/* Timer Countdown pour pending */}
        {normalizedStatus === 'pending' && timeoutRemaining !== null && (
          <View style={[
            styles.timerContainer,
            timeoutRemaining < 60 && styles.timerContainerUrgent
          ]}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <View style={styles.timerContent}>
              <Text style={[
                styles.timerValue,
                timeoutRemaining < 60 && styles.timerValueUrgent
              ]}>
                {formatTimeRemaining(timeoutRemaining)}
              </Text>
              <Text style={styles.timerLabel}>
                {timeoutRemaining < 60 ? 'Reponse imminente!' : 'Attente reponse prestataire'}
              </Text>
            </View>
            <View style={styles.timerProgressBg}>
              <View style={[
                styles.timerProgress,
                { width: `${Math.round((timeoutRemaining / 240) * 100)}%` },
                timeoutRemaining < 60 && styles.timerProgressUrgent
              ]} />
            </View>
          </View>
        )}

        {/* Notes (if present) */}
        {notes && (
          <View style={styles.notesRow}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText} numberOfLines={2}>
              {notes}
            </Text>
          </View>
        )}

        {/* Action Buttons - Dynamiques selon status */}
        <View style={styles.actionsRow}>
          {/* Bouton Suivre (si on_way ou in_progress) */}
          {actions.canTrack && onTrackProvider && (
            <Button
              variant="primary"
              size="sm"
              onPress={handleTrack}
              style={styles.actionButton}
            >
              📍 Suivre
            </Button>
          )}

          {/* Bouton Chat */}
          {actions.canContact && onContact && (
            <Button
              variant="outline"
              size="sm"
              onPress={handleContact}
              style={styles.actionButton}
            >
              💬 Chat
            </Button>
          )}

          {/* Bouton Annuler */}
          {actions.canCancel && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onPress={handleCancel}
              style={styles.actionButton}
              textStyle={styles.cancelButtonText}
            >
              Annuler
            </Button>
          )}

          {/* Bouton Laisser un avis (si completed) */}
          {normalizedStatus === 'completed_pending_review' && actions.canReview && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => onReview?.(id)}
              style={styles.actionButton}
            >
              Laisser un avis
            </Button>
          )}

          {/* Message si cancelled */}
          {normalizedStatus === 'cancelled' && (
            <View style={styles.cancelledContainer}>
              <View style={styles.cancelledHeader}>
                <Text style={styles.cancelledIcon}>❌</Text>
                <Text style={styles.cancelledTitle}>Reservation annulee</Text>
              </View>
              {props.cancelled_by && (
                <Text style={styles.cancelledBy}>
                  Par: {props.cancelled_by === 'client' ? 'Client' : 'Prestataire'}
                </Text>
              )}
              {props.cancellation_reason && (
                <Text style={styles.cancelledReason}>
                  Motif: {props.cancellation_reason}
                </Text>
              )}
              {props.cancellation_fee && props.cancellation_fee > 0 && (
                <Text style={styles.cancelledFee}>
                  Frais d'annulation: {props.cancellation_fee.toFixed(2)} MAD
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.base,
  },
  orderNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  orderNumberLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  orderNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
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
  mainInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[200],
    marginRight: spacing.sm,
  },
  providerAvatarPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerAvatarInitial: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  providerName: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.sm,
  },
  dateTimeIcon: {
    fontSize: typography.fontSize.base,
    marginRight: spacing.sm,
  },
  dateTimeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[800],
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  addressIcon: {
    fontSize: typography.fontSize.base,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    marginTop: spacing.sm,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  priceValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  notesRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  notesLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: spacing.sm,
  },
  actionButton: {
    minWidth: 100,
  },
  cancelButtonText: {
    color: colors.error,
  },
  // Status
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Cancelled
  cancelledContainer: {
    flex: 1,
    backgroundColor: colors.error + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  cancelledHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cancelledIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  cancelledTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
  },
  cancelledBy: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  cancelledReason: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  cancelledFee: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  // Timer styles
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  timerContainerUrgent: {
    backgroundColor: colors.error + '15',
    borderColor: colors.error + '50',
  },
  timerIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  timerContent: {
    flex: 1,
  },
  timerValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold' as const,
    color: colors.warning,
  },
  timerValueUrgent: {
    color: colors.error,
  },
  timerLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
  },
  timerProgressBg: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.gray[200],
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    overflow: 'hidden' as const,
  },
  timerProgress: {
    height: '100%' as any,
    backgroundColor: colors.warning,
  },
  timerProgressUrgent: {
    backgroundColor: colors.error,
  },
});
