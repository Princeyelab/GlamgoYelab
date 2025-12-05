'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';

export default function ForgotPasswordPage() {
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
      setError("L'email est requis");
      return;
    }

    if (!validateEmail(email)) {
      setError("L'email n'est pas valide");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.forgotPassword(email);
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || "Une erreur s'est produite");
      }
    } catch (err) {
      setError(err.message || "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.forgotPasswordPage}>
        <div className={styles.container}>
          <div className={styles.formCard}>
            <div className={styles.successIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className={styles.title}>Email envoyé !</h1>
            <p className={styles.message}>
              Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
            </p>
            <p className={styles.note}>
              Pensez à vérifier votre dossier spam si vous ne recevez rien dans les prochaines minutes.
            </p>
            <Link href="/login" className={styles.backLink}>
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.forgotPasswordPage}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h1 className={styles.title}>Mot de passe oublié</h1>
          <p className={styles.subtitle}>
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          {error && (
            <div className={styles.errorAlert}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="votre.email@exemple.com"
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
              {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
            </Button>
          </form>

          <div className={styles.footer}>
            <Link href="/login" className={styles.link}>
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
