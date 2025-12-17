import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../src/lib/constants/theme';

export default function Index() {
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
        <Text style={styles.title}>Services à domicile à Marrakech</Text>
        <Text style={styles.subtitle}>
          Beauté, ménage, réparations...{'\n'}Tout ce dont vous avez besoin, à portée de main
        </Text>
      </View>

      <View style={styles.buttons}>
        <Link href="/auth/login" asChild>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/auth/signup" asChild>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Créer un compte</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.footerContainer}>
        <Link href="/test-components">
          <Text style={styles.testLink}>Test Composants</Text>
        </Link>
        <Text style={styles.footer}>📍 Marrakech, Maroc</Text>
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
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  buttons: {
    gap: spacing.base,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  footerContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  testLink: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    textAlign: 'center',
    color: colors.gray[400],
    fontSize: typography.fontSize.sm,
  },
});
