/**
 * Provider Profile - GlamGo Mobile
 * Profil du prestataire avec switch vers mode client
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
import Button from '../../src/components/ui/Button';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import { selectUser, logoutUser, switchRole } from '../../src/lib/store/slices/authSlice';
import { hapticFeedback } from '../../src/lib/utils/haptics';

const DEMO_PROVIDER_STATS = {
  rating: 4.8,
  reviews: 47,
  completedBookings: 156,
  responseRate: 98,
  memberSince: '2023',
};

const DEMO_SERVICES = [
  { id: 1, name: 'Coiffure à domicile', price: 250, duration: 60 },
  { id: 2, name: 'Maquillage', price: 200, duration: 45 },
  { id: 3, name: 'Maquillage mariage', price: 500, duration: 120 },
  { id: 4, name: 'Manucure', price: 150, duration: 45 },
];

export default function ProviderProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const handleSwitchToClient = () => {
    hapticFeedback.medium();
    Alert.alert(
      'Changer de mode',
      'Voulez-vous passer en mode Client ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
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
      'Voulez-vous vraiment vous déconnecter ?',
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

  const handleEditProfile = () => {
    hapticFeedback.light();
    Alert.alert('Info', 'Modification du profil - à venir');
  };

  const handleManageServices = () => {
    hapticFeedback.light();
    Alert.alert('Info', 'Gestion des services - à venir');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {(user?.first_name || user?.name || 'P').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.name}>
          {user?.first_name && user?.last_name
            ? `${user.first_name} ${user.last_name}`
            : user?.name || 'Prestataire'}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Prestataire vérifié</Text>
        </View>
      </View>

      {/* Stats */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>⭐ {DEMO_PROVIDER_STATS.rating}</Text>
            <Text style={styles.statLabel}>{DEMO_PROVIDER_STATS.reviews} avis</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{DEMO_PROVIDER_STATS.completedBookings}</Text>
            <Text style={styles.statLabel}>Réservations</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{DEMO_PROVIDER_STATS.responseRate}%</Text>
            <Text style={styles.statLabel}>Réponse</Text>
          </View>
        </View>
      </Card>

      {/* Services */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes services</Text>
          <TouchableOpacity onPress={handleManageServices}>
            <Text style={styles.editLink}>Modifier</Text>
          </TouchableOpacity>
        </View>
        <Card>
          {DEMO_SERVICES.map((service, index) => (
            <View
              key={service.id}
              style={[
                styles.serviceRow,
                index < DEMO_SERVICES.length - 1 && styles.serviceRowBorder,
              ]}
            >
              <View>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDuration}>{service.duration} min</Text>
              </View>
              <Text style={styles.servicePrice}>{service.price} DH</Text>
            </View>
          ))}
        </Card>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>

        <Button
          variant="outline"
          fullWidth
          onPress={handleEditProfile}
          style={styles.actionButton}
        >
          Modifier mon profil
        </Button>

        <Button
          variant="outline"
          fullWidth
          onPress={() => {
            hapticFeedback.light();
            router.push('/settings');
          }}
          style={styles.actionButton}
        >
          ⚙️ Paramètres de l'application
        </Button>
      </View>

      {/* Switch Mode */}
      <View style={styles.section}>
        <Card style={styles.switchCard}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchTitle}>Mode Client</Text>
            <Text style={styles.switchDescription}>
              Accédez à l'application en tant que client pour réserver des services
            </Text>
          </View>
          <Button
            variant="secondary"
            size="sm"
            onPress={handleSwitchToClient}
          >
            Changer
          </Button>
        </Card>
      </View>

      {/* Logout */}
      <Button
        variant="ghost"
        fullWidth
        onPress={handleLogout}
        style={styles.logoutButton}
        textStyle={styles.logoutText}
      >
        Se déconnecter
      </Button>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>GlamGo Pro</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.memberSince}>
          Membre depuis {DEMO_PROVIDER_STATS.memberSince}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    padding: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing['3xl'],
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
  },
  name: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: '600',
  },

  // Stats
  statsCard: {
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 4,
  },

  // Section
  section: {
    marginBottom: spacing.xl,
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
  },
  editLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },

  // Services
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  serviceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    fontWeight: '500',
  },
  serviceDuration: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  servicePrice: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: '600',
  },

  // Actions
  actionButton: {
    marginBottom: spacing.sm,
  },

  // Switch Card
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.gray[100],
  },
  switchInfo: {
    flex: 1,
    marginRight: spacing.md,
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
  },

  // Logout
  logoutButton: {
    marginBottom: spacing.xl,
  },
  logoutText: {
    color: colors.error,
  },

  // App Info
  appInfo: {
    alignItems: 'center',
  },
  appName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  appVersion: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  memberSince: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    marginTop: 4,
  },
});
