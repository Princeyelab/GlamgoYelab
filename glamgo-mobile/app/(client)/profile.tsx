/**
 * Client Profile - GlamGo Mobile
 * Profil utilisateur avec switch vers mode prestataire
 */

import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import CurrencySelector from '../../src/components/features/CurrencySelector';
import LanguageSelector from '../../src/components/features/LanguageSelector';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import { logoutUser, selectAuth, switchRole, resetAuth } from '../../src/lib/store/slices/authSlice';
import { persistor } from '../../src/lib/store';
import { hapticFeedback } from '../../src/lib/utils/haptics';
import { useCurrency } from '../../src/contexts/CurrencyContext';
import { useLanguage } from '../../src/contexts/LanguageContext';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector(selectAuth);
  const { currencyInfo } = useCurrency();
  const { t, isRTL } = useLanguage();

  const handleSwitchToProvider = () => {
    hapticFeedback.medium();
    Alert.alert(
      t('profile.providerMode'),
      t('profile.switchToProviderMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
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
      t('auth.logout'),
      t('auth.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            // Appeler l'API logout EN PREMIER pour notifier le backend
            await dispatch(logoutUser()).unwrap();
            // Ensuite vider l'etat auth
            dispatch(resetAuth());
            // Purger et flush le stockage persistant
            await persistor.flush();
            await persistor.purge();
            // Naviguer vers login
            router.replace('/auth/login');
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
          <Text style={[styles.notLoggedInTitle, isRTL && styles.textRTL]}>{t('profile.notLoggedIn')}</Text>
          <Text style={[styles.notLoggedInText, isRTL && styles.textRTL]}>
            {t('profile.loginToAccess')}
          </Text>
          <Button
            variant="primary"
            onPress={() => router.push('/auth/login')}
            style={{ marginTop: spacing.lg }}
          >
            {t('auth.loginButton')}
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
              : user.name || t('profile.defaultUserName')}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user.role === 'provider' ? t('auth.provider') : t('auth.client')}
            </Text>
          </View>
        </View>

        {/* User Info Card */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, isRTL && styles.textRTL]}>{t('profile.accountInfo')}</Text>

          <View style={[styles.infoRow, isRTL && styles.rowRTL]}>
            <Text style={[styles.infoLabel, isRTL && styles.textRTL]}>ID</Text>
            <Text style={styles.infoValue}>{user.id}</Text>
          </View>

          <View style={[styles.infoRow, isRTL && styles.rowRTL]}>
            <Text style={[styles.infoLabel, isRTL && styles.textRTL]}>{t('auth.email')}</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          {user.phone && (
            <View style={[styles.infoRow, isRTL && styles.rowRTL]}>
              <Text style={[styles.infoLabel, isRTL && styles.textRTL]}>{t('auth.phone')}</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
          )}

          <View style={[styles.infoRow, { borderBottomWidth: 0 }, isRTL && styles.rowRTL]}>
            <Text style={[styles.infoLabel, isRTL && styles.textRTL]}>{t('profile.role')}</Text>
            <Text style={styles.infoValue}>{user.role === 'provider' ? t('auth.provider') : t('auth.client')}</Text>
          </View>
        </Card>

        {/* Preferences Card */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, isRTL && styles.textRTL]}>
            {t('profile.settings')}
          </Text>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={[styles.preferenceLabel, isRTL && styles.textRTL]}>
                {t('profile.currency')}
              </Text>
              <Text style={[styles.preferenceHint, isRTL && styles.textRTL]}>
                {currencyInfo.name}
              </Text>
            </View>
            <CurrencySelector />
          </View>

          <View style={[styles.divider, { marginVertical: spacing.md }]} />

          {/* Language Selector */}
          <LanguageSelector />
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            variant="outline"
            fullWidth
            onPress={() => router.push('/edit-profile')}
            style={styles.actionButton}
          >
            {t('profile.editProfile')}
          </Button>

          <Button
            variant="outline"
            fullWidth
            onPress={() => router.push('/settings')}
            style={styles.actionButton}
          >
            {t('profile.settings')}
          </Button>
        </View>

        {/* Switch to Provider Mode - Prominent for existing providers */}
        {user.is_provider ? (
          <Card style={[styles.providerCard, isRTL && styles.rowRTL]}>
            <View style={styles.providerIcon}>
              <Text style={styles.providerIconText}>💼</Text>
            </View>
            <View style={styles.providerInfo}>
              <Text style={[styles.providerTitle, isRTL && styles.textRTL]}>{t('profile.providerSpace')}</Text>
              <Text style={[styles.providerDescription, isRTL && styles.textRTL]}>
                {t('profile.accessDashboard')}
              </Text>
            </View>
            <Button
              variant="primary"
              size="md"
              onPress={handleSwitchToProvider}
            >
              {t('common.access')} →
            </Button>
          </Card>
        ) : (
          <Card style={[styles.switchCard, isRTL && styles.rowRTL]}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchTitle, isRTL && styles.textRTL]}>{t('profile.becomeProvider')}</Text>
              <Text style={[styles.switchDescription, isRTL && styles.textRTL]}>
                {t('profile.offerServices')}
              </Text>
            </View>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => {
                hapticFeedback.medium();
                Alert.alert(
                  t('profile.becomeProvider'),
                  t('profile.becomeProviderMessage'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                      text: t('common.start'),
                      onPress: () => {
                        dispatch(switchRole('provider'));
                        router.replace('/(provider)');
                      },
                    },
                  ]
                );
              }}
            >
              {t('auth.signup')}
            </Button>
          </Card>
        )}

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
          {t('auth.logout')}
        </Button>

        {/* Diagnostic - Dev only */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.diagnosticButton}
            onPress={() => router.push('/diagnostic')}
          >
            <Text style={styles.diagnosticButtonText}>🔧 Diagnostic API</Text>
          </TouchableOpacity>
        )}

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
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    fontWeight: '500',
  },
  preferenceHint: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  actions: {
    marginBottom: spacing.lg,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
  // Provider Card (for users who are already providers)
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.primary,
    gap: spacing.md,
    ...shadows.md,
  },
  providerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerIconText: {
    fontSize: 26,
  },
  providerInfo: {
    flex: 1,
  },
  providerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  providerDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
    lineHeight: 18,
  },

  // Switch Card (for non-providers)
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
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
  diagnosticButton: {
    backgroundColor: colors.gray[800],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  diagnosticButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
});
