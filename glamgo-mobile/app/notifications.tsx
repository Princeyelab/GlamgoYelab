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
import { selectUser, selectUserRole } from '../src/lib/store/slices/authSlice';
import apiClient from '../src/lib/api/client';
import { ENDPOINTS } from '../src/lib/api/endpoints';

// Types
type NotificationType = 'booking' | 'promo' | 'system' | 'review' | 'reminder' | 'new_order' | 'order_accepted' | 'order_completed' | 'provider_cancelled';

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: {
    booking_id?: number;
    order_id?: number;
    service_id?: number;
    provider_id?: number;
    promo_code?: string;
  };
}

// Mapper les types de notification DB vers les types d'icones
const getNotificationType = (dbType: string): NotificationType => {
  if (dbType.includes('order') || dbType.includes('booking')) return 'booking';
  if (dbType.includes('promo')) return 'promo';
  if (dbType.includes('review')) return 'review';
  if (dbType.includes('reminder')) return 'reminder';
  return 'system';
};


export default function NotificationsScreen() {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const userRole = useAppSelector(selectUserRole);
  const isProvider = userRole === 'provider';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [isProvider]);

  const loadNotifications = async () => {
    try {
      // Utiliser le bon endpoint selon le role (provider ou client)
      const endpoint = isProvider
        ? ENDPOINTS.PROVIDER.NOTIFICATIONS
        : ENDPOINTS.NOTIFICATIONS.LIST;

      console.log('[Notifications] Loading from:', endpoint, 'isProvider:', isProvider);

      const response = await apiClient.get(endpoint);
      console.log('[Notifications] Raw response:', JSON.stringify(response.data, null, 2));

      // L'API retourne { success: true, data: { notifications: [...], unread_count: X } }
      const rawData = response.data?.data?.notifications
        || response.data?.notifications
        || response.data?.data
        || response.data
        || [];

      // S'assurer que c'est un tableau
      const data = Array.isArray(rawData) ? rawData : [];

      console.log('[Notifications] Parsed:', data.length, 'notifications');

      // Transformer les données API au format attendu
      // La DB utilise notification_type, pas type
      // Le champ data peut etre une string JSON ou deja parse
      const notifications = data.map((n: any) => {
        let parsedData = {};
        if (n.data) {
          try {
            parsedData = typeof n.data === 'string' ? JSON.parse(n.data) : n.data;
          } catch (e) {
            parsedData = {};
          }
        }

        const rawType = n.notification_type || n.type || 'system';
        return {
          id: n.id,
          type: getNotificationType(rawType),
          title: n.title || 'Notification',
          message: n.message || n.body || n.content || '',
          is_read: n.is_read === true || n.is_read === 1 || !!n.read_at,
          created_at: n.created_at,
          data: parsedData,
        };
      });

      console.log('[Notifications] Mapped notifications:', notifications);
      setNotifications(notifications);
    } catch (error) {
      console.log('[Notifications] Error loading:', error);
      // Pas de notifications ou erreur API
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Marquer comme lu via l'API
    if (!notification.is_read) {
      try {
        const endpoint = isProvider
          ? ENDPOINTS.PROVIDER.MARK_NOTIFICATION_READ(notification.id)
          : ENDPOINTS.NOTIFICATIONS.MARK_READ(notification.id);

        await apiClient.patch(endpoint);
      } catch (error) {
        console.log('[Notifications] Error marking as read:', error);
      }
    }

    // Mettre a jour l'etat local
    setNotifications(prev =>
      prev.map(n =>
        n.id === notification.id ? { ...n, is_read: true } : n
      )
    );

    // Navigation selon le type
    // order_id ou booking_id peuvent etre utilises
    const orderId = notification.data?.order_id || notification.data?.booking_id;

    switch (notification.type) {
      case 'booking':
      case 'reminder':
        if (orderId) {
          // Naviguer vers la bonne route selon le role
          if (isProvider) {
            router.push(`/(provider)/booking/journey/${orderId}` as any);
          } else {
            // Client: aller vers le suivi de commande
            router.push(`/booking/track/${orderId}` as any);
          }
        }
        break;
      case 'review':
        if (orderId) {
          // Aller vers la page d'avis
          router.push(`/booking/review/${orderId}` as any);
        }
        break;
      case 'satisfaction_received':
        // Prestataire a recu une evaluation - aller vers ses gains ou bookings
        if (isProvider) {
          router.push('/(provider)/earnings' as any);
        } else if (orderId) {
          router.push(`/booking/track/${orderId}` as any);
        }
        break;
      case 'promo':
        router.push('/(client)/services' as any);
        break;
      default:
        // Pour les autres types, navigation selon le role
        if (orderId) {
          if (isProvider) {
            router.push(`/(provider)/booking/journey/${orderId}` as any);
          } else {
            router.push(`/booking/track/${orderId}` as any);
          }
        }
        break;
    }
  };

  const markAllAsRead = async () => {
    try {
      // Appeler le bon endpoint selon le role
      const endpoint = isProvider
        ? ENDPOINTS.PROVIDER.MARK_ALL_NOTIFICATIONS_READ
        : ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ;

      await apiClient.patch(endpoint);
    } catch (error) {
      console.log('[Notifications] Error marking all as read:', error);
    }

    // Mettre a jour l'etat local
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
