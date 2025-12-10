'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ForgotPasswordPage() {
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t('forgotPassword.emailRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('forgotPassword.emailInvalid'));
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.forgotPassword(email);
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || t('message.genericError'));
      }
    } catch (err) {
      setError(err.message || t('message.genericError'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.forgotPasswordPage}>
        <div className={styles.container} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className={styles.formCard}>
            <div className={styles.successIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className={styles.title}>{t('forgotPassword.successTitle')}</h1>
            <p className={styles.message}>
              {t('forgotPassword.successMessage', { email: email })}
            </p>
            <p className={styles.note}>
              {t('forgotPassword.checkSpam')}
            </p>
            <Link href="/login" className={styles.backLink}>
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.forgotPasswordPage}>
      <div className={styles.container} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={styles.formCard}>
          <h1 className={styles.title}>{t('forgotPassword.title')}</h1>
          <p className={styles.subtitle}>
            {t('forgotPassword.subtitle')}
          </p>

          {error && (
            <div className={styles.errorAlert}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                {t('forgotPassword.emailLabel')} <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder={t('forgotPassword.emailPlaceholder')}
                autoComplete="email"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {loading ? t('forgotPassword.sendingButton') : t('forgotPassword.sendButton')}
            </Button>
          </form>

          <div className={styles.footer}>
            <Link href="/login" className={styles.link}>
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
