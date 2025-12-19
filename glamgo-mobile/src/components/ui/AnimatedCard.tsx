/**
 * AnimatedCard Component - GlamGo Mobile
 * Carte avec animation d'entrée
 */

import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { SPRING_CONFIG } from '../../lib/animations/transitions';
import { colors, borderRadius, shadows, spacing } from '../../lib/constants/theme';

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  animation?: 'fadeUp' | 'fadeIn' | 'scaleIn' | 'slideRight';
}

export default function AnimatedCard({
  children,
  delay = 0,
  style,
  variant = 'default',
  animation = 'fadeUp',
}: AnimatedCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(animation === 'fadeUp' ? 20 : 0);
  const translateX = useSharedValue(animation === 'slideRight' ? -20 : 0);
  const scale = useSharedValue(animation === 'scaleIn' ? 0.95 : 1);

  useEffect(() => {
    const animate = () => {
      opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));

      if (animation === 'fadeUp') {
        translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIG));
      } else if (animation === 'slideRight') {
        translateX.value = withDelay(delay, withSpring(0, SPRING_CONFIG));
      } else if (animation === 'scaleIn') {
        scale.value = withDelay(delay, withSpring(1, SPRING_CONFIG));
      }
    };

    animate();
  }, [delay, animation]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const variantStyles = {
    default: styles.default,
    elevated: styles.elevated,
    outlined: styles.outlined,
  };

  return (
    <Animated.View style={[styles.card, variantStyles[variant], animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  default: {
    backgroundColor: colors.white,
  },
  elevated: {
    backgroundColor: colors.white,
    ...shadows.md,
  },
  outlined: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
});
