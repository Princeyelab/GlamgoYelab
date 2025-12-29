import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ImageSourcePropType,
} from 'react-native';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { hapticFeedback } from '../../lib/utils/haptics';
import { ServiceCardProps } from '../../types/service';
import { useCurrency } from '../../contexts/CurrencyContext';

// Images locales par defaut
const DEFAULT_LOCAL_IMAGES: Record<string, ImageSourcePropType> = {
  epilation: require('../../../assets/images/defaults/epilation.jpg'),
  coiffure: require('../../../assets/images/defaults/coiffure.jpg'),
  massage: require('../../../assets/images/defaults/massage.jpg'),
  beaute: require('../../../assets/images/defaults/beaute.jpg'),
  maison: require('../../../assets/images/defaults/maison.jpg'),
  voiture: require('../../../assets/images/defaults/voiture.jpg'),
  animaux: require('../../../assets/images/defaults/animaux.jpg'),
  manucure: require('../../../assets/images/defaults/manucure.jpg'),
};

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
  const [imageError, setImageError] = useState(false);
  const { formatPrice } = useCurrency();

  // Get display image (first from images array, thumbnail, or default by category)
  const getCategorySlug = () => {
    const catName = category?.name?.toLowerCase() || '';
    const serviceTitle = title?.toLowerCase() || '';

    // Verifier dans le nom de categorie ET le titre du service
    if (catName.includes('epilation') || catName.includes('épilation') ||
        serviceTitle.includes('epilation') || serviceTitle.includes('smooth')) return 'epilation';
    if (catName.includes('coiffure') || serviceTitle.includes('coupe') ||
        serviceTitle.includes('barbe') || serviceTitle.includes('cheveux')) return 'coiffure';
    if (catName.includes('maquillage') || serviceTitle.includes('maquillage')) return 'maquillage';
    if (catName.includes('manucure') || catName.includes('pédicure') ||
        serviceTitle.includes('manucure') || serviceTitle.includes('pédicure')) return 'manucure';
    if (catName.includes('massage') || serviceTitle.includes('massage')) return 'massage';
    if (catName.includes('bien') || catName.includes('yoga') || catName.includes('coach') ||
        serviceTitle.includes('yoga') || serviceTitle.includes('pilates')) return 'bien-etre';
    if (catName.includes('ménage') || catName.includes('menage') || catName.includes('maison') ||
        serviceTitle.includes('nettoyage') || serviceTitle.includes('ménage')) return 'maison';
    if (catName.includes('voiture') || catName.includes('lavage') || catName.includes('auto') ||
        serviceTitle.includes('lavage') || serviceTitle.includes('auto')) return 'voiture';
    if (catName.includes('animaux') || catName.includes('chien') || catName.includes('chat') ||
        serviceTitle.includes('chien') || serviceTitle.includes('animal')) return 'animaux';
    if (catName.includes('beauté') || catName.includes('beaute')) return 'beaute';
    return 'beaute';
  };

  // Verifier si une image URL est valide
  const isValidImage = (img: string | undefined | null): boolean => {
    return !!img && img.length > 5 && (img.startsWith('http') || img.startsWith('/'));
  };

  const firstImage = images && images.length > 0 ? images[0] : null;
  const hasValidRemoteImage = isValidImage(firstImage) || isValidImage(thumbnail);
  const remoteImageUrl = isValidImage(firstImage) ? firstImage! : (isValidImage(thumbnail) ? thumbnail! : null);

  // Image locale par defaut selon la categorie
  const categorySlug = getCategorySlug();
  const localFallbackImage = DEFAULT_LOCAL_IMAGES[categorySlug] || DEFAULT_LOCAL_IMAGES['beaute'];

  const handleFavoritePress = () => {
    hapticFeedback.light();
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
        {!imageError && hasValidRemoteImage && remoteImageUrl ? (
          <Image
            source={{ uri: remoteImageUrl }}
            style={[
              styles.image,
              variant === 'compact' && styles.compactImage,
            ]}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Image
            source={localFallbackImage}
            style={[
              styles.image,
              variant === 'compact' && styles.compactImage,
            ]}
            resizeMode="cover"
          />
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
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={3}>
          {description}
        </Text>

        {/* Footer (Prix + Duration | Rating) - Style Web App */}
        <View style={styles.footer}>
          {/* Left: Prix + Duration */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.priceValue}>
                {formatPrice(price)}
              </Text>
              <Text style={styles.priceLabel}> / service</Text>
            </View>
            {duration_minutes && (
              <View style={styles.durationRow}>
                <Text style={styles.durationIcon}>⏱</Text>
                <Text style={styles.durationText}>{duration_minutes} min</Text>
              </View>
            )}
          </View>

          {/* Right: Rating */}
          {rating > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({reviews_count})</Text>
            </View>
          )}
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
    overflow: 'hidden',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  image: {
    width: '100%',
    height: 200,
  },
  compactImage: {
    height: 160,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  newBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm + 48,
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm + 48,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  favoriteIcon: {
    fontSize: 18,
  },

  // Content
  content: {
    padding: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: spacing.md,
    flex: 1,
  },

  // Footer - Style Web App
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },

  // Prix Section (left)
  priceSection: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.primary,
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    fontWeight: 'normal',
  },

  // Duration Row (under price)
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  durationIcon: {
    fontSize: 11,
    color: colors.gray[500],
    marginRight: 4,
  },
  durationText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },

  // Rating (right)
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingStar: {
    fontSize: 12,
    color: '#F59E0B',
  },
  ratingValue: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
  },
  ratingCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },

  // Status Badge
  statusBadge: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
});
