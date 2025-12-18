import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { colors, spacing, borderRadius } from '../../lib/constants/theme';

type CardVariant = 'elevated' | 'outlined' | 'flat';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  image?: ImageSourcePropType;
  imageHeight?: number;
  onPress?: () => void;
  disabled?: boolean;
  badge?: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export default function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  image,
  imageHeight = 200,
  onPress,
  disabled = false,
  badge,
  style,
  contentStyle,
}: CardProps) {
  const cardStyle = [
    styles.base,
    variantStyles[variant],
    disabled ? styles.disabled : undefined,
    style,
  ].filter(Boolean) as ViewStyle[];

  const contentPaddingStyle = padding !== 'none' ? paddingStyles[padding] : undefined;

  const content = (
    <>
      {image && (
        <View style={styles.imageContainer}>
          <Image
            source={image}
            style={[styles.image, { height: imageHeight }]}
            resizeMode="cover"
          />
          {badge && <View style={styles.badgeContainer}>{badge}</View>}
        </View>
      )}
      <View style={[contentPaddingStyle, contentStyle]}>{children}</View>
    </>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
  },
  disabled: {
    opacity: 0.5,
  },
});

const variantStyles = StyleSheet.create({
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  flat: {
    backgroundColor: colors.gray[50],
  },
});

const paddingStyles = StyleSheet.create({
  sm: {
    padding: spacing.sm,
  },
  md: {
    padding: spacing.base,
  },
  lg: {
    padding: spacing.lg,
  },
});
