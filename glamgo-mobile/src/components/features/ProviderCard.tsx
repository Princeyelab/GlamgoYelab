import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../lib/constants/theme';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Provider, ProviderCardProps } from '../../types/provider';

/**
 * ProviderCard - Carte affichant un prestataire avec ses informations
 * Conformant avec le composant web (C:/Dev/YelabGo/frontend/src/components/ProviderCard)
 *
 * Features:
 * - Avatar with availability status
 * - "Nearest" badge for closest provider
 * - Rating and reviews
 * - Distance and distance fees
 * - Price with breakdown toggle
 * - Availability status (online/scheduled/offline)
 * - Categories badges
 * - Duration display
 * - Selection functionality
 */
export default function ProviderCard({
  provider,
  isNearest = false,
  onSelect,
  selected = false,
  compact = false,
  showDistanceDetails = true,
  showPrice = true,
  serviceId,
  formulaType = 'standard',
  currency = 'FCFA',
}: ProviderCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Extract provider data with fallbacks
  const name = provider.business_name || provider.name ||
    `${provider.first_name || ''} ${provider.last_name || ''}`.trim() || 'Prestataire';

  const avatarUrl = provider.avatar || provider.profile_photo || provider.photo_url ||
    provider.user?.profile_photo || provider.user?.avatar ||
    provider.provider?.profile_photo || provider.provider?.avatar;

  const rating = provider.rating || 0;
  const reviewsCount = provider.total_reviews || provider.reviews_count || 0;
  const isVerified = provider.isVerified || provider.is_verified || false;
  const categories = provider.categories || [];
  const bio = provider.bio;

  // Distance data
  const distance = provider.distance;
  const distanceFormatted = provider.distance_formatted;
  const withinRadius = provider.within_intervention_radius;
  const interventionRadius = provider.intervention_radius_km;
  const extraKm = provider.extra_km || provider.extra_distance_km || 0;
  const pricePerExtraKm = provider.price_per_extra_km;

  // Price data
  const basePrice = provider.base_price;
  const distanceFee = provider.distance_fee || 0;
  const calculatedPrice = provider.calculated_price;
  const priceBreakdown = provider.price_breakdown;

  // Availability
  const isAvailableNow = provider.is_available_now || provider.is_available || provider.isAvailable;
  const nextAvailability = provider.next_availability;

  // Service info
  const duration = provider.duration_minutes;
  const serviceName = provider.service_name;

  // Generate initials from name
  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  // Render star rating
  const renderStars = (ratingValue: number): string => {
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars += '\u2605';
      } else if (i === fullStars && hasHalfStar) {
        stars += '\u2605';
      } else {
        stars += '\u2606';
      }
    }
    return stars;
  };

  // Format price with currency
  const formatPrice = (price: number): string => {
    return `${price.toLocaleString('fr-FR')} ${currency}`;
  };

  // Format distance
  const formatDistance = (dist: number): string => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)} m`;
    }
    return `${dist.toFixed(1)} km`;
  };

  // Get availability status
  const getAvailabilityStatus = () => {
    if (isAvailableNow) {
      return { text: 'Disponible', color: colors.success, dotColor: colors.success };
    }
    if (nextAvailability) {
      return { text: nextAvailability, color: colors.warning, dotColor: colors.warning };
    }
    return { text: 'Indisponible', color: colors.gray[500], dotColor: colors.gray[400] };
  };

  const availability = getAvailabilityStatus();
  const avatarSize = compact ? 48 : 64;
  const visibleCategories = categories.slice(0, 3);
  const remainingCategoriesCount = categories.length - 3;

  // Calculate total price
  const totalPrice = calculatedPrice || (basePrice ? basePrice + distanceFee : undefined);

  const handleSelect = () => {
    if (onSelect) {
      onSelect(provider);
    }
  };

  return (
    <Card
      variant={selected ? 'outlined' : 'elevated'}
      padding="md"
      onPress={handleSelect}
      style={selected ? { ...styles.card, ...styles.cardSelected } : styles.card}
    >
      {/* Nearest badge */}
      {isNearest && (
        <View style={styles.nearestBadge}>
          <Badge color="success" variant="filled" size="sm">
            Le plus proche
          </Badge>
        </View>
      )}

      {/* Header with avatar and info */}
      <View style={styles.header}>
        {/* Avatar Container */}
        <View style={[styles.avatarContainer, { width: avatarSize, height: avatarSize }]}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[styles.avatar, { width: avatarSize, height: avatarSize }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { width: avatarSize, height: avatarSize }]}>
              <Text style={[styles.avatarInitials, compact && styles.avatarInitialsCompact]}>
                {getInitials(name)}
              </Text>
            </View>
          )}
          {/* Online status dot */}
          <View style={[styles.statusDot, { backgroundColor: availability.dotColor }]} />
        </View>

        {/* Info section */}
        <View style={styles.info}>
          {/* Name with verified badge */}
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>{'\u2713'}</Text>
              </View>
            )}
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Text style={styles.stars}>{renderStars(rating)}</Text>
            <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({reviewsCount} avis)</Text>
          </View>

          {/* Availability status */}
          <Text style={[styles.availabilityText, { color: availability.color }]}>
            {availability.text}
          </Text>
        </View>
      </View>

      {/* Bio - only in default variant */}
      {!compact && bio && (
        <Text style={styles.bio} numberOfLines={2}>
          {bio}
        </Text>
      )}

      {/* Distance section */}
      {showDistanceDetails && distance !== undefined && (
        <View style={styles.distanceSection}>
          <View style={styles.distanceRow}>
            <Text style={styles.distanceIcon}>{'\u{1F4CD}'}</Text>
            <Text style={styles.distanceText}>
              {distanceFormatted || formatDistance(distance)}
            </Text>
            {withinRadius ? (
              <Badge color="success" variant="soft" size="sm">
                Dans la zone
              </Badge>
            ) : extraKm > 0 && (
              <Badge color="warning" variant="soft" size="sm">
                {`+${extraKm.toFixed(1)} km`}
              </Badge>
            )}
          </View>

          {/* Distance fee info */}
          {!withinRadius && distanceFee > 0 && (
            <Text style={styles.distanceFeeText}>
              Frais de déplacement: {formatPrice(distanceFee)}
              {pricePerExtraKm && ` (${formatPrice(pricePerExtraKm)}/km)`}
            </Text>
          )}
        </View>
      )}

      {/* Price section */}
      {showPrice && totalPrice !== undefined && (
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Prix total</Text>
            <Text style={styles.priceValue}>{formatPrice(totalPrice)}</Text>
          </View>

          {/* Price breakdown toggle */}
          {(basePrice !== undefined || priceBreakdown) && (
            <TouchableOpacity
              style={styles.breakdownToggle}
              onPress={() => setShowBreakdown(!showBreakdown)}
            >
              <Text style={styles.breakdownToggleText}>
                {showBreakdown ? 'Masquer le détail' : 'Voir le détail'}
              </Text>
              <Text style={styles.breakdownArrow}>
                {showBreakdown ? '\u25B2' : '\u25BC'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Price breakdown details */}
          {showBreakdown && (
            <View style={styles.breakdownContainer}>
              {basePrice !== undefined && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Prix de base</Text>
                  <Text style={styles.breakdownValue}>{formatPrice(basePrice)}</Text>
                </View>
              )}
              {distanceFee > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Frais de déplacement</Text>
                  <Text style={styles.breakdownValue}>{formatPrice(distanceFee)}</Text>
                </View>
              )}
              {priceBreakdown?.intervention_radius_km && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Zone d'intervention</Text>
                  <Text style={styles.breakdownValue}>{priceBreakdown.intervention_radius_km} km</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Categories badges */}
      {categories.length > 0 && (
        <View style={styles.categoriesRow}>
          {visibleCategories.map((category, index) => (
            <Badge
              key={`${provider.id}-cat-${index}`}
              color="primary"
              variant="soft"
              size="sm"
            >
              {category}
            </Badge>
          ))}
          {remainingCategoriesCount > 0 && (
            <Badge color="default" variant="soft" size="sm">
              {`+${remainingCategoriesCount}`}
            </Badge>
          )}
        </View>
      )}

      {/* Duration */}
      {duration && (
        <View style={styles.durationRow}>
          <Text style={styles.durationIcon}>{'\u23F1'}</Text>
          <Text style={styles.durationText}>{duration} min</Text>
        </View>
      )}

      {/* Select button */}
      <Button
        variant={selected ? 'primary' : 'outline'}
        size="sm"
        fullWidth
        onPress={handleSelect}
        style={styles.selectButton}
      >
        {selected ? 'Sélectionné' : 'Choisir ce prestataire'}
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  nearestBadge: {
    position: 'absolute',
    top: -spacing.sm,
    right: spacing.md,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    borderRadius: borderRadius.full,
  },
  avatarPlaceholder: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: colors.white,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  avatarInitialsCompact: {
    fontSize: typography.fontSize.lg,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
    flex: 1,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  verifiedIcon: {
    color: colors.white,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stars: {
    color: colors.warning,
    fontSize: typography.fontSize.sm,
    marginRight: spacing.xs,
  },
  ratingValue: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
    fontSize: typography.fontSize.sm,
    marginRight: spacing.xs,
  },
  reviewCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  availabilityText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  bio: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  distanceSection: {
    backgroundColor: colors.gray[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  distanceIcon: {
    fontSize: 16,
  },
  distanceText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.black,
    flex: 1,
  },
  distanceFeeText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  priceSection: {
    backgroundColor: colors.primary + '10',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
  priceValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  breakdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  breakdownToggleText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  breakdownArrow: {
    fontSize: 10,
    color: colors.primary,
  },
  breakdownContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  breakdownLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
  },
  breakdownValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.black,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  durationIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  durationText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  selectButton: {
    marginTop: spacing.xs,
  },
});
