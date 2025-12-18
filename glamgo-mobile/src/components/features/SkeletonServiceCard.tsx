import React from 'react';
import { View, StyleSheet } from 'react-native';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import { spacing, borderRadius } from '../../lib/constants/theme';

export default function SkeletonServiceCard() {
  return (
    <Card padding="none">
      {/* Image skeleton */}
      <Skeleton height={180} borderRadius={0} />

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Skeleton width="75%" height={20} style={styles.title} />

        {/* Description */}
        <Skeleton width="100%" height={14} style={styles.descLine} />
        <Skeleton width="85%" height={14} style={styles.descLine} />

        {/* Provider */}
        <View style={styles.provider}>
          <Skeleton
            width={24}
            height={24}
            borderRadius={12}
            style={styles.providerAvatar}
          />
          <Skeleton width={100} height={14} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Skeleton width={80} height={16} />
          <View style={styles.priceContainer}>
            <Skeleton width={50} height={10} style={styles.priceLabel} />
            <Skeleton width={70} height={20} />
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.base,
  },
  title: {
    marginBottom: spacing.md,
  },
  descLine: {
    marginBottom: spacing.xs,
  },
  provider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  providerAvatar: {
    marginRight: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    marginBottom: 4,
  },
});
