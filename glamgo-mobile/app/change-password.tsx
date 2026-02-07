/**
 * Change Password Screen - GlamGo Mobile
 * CON-SEC-012 / CON-SEC-013
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../src/lib/constants/theme';
import { useLanguage } from '../src/contexts/LanguageContext';
import { changePassword } from '../src/lib/api/authAPI';
import { useAppDispatch } from '../src/lib/store/hooks';
import { logoutUser } from '../src/lib/store/slices/authSlice';
import { hapticFeedback } from '../src/lib/utils/haptics';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, isRTL } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!currentPassword) {
      newErrors.current = t('changePassword.currentRequired');
    }

    if (!newPassword) {
      newErrors.new = t('changePassword.newRequired');
    } else if (newPassword.length < 8) {
      newErrors.new = t('changePassword.minLength');
    }

    if (!confirmPassword) {
      newErrors.confirm = t('changePassword.confirmRequired');
    } else if (newPassword !== confirmPassword) {
      newErrors.confirm = t('changePassword.mismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      hapticFeedback.success();
      Alert.alert(
        t('changePassword.successTitle'),
        t('changePassword.successMessage'),
        [
          {
            text: 'OK',
            onPress: () => {
              // Deconnecter pour securite apres changement de MDP
              dispatch(logoutUser());
              router.replace('/auth/login');
            },
          },
        ]
      );
    } catch (err: any) {
      hapticFeedback.error();
      const message = err?.response?.data?.message || err?.message || '';

      if (message.toLowerCase().includes('current') || message.toLowerCase().includes('actuel') || message.toLowerCase().includes('incorrect')) {
        setErrors({ current: t('changePassword.currentIncorrect') });
      } else {
        Alert.alert(t('errors.error'), t('changePassword.errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    error: string | undefined,
    show: boolean,
    toggleShow: () => void,
    placeholder: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, isRTL && styles.textRTL]}>{label}</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, isRTL && styles.inputRTL, error ? styles.inputError : null]}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          value={value}
          onChangeText={(text) => { onChange(text); setErrors({}); }}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          textAlign={isRTL ? 'right' : 'left'}
          editable={!loading}
        />
        <TouchableOpacity style={styles.eyeButton} onPress={toggleShow}>
          <Text style={styles.eyeIcon}>{show ? '👁️' : '👁️‍🗨️'}</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
            <Text style={styles.backIcon}>{isRTL ? '\u2192' : '\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('changePassword.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={[styles.subtitle, isRTL && styles.textRTL]}>
          {t('changePassword.subtitle')}
        </Text>

        {/* Form */}
        <View style={styles.form}>
          {renderInput(
            t('changePassword.currentLabel'),
            currentPassword,
            setCurrentPassword,
            errors.current,
            showCurrent,
            () => setShowCurrent(!showCurrent),
            t('changePassword.currentPlaceholder')
          )}

          {renderInput(
            t('changePassword.newLabel'),
            newPassword,
            setNewPassword,
            errors.new,
            showNew,
            () => setShowNew(!showNew),
            t('changePassword.newPlaceholder')
          )}

          {renderInput(
            t('changePassword.confirmLabel'),
            confirmPassword,
            setConfirmPassword,
            errors.confirm,
            showConfirm,
            () => setShowConfirm(!showConfirm),
            t('changePassword.confirmPlaceholder')
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.buttonText, isRTL && styles.textRTL]}>
                {t('changePassword.submit')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.securityNote, isRTL && styles.textRTL]}>
          {t('changePassword.securityNote')}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
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
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  inputContainer: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
  },
  passwordRow: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    paddingRight: 50,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
  },
  inputError: {
    borderColor: colors.error,
  },
  inputRTL: {
    textAlign: 'right',
    paddingRight: spacing.base,
    paddingLeft: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  securityNote: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 20,
  },
  // RTL
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
});
