'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import ServicePrice from '@/components/Price/ServicePrice';
import { fixEncoding } from '@/lib/textUtils';
import { getServiceImageUrl } from '@/lib/serviceImages';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslatedTexts } from '@/hooks/useDeepLTranslation';

export default function ProviderServicesPage() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const [provider, setProvider] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [providerServices, setProviderServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('my-services'); // 'my-services' ou 'available-services'

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Vérifier provider_token dans localStorage puis sessionStorage
    let token = localStorage.getItem('provider_token');
    let isFromLocalStorage = true;

    if (!token) {
      token = sessionStorage.getItem('provider_token');
      isFromLocalStorage = false;
    }

    if (!token) {
      router.push('/provider/login');
      return;
    }

    apiClient.setToken(token, isFromLocalStorage, true);

    try {
      const response = await apiClient.getProviderProfile();
      if (response.success) {
        setProvider(response.data);
        await loadServices();
      } else {
        router.push('/provider/login');
      }
    } catch (err) {
      console.error('Auth error:', err);
      router.push('/provider/login');
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      // Charger tous les services disponibles
      const allServicesResponse = await apiClient.getAllServices();
      if (allServicesResponse.success) {
        setAllServices(allServicesResponse.data || []);
      }

      // Charger les services du prestataire
      const providerServicesResponse = await apiClient.getProviderServices();
      if (providerServicesResponse.success) {
        setProviderServices(providerServicesResponse.data || []);
      }
    } catch (err) {
      setError(t('providerServices.errorLoadingServices'));
      console.error(err);
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
            <LanguageSwitcher compact />
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
                        onAdd={() => handleAddService(service.id)}
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
    </div>
  );
}

// Composant carte de service avec traduction DeepL
function ServiceCard({ service, isProviderService, onAdd, onRemove, actionLoading }) {
  const { t } = useLanguage();
  const imageUrl = getServiceImageUrl(service, '400x300');

  // Traduction DeepL
  const { translated } = useTranslatedTexts({
    name: fixEncoding(service.name),
    description: fixEncoding(service.description),
    category: service.category_name ? fixEncoding(service.category_name) : '',
  });

  const displayName = translated.name || fixEncoding(service.name);
  const displayDesc = translated.description || fixEncoding(service.description);
  const displayCategory = translated.category || (service.category_name ? fixEncoding(service.category_name) : '');

  return (
    <div className={styles.serviceCard}>
      <div className={styles.serviceImage}>
        <img src={imageUrl} alt={displayName} />
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
              <ServicePrice
                amount={service.price || service.base_price}
                label={t('providerServices.price')}
              />
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
              {t('providerServices.addToMyServices')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
