import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../lib/constants/theme';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';

interface SkeletonProviderCardProps {
  compact?: boolean;
  showDistanceDetails?: boolean;
  showPrice?: boolean;
}

/**
 * SkeletonProviderCard - Loading placeholder for ProviderCard
 * Matches the layout of the enhanced ProviderCard component
 */
export default function SkeletonProviderCard({
  compact = false,
  showDistanceDetails = true,
  showPrice = true,
}: SkeletonProviderCardProps) {
  const avatarSize = compact ? 48 : 64;

  return (
    <Card variant="elevated" padding="md" style={styles.card}>
      {/* Header with avatar and info */}
      <View style={styles.header}>
        {/* Avatar skeleton */}
        <Skeleton
          width={avatarSize}
          height={avatarSize}
          borderRadius={borderRadius.full}
          style={styles.avatar}
        />

        {/* Info section skeletons */}
        <View style={styles.info}>
          {/* Name */}
          <Skeleton
            width="70%"
            height={20}
            borderRadius={borderRadius.sm}
            style={styles.nameRow}
          />

          {/* Rating */}
          <Skeleton
            width="50%"
            height={16}
            borderRadius={borderRadius.sm}
            style={styles.ratingRow}
          />

          {/* Availability */}
          <Skeleton
            width="40%"
            height={14}
            borderRadius={borderRadius.sm}
          />
        </View>
      </View>

      {/* Bio - only in default variant */}
      {!compact && (
        <View style={styles.bioSection}>
          <Skeleton
            width="100%"
            height={14}
            borderRadius={borderRadius.sm}
            style={styles.bioLine}
          />
          <Skeleton
            width="80%"
            height={14}
            borderRadius={borderRadius.sm}
          />
        </View>
      )}

      {/* Distance section */}
      {showDistanceDetails && (
        <View style={styles.distanceSection}>
          <Skeleton
            width="60%"
            height={20}
            borderRadius={borderRadius.sm}
          />
        </View>
      )}

      {/* Price section */}
      {showPrice && (
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Skeleton
              width={80}
              height={16}
              borderRadius={borderRadius.sm}
            />
            <Skeleton
              width={100}
              height={22}
              borderRadius={borderRadius.sm}
            />
          </View>
        </View>
      )}

      {/* Categories badges */}
      <View style={styles.categoriesRow}>
        <Skeleton
          width={70}
          height={24}
          borderRadius={borderRadius.full}
        />
        <Skeleton
          width={80}
          height={24}
          borderRadius={borderRadius.full}
        />
        <Skeleton
          width={60}
          height={24}
          borderRadius={borderRadius.full}
        />
      </View>

      {/* Select button */}
      <Skeleton
        width="100%"
        height={40}
        borderRadius={borderRadius.lg}
        style={styles.selectButton}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avatar: {
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    marginBottom: spacing.sm,
  },
  ratingRow: {
    marginBottom: spacing.sm,
  },
  bioSection: {
    marginBottom: spacing.md,
  },
  bioLine: {
    marginBottom: spacing.xs,
  },
  distanceSection: {
    backgroundColor: colors.gray[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  priceSection: {
    backgroundColor: colors.gray[100],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  selectButton: {
    marginTop: spacing.xs,
  },
});
