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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../src/components/ui/Card';
import Button from '../src/components/ui/Button';
import TermsModal from '../src/components/ui/TermsModal';
import { colors, spacing, typography, borderRadius } from '../src/lib/constants/theme';
import { hapticFeedback, setHapticsEnabled } from '../src/lib/utils/haptics';
import { useAppDispatch, useAppSelector } from '../src/lib/store/hooks';
import { logoutUser, selectAuth } from '../src/lib/store/slices/authSlice';
import { useLanguage } from '../src/contexts/LanguageContext';

export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectAuth);
  const { t, isRTL } = useLanguage();

  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);

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
      t('settings.clearCacheTitle'),
      t('settings.clearCacheMessage'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.confirm'),
          onPress: () => {
            hapticFeedback.success();
            Alert.alert(t('settings.success'), t('settings.clearCacheSuccess'));
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    hapticFeedback.error();
    Alert.alert(
      t('settings.deleteAccountTitle'),
      t('settings.deleteAccountMessage'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.delete'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(t('settings.info'), t('settings.deleteAccountInfo'));
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    hapticFeedback.medium();
    Alert.alert(
      t('settings.logoutTitle'),
      t('settings.logoutMessage'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: () => {
            dispatch(logoutUser());
            router.replace('/welcome');
          },
        },
      ]
    );
  };

  const handleTermsOfUse = () => {
    hapticFeedback.light();
    // Ouvrir le modal des CGU (même modal que lors de l'inscription)
    setShowTermsModal(true);
  };

  const handlePrivacyPolicy = () => {
    hapticFeedback.light();
    // Ouvrir le modal des CGU (même modal que lors de l'inscription)
    setShowTermsModal(true);
  };

  const handleContactSupport = () => {
    hapticFeedback.light();

    Alert.alert(
      t('settings.contactSupport'),
      t('settings.chooseContactMethod') || 'Choisissez votre méthode de contact',
      [
        {
          text: 'WhatsApp',
          onPress: async () => {
            const whatsappNumber = '+212642289189'; // Numéro support GlamGo
            const message = t('settings.whatsappMessage') || 'Bonjour, j\'ai besoin d\'aide avec GlamGo';
            const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;

            try {
              const supported = await Linking.canOpenURL(whatsappUrl);
              if (supported) {
                await Linking.openURL(whatsappUrl);
              } else {
                Alert.alert(t('errors.error') || 'Erreur', t('settings.whatsappNotInstalled') || 'WhatsApp n\'est pas installé sur votre appareil.');
              }
            } catch (error) {
              Alert.alert(t('errors.error') || 'Erreur', t('settings.cannotOpenWhatsapp') || 'Impossible d\'ouvrir WhatsApp.');
            }
          },
        },
        {
          text: 'Email',
          onPress: async () => {
            const email = 'support@glamgo.ma'; // Email support GlamGo
            const subject = encodeURIComponent('Support GlamGo Mobile');
            const body = encodeURIComponent(t('settings.emailBody') || 'Bonjour,\n\nJ\'ai besoin d\'aide concernant :');
            const emailUrl = `mailto:${email}?subject=${subject}&body=${body}`;

            try {
              const supported = await Linking.canOpenURL(emailUrl);
              if (supported) {
                await Linking.openURL(emailUrl);
              } else {
                Alert.alert(t('errors.error') || 'Erreur', t('settings.cannotOpenEmail') || 'Impossible d\'ouvrir l\'application email.');
              }
            } catch (error) {
              Alert.alert(t('errors.error') || 'Erreur', t('settings.cannotOpenEmail') || 'Impossible d\'ouvrir l\'application email.');
            }
          },
        },
        {
          text: t('settings.cancel'),
          style: 'cancel',
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
        <View style={[styles.header, isRTL && styles.rowRTL]}>
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light();
              router.back();
            }}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>{isRTL ? '→' : '←'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('settings.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Notifications */}
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('settings.notifications')}</Text>

          <View style={[styles.settingRow, isRTL && styles.rowRTL]}>
            <View style={[styles.settingInfo, isRTL && styles.settingInfoRTL]}>
              <Text style={[styles.settingLabel, isRTL && styles.textRTL]}>{t('settings.pushNotifications')}</Text>
              <Text style={[styles.settingDescription, isRTL && styles.textRTL]}>
                {t('settings.receiveBookingAlerts')}
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
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('settings.privacy')}</Text>

          <View style={[styles.settingRow, isRTL && styles.rowRTL]}>
            <View style={[styles.settingInfo, isRTL && styles.settingInfoRTL]}>
              <Text style={[styles.settingLabel, isRTL && styles.textRTL]}>{t('settings.locationServices')}</Text>
              <Text style={[styles.settingDescription, isRTL && styles.textRTL]}>
                {t('settings.allowLocationAccess')}
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
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('settings.appearance')}</Text>

          <View style={[styles.settingRow, styles.settingRowLast, isRTL && styles.rowRTL]}>
            <View style={[styles.settingInfo, isRTL && styles.settingInfoRTL]}>
              <Text style={[styles.settingLabel, isRTL && styles.textRTL]}>{t('settings.hapticFeedback')}</Text>
              <Text style={[styles.settingDescription, isRTL && styles.textRTL]}>
                {t('settings.vibrationsOnInteraction')}
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
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('settings.about')}</Text>

          <TouchableOpacity
            style={[styles.linkRow, isRTL && styles.rowRTL]}
            onPress={handleTermsOfUse}
          >
            <Text style={[styles.linkLabel, isRTL && styles.textRTL]}>{t('settings.termsOfUse')}</Text>
            <Text style={styles.linkIcon}>{isRTL ? '←' : '→'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, isRTL && styles.rowRTL]}
            onPress={handlePrivacyPolicy}
          >
            <Text style={[styles.linkLabel, isRTL && styles.textRTL]}>{t('settings.privacyPolicy')}</Text>
            <Text style={styles.linkIcon}>{isRTL ? '←' : '→'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, styles.linkRowLast, isRTL && styles.rowRTL]}
            onPress={handleContactSupport}
          >
            <Text style={[styles.linkLabel, isRTL && styles.textRTL]}>{t('settings.contactSupport')}</Text>
            <Text style={styles.linkIcon}>{isRTL ? '←' : '→'}</Text>
          </TouchableOpacity>
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>GlamGo Mobile</Text>
          <Text style={styles.appVersion}>{t('settings.version')} 1.0.0</Text>
          <Text style={styles.appBuild}>Build 100 • MVP Complete</Text>
        </View>

        {/* Logout */}
        <Button
          variant="outline"
          fullWidth
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          {t('settings.logout')}
        </Button>

        {/* Danger Zone */}
        <Card style={styles.dangerCard}>
          <Text style={[styles.dangerTitle, isRTL && styles.textRTL]}>{t('settings.dangerZone')}</Text>

          <Button
            variant="ghost"
            fullWidth
            onPress={handleClearCache}
          >
            {t('settings.clearCache')}
          </Button>

          <Button
            variant="ghost"
            fullWidth
            onPress={handleDeleteAccount}
            style={styles.deleteButton}
            textStyle={styles.deleteButtonText}
          >
            {t('settings.deleteAccount')}
          </Button>
        </Card>
      </ScrollView>

      {/* Modal des CGU et Politique de confidentialité */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        userType={user?.role || 'client'}
      />
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
  // RTL Styles
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  settingInfoRTL: {
    marginRight: 0,
    marginLeft: spacing.md,
    alignItems: 'flex-end',
  },
});
