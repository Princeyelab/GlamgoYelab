/**
 * Notifications Screen - GlamGo Mobile
 * Affiche toutes les notifications de l'utilisateur
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../src/components/ui/Card';
import Loading from '../src/components/ui/Loading';
import { colors, spacing, typography, borderRadius, shadows } from '../src/lib/constants/theme';
import { useAppSelector } from '../src/lib/store/hooks';
import { selectUser } from '../src/lib/store/slices/authSlice';

// Types
interface Notification {
  id: number;
  type: 'booking' | 'promo' | 'system' | 'review' | 'reminder';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: {
    booking_id?: number;
    service_id?: number;
    provider_id?: number;
    promo_code?: string;
  };
}

// Donnees demo
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: 'booking',
    title: 'Reservation confirmee',
    message: 'Votre reservation pour "Coupe femme" a ete confirmee pour demain a 14h30.',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    data: { booking_id: 123 },
  },
  {
    id: 2,
    type: 'promo',
    title: '🎉 Offre speciale !',
    message: 'Profitez de -20% sur votre prochaine reservation avec le code GLAMGO20.',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    data: { promo_code: 'GLAMGO20' },
  },
  {
    id: 3,
    type: 'reminder',
    title: 'Rappel de reservation',
    message: 'N\'oubliez pas votre rendez-vous demain a 10h00 pour "Massage relaxant".',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    data: { booking_id: 122 },
  },
  {
    id: 4,
    type: 'review',
    title: 'Donnez votre avis',
    message: 'Comment s\'est passe votre rendez-vous avec Sarah Beaute ? Partagez votre experience.',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    data: { booking_id: 121, provider_id: 5 },
  },
  {
    id: 5,
    type: 'system',
    title: 'Mise a jour de l\'application',
    message: 'Une nouvelle version de GlamGo est disponible avec de nouvelles fonctionnalites.',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const user = useAppSelector(selectUser);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // En production, appeler l'API
      // Pour l'instant, utiliser les donnees demo
      await new Promise(resolve => setTimeout(resolve, 500));
      setNotifications(DEMO_NOTIFICATIONS);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: Notification) => {
    // Marquer comme lu
    setNotifications(prev =>
      prev.map(n =>
        n.id === notification.id ? { ...n, is_read: true } : n
      )
    );

    // Navigation selon le type
    switch (notification.type) {
      case 'booking':
      case 'reminder':
        if (notification.data?.booking_id) {
          router.push(`/bookings/${notification.data.booking_id}` as any);
        }
        break;
      case 'review':
        if (notification.data?.booking_id) {
          router.push(`/bookings/${notification.data.booking_id}` as any);
        }
        break;
      case 'promo':
        router.push('/(tabs)/services');
        break;
      default:
        break;
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true }))
    );
  };

  const getNotificationIcon = (type: Notification['type']): string => {
    switch (type) {
      case 'booking':
        return '📅';
      case 'promo':
        return '🎁';
      case 'system':
        return '⚙️';
      case 'review':
        return '⭐';
      case 'reminder':
        return '⏰';
      default:
        return '📬';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.is_read && styles.notificationCardUnread,
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIcon}>
        <Text style={styles.notificationIconText}>
          {getNotificationIcon(item.type)}
        </Text>
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[
            styles.notificationTitle,
            !item.is_read && styles.notificationTitleUnread,
          ]}>
            {item.title}
          </Text>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>
          {formatTimeAgo(item.created_at)}
        </Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.headerStats}>
        <Text style={styles.headerStatsText}>
          {unreadCount > 0
            ? `${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''} notification${unreadCount > 1 ? 's' : ''}`
            : 'Toutes les notifications sont lues'}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>Tout marquer lu</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>Aucune notification</Text>
      <Text style={styles.emptyText}>
        Vous n'avez pas encore de notifications. Elles apparaitront ici.
      </Text>
    </View>
  );

  if (isLoading) {
    return <Loading fullScreen message="Chargement..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={notifications.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
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

  // List Header
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerStatsText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  markAllRead: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },

  // Notification Card
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  notificationCardUnread: {
    backgroundColor: colors.primary + '08',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationIconText: {
    fontSize: 22,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    color: colors.gray[900],
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
  },
  chevron: {
    fontSize: 24,
    color: colors.gray[400],
    marginLeft: spacing.sm,
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
    lineHeight: 24,
  },
});
