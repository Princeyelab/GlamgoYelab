import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius } from '../../lib/constants/theme';

type BadgeColor = 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'filled' | 'outlined' | 'soft';
type BadgeShape = 'pill' | 'rounded';

interface BadgeProps {
  children: string | number;
  color?: BadgeColor;
  size?: BadgeSize;
  variant?: BadgeVariant;
  shape?: BadgeShape;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// Color definitions for each variant
const badgeColors = {
  default: { main: colors.gray[700], light: colors.gray[100], contrast: colors.white },
  primary: { main: colors.primary, light: '#FFE5E8', contrast: colors.white },
  secondary: { main: colors.secondary, light: '#FFF4E6', contrast: colors.gray[900] },
  accent: { main: colors.accent, light: '#E0F2F1', contrast: colors.white },
  success: { main: colors.success, light: '#E8F5E9', contrast: colors.white },
  warning: { main: colors.warning, light: '#FFF3E0', contrast: colors.gray[900] },
  error: { main: colors.error, light: '#FFEBEE', contrast: colors.white },
};

export default function Badge({
  children,
  color = 'default',
  size = 'md',
  variant = 'filled',
  shape = 'pill',
  icon,
  style,
  textStyle,
}: BadgeProps) {
  const colorConfig = badgeColors[color];

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'filled':
        return colorConfig.main;
      case 'soft':
        return colorConfig.light;
      case 'outlined':
        return 'transparent';
      default:
        return colorConfig.main;
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'filled':
        return colorConfig.contrast;
      case 'soft':
      case 'outlined':
        return colorConfig.main;
      default:
        return colorConfig.contrast;
    }
  };

  const getBorderStyle = (): ViewStyle => {
    if (variant === 'outlined') {
      return {
        borderWidth: 1.5,
        borderColor: colorConfig.main,
      };
    }
    return {};
  };

  const badgeStyle: ViewStyle[] = [
    styles.base,
    sizeStyles[size],
    shapeStyles[shape],
    { backgroundColor: getBackgroundColor() },
    getBorderStyle(),
  ];
  if (style) badgeStyle.push(style);

  const badgeTextStyle: TextStyle[] = [
    styles.text,
    textSizeStyles[size],
    { color: getTextColor() },
  ];
  if (textStyle) badgeTextStyle.push(textStyle);

  return (
    <View style={badgeStyle}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={badgeTextStyle}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    marginRight: 4,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minHeight: 20,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 24,
  },
  lg: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    minHeight: 32,
  },
});

const shapeStyles = StyleSheet.create({
  pill: {
    borderRadius: 9999,
  },
  rounded: {
    borderRadius: borderRadius.sm,
  },
});

const textSizeStyles = StyleSheet.create({
  sm: {
    fontSize: 11,
  },
  md: {
    fontSize: 12,
  },
  lg: {
    fontSize: 14,
  },
});
