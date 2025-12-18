/**
 * Search Results Screen - GlamGo Mobile
 * Affiche les resultats de recherche pour services et prestataires
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ServiceCard from '../src/components/features/ServiceCard';
import Loading from '../src/components/ui/Loading';
import { colors, spacing, typography, borderRadius, shadows } from '../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../src/lib/store/hooks';
import {
  selectServices,
  selectFavorites,
  toggleFavorite,
} from '../src/lib/store/slices/servicesSlice';
import { Service } from '../src/types/service';

type FilterType = 'all' | 'services' | 'providers';
type SortType = 'relevance' | 'price_low' | 'price_high' | 'rating';

export default function SearchResultsScreen() {
  const { q } = useLocalSearchParams<{ q: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const services = useAppSelector(selectServices);
  const favorites = useAppSelector(selectFavorites);

  const [searchQuery, setSearchQuery] = useState(q || '');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('relevance');
  const [isLoading, setIsLoading] = useState(false);

  // Filtrer et trier les resultats
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();

    let results = services.filter(
      (service) =>
        service.title?.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.category?.name?.toLowerCase().includes(query) ||
        service.provider?.name?.toLowerCase().includes(query)
    );

    // Tri
    switch (sort) {
      case 'price_low':
        results = [...results].sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        results = [...results].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        // relevance - garder l'ordre original
        break;
    }

    return results;
  }, [searchQuery, services, sort]);

  const handleSearch = () => {
    Keyboard.dismiss();
    // La recherche est reactive via useMemo
  };

  const handleServicePress = (serviceId: number | string) => {
    router.push(`/services/${serviceId}` as any);
  };

  const handleFavoriteToggle = (serviceId: number | string) => {
    dispatch(toggleFavorite(Number(serviceId)));
  };

  const renderService = ({ item }: { item: Service }) => (
    <ServiceCard
      id={item.id}
      title={item.title}
      description={item.description}
      images={item.images}
      thumbnail={item.thumbnail}
      price={item.price}
      currency={item.currency}
      rating={item.rating}
      reviews_count={item.reviews_count}
      duration_minutes={item.duration_minutes}
      category={item.category || { id: 0, name: 'Service' }}
      provider={item.provider || { id: 0, name: 'Prestataire' }}
      is_featured={item.is_featured}
      isFavorite={favorites.includes(Number(item.id))}
      onPress={() => handleServicePress(item.id)}
      onFavoritePress={() => handleFavoriteToggle(item.id)}
    />
  );

  const renderHeader = () => (
    <View>
      {/* Search Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {searchResults.length} resultat{searchResults.length !== 1 ? 's' : ''} pour "{searchQuery}"
        </Text>
      </View>

      {/* Sort Options */}
      <View style={styles.sortBar}>
        <Text style={styles.sortLabel}>Trier par:</Text>
        <View style={styles.sortOptions}>
          <TouchableOpacity
            style={[styles.sortOption, sort === 'relevance' && styles.sortOptionActive]}
            onPress={() => setSort('relevance')}
          >
            <Text style={[styles.sortOptionText, sort === 'relevance' && styles.sortOptionTextActive]}>
              Pertinence
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sort === 'price_low' && styles.sortOptionActive]}
            onPress={() => setSort('price_low')}
          >
            <Text style={[styles.sortOptionText, sort === 'price_low' && styles.sortOptionTextActive]}>
              Prix ↑
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sort === 'price_high' && styles.sortOptionActive]}
            onPress={() => setSort('price_high')}
          >
            <Text style={[styles.sortOptionText, sort === 'price_high' && styles.sortOptionTextActive]}>
              Prix ↓
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sort === 'rating' && styles.sortOptionActive]}
            onPress={() => setSort('rating')}
          >
            <Text style={[styles.sortOptionText, sort === 'rating' && styles.sortOptionTextActive]}>
              Note
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>Aucun resultat</Text>
      <Text style={styles.emptyText}>
        {searchQuery.trim()
          ? `Aucun service trouve pour "${searchQuery}"`
          : 'Entrez un terme de recherche'}
      </Text>
      <TouchableOpacity
        style={styles.browseCta}
        onPress={() => router.push('/(tabs)/services')}
      >
        <Text style={styles.browseCtaText}>Parcourir tous les services</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header with Search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un service..."
            placeholderTextColor={colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus={!q}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {isLoading ? (
        <Loading message="Recherche en cours..." />
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderService}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={searchQuery.trim() ? renderHeader : null}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Quick Suggestions */}
      {!searchQuery.trim() && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsTitle}>Suggestions</Text>
          <View style={styles.suggestionsList}>
            {['Coiffure', 'Massage', 'Manucure', 'Maquillage', 'Epilation'].map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => setSearchQuery(suggestion)}
              >
                <Text style={styles.suggestionChipText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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
    paddingTop: 50,
    paddingHorizontal: spacing.md,
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
    marginRight: spacing.sm,
  },
  backIcon: {
    fontSize: 20,
    color: colors.gray[900],
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    height: '100%',
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.gray[500],
  },

  // Stats Bar
  statsBar: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  statsText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },

  // Sort Bar
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  sortLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginRight: spacing.sm,
  },
  sortOptions: {
    flexDirection: 'row',
    flex: 1,
  },
  sortOption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[100],
  },
  sortOptionActive: {
    backgroundColor: colors.primary,
  },
  sortOptionText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: colors.white,
  },

  // List
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  browseCta: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  browseCtaText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },

  // Suggestions
  suggestions: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  suggestionsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionChip: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  suggestionChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
});
