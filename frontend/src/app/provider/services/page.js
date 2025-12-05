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

export default function ProviderServicesPage() {
  const router = useRouter();
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
      setError('Erreur lors du chargement des services');
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
        setSuccess('Service ajouté avec succès');
        await loadServices();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Erreur lors de l\'ajout du service');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'ajout du service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveService = async (serviceId) => {
    if (!confirm('Voulez-vous vraiment retirer ce service ?')) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiClient.removeProviderService(serviceId);
      if (response.success) {
        setSuccess('Service retiré avec succès');
        await loadServices();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Erreur lors du retrait du service');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du retrait du service');
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
        <p>Chargement...</p>
      </div>
    );
  }

  if (!provider) {
    return null;
  }

  return (
    <div className={styles.servicesPage}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/provider/dashboard" className={styles.logo}>
            <span>GlamGo</span>
            <span className={styles.providerBadge}>Prestataire</span>
          </Link>

          <div className={styles.headerActions}>
            <LanguageSwitcher compact />
            <Link href="/provider/dashboard" className={styles.backLink}>
              ← Retour au dashboard
            </Link>
            <Link href="/provider/profile" className={styles.profileLink}>
              {provider.first_name} {provider.last_name}
            </Link>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          <div className={styles.pageHeader}>
            <h1>Gestion des Services</h1>
            <p className={styles.subtitle}>
              Gérez les services que vous proposez et consultez les modes de réservation
            </p>
          </div>

          {error && <div className={styles.errorAlert}>{error}</div>}
          {success && <div className={styles.successAlert}>{success}</div>}

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'my-services' ? styles.active : ''}`}
              onClick={() => setActiveTab('my-services')}
            >
              Mes Services ({providerServices.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'available-services' ? styles.active : ''}`}
              onClick={() => setActiveTab('available-services')}
            >
              Services Disponibles ({availableServices.length})
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'my-services' ? (
              <div className={styles.servicesSection}>
                {providerServices.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📋</div>
                    <h3>Aucun service ajouté</h3>
                    <p>Commencez par ajouter des services depuis l'onglet "Services Disponibles"</p>
                    <Button onClick={() => setActiveTab('available-services')} variant="primary">
                      Parcourir les services
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
                    <h3>Tous les services sont ajoutés</h3>
                    <p>Vous proposez déjà tous les services disponibles sur la plateforme</p>
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

// Composant carte de service
function ServiceCard({ service, isProviderService, onAdd, onRemove, actionLoading }) {
  const imageUrl = getServiceImageUrl(service, '400x300');

  return (
    <div className={styles.serviceCard}>
      <div className={styles.serviceImage}>
        <img src={imageUrl} alt={fixEncoding(service.name)} />
      </div>

      <div className={styles.serviceContent}>
        <div className={styles.serviceHeader}>
          <h3 className={styles.serviceName}>{fixEncoding(service.name)}</h3>
          {service.category_name && (
            <span className={styles.categoryBadge}>{fixEncoding(service.category_name)}</span>
          )}
        </div>

        <p className={styles.serviceDescription}>
          {fixEncoding(service.description)?.substring(0, 120)}
          {service.description?.length > 120 ? '...' : ''}
        </p>

        <div className={styles.serviceDetails}>
          <div className={styles.fixedPriceInfo}>
            <div className={styles.priceDisplay}>
              <ServicePrice
                amount={service.price || service.base_price}
                label="Prix"
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
              Retirer ce service
            </Button>
          ) : (
            <Button
              onClick={onAdd}
              variant="primary"
              size="small"
              fullWidth
              disabled={actionLoading}
            >
              Ajouter à mes services
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
