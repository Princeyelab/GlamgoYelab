/**
 * ProviderSelector Component - GlamGo Mobile
 * Selection du prestataire avec carte detaillee
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Card from '../ui/Card';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { hapticFeedback } from '../../lib/utils/haptics';
import apiClient from '../../lib/api/client';

export interface Provider {
  id: number;
  name: string;
  avatar?: string;
  initials: string;
  rating: number;
  reviewsCount: number;
  distance?: number;
  eta?: number;
  specialties: string[];
  isOnline: boolean;
  isVerified: boolean;
  completedServices: number;
  responseTime?: string;
  price?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface ProviderSelectorProps {
  providers: Provider[];
  selectedProviderId?: number;
  onSelect: (provider: Provider) => void;
  loading?: boolean;
  title?: string;
  showDistance?: boolean;
}

// Demo providers
export const DEMO_PROVIDERS: Provider[] = [
  {
    id: 1,
    name: 'Fatima Benali',
    initials: 'FB',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    rating: 4.9,
    reviewsCount: 127,
    distance: 1.2,
    eta: 8,
    specialties: ['Coiffure', 'Maquillage', 'Soins visage'],
    isOnline: true,
    isVerified: true,
    completedServices: 342,
    responseTime: '< 5 min',
  },
  {
    id: 2,
    name: 'Amina Kabbaj',
    initials: 'AK',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    rating: 4.7,
    reviewsCount: 89,
    distance: 2.5,
    eta: 15,
    specialties: ['Coiffure', 'Coloration'],
    isOnline: true,
    isVerified: true,
    completedServices: 186,
    responseTime: '< 10 min',
  },
  {
    id: 3,
    name: 'Sara Mansouri',
    initials: 'SM',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    rating: 4.8,
    reviewsCount: 156,
    distance: 3.1,
    eta: 18,
    specialties: ['Maquillage', 'Mariee'],
    isOnline: true,
    isVerified: false,
    completedServices: 412,
    responseTime: '< 15 min',
  },
  {
    id: 4,
    name: 'Leila Tazi',
    initials: 'LT',
    rating: 4.6,
    reviewsCount: 64,
    distance: 4.2,
    eta: 22,
    specialties: ['Soins', 'Massage'],
    isOnline: false,
    isVerified: true,
    completedServices: 98,
  },
];

interface Review {
  id: number;
  rating: number;
  comment: string;
  user_first_name?: string;
  user_last_name?: string;
  created_at: string;
  service_name?: string;
}

export default function ProviderSelector({
  providers = DEMO_PROVIDERS,
  selectedProviderId,
  onSelect,
  loading = false,
  title = 'Choisir un prestataire',
  showDistance = true,
}: ProviderSelectorProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviewsProvider, setReviewsProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const handleSelect = (provider: Provider) => {
    hapticFeedback.selection();
    onSelect(provider);
  };

  const handleExpand = (id: number) => {
    hapticFeedback.light();
    setExpandedId(expandedId === id ? null : id);
  };

  // Trouver le prestataire le plus proche
  const nearestProvider = useMemo(() => {
    const online = providers.filter(p => p.isOnline && p.distance !== undefined);
    if (online.length === 0) return null;
    return online.reduce((a, b) => (a.distance || 999) < (b.distance || 999) ? a : b);
  }, [providers]);

  // Charger les avis d'un prestataire
  const handleShowReviews = async (provider: Provider) => {
    hapticFeedback.light();
    setReviewsProvider(provider);
    setShowReviewsModal(true);
    setLoadingReviews(true);

    try {
      const response = await apiClient.get(`/api/providers/${provider.id}/reviews`);
      if (response.data?.success && response.data.data?.reviews) {
        setReviews(response.data.data.reviews);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.log('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const onlineProviders = providers.filter(p => p.isOnline);
  const offlineProviders = providers.filter(p => !p.isOnline);

  const renderProvider = (provider: Provider) => {
    const isSelected = selectedProviderId === provider.id;
    const isExpanded = expandedId === provider.id;
    const isNearest = nearestProvider?.id === provider.id;

    return (
      <TouchableOpacity
        key={provider.id}
        style={[
          styles.providerCard,
          isSelected && styles.providerCardSelected,
          isNearest && !isSelected && styles.providerCardNearest,
          !provider.isOnline && styles.providerCardOffline,
        ]}
        onPress={() => handleSelect(provider)}
        onLongPress={() => handleExpand(provider.id)}
        activeOpacity={0.7}
        disabled={!provider.isOnline}
      >
        {/* Badge Plus Proche */}
        {isNearest && provider.isOnline && (
          <View style={styles.nearestBadge}>
            <Text style={styles.nearestBadgeText}>Plus proche</Text>
          </View>
        )}

        {/* Header Row */}
        <View style={styles.providerHeader}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {provider.avatar ? (
              <Image source={{ uri: provider.avatar }} style={styles.avatar} />
            ) : (
              <View style={[
                styles.avatarPlaceholder,
                isSelected && styles.avatarPlaceholderSelected,
                isNearest && !isSelected && styles.avatarPlaceholderNearest,
              ]}>
                <Text style={[
                  styles.avatarInitials,
                  (isSelected || isNearest) && styles.avatarInitialsLight,
                ]}>{provider.initials}</Text>
              </View>
            )}
            {provider.isOnline && (
              <View style={styles.onlineIndicator} />
            )}
            {provider.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.providerInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.providerName, !provider.isOnline && styles.textOffline]}>
                {provider.name}
              </Text>
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>Selectionne</Text>
                </View>
              )}
            </View>

            {/* Rating - Cliquable pour voir les avis */}
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStars}>⭐</Text>
              <Text style={styles.ratingValue}>{provider.rating}</Text>
              <TouchableOpacity
                onPress={() => handleShowReviews(provider)}
                hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
              >
                <Text style={styles.reviewsCountLink}>({provider.reviewsCount} avis)</Text>
              </TouchableOpacity>
              {provider.completedServices > 100 && (
                <View style={styles.experienceBadge}>
                  <Text style={styles.experienceText}>{provider.completedServices}+ services</Text>
                </View>
              )}
            </View>

            {/* Specialties */}
            <View style={styles.specialtiesRow}>
              {provider.specialties.slice(0, 3).map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ETA / Distance */}
          {showDistance && provider.isOnline && (
            <View style={styles.etaContainer}>
              {provider.eta && (
                <>
                  <Text style={styles.etaValue}>{provider.eta}</Text>
                  <Text style={styles.etaLabel}>min</Text>
                </>
              )}
              {provider.distance && (
                <Text style={styles.distanceText}>{provider.distance} km</Text>
              )}
            </View>
          )}

          {/* Offline Badge */}
          {!provider.isOnline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>Hors ligne</Text>
            </View>
          )}
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>⏱️</Text>
              <Text style={styles.detailLabel}>Temps de reponse:</Text>
              <Text style={styles.detailValue}>{provider.responseTime || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>✅</Text>
              <Text style={styles.detailLabel}>Services realises:</Text>
              <Text style={styles.detailValue}>{provider.completedServices}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🏆</Text>
              <Text style={styles.detailLabel}>Specialites:</Text>
              <Text style={styles.detailValue}>{provider.specialties.join(', ')}</Text>
            </View>
          </View>
        )}

        {/* Selection Indicator */}
        <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {onlineProviders.length} disponible{onlineProviders.length > 1 ? 's' : ''} maintenant
        </Text>
      </View>

      {/* Online Providers */}
      <ScrollView
        style={styles.providersList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {onlineProviders.map(renderProvider)}

        {/* Offline Section */}
        {offlineProviders.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Actuellement indisponibles</Text>
            {offlineProviders.map(renderProvider)}
          </>
        )}
      </ScrollView>

      {/* Helper Text */}
      <Text style={styles.helperText}>
        Appuyez sur les avis pour les consulter
      </Text>

      {/* Modal Avis */}
      <Modal
        visible={showReviewsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewsModal(false)}
      >
        <View style={styles.reviewsModalOverlay}>
          <View style={styles.reviewsModalContent}>
            {/* Header */}
            <View style={styles.reviewsModalHeader}>
              <View style={styles.reviewsModalTitleRow}>
                <Text style={styles.reviewsModalTitle}>Avis clients</Text>
                {reviewsProvider && (
                  <View style={styles.reviewsModalRating}>
                    <Text style={styles.reviewsModalRatingText}>
                      ⭐ {reviewsProvider.rating} ({reviewsProvider.reviewsCount})
                    </Text>
                  </View>
                )}
              </View>
              {reviewsProvider && (
                <Text style={styles.reviewsModalSubtitle}>{reviewsProvider.name}</Text>
              )}
              <TouchableOpacity
                style={styles.reviewsModalClose}
                onPress={() => setShowReviewsModal(false)}
              >
                <Text style={styles.reviewsModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.reviewsModalList} showsVerticalScrollIndicator={false}>
              {loadingReviews ? (
                <View style={styles.reviewsLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.reviewsLoadingText}>Chargement des avis...</Text>
                </View>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>
                          {review.user_first_name?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      </View>
                      <View style={styles.reviewInfo}>
                        <Text style={styles.reviewName}>
                          {review.user_first_name || ''} {review.user_last_name?.charAt(0) || ''}.
                        </Text>
                        <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                      </View>
                      <View style={styles.reviewRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Text
                            key={star}
                            style={[
                              styles.reviewStar,
                              star <= review.rating && styles.reviewStarFilled,
                            ]}
                          >
                            ★
                          </Text>
                        ))}
                      </View>
                    </View>
                    {review.service_name && (
                      <Text style={styles.reviewService}>{review.service_name}</Text>
                    )}
                    {review.comment && (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.noReviews}>
                  <Text style={styles.noReviewsIcon}>💬</Text>
                  <Text style={styles.noReviewsText}>Aucun avis pour le moment</Text>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <TouchableOpacity
              style={styles.reviewsModalButton}
              onPress={() => {
                setShowReviewsModal(false);
                if (reviewsProvider) {
                  handleSelect(reviewsProvider);
                }
              }}
            >
              <Text style={styles.reviewsModalButtonText}>
                Choisir {reviewsProvider?.name}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },

  // Providers List
  providersList: {
    maxHeight: 400,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[400],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  // Provider Card
  providerCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    padding: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
    ...shadows.sm,
  },
  providerCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  providerCardOffline: {
    opacity: 0.6,
    backgroundColor: colors.gray[50],
  },
  providerCardNearest: {
    borderColor: colors.warning,
    backgroundColor: colors.warning + '08',
  },

  // Badge Plus Proche
  nearestBadge: {
    position: 'absolute',
    top: -10,
    left: spacing.md,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    zIndex: 1,
  },
  nearestBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },

  // Header Row
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray[200],
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderSelected: {
    backgroundColor: colors.primary,
  },
  avatarPlaceholderNearest: {
    backgroundColor: colors.warning,
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[600],
  },
  avatarInitialsLight: {
    color: colors.white,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.info,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIcon: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
  },

  // Provider Info
  providerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  providerName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginRight: spacing.sm,
  },
  textOffline: {
    color: colors.gray[500],
  },
  selectedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },

  // Rating
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingStars: {
    fontSize: 12,
    marginRight: 2,
  },
  ratingValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
    marginRight: 4,
  },
  reviewsCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginRight: spacing.sm,
  },
  reviewsCountLink: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    marginRight: spacing.sm,
    textDecorationLine: 'underline',
  },
  experienceBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  experienceText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.success,
  },

  // Specialties
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  specialtyTag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  specialtyText: {
    fontSize: 11,
    color: colors.gray[600],
  },

  // ETA Container
  etaContainer: {
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 60,
  },
  etaValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  etaLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  distanceText: {
    fontSize: 10,
    color: colors.gray[500],
    marginTop: 2,
  },

  // Offline Badge
  offlineBadge: {
    backgroundColor: colors.gray[300],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  offlineBadgeText: {
    fontSize: 11,
    color: colors.gray[600],
    fontWeight: '500',
  },

  // Expanded Details
  expandedDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
    width: 20,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginRight: spacing.sm,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
    fontWeight: '500',
    flex: 1,
  },

  // Radio Button
  radioButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  // Helper Text
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Reviews Modal
  reviewsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  reviewsModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    paddingBottom: spacing.xl,
  },
  reviewsModalHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  reviewsModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewsModalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray[900],
  },
  reviewsModalRating: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  reviewsModalRatingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.warning,
  },
  reviewsModalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 4,
  },
  reviewsModalClose: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsModalCloseText: {
    fontSize: 18,
    color: colors.gray[600],
  },
  reviewsModalList: {
    padding: spacing.md,
    maxHeight: 400,
  },
  reviewsLoading: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  reviewsLoadingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  reviewCard: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  reviewAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
  },
  reviewDate: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewStar: {
    fontSize: 14,
    color: colors.gray[300],
  },
  reviewStarFilled: {
    color: colors.warning,
  },
  reviewService: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  reviewComment: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: 20,
  },
  noReviews: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  noReviewsIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  noReviewsText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },
  reviewsModalButton: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  reviewsModalButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.white,
  },
});
