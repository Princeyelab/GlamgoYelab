import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import ServiceCard from '../../src/components/features/ServiceCard';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import {
  selectServices,
  selectFavorites,
  toggleFavorite,
} from '../../src/lib/store/slices/servicesSlice';
import { Service } from '../../src/types/service';

export default function FavoritesScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const services = useAppSelector(selectServices);
  const favorites = useAppSelector(selectFavorites);

  // Filter services to only show favorites
  const favoriteServices = services.filter(s => favorites.includes(Number(s.id)));

  const handleFavoriteToggle = (serviceId: number | string) => {
    dispatch(toggleFavorite(Number(serviceId)));
  };

  const handleServicePress = (serviceId: number | string) => {
    router.push(`/services/${serviceId}` as any);
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
      is_featured={item.is_featured}
      provider={item.provider || { id: 0, name: 'Prestataire' }}
      isNew={item.isNew}
      isFavorite={true}
      onPress={() => handleServicePress(item.id)}
      onFavoritePress={() => handleFavoriteToggle(item.id)}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Mes Favoris</Text>
      <Text style={styles.subtitle}>
        {favoriteServices.length} service{favoriteServices.length !== 1 ? 's' : ''} sauvegarde{favoriteServices.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>❤️</Text>
      <Text style={styles.emptyTitle}>Aucun favori</Text>
      <Text style={styles.emptyText}>
        Ajoutez des services en favoris pour les retrouver facilement ici
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => router.push('/(tabs)/services')}
        activeOpacity={0.8}
      >
        <Text style={styles.browseButtonText}>Parcourir les services</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <FlatList
        data={favoriteServices}
        renderItem={renderService}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.lg,
    paddingTop: spacing['2xl'],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  separator: {
    height: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    lineHeight: 24,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  browseButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
