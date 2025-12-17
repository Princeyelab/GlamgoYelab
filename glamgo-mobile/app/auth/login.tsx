import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { colors, spacing, typography } from '../../src/lib/constants/theme';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = () => {
    setEmailError('');
    setPasswordError('');

    let hasError = false;

    if (!email) {
      setEmailError('Email requis');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Format d'email invalide");
      hasError = true;
    }

    if (!password) {
      setPasswordError('Mot de passe requis');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Minimum 6 caractères');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Succès', 'Login réussi ! (simulation)');
    }, 2000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Bienvenue sur GlamGo</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
            }}
            errorText={emailError}
            error={!!emailError}
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
            }}
            errorText={passwordError}
            error={!!passwordError}
            helperText={!passwordError ? 'Minimum 6 caractères' : undefined}
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>

          <Button
            variant="ghost"
            fullWidth
            onPress={() => router.push('/auth/forgot-password')}
          >
            Mot de passe oublié ?
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            variant="outline"
            fullWidth
            onPress={() => router.push('/auth/signup')}
          >
            Créer un compte
          </Button>

          <Button
            variant="ghost"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            ← Retour à l'accueil
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentContainer: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },
  form: {
    paddingHorizontal: spacing.xl,
  },
  loginButton: {
    marginTop: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    marginHorizontal: spacing.base,
    fontSize: typography.fontSize.sm,
    color: colors.gray[400],
    fontWeight: '600',
  },
  backButton: {
    marginTop: spacing.xl,
  },
});
