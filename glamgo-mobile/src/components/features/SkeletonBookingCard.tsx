import React from 'react';
import { View, StyleSheet } from 'react-native';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import { spacing, borderRadius } from '../../lib/constants/theme';

interface SkeletonBookingCardProps {
  showActions?: boolean;
}

export default function SkeletonBookingCard({
  showActions = true,
}: SkeletonBookingCardProps) {
  return (
    <Card variant="elevated" padding="none">
      <View style={styles.container}>
        {/* Header: Service Image + Info */}
        <View style={styles.header}>
          {/* Service Image Skeleton */}
          <Skeleton
            width={80}
            height={80}
            borderRadius={borderRadius.md}
          />

          {/* Service & Provider Info Skeleton */}
          <View style={styles.mainInfo}>
            {/* Service Name */}
            <Skeleton
              width="80%"
              height={18}
              style={styles.serviceName}
            />

            {/* Provider Row */}
            <View style={styles.providerRow}>
              {/* Provider Avatar */}
              <Skeleton
                width={40}
                height={40}
                borderRadius={borderRadius.full}
                style={styles.providerAvatar}
              />
              {/* Provider Name */}
              <Skeleton
                width={100}
                height={14}
              />
            </View>
          </View>

          {/* Status Badge Skeleton */}
          <Skeleton
            width={70}
            height={24}
            borderRadius={9999}
          />
        </View>

        {/* Date & Time Row Skeleton */}
        <View style={styles.dateTimeRow}>
          <Skeleton
            width="60%"
            height={16}
          />
        </View>

        {/* Address Row Skeleton */}
        <View style={styles.addressRow}>
          <Skeleton
            width="90%"
            height={14}
            style={styles.addressLine1}
          />
          <Skeleton
            width="60%"
            height={14}
          />
        </View>

        {/* Price Row Skeleton */}
        <View style={styles.priceRow}>
          <Skeleton
            width={40}
            height={14}
          />
          <Skeleton
            width={80}
            height={20}
          />
        </View>

        {/* Action Buttons Skeleton */}
        {showActions && (
          <View style={styles.actionsRow}>
            <Skeleton
              width={100}
              height={40}
              borderRadius={borderRadius.lg}
            />
            <Skeleton
              width={100}
              height={40}
              borderRadius={borderRadius.lg}
            />
          </View>
        )}
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
  mainInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  serviceName: {
    marginBottom: spacing.sm,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    marginRight: spacing.sm,
  },
  dateTimeRow: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  addressRow: {
    marginBottom: spacing.sm,
    paddingLeft: spacing.lg,
  },
  addressLine1: {
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.base,
    paddingTop: spacing.base,
    gap: spacing.sm,
  },
});
