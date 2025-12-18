/**
 * Reviews Screen - GlamGo Mobile
 * Affiche tous les avis d'un service avec filtres et stats
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ReviewCard from '../../src/components/features/ReviewCard';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';

// Types
interface Review {
  id: number;
  user: { id: number; name: string; avatar?: string };
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  provider_response?: {
    text: string;
    responded_at: string;
  };
  created_at: string;
}

// Mock reviews
const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    user: { id: 1, name: 'Sophie Martin', avatar: 'https://i.pravatar.cc/150?img=1' },
    rating: 5,
    comment: 'Tres satisfaite de la coupe. La coiffeuse etait professionnelle et a l\'ecoute. Je recommande vivement !',
    is_verified_purchase: true,
    helpful_count: 12,
    provider_response: {
      text: 'Merci beaucoup Sophie ! C\'etait un plaisir de vous servir.',
      responded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    user: { id: 2, name: 'Karim Bensaid', avatar: 'https://i.pravatar.cc/150?img=12' },
    rating: 4,
    comment: 'Service de qualite, ponctuel et professionnel. Petit bemol sur le prix un peu eleve.',
    is_verified_purchase: true,
    helpful_count: 5,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    user: { id: 3, name: 'Amina Idrissi', avatar: 'https://i.pravatar.cc/150?img=5' },
    rating: 5,
    comment: 'Excellente experience du debut a la fin. Resultat impeccable, merci !',
    is_verified_purchase: false,
    helpful_count: 8,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    user: { id: 4, name: 'Mohamed Alami', avatar: 'https://i.pravatar.cc/150?img=8' },
    rating: 3,
    comment: 'Service correct mais j\'ai connu mieux. Le resultat est satisfaisant sans plus.',
    is_verified_purchase: true,
    helpful_count: 2,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    user: { id: 5, name: 'Fatima Zahra', avatar: 'https://i.pravatar.cc/150?img=9' },
    rating: 5,
    comment: 'Superbe prestation ! Tres professionnelle et soignee. Je reviendrai sans hesiter.',
    is_verified_purchase: true,
    helpful_count: 15,
    provider_response: {
      text: 'Merci Fatima, au plaisir de vous revoir !',
      responded_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    },
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

type SortType = 'recent' | 'rating' | 'helpful';

export default function ReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [sortBy, setSortBy] = useState<SortType>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  // Filter and sort reviews
  const reviews = MOCK_REVIEWS
    .filter(r => filterRating === null || r.rating === filterRating)
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'rating') {
        return b.rating - a.rating;
      } else {
        return b.helpful_count - a.helpful_count;
      }
    });

  // Calculate stats
  const stats = {
    total: MOCK_REVIEWS.length,
    average: (MOCK_REVIEWS.reduce((acc, r) => acc + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1),
    distribution: {
      5: MOCK_REVIEWS.filter(r => r.rating === 5).length,
      4: MOCK_REVIEWS.filter(r => r.rating === 4).length,
      3: MOCK_REVIEWS.filter(r => r.rating === 3).length,
      2: MOCK_REVIEWS.filter(r => r.rating === 2).length,
      1: MOCK_REVIEWS.filter(r => r.rating === 1).length,
    } as Record<number, number>,
  };

  const renderHeader = () => (
    <View>
      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.averageContainer}>
          <Text style={styles.averageValue}>{stats.average}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <Text key={i} style={styles.starIcon}>
                {i <= Math.round(Number(stats.average)) ? '⭐' : '☆'}
              </Text>
            ))}
          </View>
          <Text style={styles.totalReviews}>{stats.total} avis</Text>
        </View>

        <View style={styles.distributionContainer}>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.distribution[rating];
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

            return (
              <TouchableOpacity
                key={rating}
                style={styles.distributionRow}
                onPress={() => setFilterRating(filterRating === rating ? null : rating)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.distributionLabel,
                  filterRating === rating && styles.distributionLabelActive
                ]}>
                  {rating} ⭐
                </Text>
                <View style={styles.distributionBar}>
                  <View
                    style={[
                      styles.distributionBarFill,
                      { width: `${percentage}%` },
                      filterRating === rating && styles.distributionBarFillActive,
                    ]}
                  />
                </View>
                <Text style={styles.distributionCount}>{count}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Trier par:</Text>
        <View style={styles.filterButtons}>
          {(['recent', 'rating', 'helpful'] as SortType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterButton, sortBy === type && styles.filterButtonActive]}
              onPress={() => setSortBy(type)}
            >
              <Text style={[styles.filterButtonText, sortBy === type && styles.filterButtonTextActive]}>
                {type === 'recent' ? 'Recents' : type === 'rating' ? 'Note' : 'Utiles'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Active Filter */}
      {filterRating && (
        <View style={styles.activeFilter}>
          <Text style={styles.activeFilterText}>
            Filtre: {filterRating} etoile{filterRating > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={() => setFilterRating(null)}>
            <Text style={styles.clearFilter}>✕ Effacer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results count */}
      <Text style={styles.resultsCount}>
        {reviews.length} avis affiche{reviews.length > 1 ? 's' : ''}
      </Text>
    </View>
  );

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewItem}>
      <ReviewCard
        id={item.id}
        user={item.user}
        rating={item.rating}
        comment={item.comment}
        is_verified_purchase={item.is_verified_purchase}
        helpful_count={item.helpful_count}
        provider_response={item.provider_response}
        created_at={item.created_at}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>⭐</Text>
      <Text style={styles.emptyTitle}>Aucun avis</Text>
      <Text style={styles.emptyText}>
        {filterRating
          ? `Aucun avis avec ${filterRating} etoile${filterRating > 1 ? 's' : ''}`
          : 'Soyez le premier a donner votre avis !'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Avis clients</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* List */}
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: colors.gray[900],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  headerSpacer: {
    width: 40,
  },

  // List
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  averageContainer: {
    alignItems: 'center',
    marginRight: spacing.xl,
    paddingRight: spacing.xl,
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
  },
  averageValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  starIcon: {
    fontSize: 14,
  },
  totalReviews: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 4,
  },
  distributionContainer: {
    flex: 1,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  distributionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    width: 45,
  },
  distributionLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 4,
  },
  distributionBarFillActive: {
    backgroundColor: colors.primary,
  },
  distributionCount: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    width: 25,
    textAlign: 'right',
  },

  // Filters
  filters: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginRight: spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: colors.white,
  },

  // Active Filter
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  activeFilterText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  clearFilter: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },

  // Results
  resultsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.md,
  },

  // Review Item
  reviewItem: {
    marginBottom: spacing.md,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
  },
});
