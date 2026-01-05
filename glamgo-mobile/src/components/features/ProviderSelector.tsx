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
import ProviderProfileModal from './ProviderProfileModal';

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

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileProvider, setProfileProvider] = useState<any>(null);

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

  // Afficher le profil d'un prestataire
  const handleShowProfile = (provider: Provider) => {
    hapticFeedback.light();
    // Convertir vers le format attendu par ProviderProfileModal
    setProfileProvider({
      id: provider.id,
      first_name: provider.name.split(' ')[0],
      last_name: provider.name.split(' ').slice(1).join(' '),
      name: provider.name,
      avatar: provider.avatar,
      rating: provider.rating,
      total_reviews: provider.reviewsCount,
      is_verified: provider.isVerified,
      specialties: provider.specialties?.join(', '),
    });
    setShowProfileModal(true);
  };

  const onlineProviders = providers.filter(p => p.isOnline);
  const offlineProviders = providers.filter(p => !p.isOnline);

  const renderProvider = (provider: Provider) => {
    const isSelected = selectedProviderId === provider.id;
    const isExpanded = expandedId === provider.id;
    const isNearest = nearestProvider?.id === provider.id;

    // Construire l'URL de l'avatar
    const avatarUrl = provider.avatar
      ? (provider.avatar.startsWith('http') ? provider.avatar : `https://glamgo-api.fly.dev${provider.avatar}`)
      : null;

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
        {/* Badge Disponibilité - Toujours visible */}
        <View style={[
          styles.availabilityBadge,
          provider.isOnline ? styles.availableBadge : styles.unavailableBadge
        ]}>
          <View style={[
            styles.availabilityDot,
            { backgroundColor: provider.isOnline ? '#22C55E' : '#EF4444' }
          ]} />
          <Text style={[
            styles.availabilityBadgeText,
            provider.isOnline ? styles.availableText : styles.unavailableText
          ]}>
            {provider.isOnline ? 'Disponible' : 'Indisponible'}
          </Text>
        </View>

        {/* Badge Plus Proche */}
        {isNearest && provider.isOnline ? (
          <View style={styles.nearestBadge}>
            <Text style={styles.nearestBadgeText}>{'Plus proche'}</Text>
          </View>
        ) : null}

        {/* Header Row avec photo plus grande */}
        <View style={styles.providerHeader}>
          {/* Avatar - Plus grand */}
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarLarge} />
            ) : (
              <View style={[
                styles.avatarPlaceholderLarge,
                isSelected && styles.avatarPlaceholderSelected,
                isNearest && !isSelected && styles.avatarPlaceholderNearest,
              ]}>
                <Text style={[
                  styles.avatarInitialsLarge,
                  (isSelected || isNearest) && styles.avatarInitialsLight,
                ]}>{provider.initials}</Text>
              </View>
            )}
            {provider.isOnline ? (
              <View style={styles.onlineIndicatorLarge} />
            ) : null}
            {provider.isVerified ? (
              <View style={styles.verifiedBadgeLarge}>
                <Text style={styles.verifiedIconLarge}>{'✓'}</Text>
              </View>
            ) : null}
          </View>

          {/* Info */}
          <View style={styles.providerInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.providerName, !provider.isOnline && styles.textOffline]}>
                {provider.name}
              </Text>
              {isSelected ? (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>{'Selectionne'}</Text>
                </View>
              ) : null}
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
            </View>

            {/* Stats Row - Temps de réponse & Services réalisés */}
            <View style={styles.statsRow}>
              {provider.responseTime ? (
                <View style={styles.statBadge}>
                  <Text style={styles.statIcon}>⚡</Text>
                  <Text style={styles.statText}>{provider.responseTime}</Text>
                </View>
              ) : null}
              <View style={styles.statBadge}>
                <Text style={styles.statIcon}>✅</Text>
                <Text style={styles.statText}>{provider.completedServices} services</Text>
              </View>
              {/* Bouton Voir profil */}
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => handleShowProfile(provider)}
                hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
              >
                <Text style={styles.profileButtonText}>Voir profil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Distance/ETA Row - Séparé */}
        {showDistance && provider.isOnline && (provider.distance || provider.eta) ? (
          <View style={styles.distanceRow}>
            {provider.distance != null && provider.distance > 0 ? (
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceIcon}>📍</Text>
                <Text style={styles.distanceValue}>{provider.distance} km</Text>
              </View>
            ) : null}
            {provider.eta != null && provider.eta > 0 ? (
              <View style={styles.etaBadge}>
                <Text style={styles.etaIcon}>🕐</Text>
                <Text style={styles.etaValueSmall}>{provider.eta} min</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Offline Badge */}
        {!provider.isOnline ? (
          <View style={styles.offlineRow}>
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>{'Hors ligne'}</Text>
            </View>
          </View>
        ) : null}

        {/* Selection Indicator */}
        <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
          {isSelected ? <View style={styles.radioButtonInner} /> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onlineProviders.length > 0 ? (
          <Text style={styles.subtitle}>
            {onlineProviders.length} dispo.
          </Text>
        ) : null}
      </View>

      {/* Online Providers */}
      <ScrollView
        style={styles.providersList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {onlineProviders.map(renderProvider)}

        {/* Offline Section */}
        {offlineProviders.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>{'Actuellement indisponibles'}</Text>
            {offlineProviders.map(renderProvider)}
          </>
        ) : null}
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
                {reviewsProvider ? (
                  <View style={styles.reviewsModalRating}>
                    <Text style={styles.reviewsModalRatingText}>
                      {`⭐ ${reviewsProvider.rating} (${reviewsProvider.reviewsCount})`}
                    </Text>
                  </View>
                ) : null}
              </View>
              {reviewsProvider ? (
                <Text style={styles.reviewsModalSubtitle}>{reviewsProvider.name}</Text>
              ) : null}
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
                    {review.service_name ? (
                      <Text style={styles.reviewService}>{review.service_name}</Text>
                    ) : null}
                    {review.comment ? (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    ) : null}
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

      {/* Modal Profil Prestataire */}
      <ProviderProfileModal
        visible={showProfileModal}
        provider={profileProvider}
        onClose={() => setShowProfileModal(false)}
        onSelectService={(service) => {
          // Fermer le modal et sélectionner le prestataire
          setShowProfileModal(false);
          if (profileProvider) {
            const providerData = providers.find(p => p.id === profileProvider.id);
            if (providerData) {
              handleSelect(providerData);
            }
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    overflow: 'visible',
  },
  header: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: '600',
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },

  // Providers List
  providersList: {
    maxHeight: 400,
    overflow: 'visible',
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
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    position: 'relative',
    overflow: 'visible',
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

  // Badge Disponibilité
  availabilityBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md + 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  availableBadge: {
    backgroundColor: '#DCFCE7',
  },
  unavailableBadge: {
    backgroundColor: '#FEE2E2',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  availabilityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  availableText: {
    color: '#166534',
  },
  unavailableText: {
    color: '#DC2626',
  },

  // Badge Plus Proche
  nearestBadge: {
    position: 'absolute',
    top: -10,
    left: spacing.md,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    zIndex: 10,
    elevation: 3,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  nearestBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Header Row
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Avatar - Plus grand
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
  avatarLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.gray[200],
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
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
  avatarInitialsLarge: {
    fontSize: 24,
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
  onlineIndicatorLarge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    borderWidth: 3,
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
  verifiedBadgeLarge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.info,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  verifiedIcon: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
  },
  verifiedIconLarge: {
    fontSize: 12,
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

  // Stats Row - Temps de réponse & Services réalisés
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[700],
  },
  profileButton: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginLeft: 'auto',
  },
  profileButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },

  // Specialties
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  specialtiesLabel: {
    fontSize: 11,
    color: colors.gray[500],
    marginRight: 4,
  },
  specialtyTag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  specialtyTagHighlight: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  specialtyText: {
    fontSize: 11,
    color: colors.gray[600],
  },
  specialtyTextHighlight: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.primary,
  },
  moreSpecialties: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  noSpecialties: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.gray[400],
  },

  // Distance/ETA Row
  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: spacing.md,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  distanceIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  distanceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.info,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  etaIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  etaValueSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  // ETA Container (legacy)
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
  offlineRow: {
    marginTop: spacing.sm,
    alignItems: 'flex-start',
  },
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
  expandedTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  allSpecialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
