import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import Badge from '../../src/components/ui/Badge';
import Card from '../../src/components/ui/Card';
import Loading from '../../src/components/ui/Loading';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import {
  fetchServiceById,
  toggleFavorite,
  selectIsFavorite,
  selectCurrentService,
  selectServicesLoading,
  addToRecentlyViewed,
} from '../../src/lib/store/slices/servicesSlice';
import { Service } from '../../src/types/service';

const { width } = Dimensions.get('window');

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [selectedImage, setSelectedImage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const service = useAppSelector(selectCurrentService);
  const isLoading = useAppSelector(selectServicesLoading);
  const isFavorite = useAppSelector(selectIsFavorite(Number(id)));

  useEffect(() => {
    if (id) {
      loadService();
      dispatch(addToRecentlyViewed(Number(id)));
    }
  }, [id]);

  const loadService = async () => {
    try {
      setError(null);
      await dispatch(fetchServiceById(Number(id))).unwrap();
    } catch (err: any) {
      console.error('Error loading service:', err);
      setError(err?.message || 'Erreur lors du chargement');
    }
  };

  const handleFavoriteToggle = () => {
    dispatch(toggleFavorite(Number(id)));
  };

  const handleBookNow = () => {
    router.push(`/booking/create?service_id=${id}`);
  };

  const handleBack = () => {
    router.back();
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (isLoading && !service) {
    return <Loading fullScreen message="Chargement du service..." />;
  }

  if (error || !service) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorText}>
          {error || 'Service non trouve'}
        </Text>
        <Button variant="outline" onPress={handleBack}>
          Retour
        </Button>
      </View>
    );
  }

  // Get images array
  const images = service.images?.length ? service.images :
    (service.thumbnail ? [service.thumbnail] : []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <View style={styles.gallery}>
          {images.length > 0 ? (
            <Image
              source={{ uri: images[selectedImage] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.mainImage, styles.imagePlaceholder]}>
              <Text style={styles.placeholderIcon}>💇</Text>
            </View>
          )}

          {/* Overlay Gradient */}
          <View style={styles.imageOverlay} />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Favorite Button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoriteToggle}
            activeOpacity={0.8}
          >
            <Text style={styles.favoriteIcon}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>

          {/* Image Thumbnails */}
          {images.length > 1 && (
            <View style={styles.thumbnails}>
              {images.slice(0, 4).map((img: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImage(index)}
                  style={[
                    styles.thumbnail,
                    selectedImage === index && styles.thumbnailActive,
                  ]}
                >
                  <Image source={{ uri: img }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>{service.title}</Text>
              <View style={styles.meta}>
                {service.category && (
                  <Badge color="accent" size="sm">
                    {service.category.name}
                  </Badge>
                )}
                {service.is_featured && (
                  <Badge color="warning" size="sm" style={styles.metaBadge}>
                    Populaire
                  </Badge>
                )}
                {service.isNew && (
                  <Badge color="success" size="sm" style={styles.metaBadge}>
                    Nouveau
                  </Badge>
                )}
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>A partir de</Text>
              <Text style={styles.price}>{service.price} DH</Text>
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>⏱️</Text>
              <Text style={styles.infoLabel}>Duree</Text>
              <Text style={styles.infoValue}>
                {formatDuration(service.duration_minutes || 60)}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>⭐</Text>
              <Text style={styles.infoLabel}>Note</Text>
              <Text style={styles.infoValue}>
                {(service.rating || 0).toFixed(1)}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>💬</Text>
              <Text style={styles.infoLabel}>Avis</Text>
              <Text style={styles.infoValue}>
                {service.reviews_count || 0}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Card style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {service.description || 'Aucune description disponible.'}
            </Text>
          </Card>

          {/* Provider Preview (if available) */}
          {service.provider && (
            <Card style={styles.providerCard}>
              <Text style={styles.sectionTitle}>Prestataire</Text>
              <View style={styles.providerRow}>
                {service.provider.avatar ? (
                  <Image
                    source={{ uri: service.provider.avatar }}
                    style={styles.providerAvatar}
                  />
                ) : (
                  <View style={[styles.providerAvatar, styles.providerAvatarPlaceholder]}>
                    <Text style={styles.providerAvatarText}>
                      {(service.provider.name || 'P').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{service.provider.name}</Text>
                  <Text style={styles.providerRating}>
                    ⭐ {((service.provider as any).rating || 4.5).toFixed(1)}
                  </Text>
                </View>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {/* TODO: Navigate to provider profile */}}
                >
                  Voir profil
                </Button>
              </View>
            </Card>
          )}

          {/* What's Included */}
          <Card style={styles.includedCard}>
            <Text style={styles.sectionTitle}>Ce qui est inclus</Text>
            <View style={styles.includedList}>
              <View style={styles.includedItem}>
                <Text style={styles.includedIcon}>✓</Text>
                <Text style={styles.includedText}>Service a domicile</Text>
              </View>
              <View style={styles.includedItem}>
                <Text style={styles.includedIcon}>✓</Text>
                <Text style={styles.includedText}>Materiel professionnel</Text>
              </View>
              <View style={styles.includedItem}>
                <Text style={styles.includedIcon}>✓</Text>
                <Text style={styles.includedText}>Produits de qualite</Text>
              </View>
              <View style={styles.includedItem}>
                <Text style={styles.includedIcon}>✓</Text>
                <Text style={styles.includedText}>Prestataire verifie</Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarLeft}>
          <Text style={styles.bottomBarLabel}>Prix total</Text>
          <Text style={styles.bottomBarPrice}>{service.price} DH</Text>
        </View>
        <Button
          variant="primary"
          onPress={handleBookNow}
          style={styles.bookButton}
        >
          Reserver maintenant
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Gallery
  gallery: {
    position: 'relative',
  },
  mainImage: {
    width: width,
    height: width * 0.75,
    backgroundColor: colors.gray[200],
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
  placeholderIcon: {
    fontSize: 64,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  backIcon: {
    fontSize: 24,
    color: colors.gray[900],
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  favoriteIcon: {
    fontSize: 22,
  },
  thumbnails: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: colors.white,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },

  // Content
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metaBadge: {
    marginLeft: spacing.xs,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: 2,
  },
  price: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },

  // Info Cards
  infoCards: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },

  // Description
  descriptionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    lineHeight: 24,
  },

  // Provider
  providerCard: {
    marginBottom: spacing.md,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.md,
  },
  providerAvatarPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerAvatarText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 4,
  },
  providerRating: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },

  // Included
  includedCard: {
    marginBottom: spacing.md,
  },
  includedList: {
    gap: spacing.sm,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  includedIcon: {
    fontSize: typography.fontSize.base,
    color: colors.success,
    marginRight: spacing.sm,
    fontWeight: typography.fontWeight.bold,
  },
  includedText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    ...shadows.lg,
  },
  bottomBarLeft: {},
  bottomBarLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: 2,
  },
  bottomBarPrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  bookButton: {
    flex: 1,
    marginLeft: spacing.lg,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
