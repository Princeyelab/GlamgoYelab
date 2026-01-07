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
import Loading from '../../src/components/ui/Loading';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { getServiceTranslation, getCategoryTranslation } from '../../src/i18n/translations/services';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import {
  fetchServiceById,
  toggleFavorite,
  selectIsFavorite,
  selectCurrentService,
  selectServicesLoading,
  selectServices,
  addToRecentlyViewed,
} from '../../src/lib/store/slices/servicesSlice';
import { Service } from '../../src/types/service';

const { width } = Dimensions.get('window');

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, language, isRTL } = useLanguage();

  const [selectedImage, setSelectedImage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const currentService = useAppSelector(selectCurrentService);
  const services = useAppSelector(selectServices);
  const isLoading = useAppSelector(selectServicesLoading);
  const isFavorite = useAppSelector(selectIsFavorite(Number(id)));

  // Trouver le service dans le store d'abord
  const serviceFromStore = services.find(s => String(s.id) === String(id));
  const service = serviceFromStore || currentService;

  useEffect(() => {
    if (id) {
      dispatch(addToRecentlyViewed(Number(id)));
      // Ne charger depuis l'API que si pas deja dans le store
      if (!serviceFromStore) {
        loadService();
      }
    }
  }, [id, serviceFromStore]);

  const loadService = async () => {
    try {
      setError(null);
      await dispatch(fetchServiceById(id!)).unwrap();
    } catch (err: any) {
      console.error('Error loading service:', err);
      setError(err?.message || t('serviceDetail.loadError'));
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
    return <Loading fullScreen message={t('serviceDetail.loading')} />;
  }

  if (error || !service) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={[styles.errorText, isRTL && styles.rtlText]}>
          {error || t('serviceDetail.notFound')}
        </Text>
        <Button variant="outline" onPress={handleBack}>
          {t('common.back')}
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
            style={[styles.backButton, isRTL && styles.backButtonRTL]}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={styles.backIcon}>{isRTL ? '→' : '←'}</Text>
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

        {/* Content - Style Web App */}
        <View style={styles.content}>
          {/* Category Badge */}
          {service.category && (
            <View style={[styles.categoryBadge, { backgroundColor: (service.category as any).color || colors.primary }]}>
              <Text style={styles.categoryBadgeText}>
                {getCategoryTranslation((service.category as any).name || 'Service', language)}
              </Text>
            </View>
          )}

          {/* Title */}
          <Text style={[styles.title, isRTL && styles.rtlText]}>
            {getServiceTranslation(service.title || service.name || '', language).title || service.title || service.name}
          </Text>

          {/* Rating */}
          {(service.rating || 0) > 0 && (
            <View style={[styles.ratingRow, isRTL && styles.ratingRowRTL]}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingValue}>{(service.rating || 0).toFixed(1)}</Text>
              <Text style={styles.reviewsCount}>
                ({service.reviews_count || service.reviewsCount || 0} {t('serviceDetail.reviews')})
              </Text>
            </View>
          )}

          {/* Description */}
          <Text style={[styles.description, isRTL && styles.rtlText]}>
            {getServiceTranslation(service.title || service.name || '', language).description || service.description || t('serviceDetail.noDescription')}
          </Text>

          {/* Details Box - Prix & Durée */}
          <View style={[styles.detailsBox, isRTL && styles.detailsBoxRTL]}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>{t('serviceDetail.basePrice')}</Text>
              <Text style={[styles.detailValue, isRTL && styles.rtlText]}>{service.price} DH</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>{t('serviceDetail.estimatedDuration')}</Text>
              <Text style={[styles.detailValue, isRTL && styles.rtlText]}>⏱ {formatDuration(service.duration_minutes || 60)}</Text>
            </View>
          </View>

          {/* Book Button */}
          <Button
            variant="primary"
            onPress={handleBookNow}
            fullWidth
            style={styles.bookButtonInline}
          >
            {t('serviceDetail.bookNow')}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
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

  // Content - Web App Style
  content: {
    padding: spacing.lg,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  categoryBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.white,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  ratingStar: {
    fontSize: typography.fontSize.lg,
    color: '#FBBF24',
    marginRight: 4,
  },
  ratingValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginRight: 4,
  },
  reviewsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  detailsBox: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  detailItem: {
    flex: 1,
  },
  detailDivider: {
    width: 1,
    backgroundColor: colors.gray[200],
    marginHorizontal: spacing.md,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  bookButtonInline: {
    marginBottom: spacing.lg,
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
  // RTL support
  rtlText: {
    textAlign: 'right',
  },
  backButtonRTL: {
    left: undefined,
    right: 20,
  },
  ratingRowRTL: {
    flexDirection: 'row-reverse',
  },
  detailsBoxRTL: {
    flexDirection: 'row-reverse',
  },
});
