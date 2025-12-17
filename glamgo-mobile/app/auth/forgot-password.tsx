import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useState } from 'react';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = () => {
    // TODO: Implement password reset logic
    console.log('Reset password for:', email);
    setSent(true);
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>✉️</Text>
          <Text style={styles.title}>Email envoyé !</Text>
          <Text style={styles.message}>
            Si un compte existe avec l'adresse {email}, vous recevrez un lien pour réinitialiser votre mot de passe.
          </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Link href="/auth/login" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>
          Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="votre@email.com"
              placeholderTextColor={colors.gray[400]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonText}>Envoyer le lien</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
  },
  backButton: {
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  form: {
    gap: spacing.base,
    width: '100%',
  },
  inputContainer: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
  },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.base,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
});
