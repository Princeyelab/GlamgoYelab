import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../src/lib/constants/theme';
import { useAppSelector } from '../src/lib/store/hooks';
import { selectIsAuthenticated, selectUserRole } from '../src/lib/store/slices/authSlice';
import { store } from '../src/lib/store';
import { useLanguage } from '../src/contexts/LanguageContext';
import { LanguageSelectorCompact } from '../src/components/features/LanguageSelector';

export default function Index() {
  const router = useRouter();
  const { logout } = useLocalSearchParams();
  const { t, isRTL } = useLanguage();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const userRole = useAppSelector(selectUserRole);

  // Rediriger vers le bon mode selon le role
  // SAUF si on vient de se deconnecter (parametre logout)
  useEffect(() => {
    // Si parametre logout present, ne pas rediriger
    if (logout) {
      return;
    }

    if (!isAuthenticated) return;

    const timer = setTimeout(() => {
      // Verifier l'etat ACTUEL du store (pas la closure)
      const currentState = store.getState();
      const stillAuthenticated = currentState.auth.isAuthenticated;

      if (stillAuthenticated) {
        const role = currentState.auth.user?.role || 'user';
        if (role === 'provider') {
          router.replace('/(provider)' as any);
        } else {
          router.replace('/(client)' as any);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isAuthenticated, logout]);

  return (
    <View style={styles.container}>
      {/* Language Selector - Support FR, EN, ES, AR */}
      <View style={styles.languageContainer}>
        <LanguageSelectorCompact />
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.jpg')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.logoText, isRTL && styles.textRTL]}>GlamGo</Text>
        </View>
        <Text style={[styles.title, isRTL && styles.textRTL]}>{t('welcome.title')}</Text>
        <Text style={[styles.subtitle, isRTL && styles.textRTL]}>
          {t('welcome.subtitle')}
        </Text>
      </View>

      <View style={styles.buttons}>
        {/* Devenir Client */}
        <Link href="/auth/signup-client" asChild>
          <TouchableOpacity style={[styles.providerButton, isRTL && styles.providerButtonRTL]}>
            <View style={styles.buttonContent}>
              <Text style={[styles.providerButtonIcon, isRTL && styles.iconRTL]}>👤</Text>
              <Text style={[styles.providerButtonText, isRTL && styles.providerButtonTextRTL]}>{t('welcome.becomeClient')}</Text>
            </View>
          </TouchableOpacity>
        </Link>

        {/* Devenir Prestataire */}
        <Link href="/auth/signup-provider" asChild>
          <TouchableOpacity style={[styles.providerButton, isRTL && styles.providerButtonRTL]}>
            <View style={styles.buttonContent}>
              <Text style={[styles.providerButtonIcon, isRTL && styles.iconRTL]}>💼</Text>
              <Text style={[styles.providerButtonText, isRTL && styles.providerButtonTextRTL]}>{t('welcome.becomeProvider')}</Text>
            </View>
          </TouchableOpacity>
        </Link>

        {/* Comment ca marche */}
        <Link href="/how-it-works" asChild>
          <TouchableOpacity style={[styles.howItWorksButton, isRTL && styles.buttonRTL]}>
            <View style={styles.buttonContent}>
              <Text style={[styles.howItWorksIcon, isRTL && styles.iconRTL]}>❓</Text>
              <Text style={[styles.howItWorksText, isRTL && styles.buttonTextRTL]}>{t('welcome.howItWorks')}</Text>
            </View>
          </TouchableOpacity>
        </Link>

        {/* Deja inscrit */}
        <Link href="/auth/login" asChild>
          <TouchableOpacity style={styles.loginLink}>
            <Text style={[styles.loginLinkText, isRTL && styles.textRTL]}>{t('welcome.alreadyRegistered')}</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.footerContainer}>
        <Text style={[styles.footer, isRTL && styles.textRTL]}>{t('welcome.location')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
    justifyContent: 'space-between',
  },
  languageContainer: {
    alignSelf: 'flex-end',
    marginTop: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: spacing.base,
  },
  logoText: {
    fontSize: 36,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.gray[900],
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  buttons: {
    gap: spacing.sm,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Client Button
  clientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  clientButtonIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  clientButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
  },
  // Provider Button
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  providerButtonIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  providerButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
  },
  // How it works Button
  howItWorksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  howItWorksIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  howItWorksText: {
    color: colors.gray[700],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
  },
  // Login Link
  loginLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  loginLinkText: {
    color: colors.gray[500],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    textDecorationLine: 'underline',
  },
  footerContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  footer: {
    textAlign: 'center',
    color: colors.gray[400],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },

  // RTL Styles
  textRTL: {
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  buttonRTL: {
    flexDirection: 'row-reverse',
  },
  clientButtonRTL: {
    flexDirection: 'row-reverse',
  },
  providerButtonRTL: {
    flexDirection: 'row-reverse',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonTextRTL: {
    writingDirection: 'rtl',
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
  },
  clientButtonTextRTL: {
    writingDirection: 'rtl',
    textAlign: 'center',
    color: colors.white,
    fontFamily: typography.fontFamily.medium,
  },
  providerButtonTextRTL: {
    writingDirection: 'rtl',
    textAlign: 'center',
    color: colors.primary,
    fontFamily: typography.fontFamily.medium,
  },
  iconRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
});
