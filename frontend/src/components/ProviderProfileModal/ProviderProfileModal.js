'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './ProviderProfileModal.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/apiClient';
import Button from '@/components/Button';

/**
 * ProviderProfileModal - Modal détaillé du profil prestataire
 *
 * Affiche toutes les informations du prestataire:
 * - Photo, nom, note moyenne
 * - Statistiques (services complétés, temps de réponse, taux d'acceptation)
 * - Spécialités/badges
 * - Avis récents
 *
 * @param {boolean} isOpen - Contrôle l'affichage du modal
 * @param {Function} onClose - Callback de fermeture
 * @param {Object} provider - Données du prestataire
 * @param {Function} onSelect - Callback de sélection du prestataire
 */
export default function ProviderProfileModal({
  isOpen,
  onClose,
  provider,
  onSelect
}) {
  const { t, toArabicNumerals, locale } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Charger les avis et stats quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && provider?.id) {
      loadProviderData();
    }
  }, [isOpen, provider?.id]);

  const loadProviderData = async () => {
    if (!provider?.id) return;

    setReviewsLoading(true);
    try {
      const response = await apiClient.get(`/providers/${provider.id}/reviews`);
      if (response.success && response.data) {
        const reviewsData = response.data.reviews || response.data || [];
        setReviews(Array.isArray(reviewsData) ? reviewsData.slice(0, 5) : []);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  if (!isOpen || !provider) return null;

  // Extraire les données du provider
  const {
    id,
    name: rawName,
    business_name,
    first_name,
    last_name,
    avatar,
    profile_photo,
    photo_url,
    profile_image,
    photo,
    rating,
    total_reviews,
    completed_services,
    response_time,
    acceptance_rate,
    specialties,
    bio,
    description
  } = provider;

  // Photo de profil avec fallbacks
  const profilePhoto = avatar
    || profile_photo
    || photo_url
    || profile_image
    || photo
    || provider.user?.profile_photo
    || provider.user?.avatar;

  // Nom du prestataire
  const name = rawName
    || business_name
    || (first_name && last_name ? `${first_name} ${last_name}` : null)
    || first_name
    || t('provider.defaultName');

  // Générer les étoiles
  const renderStars = (ratingValue) => {
    const stars = [];
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className={styles.starFull}>★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className={styles.starHalf}>★</span>);
      } else {
        stars.push(<span key={i} className={styles.starEmpty}>☆</span>);
      }
    }
    return stars;
  };

  // Formater date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Formater le temps de réponse
  const formatResponseTime = (minutes) => {
    if (!minutes) return t('provider.responseTimeUnknown') || '---';
    if (minutes < 60) return `${toArabicNumerals(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    return `${toArabicNumerals(hours)}h`;
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(provider);
    }
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>

          <div className={styles.profileHeader}>
            <div className={styles.avatarWrapper}>
              {!imageError && profilePhoto ? (
                <Image
                  src={profilePhoto.startsWith('http') ? profilePhoto : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080'}${profilePhoto}`}
                  alt={name}
                  width={100}
                  height={100}
                  className={styles.avatar}
                  onError={() => setImageError(true)}
                  unoptimized
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {name?.charAt(0) || 'P'}
                </div>
              )}
            </div>

            <h2 className={styles.name}>{name}</h2>
            {business_name && business_name !== name && (
              <p className={styles.businessName}>{business_name}</p>
            )}

            <div className={styles.ratingSection}>
              <div className={styles.stars}>{renderStars(parseFloat(rating) || 0)}</div>
              <span className={styles.ratingValue}>
                {toArabicNumerals((parseFloat(rating) || 0).toFixed(1))}
              </span>
              <span className={styles.reviewCount}>
                ({toArabicNumerals(total_reviews || 0)} {t('common.reviews')})
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Bio/Description */}
          {(bio || description) && (
            <div className={styles.bioSection}>
              <p>{bio || description}</p>
            </div>
          )}

          {/* Stats */}
          <div className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>{t('provider.stats') || 'Statistiques'}</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>✅</span>
                <span className={styles.statValue}>
                  {toArabicNumerals(stats?.completed_count || completed_services || 0)}
                </span>
                <span className={styles.statLabel}>{t('provider.completedServices')}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>⚡</span>
                <span className={styles.statValue}>
                  {formatResponseTime(stats?.avg_response_time || response_time)}
                </span>
                <span className={styles.statLabel}>{t('provider.responseTime')}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>👍</span>
                <span className={styles.statValue}>
                  {toArabicNumerals(stats?.acceptance_rate || acceptance_rate || 0)}%
                </span>
                <span className={styles.statLabel}>{t('provider.acceptanceRate')}</span>
              </div>
            </div>
          </div>

          {/* Specialties */}
          {specialties && specialties.length > 0 && (
            <div className={styles.specialtiesSection}>
              <h3 className={styles.sectionTitle}>{t('provider.specialties') || 'Spécialités'}</h3>
              <div className={styles.specialtiesList}>
                {specialties.map((spec, index) => (
                  <span key={index} className={styles.specialtyBadge}>{spec}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Reviews */}
          <div className={styles.reviewsSection}>
            <h3 className={styles.sectionTitle}>{t('provider.recentReviews')}</h3>

            {reviewsLoading ? (
              <div className={styles.reviewsLoading}>
                <div className={styles.spinner}></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className={styles.noReviews}>
                <span className={styles.noReviewsIcon}>📝</span>
                <p>{t('provider.noReviews')}</p>
              </div>
            ) : (
              <div className={styles.reviewsList}>
                {reviews.map((review, index) => (
                  <div key={review.id || index} className={styles.reviewItem}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.reviewerAvatar}>
                        {(review.user_first_name || review.user_name || 'C').charAt(0)}
                      </div>
                      <div className={styles.reviewerInfo}>
                        <span className={styles.reviewerName}>
                          {review.user_first_name
                            ? `${review.user_first_name} ${review.user_last_name || ''}`.trim()
                            : review.user_name || t('provider.anonymousClient')}
                        </span>
                        <span className={styles.reviewDate}>{formatDate(review.created_at)}</span>
                      </div>
                      <div className={styles.reviewRating}>
                        {renderStars(parseFloat(review.rating) || 0)}
                      </div>
                    </div>
                    {review.comment && (
                      <p className={styles.reviewComment}>{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {onSelect && (
          <div className={styles.footer}>
            <Button variant="primary" onClick={handleSelect} fullWidth>
              {t('provider.selectProvider')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
