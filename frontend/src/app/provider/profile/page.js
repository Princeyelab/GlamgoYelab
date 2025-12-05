'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { mergeProviderData, saveProviderTempData } from '@/lib/providerDataHelper';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// URL de base pour les images
const UPLOADS_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';
import {
  SPECIALTIES_BY_CATEGORY,
  CATEGORY_LABELS,
  getSpecialtyLabel
} from '@/lib/providerSpecialties';

const MOROCCAN_CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger',
  'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan',
  'Safi', 'Essaouira', 'El Jadida', 'Nador', 'Béni Mellal', 'Mohammedia'
];

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

const DEFAULT_AVAILABILITY = {
  monday: { available: true, start: '09:00', end: '18:00' },
  tuesday: { available: true, start: '09:00', end: '18:00' },
  wednesday: { available: true, start: '09:00', end: '18:00' },
  thursday: { available: true, start: '09:00', end: '18:00' },
  friday: { available: true, start: '09:00', end: '18:00' },
  saturday: { available: true, start: '09:00', end: '18:00' },
  sunday: { available: false, start: '09:00', end: '18:00' },
};

export default function ProviderProfilePage() {
  const router = useRouter();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    latitude: null,
    longitude: null,
    cin_number: '',
    professional_license: '',
    bio: '',
    experience_years: '',
    starting_price: '',
    intervention_radius: 10,
    specialties: [],
    coverage_area: [],
    availability_schedule: DEFAULT_AVAILABILITY
  });

  const [errors, setErrors] = useState({});

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
        console.log('🔍 [PROFILE PAGE] Raw backend data:', response.data);
        console.log('🔍 [PROFILE PAGE] Backend fields:', Object.keys(response.data));

        // Fusionner avec les données locales
        const completeData = mergeProviderData(response.data);

        console.log('✅ [PROFILE PAGE] Complete merged data:', completeData);
        console.log('✅ [PROFILE PAGE] All fields:', Object.keys(completeData));
        console.log('📍 [PROFILE PAGE] Coordonnées GPS:', {
          latitude: completeData.latitude,
          longitude: completeData.longitude,
          address: completeData.address,
          city: completeData.city
        });

        setProvider(completeData);
        // Remplir le formulaire avec les données complètes
        // Parser availability_schedule si c'est une chaîne JSON
        let availabilityData = completeData.availability_schedule;
        if (typeof availabilityData === 'string') {
          try {
            availabilityData = JSON.parse(availabilityData);
          } catch (e) {
            availabilityData = DEFAULT_AVAILABILITY;
          }
        }
        setFormData({
          first_name: completeData.first_name || '',
          last_name: completeData.last_name || '',
          email: completeData.email || '',
          phone: completeData.phone || '',
          date_of_birth: completeData.date_of_birth || '',
          address: completeData.address || '',
          city: completeData.city || '',
          latitude: completeData.latitude || null,
          longitude: completeData.longitude || null,
          cin_number: completeData.cin_number || '',
          professional_license: completeData.professional_license || '',
          bio: completeData.bio || '',
          experience_years: completeData.experience_years || '',
          starting_price: completeData.starting_price || '',
          intervention_radius: completeData.intervention_radius || 10,
          specialties: completeData.specialties || [],
          coverage_area: completeData.coverage_area || [],
          availability_schedule: availabilityData || DEFAULT_AVAILABILITY
        });
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

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'select-multiple') {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData(prev => ({ ...prev, [name]: selectedOptions }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePlaceSelected = ({ address, latitude, longitude }) => {
    console.log('📍 [PROFILE] Adresse sélectionnée:', { address, latitude, longitude });
    setFormData(prev => ({
      ...prev,
      address,
      latitude,
      longitude
    }));
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: '' }));
    }
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      availability_schedule: {
        ...prev.availability_schedule,
        [day]: {
          ...prev.availability_schedule[day],
          [field]: field === 'available' ? value : value
        }
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Le prénom est requis';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Le nom est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!/^(06|07)[0-9]{8}$/.test(formData.phone)) {
      newErrors.phone = 'Le téléphone doit commencer par 06 ou 07 (10 chiffres)';
    }
    if (!formData.cin_number.trim()) {
      newErrors.cin_number = 'Le numéro CIN est requis';
    } else if (!/^[A-Z]{1,2}[0-9]{6,7}$/.test(formData.cin_number)) {
      newErrors.cin_number = 'Format CIN invalide (ex: AB123456)';
    }
    if (!formData.city) {
      newErrors.city = 'La ville est requise';
    }
    if (formData.starting_price && formData.starting_price < 0) {
      newErrors.starting_price = 'Le prix de base ne peut pas être négatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setSaving(true);
    try {
      console.log('💾 [PROFILE] Données envoyées au backend:', {
        ...formData,
        latitude: formData.latitude,
        longitude: formData.longitude
      });
      const response = await apiClient.updateProviderProfile(formData);
      if (response.success) {
        // Sauvegarder les données mises à jour localement
        saveProviderTempData(formData);

        // Mettre à jour la localisation GPS via l'API dédiée
        if (formData.latitude && formData.longitude) {
          try {
            console.log('📍 [PROFILE] Mise à jour localisation GPS:', formData.latitude, formData.longitude);
            await apiClient.updateProviderLocation(formData.latitude, formData.longitude);
            console.log('✅ [PROFILE] Localisation GPS mise à jour avec succès');
          } catch (locErr) {
            console.warn('⚠️ [PROFILE] Erreur mise à jour localisation:', locErr);
            // Ne pas bloquer la sauvegarde du profil
          }
        }

        // Fusionner les données du backend avec les nouvelles données
        const completeData = mergeProviderData(response.data);

        setSuccess('Profil mis à jour avec succès');
        setProvider(completeData);
        setIsEditing(false);
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('provider_token');
    apiClient.clearToken();
    router.push('/provider/login');
  };

  const handlePhotoClick = () => {
    if (!uploadingPhoto) {
      fileInputRef.current?.click();
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format non autorisé. Utilisez JPG, PNG ou WEBP');
      return;
    }

    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 5 MB)');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('profile_image', file);

      const response = await apiClient.uploadProviderProfileImage(formData);

      if (response.success) {
        // Mettre à jour l'avatar dans le state provider
        setProvider(prev => ({
          ...prev,
          avatar: response.data.avatar
        }));
        setSuccess('Photo de profil mise à jour');
      } else {
        setError(response.message || 'Erreur lors de l\'upload');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Erreur lors de l\'upload de la photo');
    } finally {
      setUploadingPhoto(false);
      // Reset le file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
    <div className={styles.profilePage}>
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
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          <div className={styles.profileContainer}>
            <div className={styles.profileHeader}>
              <h1>Mon Profil</h1>
              {!isEditing && (
                <Button variant="primary" onClick={() => setIsEditing(true)}>
                  Modifier le profil
                </Button>
              )}
            </div>

            {error && <div className={styles.errorAlert}>{error}</div>}
            {success && <div className={styles.successAlert}>{success}</div>}

            {!isEditing ? (
              // Mode affichage
              <div className={styles.profileView}>
                {/* Photo de profil */}
                <div className={styles.photoSection}>
                  <div
                    className={`${styles.avatarContainer} ${uploadingPhoto ? styles.uploading : ''}`}
                    onClick={handlePhotoClick}
                  >
                    {provider.avatar ? (
                      <img
                        src={`${UPLOADS_BASE_URL}${provider.avatar}`}
                        alt={`${provider.first_name} ${provider.last_name}`}
                        className={styles.avatarImage}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        <span>{provider.first_name?.charAt(0)}{provider.last_name?.charAt(0)}</span>
                      </div>
                    )}

                    {uploadingPhoto ? (
                      <div className={styles.uploadOverlay}>
                        <div className={styles.uploadSpinner}></div>
                      </div>
                    ) : (
                      <div className={styles.uploadHint}>
                        <span className={styles.cameraIcon}>📷</span>
                        <span>Modifier</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className={styles.hiddenFileInput}
                  />
                  <div className={styles.photoInfo}>
                    <h2>{provider.first_name} {provider.last_name}</h2>
                    <p className={styles.photoHint}>Cliquez sur la photo pour la modifier</p>
                  </div>
                </div>

                {/* Statut du compte */}
                <div className={styles.statusBanner}>
                  <div className={styles.statusInfo}>
                    <span className={`${styles.statusBadge} ${provider.is_verified ? styles.verified : styles.pending}`}>
                      {provider.is_verified ? '✓ Vérifié' : '⏳ En attente de vérification'}
                    </span>
                    <span className={`${styles.statusBadge} ${provider.is_active ? styles.active : styles.inactive}`}>
                      {provider.is_active ? '🟢 Actif' : '🔴 Inactif'}
                    </span>
                  </div>
                  {provider.total_reviews > 0 && (
                    <div className={styles.reviewsInfo}>
                      <span>⭐ {parseFloat(provider.rating || 0).toFixed(1)}</span>
                      <span className={styles.reviewCount}>({provider.total_reviews} avis)</span>
                    </div>
                  )}
                </div>

                <section className={styles.section}>
                  <h2>Informations personnelles</h2>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Nom complet:</span>
                      <span className={styles.value}>{provider.first_name} {provider.last_name}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Email:</span>
                      <span className={styles.value}>{provider.email}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Téléphone:</span>
                      <span className={styles.value}>{provider.phone}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Date de naissance:</span>
                      <span className={styles.value}>
                        {provider.date_of_birth
                          ? new Date(provider.date_of_birth).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          : 'Non renseignée'}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>CIN:</span>
                      <span className={styles.value}>{provider.cin_number || 'Non renseigné'}</span>
                    </div>
                    {provider.professional_license && (
                      <div className={styles.infoItem}>
                        <span className={styles.label}>Patente:</span>
                        <span className={styles.value}>{provider.professional_license}</span>
                      </div>
                    )}
                  </div>
                </section>

                <section className={styles.section}>
                  <h2>Localisation</h2>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Ville:</span>
                      <span className={styles.value}>{provider.city || 'Non renseignée'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Adresse:</span>
                      <span className={styles.value}>{provider.address || 'Non renseignée'}</span>
                    </div>
                    {provider.latitude && provider.longitude && (
                      <div className={styles.infoItem}>
                        <span className={styles.label}>Coordonnées GPS:</span>
                        <span className={styles.value}>
                          {parseFloat(provider.latitude).toFixed(6)}, {parseFloat(provider.longitude).toFixed(6)}
                        </span>
                      </div>
                    )}
                  </div>
                </section>

                <section className={styles.section}>
                  <h2>Activité professionnelle</h2>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Prix de base:</span>
                      <span className={styles.value}>
                        {provider.starting_price ? `${provider.starting_price} DH` : 'Non renseigné'}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Rayon d'intervention:</span>
                      <span className={styles.value}>
                        {provider.intervention_radius ? `${provider.intervention_radius} km` : '10 km (par défaut)'}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Années d'expérience:</span>
                      <span className={styles.value}>{provider.experience_years || 'Non renseigné'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Note moyenne:</span>
                      <span className={styles.value}>
                        ⭐ {provider.rating ? parseFloat(provider.rating).toFixed(1) : '0.0'}
                        {provider.total_reviews > 0 && ` (${provider.total_reviews} avis)`}
                      </span>
                    </div>
                  </div>

                  {provider.bio && (
                    <div className={styles.bioSection}>
                      <span className={styles.label}>Biographie:</span>
                      <p className={styles.bioText}>{provider.bio}</p>
                    </div>
                  )}

                  {provider.specialties && provider.specialties.length > 0 && (
                    <div className={styles.specialtiesSection}>
                      <span className={styles.label}>Spécialités:</span>
                      <div className={styles.tags}>
                        {(typeof provider.specialties === 'string' ?
                          JSON.parse(provider.specialties) : provider.specialties).map((specialty, index) => (
                          <span key={index} className={styles.tag}>{getSpecialtyLabel(specialty)}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {provider.coverage_area && provider.coverage_area.length > 0 && (
                    <div className={styles.coverageSection}>
                      <span className={styles.label}>Zones de couverture:</span>
                      <div className={styles.tags}>
                        {(typeof provider.coverage_area === 'string' ?
                          JSON.parse(provider.coverage_area) : provider.coverage_area).map((city, index) => (
                          <span key={index} className={styles.tag}>{city}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Section Disponibilités */}
                <section className={styles.section}>
                  <h2>Disponibilités</h2>
                  <div className={styles.availabilityGrid}>
                    {DAYS_OF_WEEK.map(({ key, label }) => {
                      const schedule = provider.availability_schedule
                        ? (typeof provider.availability_schedule === 'string'
                          ? JSON.parse(provider.availability_schedule)
                          : provider.availability_schedule)[key]
                        : DEFAULT_AVAILABILITY[key];
                      return (
                        <div key={key} className={styles.availabilityItem}>
                          <span className={styles.dayLabel}>{label}</span>
                          <span className={`${styles.availabilityStatus} ${schedule?.available ? styles.available : styles.unavailable}`}>
                            {schedule?.available
                              ? `${schedule.start} - ${schedule.end}`
                              : 'Indisponible'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : (
              // Mode édition
              <form onSubmit={handleSubmit} className={styles.profileForm}>
                <section className={styles.formSection}>
                  <h2>Informations personnelles</h2>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label htmlFor="first_name">Prénom <span className={styles.required}>*</span></label>
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.first_name ? styles.inputError : ''}`}
                      />
                      {errors.first_name && <span className={styles.error}>{errors.first_name}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="last_name">Nom <span className={styles.required}>*</span></label>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.last_name ? styles.inputError : ''}`}
                      />
                      {errors.last_name && <span className={styles.error}>{errors.last_name}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="email">Email <span className={styles.required}>*</span></label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                      />
                      {errors.email && <span className={styles.error}>{errors.email}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="phone">Téléphone <span className={styles.required}>*</span></label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0612345678"
                        className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                      />
                      {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="date_of_birth">Date de naissance</label>
                      <input
                        type="date"
                        id="date_of_birth"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                        className={styles.input}
                      />
                      <span className={styles.hint}>Vous devez avoir au moins 18 ans</span>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="cin_number">Numéro CIN <span className={styles.required}>*</span></label>
                      <input
                        type="text"
                        id="cin_number"
                        name="cin_number"
                        value={formData.cin_number}
                        onChange={handleChange}
                        placeholder="AB123456"
                        className={`${styles.input} ${errors.cin_number ? styles.inputError : ''}`}
                      />
                      {errors.cin_number && <span className={styles.error}>{errors.cin_number}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="professional_license">Patente (optionnel)</label>
                      <input
                        type="text"
                        id="professional_license"
                        name="professional_license"
                        value={formData.professional_license}
                        onChange={handleChange}
                        placeholder="Numéro de patente"
                        className={styles.input}
                      />
                    </div>
                  </div>
                </section>

                <section className={styles.formSection}>
                  <h2>Localisation</h2>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label htmlFor="city">Ville <span className={styles.required}>*</span></label>
                      <select
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={`${styles.select} ${errors.city ? styles.inputError : ''}`}
                      >
                        <option value="">Sélectionnez une ville</option>
                        {MOROCCAN_CITIES.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      {errors.city && <span className={styles.error}>{errors.city}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="address">Adresse</label>
                      <AddressAutocomplete
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={(e) => handleChange(e)}
                        onPlaceSelected={handlePlaceSelected}
                        placeholder="Tapez votre adresse..."
                        error={errors.address}
                      />
                      <span className={styles.hint}>
                        L'autocomplétion permet d'obtenir vos coordonnées GPS automatiquement
                      </span>
                      {errors.address && <span className={styles.error}>{errors.address}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="coverage_area">Zones de couverture</label>
                      <select
                        id="coverage_area"
                        name="coverage_area"
                        multiple
                        value={formData.coverage_area}
                        onChange={handleChange}
                        className={styles.multiSelect}
                        size="5"
                      >
                        {MOROCCAN_CITIES.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <span className={styles.hint}>
                        Maintenez Ctrl (Windows) ou Cmd (Mac) pour sélectionner plusieurs villes
                      </span>
                    </div>
                  </div>
                </section>

                <section className={styles.formSection}>
                  <h2>Activité professionnelle</h2>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label htmlFor="starting_price">Prix de base (DH)</label>
                      <input
                        type="number"
                        id="starting_price"
                        name="starting_price"
                        value={formData.starting_price}
                        onChange={handleChange}
                        placeholder="150"
                        min="0"
                        step="10"
                        className={`${styles.input} ${errors.starting_price ? styles.inputError : ''}`}
                      />
                      <span className={styles.hint}>
                        Votre prix de départ pour les services
                      </span>
                      {errors.starting_price && <span className={styles.error}>{errors.starting_price}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="intervention_radius">Rayon d'intervention (km)</label>
                      <input
                        type="number"
                        id="intervention_radius"
                        name="intervention_radius"
                        value={formData.intervention_radius}
                        onChange={handleChange}
                        placeholder="10"
                        min="1"
                        max="100"
                        className={styles.input}
                      />
                      <span className={styles.hint}>
                        Distance maximale pour vos interventions (1-100 km)
                      </span>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="experience_years">Années d'expérience</label>
                      <input
                        type="number"
                        id="experience_years"
                        name="experience_years"
                        value={formData.experience_years}
                        onChange={handleChange}
                        placeholder="5"
                        min="0"
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="specialties">Spécialités</label>
                      <select
                        id="specialties"
                        name="specialties"
                        multiple
                        value={formData.specialties}
                        onChange={handleChange}
                        className={styles.multiSelect}
                        size="10"
                      >
                        {Object.entries(SPECIALTIES_BY_CATEGORY).map(([categorySlug, specialties]) => (
                          <optgroup key={categorySlug} label={CATEGORY_LABELS[categorySlug]}>
                            {specialties.map(specialty => (
                              <option key={specialty.value} value={specialty.value}>
                                {specialty.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <span className={styles.hint}>
                        Maintenez Ctrl (Windows) ou Cmd (Mac) pour sélectionner plusieurs spécialités
                      </span>
                    </div>

                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="bio">Biographie</label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Présentez votre parcours, vos compétences et votre passion..."
                        rows="5"
                        className={styles.textarea}
                      />
                      <span className={styles.hint}>
                        Une bonne biographie aide les clients à vous choisir
                      </span>
                    </div>
                  </div>
                </section>

                {/* Section Disponibilités */}
                <section className={styles.formSection}>
                  <h2>Disponibilités</h2>
                  <p className={styles.sectionHint}>
                    Définissez vos horaires de travail pour chaque jour de la semaine
                  </p>
                  <div className={styles.availabilityForm}>
                    {DAYS_OF_WEEK.map(({ key, label }) => (
                      <div key={key} className={styles.availabilityRow}>
                        <div className={styles.dayToggle}>
                          <input
                            type="checkbox"
                            id={`available_${key}`}
                            checked={formData.availability_schedule[key]?.available || false}
                            onChange={(e) => handleAvailabilityChange(key, 'available', e.target.checked)}
                            className={styles.checkbox}
                          />
                          <label htmlFor={`available_${key}`} className={styles.dayName}>
                            {label}
                          </label>
                        </div>
                        {formData.availability_schedule[key]?.available && (
                          <div className={styles.timeInputs}>
                            <input
                              type="time"
                              value={formData.availability_schedule[key]?.start || '09:00'}
                              onChange={(e) => handleAvailabilityChange(key, 'start', e.target.value)}
                              className={styles.timeInput}
                            />
                            <span className={styles.timeSeparator}>à</span>
                            <input
                              type="time"
                              value={formData.availability_schedule[key]?.end || '18:00'}
                              onChange={(e) => handleAvailabilityChange(key, 'end', e.target.value)}
                              className={styles.timeInput}
                            />
                          </div>
                        )}
                        {!formData.availability_schedule[key]?.available && (
                          <span className={styles.unavailableLabel}>Indisponible</span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <div className={styles.formActions}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setErrors({});
                      // Restaurer les données originales
                      checkAuth();
                    }}
                    disabled={saving}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={saving}
                    disabled={saving}
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
