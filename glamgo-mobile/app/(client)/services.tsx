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
import { useRouter } from 'expo-router';
import ServiceCard from '../../src/components/features/ServiceCard';
import SkeletonServiceCard from '../../src/components/features/SkeletonServiceCard';
import Badge from '../../src/components/ui/Badge';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import {
  setServices,
  setCategories,
  toggleFavorite,
  setSelectedCategory,
  selectServices,
  selectFavorites,
  selectSelectedCategory,
} from '../../src/lib/store/slices/servicesSlice';

// VRAIES DONNEES APP WEB
import { SERVICES } from '../../src/lib/constants/services';
import { CATEGORIES } from '../../src/lib/constants/categories';
import { Service } from '../../src/types/service';

// Test Agent
import { testAgent, TestReport } from '../../src/lib/testing/testAgent';
import TestReportModal from '../../src/components/debug/TestReportModal';
import { shouldRunAutoTests } from '../../src/lib/constants/config';

export default function ServicesScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux state
  const services = useAppSelector(selectServices);
  const favorites = useAppSelector(selectFavorites);
  const selectedCategory = useAppSelector(selectSelectedCategory);

  // Local state - search query reste local pour eviter re-render
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Test Agent state
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [showTestReport, setShowTestReport] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Load services on mount (avec tests auto)
  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    if (shouldRunAutoTests()) {
      await runTests();
    } else {
      await loadServices();
    }
  };

  const runTests = async () => {
    setIsTesting(true);
    setIsLoading(true);

    try {
      const report = await testAgent.runAllTests();
      setTestReport(report);

      if (report.failed > 0) {
        // Tests echoues - afficher rapport
        setShowTestReport(true);
      } else {
        // Tests OK - charger services
        await loadServices();
      }
    } catch (error) {
      console.error('Test error:', error);
      // En cas d'erreur, charger quand meme les donnees locales
      await loadServices();
    } finally {
      setIsTesting(false);
    }
  };

  const handleContinueAfterTests = async () => {
    setShowTestReport(false);
    await loadServices();
  };

  const handleRetryTests = async () => {
    setShowTestReport(false);
    await runTests();
  };

  const loadServices = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      dispatch(setServices(SERVICES));
      dispatch(setCategories(CATEGORIES));
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
      filtered = filtered.filter(s => s.category_id === selectedCategory);
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
  }, [services, selectedCategory, searchText]);

  // Render Service Card
  const renderServiceCard = ({ item }: { item: Service }) => {
    const category = item.category || { id: item.category_id || 0, name: 'Service', color: colors.gray[500] };
    const provider = item.provider || { id: 0, name: 'Prestataire' };

    return (
      <ServiceCard
        id={item.id}
        title={item.title}
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
      <Text style={styles.emptyTitle}>Aucun service trouve</Text>
      <Text style={styles.emptyText}>
        {searchText
          ? `Aucun resultat pour "${searchText}"`
          : 'Aucun service disponible'}
      </Text>
      {searchText ? (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => setSearchText('')}
        >
          <Text style={styles.clearSearchText}>Effacer la recherche</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  // Skeleton Loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonHeader}>
          {isTesting && (
            <View style={styles.testingBanner}>
              <Text style={styles.testingText}>🧪 Test API en cours...</Text>
            </View>
          )}
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
        <Text style={styles.title}>Services GlamGo</Text>
        <Text style={styles.subtitle}>
          {SERVICES.length} services a domicile a Marrakech
        </Text>

        {/* Search Bar - State local */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un service..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={colors.gray[400]}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
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
              Tous ({SERVICES.length})
            </Text>
          </TouchableOpacity>

          {CATEGORIES.map((category) => {
            const count = SERVICES.filter(s => s.category_id === category.id).length;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                ]}
                onPress={() => handleCategoryFilter(Number(category.id))}
              >
                <Text style={styles.categoryChipIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category.id && styles.categoryChipTextActive,
                  ]}
                >
                  {category.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
            {selectedCategory ? ' dans cette categorie' : ''}
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

      {/* Test Report Modal */}
      <TestReportModal
        visible={showTestReport}
        report={testReport}
        onClose={() => setShowTestReport(false)}
        onContinue={handleContinueAfterTests}
        onRetry={handleRetryTests}
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

  // Testing Banner
  testingBanner: {
    backgroundColor: '#EFF6FF',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  testingText: {
    color: '#1E40AF',
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
});
