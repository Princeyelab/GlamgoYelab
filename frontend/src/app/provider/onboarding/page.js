'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import {
  SPECIALTIES_BY_CATEGORY,
  CATEGORY_LABELS,
  SPECIALTIES_REQUIRING_DIPLOMA,
  getServicesForSpecialty
} from '@/lib/providerSpecialties';

export default function ProviderOnboardingPage() {
  const router = useRouter();
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
        setError('Le fichier ne doit pas dépasser 5 Mo');
        return;
      }
      setDiplomaFile(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (selectedSpecialties.length === 0) {
      setError('Veuillez sélectionner au moins une spécialité');
      return;
    }

    // Vérifier si diplôme requis mais non fourni
    const needsDiploma = selectedSpecialties.some(spec =>
      SPECIALTIES_REQUIRING_DIPLOMA.includes(spec)
    );
    if (needsDiploma && !diplomaFile) {
      setError('Un diplôme ou certificat est requis pour les spécialités sélectionnées');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Préparer les données
      const formData = new FormData();
      formData.append('specialties', JSON.stringify(selectedSpecialties));

      // Convertir spécialités en services offerts
      const servicesOffered = selectedSpecialties.flatMap(spec => {
        const services = getServicesForSpecialty(spec);
        return services.map(serviceName => ({
          specialty: spec,
          service_name: serviceName,
          custom_price: null
        }));
      });
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

      const data = await response.json();

      if (data.success) {
        // Rafraîchir les données utilisateur
        await refreshUser();

        // Marquer le popup de bienvenue
        localStorage.setItem('showWelcomePopupProvider', 'true');

        // Rediriger vers le dashboard
        router.push('/provider/dashboard');
      } else {
        setError(data.message || 'Une erreur est survenue');
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.');
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
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.onboardingPage}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Vos services</h1>
            <p className={styles.subtitle}>
              Sélectionnez les services que vous proposez. Vous pourrez modifier cette liste plus tard.
            </p>
          </div>

          {error && (
            <div className={styles.errorAlert}>{error}</div>
          )}

          <div className={styles.categoriesGrid}>
            {Object.entries(SPECIALTIES_BY_CATEGORY).map(([categorySlug, specialties]) => (
              <div key={categorySlug} className={styles.categoryCard}>
                <h3 className={styles.categoryTitle}>
                  {CATEGORY_LABELS[categorySlug]}
                </h3>
                <div className={styles.specialtiesList}>
                  {specialties.map(specialty => {
                    const isSelected = selectedSpecialties.includes(specialty.value);
                    const requiresDiploma = SPECIALTIES_REQUIRING_DIPLOMA.includes(specialty.value);

                    return (
                      <label
                        key={specialty.value}
                        className={`${styles.specialtyItem} ${isSelected ? styles.selected : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSpecialtyToggle(specialty.value)}
                          className={styles.checkbox}
                        />
                        <div className={styles.specialtyInfo}>
                          <span className={styles.specialtyLabel}>
                            {specialty.label}
                            {requiresDiploma && (
                              <span className={styles.diplomaBadge} title="Diplôme requis">
                                🎓
                              </span>
                            )}
                          </span>
                          <span className={styles.specialtyDescription}>
                            {specialty.description}
                          </span>
                        </div>
                      </label>
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
                Diplôme ou certificat requis
              </h3>
              <p className={styles.diplomaHint}>
                Certaines spécialités sélectionnées nécessitent un diplôme ou certificat.
              </p>
              <div className={styles.fileInputWrapper}>
                <label
                  htmlFor="diploma"
                  className={`${styles.fileInputLabel} ${diplomaFile ? styles.hasFile : ''}`}
                >
                  <span className={styles.fileIcon}>🎓</span>
                  <div className={styles.fileText}>
                    <strong>{diplomaFile ? diplomaFile.name : 'Télécharger votre diplôme'}</strong>
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
                {selectedSpecialties.length} spécialité{selectedSpecialties.length > 1 ? 's' : ''} sélectionnée{selectedSpecialties.length > 1 ? 's' : ''}
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
              Configurer plus tard
            </Button>
            <Button
              variant="primary"
              size="large"
              onClick={handleSubmit}
              loading={loading}
              disabled={loading || selectedSpecialties.length === 0}
            >
              {loading ? 'Enregistrement...' : 'Terminer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
