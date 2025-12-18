import React from 'react';
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

/**
 * Format price with currency
 */
function formatPrice(price: number, currency: string = 'MAD'): string {
  return `${price} ${currency}`;
}

export default function BookingCard(props: BookingCardProps) {
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
  } = props;
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
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>{formatPrice(total, currency)}</Text>
        </View>

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

          {/* Bouton Contacter */}
          {actions.canContact && onContact && (
            <Button
              variant="outline"
              size="sm"
              onPress={handleContact}
              style={styles.actionButton}
            >
              💬 Contacter
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
          {normalizedStatus === 'completed' && actions.canReview && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => onViewDetails?.(id)}
              style={styles.actionButton}
            >
              Laisser un avis
            </Button>
          )}

          {/* Message si cancelled */}
          {normalizedStatus === 'cancelled' && (
            <View style={styles.cancelledMessage}>
              <Text style={styles.cancelledText}>
                Cette reservation a ete annulee
              </Text>
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
  cancelledMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  cancelledText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    fontStyle: 'italic',
  },
});
