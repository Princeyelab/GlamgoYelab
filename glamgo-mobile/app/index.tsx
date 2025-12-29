import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../src/lib/constants/theme';
import { useAppSelector } from '../src/lib/store/hooks';
import { selectIsAuthenticated, selectUserRole } from '../src/lib/store/slices/authSlice';
import { store } from '../src/lib/store';

export default function Index() {
  const router = useRouter();
  const { logout } = useLocalSearchParams();
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
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.jpg')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>GlamGo</Text>
        </View>
        <Text style={styles.title}>Services a domicile a Marrakech</Text>
        <Text style={styles.subtitle}>
          Beaute, menage, reparations...{'\n'}Tout ce dont vous avez besoin, a portee de main
        </Text>
      </View>

      <View style={styles.buttons}>
        {/* Devenir Client */}
        <Link href="/auth/signup-client" asChild>
          <TouchableOpacity style={styles.clientButton}>
            <Text style={styles.clientButtonIcon}>👤</Text>
            <Text style={styles.clientButtonText}>Devenir Client</Text>
          </TouchableOpacity>
        </Link>

        {/* Devenir Prestataire */}
        <Link href="/auth/signup-provider" asChild>
          <TouchableOpacity style={styles.providerButton}>
            <Text style={styles.providerButtonIcon}>💼</Text>
            <Text style={styles.providerButtonText}>Devenir Prestataire</Text>
          </TouchableOpacity>
        </Link>

        {/* Comment ca marche */}
        <Link href="/how-it-works" asChild>
          <TouchableOpacity style={styles.howItWorksButton}>
            <Text style={styles.howItWorksIcon}>❓</Text>
            <Text style={styles.howItWorksText}>Comment ca marche ?</Text>
          </TouchableOpacity>
        </Link>

        {/* Deja inscrit */}
        <Link href="/auth/login" asChild>
          <TouchableOpacity style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Deja inscrit ? Se connecter</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.footer}>Marrakech, Maroc</Text>
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
});
