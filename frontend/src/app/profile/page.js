'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { updateClientTempData } from '@/lib/clientDataHelper';
import { useLanguage } from '@/contexts/LanguageContext';

const MOROCCAN_CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger',
  'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan',
  'Safi', 'Essaouira', 'El Jadida', 'Nador', 'Béni Mellal', 'Mohammedia'
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { t } = useLanguage();
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
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Helper pour obtenir le nom complet
  const getFullName = (userData) => {
    if (!userData) return '';
    if (userData.first_name || userData.last_name) {
      return `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
    }
    return '';
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        
        date_of_birth: user.date_of_birth || '',
        address: user.address || '',
        city: user.city || '',
        latitude: user.latitude || null,
        longitude: user.longitude || null,
      });
      setImagePreview(user.avatar || null);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('profile.imageTooBig'));
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        setError(t('profile.fileMustBeImage'));
        return;
      }

      setProfileImage(file);

      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
      setSuccess('');
    }
  };

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Si une image a été sélectionnée, l'uploader d'abord
      if (profileImage) {
        const formDataImage = new FormData();
        formDataImage.append('profile_image', profileImage);

        // Upload via fetch directement (FormData nécessite un traitement spécial)
        const token = apiClient.getToken();
        const uploadResponse = await fetch(`${apiClient.baseURL}/user/profile/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataImage,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadData.success) {
          throw new Error(uploadData.message || t('profile.uploadError'));
        }
      }

      // Mettre à jour les autres informations du profil
      const response = await apiClient.put('/user/profile', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        city: formData.city,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });
      if (response.success) {
        setSuccess(t('profile.updateSuccess'));
        setIsEditing(false);
        setProfileImage(null);

        // Mettre à jour les données locales pour les champs qui peuvent être manquants dans l'API
        updateClientTempData({
          date_of_birth: formData.date_of_birth,
          address: formData.address,
          city: formData.city,
          latitude: formData.latitude,
          longitude: formData.longitude,
          phone: formData.phone,
        });

        // Rafraîchir les données utilisateur
        await refreshUser();
      } else {
        setError(response.message || t('profile.updateError'));
      }
    } catch (err) {
      setError(err.message || t('profile.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    setProfileImage(null);
    // Réinitialiser les données du formulaire
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        
        date_of_birth: user.date_of_birth || '',
        address: user.address || '',
        city: user.city || '',
        latitude: user.latitude || null,
        longitude: user.longitude || null,
      });
      setImagePreview(user.avatar || null);
    }
  };

  if (authLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>{t('profile.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const fullName = getFullName(user);

  return (
    <div className={styles.profilePage}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>{t('profile.title')}</h1>
          <p className={styles.subtitle}>{t('profile.subtitle')}</p>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.success}>
            {success}
          </div>
        )}

        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarWrapper}>
              <div
                className={`${styles.avatar} ${isEditing ? styles.avatarEditable : ''}`}
                onClick={handleAvatarClick}
              >
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt={t('profile.profilePhoto')}
                    fill
                    className={styles.avatarImage}
                  />
                ) : (
                  <span className={styles.avatarInitial}>
                    {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              {isEditing && (
                <div className={styles.avatarOverlay} onClick={handleAvatarClick}>
                  <span className={styles.cameraIcon}>📷</span>
                  <span className={styles.uploadText}>{t('profile.change')}</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
              />
            </div>
            <div className={styles.userInfo}>
              <h2 className={styles.userName}>{fullName || t('profile.user')}</h2>
              <p className={styles.userRole}>{t('profile.clientGlamgo')}</p>
            </div>
            {!isEditing && (
              <Button
                variant="primary"
                size="small"
                onClick={() => setIsEditing(true)}
              >
                {t('profile.modify')}
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className={styles.profileForm}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="first_name" className={styles.label}>
                  {t('profile.firstName')}
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="last_name" className={styles.label}>
                  {t('profile.lastName')}
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  {t('profile.emailAddress')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={true}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  {t('profile.phone')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={styles.input}
                  placeholder="Ex: 06 12 34 56 78"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="date_of_birth" className={styles.label}>
                  {t('profile.birthDate')}
                </label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="city" className={styles.label}>
                  {t('profile.city')}
                </label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={styles.input}
                >
                  <option value="">{t('profile.selectCity')}</option>
                  {MOROCCAN_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="address" className={styles.label}>
                  {t('profile.address')}
                </label>
                {isEditing ? (
                  <AddressAutocomplete
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    onPlaceSelected={({ address, latitude, longitude }) => {
                      setFormData(prev => ({
                        ...prev,
                        address: address || prev.address,
                        latitude: latitude || prev.latitude,
                        longitude: longitude || prev.longitude,
                      }));
                    }}
                    className={styles.input}
                    placeholder={t('profile.typeAddress')}
                  />
                ) : (
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    disabled={true}
                    className={styles.input}
                  />
                )}
              </div>
            </div>

            {isEditing && (
              <div className={styles.formActions}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? t('profile.saving') : t('profile.save')}
                </Button>
              </div>
            )}
          </form>
        </div>

        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>📊</div>
            <h3 className={styles.infoTitle}>{t('profile.statistics')}</h3>
            <p className={styles.infoText}>
              {t('profile.memberSince', { date: user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'récemment' })}
            </p>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>🔒</div>
            <h3 className={styles.infoTitle}>{t('profile.security')}</h3>
            <p className={styles.infoText}>
              {t('profile.accountSecured')}
            </p>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>⭐</div>
            <h3 className={styles.infoTitle}>{t('profile.loyalty')}</h3>
            <p className={styles.infoText}>
              {t('profile.premiumServices')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
