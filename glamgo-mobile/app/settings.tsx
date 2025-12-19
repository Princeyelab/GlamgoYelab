/**
 * Settings Screen - GlamGo Mobile
 * Paramètres de l'application
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../src/components/ui/Card';
import Button from '../src/components/ui/Button';
import { colors, spacing, typography, borderRadius } from '../src/lib/constants/theme';
import { hapticFeedback, setHapticsEnabled } from '../src/lib/utils/haptics';
import { useAppDispatch } from '../src/lib/store/hooks';
import { logoutUser } from '../src/lib/store/slices/authSlice';

export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleToggle = (
    setter: (val: boolean) => void,
    value: boolean,
    callback?: (newValue: boolean) => void
  ) => {
    hapticFeedback.selection();
    setter(!value);
    callback?.(!value);
  };

  const handleHapticsToggle = () => {
    const newValue = !haptics;
    setHaptics(newValue);
    setHapticsEnabled(newValue);
    if (newValue) {
      hapticFeedback.selection();
    }
  };

  const handleClearCache = () => {
    hapticFeedback.warning();
    Alert.alert(
      'Vider le cache',
      'Cela supprimera les données temporaires. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            hapticFeedback.success();
            Alert.alert('Succès', 'Cache vidé avec succès');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    hapticFeedback.error();
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Fonctionnalité disponible en production');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    hapticFeedback.medium();
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => {
            dispatch(logoutUser());
            router.replace('/welcome');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light();
              router.back();
            }}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Paramètres</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Notifications */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications push</Text>
              <Text style={styles.settingDescription}>
                Recevoir les alertes de réservation
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={() => handleToggle(setNotifications, notifications)}
              trackColor={{ false: colors.gray[300], true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        {/* Privacy */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Confidentialité</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Services de localisation</Text>
              <Text style={styles.settingDescription}>
                Autoriser l'accès à votre position
              </Text>
            </View>
            <Switch
              value={locationServices}
              onValueChange={() => handleToggle(setLocationServices, locationServices)}
              trackColor={{ false: colors.gray[300], true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        {/* Appearance */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Apparence</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Mode sombre</Text>
              <Text style={styles.settingDescription}>
                Bientôt disponible
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={() => handleToggle(setDarkMode, darkMode)}
              trackColor={{ false: colors.gray[300], true: colors.primary }}
              thumbColor={colors.white}
              disabled
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Retour haptique</Text>
              <Text style={styles.settingDescription}>
                Vibrations lors des interactions
              </Text>
            </View>
            <Switch
              value={haptics}
              onValueChange={handleHapticsToggle}
              trackColor={{ false: colors.gray[300], true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        {/* About */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>À propos</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => hapticFeedback.light()}
          >
            <Text style={styles.linkLabel}>Conditions d'utilisation</Text>
            <Text style={styles.linkIcon}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => hapticFeedback.light()}
          >
            <Text style={styles.linkLabel}>Politique de confidentialité</Text>
            <Text style={styles.linkIcon}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, styles.linkRowLast]}
            onPress={() => hapticFeedback.light()}
          >
            <Text style={styles.linkLabel}>Contact & Support</Text>
            <Text style={styles.linkIcon}>→</Text>
          </TouchableOpacity>
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>GlamGo Mobile</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appBuild}>Build 100 • MVP Complete</Text>
        </View>

        {/* Logout */}
        <Button
          variant="outline"
          fullWidth
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Déconnexion
        </Button>

        {/* Danger Zone */}
        <Card style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Zone dangereuse</Text>

          <Button
            variant="ghost"
            fullWidth
            onPress={handleClearCache}
          >
            Vider le cache
          </Button>

          <Button
            variant="ghost"
            fullWidth
            onPress={handleDeleteAccount}
            style={styles.deleteButton}
            textStyle={styles.deleteButtonText}
          >
            Supprimer le compte
          </Button>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: 50,
    paddingBottom: spacing['3xl'],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.gray[900],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  headerSpacer: {
    width: 40,
  },

  // Cards
  card: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },

  // Settings Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    color: colors.gray[900],
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },

  // Link Row
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  linkRowLast: {
    borderBottomWidth: 0,
  },
  linkLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
  },
  linkIcon: {
    fontSize: 20,
    color: colors.gray[400],
  },

  // App Info
  appInfo: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  appName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  appVersion: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: 2,
  },
  appBuild: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },

  // Logout
  logoutButton: {
    marginBottom: spacing.xl,
  },

  // Danger Zone
  dangerCard: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  dangerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.error,
    marginBottom: spacing.md,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
  deleteButtonText: {
    color: colors.error,
  },
});
