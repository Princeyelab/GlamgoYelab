'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRememberMe = localStorage.getItem('remember_me') === 'true';
      setRememberMe(savedRememberMe);
      if (savedRememberMe) {
        const savedEmail = localStorage.getItem('saved_email');
        if (savedEmail) {
          setFormData(prev => ({ ...prev, email: savedEmail }));
        }
      }
      // Nettoyer les anciens mots de passe stockés (sécurité)
      localStorage.removeItem('saved_password');
    }
  }, []);

  const handleEmailFocus = () => {
    if (typeof window !== 'undefined' && !formData.email) {
      const savedEmail = localStorage.getItem('saved_email');
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
        setRememberMe(true);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = t('login.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('login.emailInvalid');
    }
    if (!formData.password) {
      newErrors.password = t('login.passwordRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await apiClient.login(formData.email, formData.password, rememberMe);
      if (response.success) {
        if (rememberMe) {
          localStorage.setItem('remember_me', 'true');
          localStorage.setItem('saved_email', formData.email);
        } else {
          localStorage.removeItem('remember_me');
          localStorage.removeItem('saved_email');
        }
        // Conserver le flag showWelcomePopup s'il existe (nouvel inscrit)
        const showWelcome = localStorage.getItem('showWelcomePopup');
        login(response.data.user);
        if (showWelcome === 'true') {
          localStorage.setItem('showWelcomePopup', 'true');
        }
        router.push('/');
      } else {
        setServerError(response.message || t('login.wrongCredentials'));
      }
    } catch (error) {
      setServerError(error.message || t('login.wrongCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <div className={styles.backLink}>
            <Link href="/" className={styles.backButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {t('login.backToHome')}
            </Link>
          </div>

          <h1 className={styles.title}>{t('login.title')}</h1>
          <p className={styles.subtitle}>{t('login.subtitle')}</p>
          {serverError && <div className={styles.errorAlert}>{serverError}</div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor='email' className={styles.label}>{t('form.email')} <span className={styles.required}>*</span></label>
              <input type='email' id='email' name='email' value={formData.email} onChange={handleChange} className={`${styles.input} ${errors.email ? styles.inputError : ''}`} placeholder={t('register.emailPlaceholder')} autoComplete='email' onFocus={handleEmailFocus} />
              {errors.email && <span className={styles.error}>{errors.email}</span>}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor='password' className={styles.label}>{t('form.password')} <span className={styles.required}>*</span></label>
              <div className={styles.passwordWrapper}>
                <input type={showPassword ? 'text' : 'password'} id='password' name='password' value={formData.password} onChange={handleChange} className={`${styles.input} ${errors.password ? styles.inputError : ''}`} placeholder={t('form.password')} autoComplete='current-password' />
                <button type='button' className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}>
                  {showPassword ? (<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' /><line x1='1' y1='1' x2='23' y2='23' /></svg>) : (<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' /><circle cx='12' cy='12' r='3' /></svg>)}
                </button>
              </div>
              {errors.password && <span className={styles.error}>{errors.password}</span>}
            </div>
            <div className={styles.forgotPassword}>
              <Link href="/forgot-password" className={styles.forgotLink}>
                {t('login.forgotPassword')}
              </Link>
            </div>
            <div className={styles.rememberMe}>
              <label className={styles.checkboxLabel}>
                <input type='checkbox' checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className={styles.checkbox} />
                <span>{t('login.rememberMe')}</span>
              </label>
            </div>
            <Button type='submit' variant='primary' size='large' fullWidth loading={loading} disabled={loading}>{loading ? t('login.connecting') : t('login.connect')}</Button>
          </form>
          <div className={styles.footer}>
            <p>{t('login.noAccount')}{' '}<Link href='/register' className={styles.link}>{t('login.signUp')}</Link></p>
            <p className={styles.divider}>—</p>
            <p>{t('login.areProvider')}{' '}<Link href='/provider/login' className={styles.link}>{t('login.providerLogin')}</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
