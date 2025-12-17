import React from 'react';
import { View, StyleSheet } from 'react-native';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import { spacing, borderRadius } from '../../lib/constants/theme';

interface SkeletonReviewCardProps {
  showService?: boolean;
}

export default function SkeletonReviewCard({ showService = false }: SkeletonReviewCardProps) {
  return (
    <Card padding="md" style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.userInfo}>
          <Skeleton width="60%" height={16} style={styles.marginBottom} />
          <Skeleton width="40%" height={14} />
        </View>
      </View>

      {/* Stars */}
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} width={18} height={18} borderRadius={9} style={styles.star} />
        ))}
      </View>

      {/* Service Info (optional) */}
      {showService && (
        <Skeleton width="70%" height={32} borderRadius={borderRadius.sm} style={styles.marginBottomMd} />
      )}

      {/* Comment */}
      <Skeleton width="100%" height={14} style={styles.marginBottomSm} />
      <Skeleton width="95%" height={14} style={styles.marginBottomSm} />
      <Skeleton width="80%" height={14} style={styles.marginBottomMd} />

      {/* Helpful button */}
      <Skeleton width="60%" height={36} borderRadius={borderRadius.md} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.base,
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  marginBottom: {
    marginBottom: 8,
  },
  marginBottomSm: {
    marginBottom: 4,
  },
  marginBottomMd: {
    marginBottom: spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  star: {
    marginRight: 4,
  },
});
