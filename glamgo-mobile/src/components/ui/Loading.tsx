import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';

type LoadingSize = 'sm' | 'md' | 'lg';

interface LoadingProps {
  size?: LoadingSize;
  color?: string;
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export default function Loading({
  size = 'md',
  color = colors.primary,
  message,
  fullScreen = false,
  style,
}: LoadingProps) {
  const getActivitySize = (): 'small' | 'large' => {
    if (size === 'lg') return 'large';
    return 'small';
  };

  const getScale = (): number => {
    if (size === 'md') return 1.2;
    if (size === 'lg') return 1.5;
    return 1;
  };

  const content = (
    <View style={[styles.container, !fullScreen && style]}>
      <ActivityIndicator
        size={getActivitySize()}
        color={color}
        style={{ transform: [{ scale: getScale() }] }}
      />
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <Modal
        transparent
        visible
        animationType="fade"
      >
        <View style={styles.overlay}>
          <View style={styles.fullScreenContainer}>
            {content}
          </View>
        </View>
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    minWidth: 150,
    alignItems: 'center',
  },
});
