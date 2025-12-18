import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';
import { CategoryCardProps } from '../../types/service';

// Helper pour assombrir couleur
function adjustColor(color: string, amount: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default function CategoryCard({
  name,
  icon,
  color = colors.gray[400],
  services_count = 0,
  image,
  variant = 'default',
  onPress,
}: CategoryCardProps) {
  // Créer couleur gradient (plus foncé)
  const gradientColors: [string, string] = [
    color,
    adjustColor(color, -30),
  ];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        variant === 'list' && styles.listContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Background Image (optionnel) */}
        {image && (
          <Image
            source={{ uri: image }}
            style={styles.backgroundImage}
            blurRadius={20}
          />
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          {icon && (
            <View style={styles.iconContainer}>
              {icon.startsWith('http') ? (
                <Image
                  source={{ uri: icon }}
                  style={styles.iconImage}
                />
              ) : (
                <Text style={styles.iconEmoji}>{icon}</Text>
              )}
            </View>
          )}

          {/* Text */}
          <View style={styles.textContainer}>
            <Text
              style={styles.name}
              numberOfLines={variant === 'list' ? 1 : 2}
            >
              {name}
            </Text>
            {services_count > 0 && (
              <Text style={styles.count}>
                {services_count} service{services_count > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    height: 140,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  listContainer: {
    height: 120,
    width: 160,
    marginRight: spacing.md,
    marginBottom: 0,
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  content: {
    flex: 1,
    padding: spacing.base,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 32,
    height: 32,
  },
  iconEmoji: {
    fontSize: 28,
  },
  textContainer: {
    marginTop: 'auto',
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  count: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
