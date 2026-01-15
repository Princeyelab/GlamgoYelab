'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import ProviderNotificationDropdown from '@/components/ProviderNotificationDropdown';

export default function CustomServicesPage() {
  const router = useRouter();
  const { t, isRTL, language, translateDynamicBatch } = useLanguage();
  const [provider, setProvider] = useState(null);
  const [customServices, setCustomServices] = useState([]);
  const [translatedServices, setTranslatedServices] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal d'ajout/édition
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    duration_minutes: '60'
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Traduire les noms et descriptions des services quand la langue change
  useEffect(() => {
    const translateServices = async () => {
      if (!customServices.length || language === 'fr') {
        setTranslatedServices({});
        return;
      }

      try {
        // Collecter tous les textes à traduire
        const textsToTranslate = [];
        const indexMap = []; // Pour mapper les résultats aux services

        customServices.forEach((service, idx) => {
          if (service.name) {
            textsToTranslate.push(service.name);
            indexMap.push({ serviceId: service.id, field: 'name' });
          }
          if (service.description) {
            textsToTranslate.push(service.description);
            indexMap.push({ serviceId: service.id, field: 'description' });
          }
        });

        if (textsToTranslate.length === 0) return;

        // Traduire en batch
        const translated = await translateDynamicBatch(textsToTranslate);

        // Reconstruire l'objet de traductions
        const newTranslations = {};
        translated.forEach((text, idx) => {
          const { serviceId, field } = indexMap[idx];
          if (!newTranslations[serviceId]) {
            newTranslations[serviceId] = {};
          }
          newTranslations[serviceId][field] = text;
        });

        setTranslatedServices(newTranslations);
      } catch (error) {
        console.error('Erreur traduction services:', error);
      }
    };

    translateServices();
  }, [customServices, language, translateDynamicBatch]);

  // Helper pour obtenir le texte traduit ou l'original
  const getServiceText = (service, field) => {
    if (language === 'fr') {
      return service[field];
    }
    return translatedServices[service.id]?.[field] || service[field];
  };

  const checkAuth = async () => {
    let token = localStorage.getItem('provider_token');
    let isFromLocalStorage = true;

    if (!token) {
      token = sessionStorage.getItem('provider_token');
      isFromLocalStorage = false;
    }

    if (!token) {
      console.log('🔒 [Custom Services] Pas de token, redirection vers login');
      router.push('/provider/login');
      return;
    }

    apiClient.setToken(token, isFromLocalStorage, true);
    console.log('🔑 [Custom Services] Token chargé, appel API profile...');

    try {
      const response = await apiClient.getProviderProfile();
      if (response.success) {
        console.log('✅ [Custom Services] Profil chargé avec succès');
        setProvider(response.data);
        await loadData();
      } else {
        console.warn('⚠️ [Custom Services] Réponse API sans success, redirection');
        router.push('/provider/login');
      }
    } catch (error) {
      console.error('❌ [Custom Services] Erreur auth:', error);
      router.push('/provider/login');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les services personnalisés et les catégories
      const [servicesRes, categoriesRes] = await Promise.all([
        apiClient.getCustomServices(),
        apiClient.get('/categories')
      ]);

      if (servicesRes.success) {
        setCustomServices(servicesRes.data.services || []);
      }

      if (categoriesRes.success) {
        setCategories(categoriesRes.data || []);
      }

    } catch (error) {
      console.error('Erreur chargement:', error);
      setError(t('customServices.loadError') || 'Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      category_id: categories[0]?.id || '',
      price: '',
      duration_minutes: '60'
    });
    setSelectedImages([]);
    setExistingImages([]);
    setShowModal(true);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      category_id: service.category_id,
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString()
    });
    setSelectedImages([]);
    setExistingImages(service.images || []);
    setShowModal(true);
  };

  const handleDelete = async (serviceId) => {
    if (!confirm(t('customServices.confirmDelete') || 'Êtes-vous sûr de vouloir supprimer ce service ?')) {
      return;
    }

    try {
      const response = await apiClient.deleteCustomService(serviceId);
      if (response.success) {
        setSuccess(t('customServices.deleteSuccess') || 'Service supprimé avec succès');
        setCustomServices(customServices.filter(s => s.id !== serviceId));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || t('customServices.deleteError') || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      setError(t('customServices.deleteError') || 'Erreur lors de la suppression du service');
    }
  };

  const handleToggleActive = async (service) => {
    try {
      const response = await apiClient.updateCustomService(service.id, {
        is_active: !service.is_active
      });

      if (response.success) {
        setCustomServices(customServices.map(s =>
          s.id === service.id ? { ...s, is_active: !s.is_active } : s
        ));
      }
    } catch (error) {
      console.error('Erreur activation:', error);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + selectedImages.length + files.length;

    if (totalImages > 5) {
      setError(t('customServices.maxImages') || 'Maximum 5 images par service');
      return;
    }

    setSelectedImages([...selectedImages, ...files]);
  };

  const handleRemoveSelectedImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = async (index) => {
    if (!editingService) return;

    try {
      const response = await apiClient.deleteCustomServiceImage(editingService.id, index);
      if (response.success) {
        setExistingImages(response.data.images || []);
      }
    } catch (error) {
      console.error('Erreur suppression image:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        setError(t('customServices.nameRequired') || 'Le nom du service est requis');
        setSubmitting(false);
        return;
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        setError(t('customServices.priceRequired') || 'Le prix doit être supérieur à 0');
        setSubmitting(false);
        return;
      }

      // Créer ou mettre à jour le service
      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category_id: parseInt(formData.category_id),
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes)
      };

      let savedService;
      let serviceId;

      if (editingService) {
        const response = await apiClient.updateCustomService(editingService.id, serviceData);
        if (!response.success) {
          throw new Error(response.message || t('customServices.updateError') || 'Erreur lors de la mise à jour');
        }
        savedService = response.data.service || response.data;
        serviceId = editingService.id;
      } else {
        const response = await apiClient.createCustomService(serviceData);
        if (!response.success) {
          throw new Error(response.message || t('customServices.createError') || 'Erreur lors de la création');
        }
        savedService = response.data.service || response.data;
        serviceId = savedService.id;
      }

      console.log('Service créé/modifié:', savedService, 'ID:', serviceId);

      // Upload des nouvelles images
      if (selectedImages.length > 0 && serviceId) {
        const formDataImages = new FormData();
        selectedImages.forEach((file) => {
          formDataImages.append('images[]', file);
        });

        console.log('Upload images pour service ID:', serviceId);
        const uploadResponse = await apiClient.uploadCustomServiceImages(serviceId, formDataImages);
        console.log('Réponse upload images:', uploadResponse);
      }

      setSuccess(editingService ? (t('customServices.updateSuccess') || 'Service mis à jour avec succès') : (t('customServices.createSuccess') || 'Service créé avec succès'));
      setShowModal(false);

      // Attendre un peu pour que le backend traite l'upload
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadData();
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Erreur soumission:', error);
      setError(error.message || t('customServices.createError') || 'Erreur lors de la sauvegarde du service');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>{t('customServices.loading') || 'Chargement...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <Link href="/provider/dashboard" className={styles.backButton}>
                ←
              </Link>
              <div>
                <h1 className={styles.headerTitle}>{t('customServices.title') || 'Services Personnalisés'}</h1>
                <p className={styles.headerSubtitle}>
                  {(t('customServices.subtitle') || '{count}/10 services créés').replace('{count}', customServices.length)}
                </p>
              </div>
            </div>
            <div className={styles.headerRight}>
              <LanguageSwitcher compact />
              <ProviderNotificationDropdown />
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          {error && (
            <div className={styles.alert} style={{ background: '#fee', color: '#c00' }}>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.alert} style={{ background: '#efe', color: '#0a0' }}>
              {success}
            </div>
          )}

          <div className={styles.actions}>
            <Button
              onClick={handleAddNew}
              variant="primary"
              disabled={customServices.length >= 10}
            >
              + {t('customServices.createService') || 'Créer un service personnalisé'}
            </Button>
          </div>

          {customServices.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📦</div>
              <h3>{t('customServices.emptyTitle') || 'Aucun service personnalisé'}</h3>
              <p>{t('customServices.emptyDescription') || 'Créez vos propres services avec vos tarifs et durées personnalisés'}</p>
              <Button onClick={handleAddNew} variant="primary">
                {t('customServices.createFirstService') || 'Créer mon premier service'}
              </Button>
            </div>
          ) : (
            <div className={styles.servicesGrid}>
              {customServices.map((service) => (
                <div key={service.id} className={styles.serviceCard}>
                  {service.images && service.images.length > 0 ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}${service.images[0]}`}
                      alt={service.name}
                      className={styles.serviceImage}
                      onError={(e) => {
                        console.error('Erreur chargement image:', service.images[0]);
                        console.error('URL complète:', e.target.src);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {(!service.images || service.images.length === 0) && (
                    <div className={styles.servicePlaceholder}>📸</div>
                  )}

                  <div className={styles.serviceBody}>
                    <div className={styles.serviceHeader}>
                      <h3 className={styles.serviceName}>{getServiceText(service, 'name')}</h3>
                      <span className={`${styles.badge} ${service.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                        {service.is_active ? (t('customServices.active') || 'Actif') : (t('customServices.inactive') || 'Inactif')}
                      </span>
                    </div>

                    {service.description && (
                      <p className={styles.serviceDescription}>{getServiceText(service, 'description')}</p>
                    )}

                    <div className={styles.serviceInfo}>
                      <span className={styles.servicePrice}>{service.price} MAD</span>
                      <span className={styles.serviceDuration}>{service.duration_minutes} min</span>
                    </div>

                    <div className={styles.serviceActions}>
                      <button
                        onClick={() => handleToggleActive(service)}
                        className={styles.actionButton}
                      >
                        {service.is_active ? (t('customServices.deactivate') || 'Désactiver') : (t('customServices.activate') || 'Activer')}
                      </button>
                      <button
                        onClick={() => handleEdit(service)}
                        className={styles.actionButton}
                      >
                        {t('customServices.edit') || 'Modifier'}
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                      >
                        {t('customServices.delete') || 'Supprimer'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal d'ajout/édition */}
      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingService ? (t('customServices.modalTitleEdit') || 'Modifier le service') : (t('customServices.modalTitleNew') || 'Nouveau service personnalisé')}</h2>
              <button onClick={() => setShowModal(false)} className={styles.modalClose}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>{t('customServices.serviceName') || 'Nom du service'} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('customServices.serviceNamePlaceholder') || 'Ex: Maquillage express'}
                  maxLength={100}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t('customServices.category') || 'Catégorie'} *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>{t('customServices.price') || 'Prix (MAD)'} *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('customServices.duration') || 'Durée (minutes)'} *</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    placeholder="60"
                    min="15"
                    max="480"
                    step="15"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>{t('customServices.description') || 'Description'}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('customServices.descriptionPlaceholder') || 'Décrivez votre service...'}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t('customServices.photos') || 'Photos'} (max 5)</label>
                <div className={styles.imagesGrid}>
                  {/* Images existantes */}
                  {existingImages.map((img, index) => (
                    <div key={`existing-${index}`} className={styles.imagePreview}>
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}${img}`}
                        alt=""
                        onError={(e) => {
                          console.error('Erreur chargement image modal:', img);
                          console.error('URL complète modal:', e.target.src);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(index)}
                        className={styles.imageRemove}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Nouvelles images sélectionnées */}
                  {selectedImages.map((file, index) => (
                    <div key={`new-${index}`} className={styles.imagePreview}>
                      <img src={URL.createObjectURL(file)} alt="" />
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedImage(index)}
                        className={styles.imageRemove}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Bouton d'ajout */}
                  {existingImages.length + selectedImages.length < 5 && (
                    <label className={styles.imageAdd}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                      />
                      <span>+</span>
                    </label>
                  )}
                </div>
              </div>

              <div className={styles.formActions}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  {t('customServices.cancel') || 'Annuler'}
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? (t('customServices.saving') || 'Enregistrement...') : (editingService ? (t('customServices.update') || 'Mettre à jour') : (t('customServices.create') || 'Créer'))}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
