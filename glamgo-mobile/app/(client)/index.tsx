/**
 * Home Screen - GlamGo Mobile
 * Ecran d'accueil avec recherche, notifications et services populaires
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import ServiceCard from '../../src/components/features/ServiceCard';
import CurrencySelector from '../../src/components/features/CurrencySelector';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import { selectUser } from '../../src/lib/store/slices/authSlice';
import {
  selectServices,
  selectFavorites,
  selectCategories,
  toggleFavorite,
  fetchServices,
  fetchCategories,
} from '../../src/lib/store/slices/servicesSlice';
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../../src/lib/constants/categories';
import apiClient from '../../src/lib/api/client';
import { ENDPOINTS } from '../../src/lib/api/endpoints';

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const services = useAppSelector(selectServices);
  const favorites = useAppSelector(selectFavorites);
  const categories = useAppSelector(selectCategories);

  // Notifications non lues
  const [unreadCount, setUnreadCount] = useState(0);

  // Messages non lus
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeOrderWithMessages, setActiveOrderWithMessages] = useState<number | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  // Charger les services et categories au montage
  useEffect(() => {
    if (services.length === 0) {
      dispatch(fetchServices(undefined));
    }
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, []);

  // Fonction pour charger le nombre de notifications non lues
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      // Essayer d'abord l'endpoint unread-count
      const response = await apiClient.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      // Format: { success: true, data: { count: X } }
      const count = response.data?.data?.count ?? response.data?.count ?? 0;
      setUnreadCount(count);
    } catch (error) {
      // Si l'endpoint n'existe pas, récupérer la liste et compter
      try {
        const listResponse = await apiClient.get(ENDPOINTS.NOTIFICATIONS.LIST);
        // Format: { success: true, data: { notifications: [...], unread_count: X } }
        const data = listResponse.data?.data || listResponse.data || {};
        const unread = data.unread_count ??
          (data.notifications || []).filter((n: any) => !n.read_at && !n.is_read).length;
        setUnreadCount(unread);
      } catch {
        // Pas de notifications pour ce nouvel utilisateur
        setUnreadCount(0);
      }
    }
  }, [user]);

  // Compter les messages non lus du prestataire
  const fetchUnreadMessages = useCallback(async () => {
    if (!user) return;

    // Ignorer pendant 10 secondes apres avoir clique sur le bouton (temps de lire les messages)
    const timeSinceClick = Date.now() - lastClickTimeRef.current;
    if (timeSinceClick < 10000) {
      return;
    }

    try {
      // Recuperer TOUTES les commandes (y compris completees pour les messages non lus)
      const ordersResponse = await apiClient.get(ENDPOINTS.BOOKINGS.LIST);
      const orders = ordersResponse.data?.data || [];
      // Inclure aussi les commandes completees qui peuvent avoir des messages non lus
      const ordersWithChat = orders.filter((o: any) =>
        ['pending', 'accepted', 'confirmed', 'on_way', 'arrived', 'in_progress', 'completed'].includes(o.status)
      );

      // Trouver l'ordre qui a vraiment des messages non lus
      let orderWithUnread: number | null = null;
      for (const order of ordersWithChat) {
        try {
          const chatStatus = await apiClient.get(`/api/orders/${order.id}/chat-status`);
          const unreadCount = chatStatus.data?.data?.unread_count ?? 0;
          if (unreadCount > 0) {
            orderWithUnread = order.id;
            break; // Prendre le premier ordre avec messages non lus
          }
        } catch (e) {
          // Ignorer les erreurs pour cet ordre
        }
      }

      setActiveOrderWithMessages(orderWithUnread || (ordersWithChat.length > 0 ? ordersWithChat[0].id : null));

      // Utiliser l'endpoint unread-count global
      const response = await apiClient.get('/api/chat/unread-count');
      const count = response.data?.data?.unread_count ?? 0;
      setUnreadMessages(count);
    } catch (error) {
      // Silently ignore errors
    }
  }, [user]);

  // Rafraichir les badges quand l'ecran devient actif
  useFocusEffect(
    useCallback(() => {
      // Reinitialiser le blocage quand on revient sur l'ecran (retour du chat)
      lastClickTimeRef.current = 0;

      fetchUnreadCount();
      fetchUnreadMessages();

      // Polling toutes les 10 secondes
      const interval = setInterval(() => {
        fetchUnreadCount();
        fetchUnreadMessages();
      }, 10000);

      return () => clearInterval(interval);
    }, [fetchUnreadCount, fetchUnreadMessages])
  );

  // Ouvrir le chat
  const handleMessagesPress = () => {
    if (activeOrderWithMessages) {
      // Bloquer les fetches pendant 10 secondes pour laisser le temps de marquer comme lu
      lastClickTimeRef.current = Date.now();
      const orderId = activeOrderWithMessages;
      router.push(`/chat/${orderId}` as any);
    } else {
      // Aller vers les reservations si pas de message
      router.push('/(client)/bookings');
    }
  };

  // Services populaires (premiers 4)
  const popularServices = services.slice(0, 4);

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

  const handleCategoryPress = (categorySlug: string) => {
    // Trouver l'ID de la categorie API par slug
    const apiCat = categories.find(c => c.slug === categorySlug);
    if (apiCat) {
      // Naviguer vers services avec le filtre de categorie
      router.push({
        pathname: '/(client)/services',
        params: { categoryId: String(apiCat.id) }
      } as any);
    } else {
      // Fallback: recherche par nom
      router.push(`/search?q=${categorySlug}` as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header Sticky */}
      <View style={styles.stickyHeader}>
        <View style={styles.headerTop}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting} numberOfLines={1}>
              Bonjour{user ? `, ${user.first_name || user.name?.split(' ')[0] || ''}` : ''} 👋
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Que recherchez-vous ?
            </Text>
          </View>

          {/* Header Actions */}
          <View style={styles.headerActions}>
            {/* Currency Selector */}
            <CurrencySelector />

            {/* Message Button */}
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleMessagesPress}
            >
              <Text style={styles.notificationIcon}>💬</Text>
              {unreadMessages > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadMessages}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Notification Bell */}
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleNotificationsPress}
            >
              <Text style={styles.notificationIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
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

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Categories - UI locale mappee avec API */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((localCat) => {
            // Trouver la categorie API correspondante par slug
            const apiCat = categories.find(c => c.slug === localCat.slug);
            // Utiliser l'ID de l'API si disponible, sinon l'ID local
            const categoryId = apiCat?.id || localCat.id;

            return (
              <TouchableOpacity
                key={localCat.id}
                style={[
                  styles.categoryCard,
                  {
                    borderColor: localCat.color + '25',
                    backgroundColor: localCat.color + '08',
                  }
                ]}
                onPress={() => handleCategoryPress(localCat.slug || localCat.name.toLowerCase())}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: localCat.color + '20' }]}>
                  <Text style={styles.categoryIcon}>{localCat.icon}</Text>
                </View>
                <Text style={[styles.categoryName, { color: localCat.color }]}>{localCat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Popular Services */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Services populaires</Text>
          <TouchableOpacity onPress={() => router.push('/(client)/services')}>
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
            onPress={() => router.push('/(client)/bookings')}
          >
            <View style={styles.quickActionIconContainer}>
              <Text style={styles.quickActionEmoji}>📅</Text>
            </View>
            <Text style={styles.quickActionText}>Mes reservations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(client)/favorites')}
          >
            <View style={styles.quickActionIconContainer}>
              <Text style={styles.quickActionEmoji}>❤️</Text>
            </View>
            <Text style={styles.quickActionText}>Mes favoris</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(client)/profile')}
          >
            <View style={styles.quickActionIconContainer}>
              <Text style={styles.quickActionEmoji}>👤</Text>
            </View>
            <Text style={styles.quickActionText}>Mon profil</Text>
          </TouchableOpacity>
        </View>
      </View>

        {/* Spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },

  // Header Sticky
  stickyHeader: {
    backgroundColor: colors.white,
    paddingTop: Platform.OS === 'android' ? spacing.sm : spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    ...shadows.md,
    zIndex: 100,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greetingContainer: {
    flex: 1,
    marginRight: spacing.sm,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  notificationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  notificationIcon: {
    fontSize: 16,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: colors.white,
    fontSize: 12,
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
  categoriesScroll: {
    paddingRight: spacing.lg,
    gap: spacing.sm,
  },
  categoryCard: {
    width: 80,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[100],
    marginRight: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[800],
    fontWeight: '600',
    textAlign: 'center',
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
    gap: spacing.sm,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[100],
    ...shadows.sm,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[700],
    fontWeight: '600',
    textAlign: 'center',
  },
});
