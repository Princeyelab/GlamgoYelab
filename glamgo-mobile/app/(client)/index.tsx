/**
 * Home Screen - GlamGo Mobile
 * Ecran d'accueil avec recherche, notifications et services populaires
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import ServiceCard from '../../src/components/features/ServiceCard';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import { selectUser } from '../../src/lib/store/slices/authSlice';
import {
  selectServices,
  selectFavorites,
  selectCategories,
  toggleFavorite,
} from '../../src/lib/store/slices/servicesSlice';

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const services = useAppSelector(selectServices);
  const favorites = useAppSelector(selectFavorites);
  const categories = useAppSelector(selectCategories);

  // Services populaires (premiers 4)
  const popularServices = services.slice(0, 4);

  // Categories principales
  const mainCategories = [
    { id: 1, name: 'Coiffure', icon: '💇' },
    { id: 2, name: 'Massage', icon: '💆' },
    { id: 3, name: 'Manucure', icon: '💅' },
    { id: 4, name: 'Maquillage', icon: '💄' },
  ];

  const handleSearchPress = () => {
    router.push('/search');
  };

  const handleNotificationsPress = () => {
    router.push('/notifications');
  };

  const handleServicePress = (serviceId: number | string) => {
    router.push(`/services/${serviceId}` as any);
  };

  const handleFavoriteToggle = (serviceId: number | string) => {
    dispatch(toggleFavorite(Number(serviceId)));
  };

  const handleCategoryPress = (categoryName: string) => {
    router.push(`/search?q=${categoryName}` as any);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              Bonjour{user ? `, ${user.first_name || user.name?.split(' ')[0] || ''}` : ''} 👋
            </Text>
            <Text style={styles.subtitle}>
              Que recherchez-vous aujourd'hui ?
            </Text>
          </View>

          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationsPress}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={handleSearchPress}
          activeOpacity={0.8}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>
            Rechercher un service...
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesGrid}>
          {mainCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category.name)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Popular Services */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Services populaires</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/services')}>
            <Text style={styles.seeAll}>Voir tout →</Text>
          </TouchableOpacity>
        </View>

        {popularServices.length > 0 ? (
          <View style={styles.servicesList}>
            {popularServices.map((service) => (
              <View key={service.id} style={styles.serviceItem}>
                <ServiceCard
                  id={service.id}
                  title={service.title}
                  description={service.description}
                  images={service.images}
                  thumbnail={service.thumbnail}
                  price={service.price}
                  currency={service.currency}
                  rating={service.rating}
                  reviews_count={service.reviews_count}
                  duration_minutes={service.duration_minutes}
                  category={service.category || { id: 0, name: 'Service' }}
                  provider={service.provider || { id: 0, name: 'Prestataire' }}
                  is_featured={service.is_featured}
                  isFavorite={favorites.includes(Number(service.id))}
                  onPress={() => handleServicePress(service.id)}
                  onFavoritePress={() => handleFavoriteToggle(service.id)}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyServices}>
            <Text style={styles.emptyText}>Chargement des services...</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acces rapide</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/bookings')}
          >
            <Text style={styles.quickActionIcon}>📅</Text>
            <Text style={styles.quickActionText}>Mes reservations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/favorites')}
          >
            <Text style={styles.quickActionIcon}>❤️</Text>
            <Text style={styles.quickActionText}>Mes favoris</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.quickActionIcon}>👤</Text>
            <Text style={styles.quickActionText}>Mon profil</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Spacer for tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },

  // Header
  header: {
    backgroundColor: colors.white,
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    ...shadows.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 22,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: typography.fontSize.base,
    color: colors.gray[400],
  },

  // Section
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },

  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '23%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  categoryName: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[700],
    fontWeight: '500',
  },

  // Services
  servicesList: {
    marginTop: -spacing.md,
  },
  serviceItem: {
    marginBottom: spacing.md,
  },
  emptyServices: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '31%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  quickActionText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[700],
    fontWeight: '500',
    textAlign: 'center',
  },
});
