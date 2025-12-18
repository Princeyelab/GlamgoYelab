import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';
import { colors, spacing, borderRadius } from '../../lib/constants/theme';

export default function SkeletonCard() {
  return (
    <View style={styles.card}>
      {/* Image skeleton */}
      <Skeleton
        width="100%"
        height={150}
        borderRadius={0}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Title skeleton */}
        <Skeleton
          width="70%"
          height={20}
          style={styles.title}
        />

        {/* Description skeleton */}
        <Skeleton
          width="100%"
          height={14}
          style={styles.line}
        />
        <Skeleton
          width="85%"
          height={14}
          style={styles.line}
        />

        {/* Footer skeleton (prix + button) */}
        <View style={styles.footer}>
          <Skeleton width={80} height={24} />
          <Skeleton
            width={100}
            height={40}
            borderRadius={borderRadius.md}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  content: {
    padding: spacing.base,
  },
  title: {
    marginBottom: spacing.md,
  },
  line: {
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
