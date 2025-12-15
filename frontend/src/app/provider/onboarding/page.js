'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import {
  SPECIALTIES_BY_CATEGORY,
  SPECIALTIES_REQUIRING_DIPLOMA,
  getServicesForSpecialty,
  getCategoryLabel,
  getSpecialtyLabel
} from '@/lib/providerSpecialties';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const { t, isRTL, language, toggleLanguage } = useLanguage();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDiplomaUpload, setShowDiplomaUpload] = useState(false);
  const [diplomaFile, setDiplomaFile] = useState(null);

  // Vérifier si un diplôme est requis pour les spécialités sélectionnées
  useEffect(() => {
    const needsDiploma = selectedSpecialties.some(spec =>
      SPECIALTIES_REQUIRING_DIPLOMA.includes(spec)
    );
    setShowDiplomaUpload(needsDiploma);
  }, [selectedSpecialties]);

  // Rediriger si pas authentifié
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/provider/login');
    }
  }, [user, authLoading, router]);

  const handleSpecialtyToggle = (specialtyValue) => {
    setSelectedSpecialties(prev => {
      if (prev.includes(specialtyValue)) {
        return prev.filter(s => s !== specialtyValue);
      } else {
        return [...prev, specialtyValue];
      }
    });
    setError('');
  };

  const handleDiplomaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t('providerOnboarding.fileTooLarge'));
        return;
      }
      setDiplomaFile(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (selectedSpecialties.length === 0) {
      setError(t('providerOnboarding.selectAtLeastOne'));
      return;
    }

    // Vérifier si diplôme requis mais non fourni
    const needsDiploma = selectedSpecialties.some(spec =>
      SPECIALTIES_REQUIRING_DIPLOMA.includes(spec)
    );
    if (needsDiploma && !diplomaFile) {
      setError(t('providerOnboarding.diplomaRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convertir spécialités en services offerts
      const servicesOffered = selectedSpecialties.flatMap(spec => {
        const services = getServicesForSpecialty(spec);
        return services.map(serviceName => ({
          specialty: spec,
          service_name: serviceName,
          custom_price: null
        }));
      });

      // Sauvegarder en localStorage pour le mode démo
      const providerTempData = JSON.parse(localStorage.getItem('provider_temp_data') || '{}');
      providerTempData.specialties = selectedSpecialties;
      providerTempData.services_offered = servicesOffered;
      providerTempData.onboarding_completed = true;
      localStorage.setItem('provider_temp_data', JSON.stringify(providerTempData));

      // Essayer d'appeler le backend, mais ne pas bloquer si ça échoue
      try {
        const formData = new FormData();
        formData.append('specialties', JSON.stringify(selectedSpecialties));
        formData.append('services_offered', JSON.stringify(servicesOffered));
        if (diplomaFile) {
          formData.append('diploma_certificate', diplomaFile);
        }
        formData.append('onboarding_completed', 'true');

        const token = apiClient.getToken();
        const response = await fetch(`${apiClient.baseURL}/provider/onboarding`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            await refreshUser();
          }
        }
      } catch (apiError) {
        // Ignorer les erreurs API en mode démo
        console.log('Onboarding API skipped (demo mode):', apiError.message);
      }

      // Marquer le popup de bienvenue
      localStorage.setItem('showWelcomePopupProvider', 'true');

      // Rediriger vers le dashboard
      router.push('/provider/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(t('providerOnboarding.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Permettre de passer et configurer plus tard
    localStorage.setItem('showWelcomePopupProvider', 'true');
    router.push('/provider/dashboard');
  };

  if (authLoading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner}></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.onboardingPage} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Bouton de changement de langue */}
      <button
        className={styles.languageToggle}
        onClick={toggleLanguage}
        aria-label={language === 'fr' ? 'التبديل إلى العربية' : 'Passer en français'}
      >
        <span className={styles.languageIcon}>{language === 'fr' ? '🇲🇦' : '🇫🇷'}</span>
        <span className={styles.languageText}>{language === 'fr' ? 'العربية' : 'Français'}</span>
      </button>

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>{t('providerOnboarding.title')}</h1>
            <p className={styles.subtitle}>
              {t('providerOnboarding.subtitle')}
            </p>
          </div>

          {error && (
            <div className={styles.errorAlert}>{error}</div>
          )}

          <div className={styles.categoriesGrid}>
            {Object.entries(SPECIALTIES_BY_CATEGORY).map(([categorySlug, specialties]) => (
              <div key={categorySlug} className={styles.categorySection}>
                <h3 className={styles.categoryTitle}>
                  {getCategoryLabel(categorySlug, language)}
                </h3>
                <div className={styles.servicesGrid}>
                  {specialties.map(specialty => {
                    const isSelected = selectedSpecialties.includes(specialty.value);
                    const requiresDiploma = SPECIALTIES_REQUIRING_DIPLOMA.includes(specialty.value);

                    return (
                      <div
                        key={specialty.value}
                        className={`${styles.serviceCard} ${isSelected ? styles.selected : ''}`}
                        onClick={() => handleSpecialtyToggle(specialty.value)}
                      >
                        <div className={styles.cardIcon}>
                          {specialty.icon || '✨'}
                        </div>
                        <div className={styles.cardContent}>
                          <span className={styles.cardLabel}>
                            {getSpecialtyLabel(specialty, language)}
                          </span>
                          {requiresDiploma && (
                            <span className={styles.diplomaBadge} title={t('providerOnboarding.diplomaRequired')}>
                              🎓
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <div className={styles.checkmark}>✓</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Section diplôme si requis */}
          {showDiplomaUpload && (
            <div className={styles.diplomaSection}>
              <h3 className={styles.diplomaTitle}>
                {t('providerOnboarding.diplomaRequiredTitle')}
              </h3>
              <p className={styles.diplomaHint}>
                {t('providerOnboarding.diplomaRequiredHint')}
              </p>
              <div className={styles.fileInputWrapper}>
                <label
                  htmlFor="diploma"
                  className={`${styles.fileInputLabel} ${diplomaFile ? styles.hasFile : ''}`}
                >
                  <span className={styles.fileIcon}>🎓</span>
                  <div className={styles.fileText}>
                    <strong>{diplomaFile ? diplomaFile.name : t('providerOnboarding.uploadDiploma')}</strong>
                    <span>PDF, JPG, PNG - max 5MB</span>
                  </div>
                </label>
                <input
                  type="file"
                  id="diploma"
                  onChange={handleDiplomaChange}
                  className={styles.fileInputHidden}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
            </div>
          )}

          {/* Résumé de la sélection */}
          {selectedSpecialties.length > 0 && (
            <div className={styles.selectionSummary}>
              <span className={styles.summaryLabel}>
                {selectedSpecialties.length} {selectedSpecialties.length > 1 ? t('providerOnboarding.specialtiesSelected') : t('providerOnboarding.specialtySelected')}
              </span>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              variant="outline"
              size="large"
              onClick={handleSkip}
              disabled={loading}
            >
              {t('providerOnboarding.configureLater')}
            </Button>
            <Button
              variant="primary"
              size="large"
              onClick={handleSubmit}
              loading={loading}
              disabled={loading || selectedSpecialties.length === 0}
            >
              {loading ? t('providerOnboarding.saving') : t('providerOnboarding.finish')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
