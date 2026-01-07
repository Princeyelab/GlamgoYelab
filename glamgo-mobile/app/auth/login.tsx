import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import { loginUser, clearError, selectAuth } from '../../src/lib/store/slices/authSlice';
import { useLanguage } from '../../src/contexts/LanguageContext';

type AccountType = 'client' | 'provider';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, error } = useAppSelector(selectAuth);
  const { t, isRTL } = useLanguage();

  const [accountType, setAccountType] = useState<AccountType>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Rediriger si deja authentifie
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/' as any);
    }
  }, [isAuthenticated]);

  // Clear error quand on modifie les champs
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [email, password]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');

    let hasError = false;

    if (!email) {
      setEmailError(t('auth.emailRequired'));
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError(t('auth.invalidEmail'));
      hasError = true;
    }

    if (!password) {
      setPasswordError(t('auth.passwordRequired'));
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError(t('auth.passwordMinLength'));
      hasError = true;
    }

    if (hasError) return;

    // Dispatch Redux action avec le type de compte
    try {
      await dispatch(loginUser({ email, password, accountType })).unwrap();
      // Success - navigation automatique via useEffect
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : t('auth.loginFailed');
      Alert.alert(t('common.error'), errorMessage);
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
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <Text style={[styles.title, isRTL && styles.textRTL]}>{t('auth.login')}</Text>
          <Text style={[styles.subtitle, isRTL && styles.textRTL]}>{t('auth.welcomeBack')}</Text>
        </View>

        {/* Selecteur Client / Prestataire */}
        <View style={[styles.accountTypeContainer, isRTL && styles.accountTypeContainerRTL]}>
          <TouchableOpacity
            style={[
              styles.accountTypeButton,
              accountType === 'client' && styles.accountTypeButtonActive,
              isRTL && styles.accountTypeButtonRTL,
            ]}
            onPress={() => setAccountType('client')}
            disabled={isLoading}
          >
            <Text style={styles.accountTypeIcon}>👤</Text>
            <Text
              style={[
                styles.accountTypeText,
                accountType === 'client' && styles.accountTypeTextActive,
              ]}
            >
              {t('auth.client')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.accountTypeButton,
              accountType === 'provider' && styles.accountTypeButtonActive,
              isRTL && styles.accountTypeButtonRTL,
            ]}
            onPress={() => setAccountType('provider')}
            disabled={isLoading}
          >
            <Text style={styles.accountTypeIcon}>💼</Text>
            <Text
              style={[
                styles.accountTypeText,
                accountType === 'provider' && styles.accountTypeTextActive,
              ]}
            >
              {t('auth.provider')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.form, isRTL && styles.formRTL]}>
          <Input
            label={t('auth.email')}
            type="email"
            placeholder={t('auth.emailPlaceholder')}
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
            label={t('auth.password')}
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
            }}
            errorText={passwordError}
            error={!!passwordError}
            helperText={!passwordError ? t('auth.passwordMinLength') : undefined}
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
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
          >
            {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
          </Button>

          <Button
            variant="ghost"
            fullWidth
            onPress={() => router.push('/auth/forgot-password')}
            disabled={isLoading}
          >
            {t('auth.forgotPassword')}
          </Button>

          <View style={[styles.divider, isRTL && styles.dividerRTL]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            variant="outline"
            fullWidth
            onPress={() => router.push('/')}
            disabled={isLoading}
          >
            {t('auth.backToHome')}
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
  accountTypeContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  accountTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  accountTypeButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  accountTypeIcon: {
    fontSize: 18,
  },
  accountTypeText: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    color: colors.gray[500],
  },
  accountTypeTextActive: {
    color: colors.gray[900],
    fontWeight: '600',
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
  // RTL Styles
  headerRTL: {
    alignItems: 'flex-end',
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  accountTypeContainerRTL: {
    flexDirection: 'row-reverse',
  },
  accountTypeButtonRTL: {
    flexDirection: 'row-reverse',
  },
  formRTL: {
    alignItems: 'stretch',
  },
  dividerRTL: {
    flexDirection: 'row-reverse',
  },
});
