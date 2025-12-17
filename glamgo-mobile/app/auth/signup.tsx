import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { colors, spacing, typography } from '../../src/lib/constants/theme';

export default function SignupScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = () => {
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
      setNameError('Minimum 2 caractères');
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
      setPhoneError('Téléphone requis');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Mot de passe requis');
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError('Minimum 8 caractères');
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

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Succès', 'Inscription réussie ! (simulation)', [
        { text: 'OK', onPress: () => router.push('/auth/login') },
      ]);
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
          <Text style={styles.title}>Créer un compte</Text>
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
          />

          <Input
            label="Téléphone"
            type="phone"
            placeholder="+212 6XX XXX XXX"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setPhoneError('');
            }}
            errorText={phoneError}
            error={!!phoneError}
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
            helperText={!passwordError ? 'Minimum 8 caractères' : undefined}
          />

          <Input
            label="Confirmer mot de passe"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setConfirmPasswordError('');
            }}
            errorText={confirmPasswordError}
            error={!!confirmPasswordError}
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
            style={styles.signupButton}
          >
            {loading ? 'Inscription...' : 'Créer mon compte'}
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
          >
            J'ai déjà un compte
          </Button>

          <Button
            variant="ghost"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            ← Retour
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
