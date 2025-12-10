'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProviderResetPasswordPage() {
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  useEffect(() => {
    if (!token) {
      setServerError(t('resetPassword.tokenMissing'));
    }
  }, [token, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = t('resetPassword.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('resetPassword.passwordTooShort');
    }

    if (!formData.password_confirmation) {
      newErrors.password_confirmation = t('resetPassword.confirmPasswordRequired');
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = t('resetPassword.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!token) {
      setServerError(t('resetPassword.tokenMissing'));
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.providerResetPassword(
        token,
        formData.password,
        formData.password_confirmation
      );

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/provider/login');
        }, 3000);
      } else {
        setServerError(response.message || t('message.genericError'));
      }
    } catch (error) {
      setServerError(error.message || t('message.genericError'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.resetPasswordPage}>
        <div className={styles.container} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className={styles.formCard}>
            <div className={styles.successIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className={styles.title}>{t('resetPassword.successTitle')}</h1>
            <p className={styles.message}>
              {t('resetPassword.successMessage')}
            </p>
            <Link href="/provider/login" className={styles.backLink}>
              {t('resetPassword.loginNow')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.resetPasswordPage}>
      <div className={styles.container} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={styles.formCard}>
          <h1 className={styles.title}>{t('resetPassword.title')}</h1>
          <p className={styles.subtitle}>
            {t('resetPassword.subtitle')}
          </p>

          {serverError && (
            <div className={styles.errorAlert}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                {t('resetPassword.newPasswordLabel')} <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                  placeholder={t('resetPassword.passwordPlaceholder')}
                  disabled={!token}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('resetPassword.hidePassword') : t('resetPassword.showPassword')}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className={styles.error}>{errors.password}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password_confirmation" className={styles.label}>
                {t('resetPassword.confirmPasswordLabel')} <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPasswordConfirmation ? 'text' : 'password'}
                  id="password_confirmation"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.password_confirmation ? styles.inputError : ''}`}
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  disabled={!token}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                  aria-label={showPasswordConfirmation ? t('resetPassword.hidePassword') : t('resetPassword.showPassword')}
                >
                  {showPasswordConfirmation ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password_confirmation && (
                <span className={styles.error}>{errors.password_confirmation}</span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              disabled={loading || !token}
            >
              {loading ? t('resetPassword.resettingButton') : t('resetPassword.resetButton')}
            </Button>
          </form>

          <div className={styles.footer}>
            <Link href="/provider/login" className={styles.link}>
              {t('resetPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
