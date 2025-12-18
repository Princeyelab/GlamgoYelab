import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { colors, spacing, typography } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import { registerUser, clearError, selectAuth } from '../../src/lib/store/slices/authSlice';

export default function SignupScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, error } = useAppSelector(selectAuth);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Rediriger si authentifie
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/' as any);
    }
  }, [isAuthenticated]);

  // Clear error
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [name, email, phone, password, confirmPassword]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;

    if (!name) {
      setNameError('Nom requis');
      hasError = true;
    } else if (name.length < 2) {
      setNameError('Minimum 2 caracteres');
      hasError = true;
    }

    if (!email) {
      setEmailError('Email requis');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Format d'email invalide");
      hasError = true;
    }

    if (!phone) {
      setPhoneError('Telephone requis');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Mot de passe requis');
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError('Minimum 8 caracteres');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Confirmation requise');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Les mots de passe ne correspondent pas');
      hasError = true;
    }

    if (hasError) return;

    // Dispatch Redux action
    try {
      await dispatch(registerUser({ name, email, phone, password })).unwrap();
      // Success - navigation auto via useEffect
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Inscription echouee';
      Alert.alert('Erreur', errorMessage);
    }
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
          <Text style={styles.title}>Creer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez GlamGo</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nom complet"
            placeholder="Jean Dupont"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setNameError('');
            }}
            errorText={nameError}
            error={!!nameError}
            editable={!isLoading}
          />

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
            editable={!isLoading}
          />

          <Input
            label="Telephone"
            type="phone"
            placeholder="+212 6XX XXX XXX"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setPhoneError('');
            }}
            errorText={phoneError}
            error={!!phoneError}
            editable={!isLoading}
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder="********"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
            }}
            errorText={passwordError}
            error={!!passwordError}
            helperText={!passwordError ? 'Minimum 8 caracteres' : undefined}
            editable={!isLoading}
          />

          <Input
            label="Confirmer mot de passe"
            type="password"
            placeholder="********"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setConfirmPasswordError('');
            }}
            errorText={confirmPasswordError}
            error={!!confirmPasswordError}
            editable={!isLoading}
          />

          {/* Global error from Redux */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSignup}
            loading={isLoading}
            disabled={isLoading}
            style={styles.signupButton}
          >
            {isLoading ? 'Inscription...' : 'Creer mon compte'}
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            variant="outline"
            fullWidth
            onPress={() => router.push('/auth/login')}
            disabled={isLoading}
          >
            J'ai deja un compte
          </Button>

          <Button
            variant="ghost"
            onPress={() => router.push('/welcome')}
            style={styles.backButton}
            disabled={isLoading}
          >
            Retour a l'accueil
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
  errorContainer: {
    padding: spacing.md,
    backgroundColor: colors.error + '15',
    borderRadius: 8,
    marginVertical: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  signupButton: {
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
