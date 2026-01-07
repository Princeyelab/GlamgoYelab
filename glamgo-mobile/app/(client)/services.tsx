import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ServiceCard from '../../src/components/features/ServiceCard';
import SkeletonServiceCard from '../../src/components/features/SkeletonServiceCard';
import Badge from '../../src/components/ui/Badge';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import {
  setCategories,
  toggleFavorite,
  setSelectedCategory,
  selectServices,
  selectFavorites,
  selectSelectedCategory,
  selectCategories,
  selectServicesLoading,
  fetchServices,
  fetchCategories,
} from '../../src/lib/store/slices/servicesSlice';
import { CATEGORIES } from '../../src/lib/constants/categories';
import { Service, Category } from '../../src/types/service';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { getCategoryTranslation } from '../../src/i18n/translations/services';

export default function ServicesScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const { t, isRTL, language } = useLanguage();

  // Redux state
  const services = useAppSelector(selectServices);
  const favorites = useAppSelector(selectFavorites);
  const selectedCategory = useAppSelector(selectSelectedCategory);
  const apiCategories = useAppSelector(selectCategories);

  // Local state - search query reste local pour eviter re-render
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Appliquer le filtre de categorie si passe en parametre
  useEffect(() => {
    if (categoryId) {
      dispatch(setSelectedCategory(Number(categoryId)));
    }
  }, [categoryId]);

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      // Charger depuis l'API (vrais IDs de la base de donnees)
      await dispatch(fetchServices(undefined)).unwrap();
      await dispatch(fetchCategories()).unwrap();
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadServices();
    setIsRefreshing(false);
  };

  const handleCategoryFilter = (categoryId: number) => {
    dispatch(setSelectedCategory(selectedCategory === categoryId ? null : categoryId));
  };

  const handleFavoriteToggle = (serviceId: number | string) => {
    dispatch(toggleFavorite(Number(serviceId)));
  };

  const handleServicePress = (serviceId: number | string) => {
    router.push(`/services/${serviceId}` as any);
  };

  // Filtrage avec useMemo pour performance
  const filteredServices = useMemo(() => {
    let filtered = services;

    if (selectedCategory) {
      // Inclure les services de la categorie selectionnee ET de ses sous-categories
      const subCategoryIds = apiCategories
        .filter(c => c.parent_id === selectedCategory)
        .map(c => c.id);
      const categoryIds = [selectedCategory, ...subCategoryIds];
      filtered = filtered.filter(s => categoryIds.includes(s.category_id));
    }

    if (searchText.trim()) {
      const query = searchText.toLowerCase().trim();
      filtered = filtered.filter(s =>
        s.title?.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.category?.name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [services, selectedCategory, searchText, apiCategories]);

  // Render Service Card
  const renderServiceCard = ({ item }: { item: Service }) => {
    // Trouver la vraie categorie depuis l'API
    let category = item.category;
    if (!category && item.category_id) {
      const apiCat = apiCategories.find(c => c.id === item.category_id);
      if (apiCat) {
        category = { id: apiCat.id, name: apiCat.name, color: apiCat.color };
      }
    }
    if (!category) {
      category = { id: item.category_id || 0, name: t('services.service'), color: colors.gray[500] };
    }
    const provider = item.provider || { id: 0, name: t('provider.provider') };

    // Utiliser name si title n'existe pas (compatibilite API)
    const serviceTitle = item.title || (item as any).name || t('services.service');

    return (
      <ServiceCard
        id={item.id}
        title={serviceTitle}
        description={item.description}
        category={category}
        provider={provider}
        price={item.price}
        currency={item.currency}
        images={item.images}
        thumbnail={item.thumbnail}
        rating={item.rating}
        reviews_count={item.reviews_count}
        duration_minutes={item.duration_minutes}
        is_featured={item.is_featured}
        status={item.status}
        isNew={item.isNew}
        isFavorite={favorites.includes(Number(item.id))}
        onPress={() => handleServicePress(item.id)}
        onFavoritePress={() => handleFavoriteToggle(item.id)}
      />
    );
  };

  // Render Empty State
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={[styles.emptyTitle, isRTL && styles.rtlText]}>{t('services.noServiceFound')}</Text>
      <Text style={[styles.emptyText, isRTL && styles.rtlText]}>
        {searchText
          ? t('services.noResultsFor', { query: searchText })
          : t('services.noServices')}
      </Text>
      {searchText ? (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => setSearchText('')}
        >
          <Text style={styles.clearSearchText}>{t('services.clearSearch')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  // Skeleton Loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonSubtitle} />
          <View style={styles.skeletonSearch} />
          <View style={styles.skeletonCategories}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={styles.skeletonChip} />
            ))}
          </View>
        </View>
        <View style={styles.skeletonList}>
          <SkeletonServiceCard />
          <SkeletonServiceCard />
          <SkeletonServiceCard />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* HEADER FIXE - En dehors du FlatList */}
      <View style={styles.fixedHeader}>
        {/* Title */}
        <Text style={[styles.title, isRTL && styles.rtlText]}>{t('services.glamgoServices')}</Text>
        <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
          {t('services.homeServicesCount', { count: services.length })}
        </Text>

        {/* Search Bar - State local */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, isRTL && styles.rtlText]}
            placeholder={t('home.searchPlaceholder')}
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={colors.gray[400]}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
            textAlign={isRTL ? 'right' : 'left'}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
            ]}
            onPress={() => dispatch(setSelectedCategory(null))}
          >
            <Text
              style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextActive,
              ]}
            >
              {t('services.all')} ({services.length})
            </Text>
          </TouchableOpacity>

          {CATEGORIES.map((localCat) => {
            // Trouver la categorie API correspondante par slug
            const apiCat = apiCategories.find(c => c.slug === localCat.slug);
            const apiCatId = apiCat?.id;

            // Compter services de cette categorie ET de ses sous-categories
            const subCatIds = apiCat ? apiCategories.filter(c => c.parent_id === apiCat.id).map(c => c.id) : [];
            const allCatIds = apiCatId ? [apiCatId, ...subCatIds] : [];
            const count = services.filter(s => allCatIds.includes(s.category_id)).length;

            // Utiliser l'ID de l'API pour le filtrage
            const filterCatId = apiCatId ? Number(apiCatId) : Number(localCat.id);

            return (
              <TouchableOpacity
                key={localCat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === filterCatId && styles.categoryChipActive,
                ]}
                onPress={() => handleCategoryFilter(filterCatId)}
              >
                <Text style={styles.categoryChipIcon}>{localCat.icon}</Text>
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === filterCatId && styles.categoryChipTextActive,
                  ]}
                >
                  {getCategoryTranslation(localCat.name, language)} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsText, isRTL && styles.rtlText]}>
            {filteredServices.length} {filteredServices.length !== 1 ? t('services.servicesPlural') : t('services.serviceSingular')}
            {selectedCategory ? ` ${t('services.inThisCategory')}` : ''}
          </Text>
          {favorites.length > 0 && (
            <Badge color="primary" size="sm">
              {`❤️ ${favorites.length}`}
            </Badge>
          )}
        </View>
      </View>

      {/* LISTE DES SERVICES */}
      <FlatList
        data={filteredServices}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={10}
        showsVerticalScrollIndicator={false}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },

  // Fixed Header
  fixedHeader: {
    backgroundColor: colors.white,
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    paddingVertical: 4,
  },
  searchClear: {
    fontSize: 18,
    color: colors.gray[400],
    paddingLeft: spacing.sm,
  },

  // Categories
  categoriesScroll: {
    marginBottom: spacing.sm,
    marginHorizontal: -spacing.lg,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: colors.white,
  },

  // Results
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },

  // List
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.lg,
  },
  clearSearchButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  clearSearchText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },

  // Skeleton
  skeletonHeader: {
    padding: spacing.lg,
    paddingTop: 60,
    backgroundColor: colors.white,
  },
  skeletonTitle: {
    width: 200,
    height: 28,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  skeletonSubtitle: {
    width: 280,
    height: 16,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
  },
  skeletonSearch: {
    height: 44,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  skeletonCategories: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  skeletonChip: {
    width: 90,
    height: 32,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  skeletonList: {
    padding: spacing.lg,
  },
  // RTL support
  rtlText: {
    textAlign: 'right',
  },
});
