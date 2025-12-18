/**
 * OfflineBanner - Banniere affichee quand l'app est hors ligne
 * Utilise le hook useNetworkStatus pour detecter l'etat reseau
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../lib/constants/theme';
import { useAppSelector } from '../../lib/store/hooks';
import { selectIsOnline } from '../../lib/store/slices/uiSlice';

interface OfflineBannerProps {
  onRetry?: () => void;
}

export default function OfflineBanner({ onRetry }: OfflineBannerProps) {
  const isOnline = useAppSelector(selectIsOnline);
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      // Show banner
      wasOffline.current = true;
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else if (wasOffline.current) {
      // Hide banner with slight delay to show "back online" message
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          wasOffline.current = false;
        });
      }, 1500);
    }
  }, [isOnline, slideAnim]);

  // Don't render if always online
  if (isOnline && !wasOffline.current) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.sm,
          transform: [{ translateY: slideAnim }],
          backgroundColor: isOnline ? colors.success : colors.warning,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{isOnline ? '✓' : '📡'}</Text>
        <Text style={styles.text}>
          {isOnline
            ? 'Connexion retablie'
            : 'Pas de connexion internet'}
        </Text>
        {!isOnline && onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            style={styles.retryButton}
            activeOpacity={0.7}
          >
            <Text style={styles.retryText}>Reessayer</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  text: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  retryButton: {
    marginLeft: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  retryText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
