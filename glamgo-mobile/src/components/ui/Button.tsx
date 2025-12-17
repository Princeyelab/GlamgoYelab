import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onPress,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyles: ViewStyle[] = [
    styles.base,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
  ];
  if (style) buttonStyles.push(style);

  const textStyles: TextStyle[] = [
    styles.text,
    textVariantStyles[variant],
    textSizeStyles[size],
  ];
  if (textStyle) textStyles.push(textStyle);

  const loaderColor = variant === 'outline' || variant === 'ghost'
    ? colors.primary
    : colors.white;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {leftIcon && !loading && (
        <View style={styles.iconLeft}>{leftIcon}</View>
      )}

      {loading ? (
        <ActivityIndicator color={loaderColor} size="small" />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}

      {rightIcon && !loading && (
        <View style={styles.iconRight}>{rightIcon}</View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
};

const textVariantStyles: Record<ButtonVariant, TextStyle> = {
  primary: {
    color: colors.white,
  },
  secondary: {
    color: colors.black,
  },
  outline: {
    color: colors.primary,
  },
  ghost: {
    color: colors.primary,
  },
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    minHeight: 56,
  },
};

const textSizeStyles: Record<ButtonSize, TextStyle> = {
  sm: {
    fontSize: typography.fontSize.sm,
  },
  md: {
    fontSize: typography.fontSize.base,
  },
  lg: {
    fontSize: typography.fontSize.lg,
  },
};
