import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import { logoutUser, selectAuth, switchRole } from '../../src/lib/store/slices/authSlice';
import { hapticFeedback } from '../../src/lib/utils/haptics';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector(selectAuth);

  const handleSwitchToProvider = () => {
    hapticFeedback.medium();
    Alert.alert(
      'Mode Prestataire',
      'Voulez-vous passer en mode Prestataire pour gerer vos services ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            dispatch(switchRole('provider'));
            router.replace('/(provider)');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Deconnexion',
      'Etes-vous sur de vouloir vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Deconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logoutUser()).unwrap();
              router.replace('/welcome');
            } catch (err) {
              Alert.alert('Erreur', 'Deconnexion echouee');
            }
          },
        },
      ]
    );
  };

  // Si pas d'utilisateur connecte
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.notLoggedIn}>
          <Text style={styles.notLoggedInTitle}>Non connecte</Text>
          <Text style={styles.notLoggedInText}>
            Connectez-vous pour acceder a votre profil
          </Text>
          <Button
            variant="primary"
            onPress={() => router.push('/auth/login')}
            style={{ marginTop: spacing.lg }}
          >
            Se connecter
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header avec Avatar */}
        <View style={styles.header}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(user.first_name || user.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.name}>
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.name || 'Utilisateur'}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user.role === 'provider' ? 'Prestataire' : 'Client'}
            </Text>
          </View>
        </View>

        {/* User Info Card */}
        <Card variant="outlined" style={styles.card}>
          <Text style={styles.cardTitle}>Informations du compte</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID</Text>
            <Text style={styles.infoValue}>{user.id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          {user.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telephone</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
          )}

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{user.role}</Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            variant="outline"
            fullWidth
            onPress={() => Alert.alert('Info', 'Modifier profil - a venir')}
            style={styles.actionButton}
          >
            Modifier le profil
          </Button>

          <Button
            variant="outline"
            fullWidth
            onPress={() => router.push('/settings')}
            style={styles.actionButton}
          >
            Parametres
          </Button>
        </View>

        {/* Switch to Provider Mode */}
        <Card style={styles.switchCard}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchTitle}>Mode Prestataire</Text>
            <Text style={styles.switchDescription}>
              Devenez prestataire et proposez vos services
            </Text>
          </View>
          <Button
            variant="secondary"
            size="sm"
            onPress={handleSwitchToProvider}
          >
            Activer
          </Button>
        </Card>

        {/* Logout */}
        <Button
          variant="ghost"
          fullWidth
          onPress={handleLogout}
          loading={isLoading}
          disabled={isLoading}
          style={styles.logoutButton}
          textStyle={styles.logoutText}
        >
          Se deconnecter
        </Button>

        {/* App Version */}
        <Text style={styles.version}>GlamGo v1.0.0</Text>
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
    padding: spacing.xl,
    paddingTop: 60,
  },
  notLoggedIn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  notLoggedInTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  notLoggedInText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
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
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  card: {
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  infoLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    fontWeight: '500',
  },
  actions: {
    marginBottom: spacing.lg,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
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
  logoutButton: {
    marginBottom: spacing.xl,
  },
  logoutText: {
    color: colors.error,
  },
  version: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
  },
});
