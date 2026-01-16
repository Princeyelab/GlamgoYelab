'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { fixEncoding } from '@/lib/textUtils';
import { getServiceImageUrl } from '@/lib/serviceImages';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslatedTexts } from '@/hooks/useDeepLTranslation';
import { serviceRequiresDiplomaByDBName } from '@/lib/providerSpecialties';
import ProviderNotificationDropdown from '@/components/ProviderNotificationDropdown';

// Mapping des clés de services (onboarding) vers les noms de la BDD
const SERVICE_KEY_TO_DB_NAME = {
  coiffure_homme_simple: 'Coiffure Homme Simple',
  coiffure_homme_premium: 'Coiffure Homme Premium',
  coiffure_express: 'Coiffure Express',
  coiffure_classique: 'Coiffure Classique',
  coiffure_mariage: 'Coiffure Mariage & Événement',
  taille_barbe: 'Taille de Barbe',
  pack_coiffure_barbe: 'Pack Coiffure + Barbe',
  smooth_femme: 'Smooth Femme',
  full_smooth_femme: 'Full Smooth Femme',
  smooth_homme: 'Smooth Homme',
  full_smooth_homme: 'Full Smooth Homme',
  menage: 'Ménage',
  petits_bricolages: 'Petits Bricolages',
  jardinage: 'Jardinage',
  chef_2_personnes: 'Chef à Domicile - 2 Personnes',
  chef_4_personnes: 'Chef à Domicile - 4 Personnes',
  chef_8_personnes: 'Chef à Domicile - 8 Personnes',
  nettoyage_auto_complet: 'Nettoyage Auto Complet',
  nettoyage_auto_externe: 'Nettoyage Auto Externe',
  nettoyage_auto_interne: 'Nettoyage Auto Interne',
  gardiennage_animaux: 'Gardiennage d\'Animaux',
  promenade_animaux: 'Promenade d\'Animaux',
  massage_relaxant: 'Massage Relaxant',
  hammam_gommage: 'Hammam & Gommage',
  soin_argan: 'Soin Premium Argan',
  yoga: 'Yoga',
  coach_sportif: 'Coach Sportif',
  danse_orientale: 'Danse Orientale'
};

export default function ProviderServicesPage() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const [provider, setProvider] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [providerServices, setProviderServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('my-services');
  const hasSyncedRef = useRef(false);

  // État pour le modal de diplôme
  const [showDiplomaModal, setShowDiplomaModal] = useState(false);
  const [pendingService, setPendingService] = useState(null);
  const [diplomaFile, setDiplomaFile] = useState(null);
  const [diplomaError, setDiplomaError] = useState('');
  const [uploadingDiploma, setUploadingDiploma] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    let token = localStorage.getItem('provider_token');
    let isFromLocalStorage = true;

    if (!token) {
      token = sessionStorage.getItem('provider_token');
      isFromLocalStorage = false;
    }

    if (!token) {
      console.log('🔒 [Services] Pas de token, redirection vers login');
      router.push('/provider/login');
      return;
    }

    apiClient.setToken(token, isFromLocalStorage, true);
    console.log('🔑 [Services] Token chargé, appel API profile...');

    try {
      const response = await apiClient.getProviderProfile();
      if (response.success) {
        console.log('✅ [Services] Profil chargé avec succès');
        setProvider(response.data);
        await loadServices();
      } else {
        console.warn('⚠️ [Services] Réponse API sans success, redirection');
        router.push('/provider/login');
      }
    } catch (err) {
      console.error('❌ [Services] Auth error:', err);
      if (err.isAuthError || err.status === 401) {
        console.log('🔒 [Services] Token expiré, nettoyage et redirection');
        localStorage.removeItem('provider_token');
        sessionStorage.removeItem('provider_token');
        router.push('/provider/login');
      } else {
        setError(t('providerServices.connectionError') || 'Erreur de connexion au serveur. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Synchroniser les services de l'onboarding avec le backend
  const syncOnboardingServices = async (dbServices, currentProviderServices) => {
    if (hasSyncedRef.current) return;

    try {
      const providerTempData = JSON.parse(localStorage.getItem('provider_temp_data') || '{}');
      const onboardingServices = providerTempData.services || [];

      if (onboardingServices.length === 0) {
        console.log('📋 [Services] Pas de services onboarding à synchroniser');
        return;
      }

      // Si le prestataire a déjà des services, ne pas re-synchroniser
      if (currentProviderServices.length > 0) {
        console.log('📋 [Services] Prestataire a déjà des services, pas de sync');
        hasSyncedRef.current = true;
        return;
      }

      console.log('🔄 [Services] Synchronisation des services onboarding:', onboardingServices);
      setSyncing(true);

      // Pour chaque service de l'onboarding, trouver l'ID correspondant dans la BDD
      for (const serviceKey of onboardingServices) {
        const dbName = SERVICE_KEY_TO_DB_NAME[serviceKey];
        if (!dbName) {
          console.warn(`⚠️ Service non trouvé dans le mapping: ${serviceKey}`);
          continue;
        }

        // Chercher le service dans la liste des services de la BDD
        const dbService = dbServices.find(s =>
          s.name === dbName ||
          s.name.toLowerCase() === dbName.toLowerCase()
        );

        if (dbService) {
          console.log(`➕ Ajout du service: ${dbName} (ID: ${dbService.id})`);
          try {
            await apiClient.addProviderService(dbService.id);
          } catch (e) {
            console.warn(`Erreur ajout service ${dbName}:`, e.message);
          }
        } else {
          console.warn(`⚠️ Service non trouvé dans la BDD: ${dbName}`);
        }
      }

      hasSyncedRef.current = true;
      setSuccess(t('providerServices.servicesSynced') || 'Services synchronisés avec succès !');
      setTimeout(() => setSuccess(''), 3000);

      // Recharger les services
      const providerServicesResponse = await apiClient.getProviderServices();
      if (providerServicesResponse.success) {
        setProviderServices(providerServicesResponse.data || []);
      }

    } catch (err) {
      console.error('❌ Erreur sync onboarding:', err);
    } finally {
      setSyncing(false);
    }
  };

  const loadServices = async () => {
    try {
      // Charger tous les services disponibles
      const allServicesResponse = await apiClient.getAllServices();
      let dbServices = [];
      if (allServicesResponse.success) {
        dbServices = allServicesResponse.data || [];
        setAllServices(dbServices);
      }

      // Charger les services du prestataire
      const providerServicesResponse = await apiClient.getProviderServices();
      let currentProviderServices = [];
      if (providerServicesResponse.success) {
        currentProviderServices = providerServicesResponse.data || [];
        setProviderServices(currentProviderServices);
      }

      // Synchroniser les services de l'onboarding si nécessaire
      await syncOnboardingServices(dbServices, currentProviderServices);

    } catch (err) {
      setError(t('providerServices.errorLoadingServices'));
      console.error(err);
    }
  };

  // Vérifier si un diplôme est requis et gérer l'ajout
  const handleAddServiceClick = (service) => {
    const requiresDiploma = serviceRequiresDiplomaByDBName(service.name);

    if (requiresDiploma) {
      // Ouvrir le modal pour demander le diplôme
      setPendingService(service);
      setDiplomaFile(null);
      setDiplomaError('');
      setShowDiplomaModal(true);
    } else {
      // Ajouter directement le service
      handleAddService(service.id);
    }
  };

  const handleAddService = async (serviceId) => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiClient.addProviderService(serviceId);
      if (response.success) {
        setSuccess(t('providerServices.serviceAdded'));
        await loadServices();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || t('providerServices.errorAddingService'));
      }
    } catch (err) {
      setError(err.message || t('providerServices.errorAddingService'));
    } finally {
      setActionLoading(false);
    }
  };

  // Gérer le changement de fichier diplôme
  const handleDiplomaFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setDiplomaError(t('providerOnboarding.fileTooLarge') || 'Fichier trop volumineux (max 5MB)');
        return;
      }
      setDiplomaFile(file);
      setDiplomaError('');
    }
  };

  // Soumettre le diplôme et ajouter le service
  const handleDiplomaSubmit = async () => {
    if (!diplomaFile) {
      setDiplomaError(t('providerServices.diplomaRequired') || 'Veuillez ajouter votre diplôme/certificat');
      return;
    }

    setUploadingDiploma(true);
    setDiplomaError('');

    try {
      // D'abord, uploader le diplôme
      const formData = new FormData();
      formData.append('diploma_certificate', diplomaFile);

      const token = apiClient.getToken();
      const uploadResponse = await fetch(`${apiClient.baseURL}/provider/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        console.warn('Upload diplôme: réponse non-OK, mais on continue');
      }

      // Ensuite, ajouter le service
      await handleAddService(pendingService.id);

      // Fermer le modal
      setShowDiplomaModal(false);
      setPendingService(null);
      setDiplomaFile(null);

    } catch (err) {
      console.error('Erreur upload diplôme:', err);
      // Même si l'upload échoue, essayer d'ajouter le service
      try {
        await handleAddService(pendingService.id);
        setShowDiplomaModal(false);
        setPendingService(null);
        setDiplomaFile(null);
      } catch (addErr) {
        setDiplomaError(t('providerServices.errorAddingService') || 'Erreur lors de l\'ajout du service');
      }
    } finally {
      setUploadingDiploma(false);
    }
  };

  const handleRemoveService = async (serviceId) => {
    if (!confirm(t('providerServices.confirmRemove'))) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiClient.removeProviderService(serviceId);
      if (response.success) {
        setSuccess(t('providerServices.serviceRemoved'));
        await loadServices();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || t('providerServices.errorRemovingService'));
      }
    } catch (err) {
      setError(err.message || t('providerServices.errorRemovingService'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('provider_token');
    apiClient.clearToken();
    router.push('/provider/login');
  };

  // Filtrer les services déjà ajoutés
  const providerServiceIds = providerServices.map(s => s.id || s.service_id);
  const availableServices = allServices.filter(s => !providerServiceIds.includes(s.id));

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!provider) {
    return null;
  }

  return (
    <div className={styles.servicesPage} dir={isRTL ? 'rtl' : 'ltr'}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/provider/dashboard" className={styles.logo}>
            <span>GlamGo</span>
            <span className={styles.providerBadge}>{t('providerDashboard.provider')}</span>
          </Link>

          <div className={styles.headerActions}>
            <LanguageSwitcher compact dark />
            <ProviderNotificationDropdown />
            <Link href="/provider/dashboard" className={styles.backLink}>
              {isRTL ? '→' : '←'} {t('providerProfile.backToDashboard')}
            </Link>
            <Link href="/provider/profile" className={styles.profileLink}>
              {provider.first_name} {provider.last_name}
            </Link>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          <div className={styles.pageHeader}>
            <h1>{t('providerServices.title')}</h1>
            <p className={styles.subtitle}>
              {t('providerServices.subtitle')}
            </p>
          </div>

          {syncing && (
            <div className={styles.syncingAlert}>
              <div className={styles.spinner}></div>
              <span>Synchronisation des services...</span>
            </div>
          )}

          {error && <div className={styles.errorAlert}>{error}</div>}
          {success && <div className={styles.successAlert}>{success}</div>}

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'my-services' ? styles.active : ''}`}
              onClick={() => setActiveTab('my-services')}
            >
              {t('providerServices.myServicesTab')} ({providerServices.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'available-services' ? styles.active : ''}`}
              onClick={() => setActiveTab('available-services')}
            >
              {t('providerServices.availableServicesTab')} ({availableServices.length})
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'my-services' ? (
              <div className={styles.servicesSection}>
                {providerServices.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📋</div>
                    <h3>{t('providerServices.noServicesAdded')}</h3>
                    <p>{t('providerServices.startAddingServices')}</p>
                    <Button onClick={() => setActiveTab('available-services')} variant="primary">
                      {t('providerServices.browseServices')}
                    </Button>
                  </div>
                ) : (
                  <div className={styles.servicesGrid}>
                    {providerServices.map(service => (
                      <ServiceCard
                        key={service.id || service.service_id}
                        service={service}
                        isProviderService={true}
                        onRemove={() => handleRemoveService(service.id || service.service_id)}
                        actionLoading={actionLoading}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.servicesSection}>
                {availableServices.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>✅</div>
                    <h3>{t('providerServices.allServicesAdded')}</h3>
                    <p>{t('providerServices.allServicesAddedDesc')}</p>
                  </div>
                ) : (
                  <div className={styles.servicesGrid}>
                    {availableServices.map(service => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        isProviderService={false}
                        onAdd={() => handleAddServiceClick(service)}
                        actionLoading={actionLoading}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de diplôme */}
      {showDiplomaModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDiplomaModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowDiplomaModal(false)}>
              ×
            </button>

            <div className={styles.modalHeader}>
              <span className={styles.modalIcon}>🎓</span>
              <h2>{t('providerServices.diplomaRequiredTitle') || 'Diplôme requis'}</h2>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalDescription}>
                {t('providerServices.diplomaRequiredDesc') ||
                  `Le service "${pendingService?.name}" nécessite un diplôme ou certificat professionnel. Veuillez le télécharger pour continuer.`}
              </p>

              {diplomaError && (
                <div className={styles.modalError}>{diplomaError}</div>
              )}

              <div className={styles.fileInputWrapper}>
                <label
                  htmlFor="diplomaFile"
                  className={`${styles.fileInputLabel} ${diplomaFile ? styles.hasFile : ''}`}
                >
                  <span className={styles.fileIcon}>📄</span>
                  <div className={styles.fileText}>
                    <strong>
                      {diplomaFile
                        ? diplomaFile.name
                        : (t('providerOnboarding.uploadDiploma') || 'Cliquez pour ajouter votre diplôme')}
                    </strong>
                    <span>PDF, JPG, PNG - max 5MB</span>
                  </div>
                </label>
                <input
                  type="file"
                  id="diplomaFile"
                  onChange={handleDiplomaFileChange}
                  className={styles.fileInputHidden}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button
                variant="outline"
                onClick={() => setShowDiplomaModal(false)}
                disabled={uploadingDiploma}
              >
                {t('common.cancel') || 'Annuler'}
              </Button>
              <Button
                variant="primary"
                onClick={handleDiplomaSubmit}
                loading={uploadingDiploma}
                disabled={!diplomaFile || uploadingDiploma}
              >
                {uploadingDiploma
                  ? (t('common.loading') || 'Chargement...')
                  : (t('providerServices.addWithDiploma') || 'Ajouter le service')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant carte de service avec traduction DeepL
function ServiceCard({ service, isProviderService, onAdd, onRemove, actionLoading }) {
  const { t } = useLanguage();
  const imageUrl = getServiceImageUrl(service, '400x300');

  // Vérifier si le service nécessite un diplôme
  const requiresDiploma = serviceRequiresDiplomaByDBName(service.name);

  // Traduction DeepL
  const { translated } = useTranslatedTexts({
    name: fixEncoding(service.name),
    description: fixEncoding(service.description),
    category: service.category_name ? fixEncoding(service.category_name) : '',
  });

  const displayName = translated.name || fixEncoding(service.name);
  const displayDesc = translated.description || fixEncoding(service.description);
  const displayCategory = translated.category || (service.category_name ? fixEncoding(service.category_name) : '');

  // Prix en DH
  const priceInDH = (service.price || service.base_price || 0);

  return (
    <div className={styles.serviceCard}>
      <div className={styles.serviceImage}>
        <img src={imageUrl} alt={displayName} />
        {requiresDiploma && (
          <span className={styles.diplomaBadge} title={t('providerServices.requiresDiploma') || 'Diplôme requis'}>
            🎓
          </span>
        )}
      </div>

      <div className={styles.serviceContent}>
        <div className={styles.serviceHeader}>
          <h3 className={styles.serviceName}>{displayName}</h3>
          {displayCategory && (
            <span className={styles.categoryBadge}>{displayCategory}</span>
          )}
        </div>

        <p className={styles.serviceDescription}>
          {displayDesc?.substring(0, 120)}
          {displayDesc?.length > 120 ? '...' : ''}
        </p>

        <div className={styles.serviceDetails}>
          <div className={styles.fixedPriceInfo}>
            <div className={styles.priceDisplay}>
              <span className={styles.priceAmount}>{priceInDH} DH</span>
              <span className={styles.priceLabel}>{t('providerServices.price') || 'Prix'}</span>
            </div>
            {service.estimated_duration && (
              <div className={styles.duration}>
                <span className={styles.durationIcon}>⏱</span>
                <span>{service.estimated_duration}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.serviceActions}>
          {isProviderService ? (
            <Button
              onClick={onRemove}
              variant="outline"
              size="small"
              fullWidth
              disabled={actionLoading}
            >
              {t('providerServices.removeService')}
            </Button>
          ) : (
            <Button
              onClick={onAdd}
              variant="primary"
              size="small"
              fullWidth
              disabled={actionLoading}
            >
              {requiresDiploma
                ? (t('providerServices.addWithDiploma') || '🎓 Ajouter (diplôme requis)')
                : t('providerServices.addToMyServices')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
