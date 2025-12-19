/**
 * Provider Profile - GlamGo Mobile
 * Profil complet du prestataire avec stats, services et switch mode
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import { selectUser, logoutUser, switchRole } from '../../src/lib/store/slices/authSlice';
import { hapticFeedback } from '../../src/lib/utils/haptics';

const MOCK_PROVIDER_STATS = {
  rating: 4.8,
  reviews_count: 156,
  services_count: 8,
  completed_bookings: 523,
  earnings_total: 142500,
  completion_rate: 96,
  response_time: '< 5 min',
  is_verified: true,
  joined_date: '2023-06-15',
};

const MOCK_SERVICES = [
  { id: 1, title: 'Coupe Femme', price: 150, bookings: 245, active: true },
  { id: 2, title: 'Coupe Homme', price: 80, bookings: 156, active: true },
  { id: 3, title: 'Brushing', price: 100, bookings: 89, active: true },
  { id: 4, title: 'Coloration', price: 250, bookings: 33, active: false },
];

export default function ProviderProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const handleSwitchToClient = () => {
    hapticFeedback.medium();
    Alert.alert(
      'Passer en mode Client',
      'Basculer vers l\'interface client ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Passer en mode Client',
          onPress: () => {
            dispatch(switchRole('user'));
            router.replace('/(client)');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    hapticFeedback.warning();
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logoutUser());
            router.replace('/welcome');
          },
        },
      ]
    );
  };

  const handleManageServices = () => {
    hapticFeedback.light();
    router.push('/(provider)/services' as any);
  };

  const handleEditProfile = () => {
    hapticFeedback.light();
    Alert.alert('Info', 'Modification du profil - à venir');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header with Avatar */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {(user?.first_name || user?.name || 'P').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {MOCK_PROVIDER_STATS.is_verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>
          {user?.first_name && user?.last_name
            ? `${user.first_name} ${user.last_name}`
            : user?.name || 'Prestataire'}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>

        {/* Header Stats */}
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>⭐ {MOCK_PROVIDER_STATS.rating}</Text>
            <Text style={styles.headerStatLabel}>{MOCK_PROVIDER_STATS.reviews_count} avis</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{MOCK_PROVIDER_STATS.completed_bookings}</Text>
            <Text style={styles.headerStatLabel}>Services complétés</Text>
          </View>
        </View>
      </View>

      {/* Performance Card */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Performance</Text>

        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>Taux de complétion</Text>
          <View style={styles.performanceValueContainer}>
            <Text style={styles.performanceValue}>{MOCK_PROVIDER_STATS.completion_rate}%</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${MOCK_PROVIDER_STATS.completion_rate}%` },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>Temps de réponse</Text>
          <Text style={styles.performanceValue}>{MOCK_PROVIDER_STATS.response_time}</Text>
        </View>

        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>Services actifs</Text>
          <Text style={styles.performanceValue}>
            {MOCK_SERVICES.filter(s => s.active).length}/{MOCK_SERVICES.length}
          </Text>
        </View>

        <View style={[styles.performanceRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.performanceLabel}>Membre depuis</Text>
          <Text style={styles.performanceValue}>
            {new Date(MOCK_PROVIDER_STATS.joined_date).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>
      </Card>

      {/* Services */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes Services</Text>
          <TouchableOpacity onPress={handleManageServices}>
            <Text style={styles.manageLink}>Gérer →</Text>
          </TouchableOpacity>
        </View>

        {MOCK_SERVICES.map((service, index) => (
          <View
            key={service.id}
            style={[
              styles.serviceRow,
              index === MOCK_SERVICES.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.title}</Text>
              <Text style={styles.serviceBookings}>{service.bookings} réservations</Text>
            </View>
            <Text style={styles.servicePrice}>{service.price} DH</Text>
            <Badge variant={service.active ? 'success' : 'default'} size="sm">
              {service.active ? 'Actif' : 'Inactif'}
            </Badge>
          </View>
        ))}
      </Card>

      {/* Earnings Summary */}
      <Card style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>Revenus totaux</Text>
        <Text style={styles.earningsTotal}>
          {MOCK_PROVIDER_STATS.earnings_total.toLocaleString()} DH
        </Text>
        <Text style={styles.earningsSubtext}>Depuis le début de votre activité</Text>
        <TouchableOpacity
          style={styles.earningsButton}
          onPress={() => router.push('/(provider)/earnings' as any)}
        >
          <Text style={styles.earningsButtonText}>Voir les détails →</Text>
        </TouchableOpacity>
      </Card>

      {/* Switch Role */}
      <Card style={styles.switchCard}>
        <View style={styles.switchIcon}>
          <Text style={styles.switchIconText}>🔄</Text>
        </View>
        <View style={styles.switchInfo}>
          <Text style={styles.switchTitle}>Mode Client</Text>
          <Text style={styles.switchDescription}>
            Basculer vers l'interface client pour réserver des services
          </Text>
        </View>
        <Button variant="outline" size="sm" onPress={handleSwitchToClient}>
          Changer
        </Button>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={handleEditProfile}>
          <Text style={styles.quickActionIcon}>✏️</Text>
          <Text style={styles.quickActionText}>Modifier profil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => {
            hapticFeedback.light();
            router.push('/settings' as any);
          }}
        >
          <Text style={styles.quickActionIcon}>⚙️</Text>
          <Text style={styles.quickActionText}>Paramètres</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => {
            hapticFeedback.light();
            Alert.alert('Aide', 'Support à venir');
          }}
        >
          <Text style={styles.quickActionIcon}>❓</Text>
          <Text style={styles.quickActionText}>Aide</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <Button
        variant="ghost"
        fullWidth
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
      </Button>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Mode Prestataire • GlamGo v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.white,
    ...shadows.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  verifiedIcon: {
    fontSize: 16,
    color: colors.white,
    fontWeight: 'bold',
  },
  name: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  email: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginBottom: spacing.lg,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  headerStat: {
    alignItems: 'center',
  },
  headerStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
  },
  headerStatValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  headerStatLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
  },

  // Cards
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  manageLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },

  // Performance
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  performanceLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  performanceValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  performanceValueContainer: {
    alignItems: 'flex-end',
  },
  progressBar: {
    width: 80,
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },

  // Services
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: spacing.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  serviceBookings: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  servicePrice: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Earnings Card
  earningsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.primary + '08',
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  earningsLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  earningsTotal: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  earningsSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.md,
  },
  earningsButton: {
    paddingVertical: spacing.xs,
  },
  earningsButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },

  // Switch Card
  switchCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchIconText: {
    fontSize: 24,
  },
  switchInfo: {
    flex: 1,
  },
  switchTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 18,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  quickActionText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    fontWeight: '500',
  },

  // Logout
  logoutButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  logoutText: {
    color: colors.error,
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },

  // App Info
  appInfo: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  appVersion: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
  },
});
