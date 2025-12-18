import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';
import { ServiceCardProps } from '../../types/service';

export default function ServiceCard({
  id,
  title,
  description,
  category,
  price,
  currency = 'MAD',
  images,
  thumbnail,
  rating,
  reviews_count,
  duration_minutes,
  is_featured,
  status = 'active',
  provider,
  isNew = false,
  isFavorite: initialIsFavorite = false,
  variant = 'default',
  onPress,
  onFavoritePress,
}: ServiceCardProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

  // Get display image (first from images array or thumbnail)
  const displayImage = images && images.length > 0 ? images[0] : thumbnail || '';

  // Get provider info with fallbacks
  const providerName = 'name' in provider ? provider.name : 'Prestataire';
  const providerAvatar = 'avatar' in provider ? provider.avatar : undefined;

  const handleFavoritePress = () => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    onFavoritePress?.(id, newFavoriteState);
  };

  return (
    <Card
      onPress={onPress}
      padding="none"
      style={variant === 'compact' ? styles.compactCard : undefined}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        {displayImage ? (
          <Image
            source={{ uri: displayImage }}
            style={[
              styles.image,
              variant === 'compact' && styles.compactImage,
            ]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder, variant === 'compact' && styles.compactImage]}>
            <Text style={styles.imagePlaceholderText}>💇</Text>
          </View>
        )}

        {/* Overlays sur image */}
        <View style={styles.imageOverlays}>
          {/* Badge Catégorie (top-left) */}
          <Badge
            color="primary"
            size="sm"
            style={styles.categoryBadge}
          >
            {category.name}
          </Badge>

          {/* Badge Nouveau (top-right si isNew) */}
          {isNew && (
            <Badge
              color="accent"
              size="sm"
              style={styles.newBadge}
            >
              Nouveau
            </Badge>
          )}

          {/* Badge Featured (si is_featured et pas nouveau) */}
          {is_featured && !isNew && (
            <Badge
              color="secondary"
              size="sm"
              style={styles.featuredBadge}
            >
              Populaire
            </Badge>
          )}

          {/* Favori Button (top-right) */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            activeOpacity={0.8}
          >
            <Text style={styles.favoriteIcon}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Titre */}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        {/* Duration */}
        {duration_minutes && (
          <View style={styles.durationContainer}>
            <Text style={styles.durationIcon}>⏱️</Text>
            <Text style={styles.durationText}>
              {duration_minutes} min
            </Text>
          </View>
        )}

        {/* Provider Info */}
        <View style={styles.providerContainer}>
          {providerAvatar ? (
            <Image
              source={{ uri: providerAvatar }}
              style={styles.providerAvatar}
            />
          ) : (
            <View style={[styles.providerAvatar, styles.providerAvatarPlaceholder]}>
              <Text style={styles.providerAvatarText}>
                {providerName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.providerName} numberOfLines={1}>
            {providerName}
          </Text>
        </View>

        {/* Footer (Rating + Prix) */}
        <View style={styles.footer}>
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingStar}>⭐</Text>
            <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({reviews_count})</Text>
          </View>

          {/* Prix */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>A partir de</Text>
            <Text style={styles.priceValue}>
              {price} {currency}
            </Text>
          </View>
        </View>

        {/* Status Badge (debug) */}
        {status !== 'active' && (
          <Badge
            color={status === 'inactive' ? 'default' : 'warning'}
            variant="soft"
            size="sm"
            style={styles.statusBadge}
          >
            {status === 'inactive' ? 'Inactif' : 'Brouillon'}
          </Badge>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    marginBottom: spacing.md,
  },

  // Image
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  image: {
    width: '100%',
    height: 180,
  },
  compactImage: {
    height: 150,
  },
  imagePlaceholder: {
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
  },

  // Image Overlays
  imageOverlays: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.sm,
  },
  categoryBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  newBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm + 44,
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm + 44,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteIcon: {
    fontSize: 18,
  },

  // Content
  content: {
    padding: spacing.base,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: spacing.sm,
  },

  // Duration
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  durationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  durationText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },

  // Provider
  providerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  providerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  providerAvatarPlaceholder: {
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[600],
  },
  providerName: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    flex: 1,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Rating
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
    marginRight: 4,
  },
  ratingCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },

  // Prix
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: 2,
  },
  priceValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Status Badge
  statusBadge: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
});
