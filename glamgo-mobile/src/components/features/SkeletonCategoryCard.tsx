import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../ui/Skeleton';
import { colors, spacing, borderRadius } from '../../lib/constants/theme';

interface SkeletonCategoryCardProps {
  variant?: 'default' | 'list';
}

export default function SkeletonCategoryCard({
  variant = 'default',
}: SkeletonCategoryCardProps) {
  return (
    <View
      style={[
        styles.container,
        variant === 'list' && styles.listContainer,
      ]}
    >
      {/* Icon */}
      <Skeleton width={48} height={48} borderRadius={24} />

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Text */}
      <View>
        <Skeleton width="80%" height={20} style={styles.nameSkeletons} />
        <Skeleton width="60%" height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 140,
    padding: spacing.base,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    justifyContent: 'space-between',
  },
  listContainer: {
    height: 120,
    width: 160,
    marginRight: spacing.md,
  },
  spacer: {
    flex: 1,
  },
  nameSkeletons: {
    marginBottom: spacing.sm,
  },
});
