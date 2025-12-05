'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './ProviderCard.module.scss';
import Price from '@/components/Price';
import PriceBreakdown from '@/components/PriceBreakdown';
import { DistanceFeeModal } from '@/components/DistanceFeeExplainer';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Carte affichant un prestataire avec ses informations de distance et prix
 *
 * @param {Object} provider - Données du prestataire
 * @param {boolean} isNearest - Si c'est le prestataire le plus proche
 * @param {Function} onSelect - Callback de sélection
 * @param {boolean} selected - Si le prestataire est sélectionné
 * @param {boolean} compact - Mode compact pour liste
 * @param {boolean} showDistanceDetails - Afficher les détails de frais de distance
 * @param {number} serviceId - ID du service (pour recalcul du prix)
 * @param {string} formulaType - Type de formule actuelle (pour recalcul du prix)
 * @param {Object} clientLocation - Position du client {lat, lng} pour la carte dans le modal
 */
export default function ProviderCard({
  provider,
  isNearest = false,
  onSelect,
  selected = false,
  compact = false,
  showDistanceDetails = true,
  serviceId,
  formulaType = 'standard',
  clientLocation = null
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [dynamicPrice, setDynamicPrice] = useState(null);
  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const { currency } = useCurrency();
  const { t } = useLanguage();

  // Réinitialiser le prix dynamique quand la formule change
  useEffect(() => {
    setDynamicPrice(null);
  }, [formulaType]);

  // Callback pour mettre à jour le prix quand PriceBreakdown recalcule
  const handlePriceChange = (breakdown) => {
    if (breakdown?.total) {
      setDynamicPrice(breakdown.total);
    }
  };

  if (!provider) return null;

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
    distance,
    distance_formatted,
    rating,
    total_reviews,
    is_available,
    is_available_now,
    next_availability,
    base_price,
    distance_fee = 0,
    extra_km,
    extra_distance_km,
    calculated_price,
    price_breakdown,
    within_intervention_radius,
    intervention_radius_km,
    price_per_extra_km,
    duration_minutes,
    service_name
  } = provider;

  // Photo de profil avec plusieurs fallbacks possibles
  // Vérifier aussi les objets imbriqués (user, provider)
  const profilePhoto = avatar
    || profile_photo
    || photo_url
    || profile_image
    || photo
    || provider.user?.profile_photo
    || provider.user?.avatar
    || provider.user?.photo
    || provider.provider?.profile_photo
    || provider.provider?.avatar;

  // Données pour le calcul de distance
  const distanceCalculation = {
    distance_km: distance || 0,
    is_in_radius: within_intervention_radius !== false && distance_fee <= 0,
    intervention_radius_km: intervention_radius_km || price_breakdown?.intervention_radius_km || 10,
    extra_distance_km: extra_distance_km || extra_km || price_breakdown?.extra_distance_km || 0,
    price_per_extra_km: price_per_extra_km || price_breakdown?.price_per_extra_km || 5,
    fee: distance_fee || price_breakdown?.distance_fee || 0
  };

  // Nom du prestataire avec fallbacks
  const name = rawName
    || business_name
    || (first_name && last_name ? `${first_name} ${last_name}` : null)
    || first_name
    || t('provider.defaultName');

  const handleSelect = () => {
    if (onSelect) {
      onSelect(provider);
    }
  };

  const toggleBreakdown = (e) => {
    e.stopPropagation();
    setShowBreakdown(!showBreakdown);
  };

  const openDistanceModal = (e) => {
    e.stopPropagation();
    setShowDistanceModal(true);
  };

  // Générer les étoiles de rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

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

  return (
    <div
      className={`${styles.providerCard} ${isNearest ? styles.nearest : ''} ${selected ? styles.selected : ''} ${compact ? styles.compact : ''}`}
      onClick={handleSelect}
    >
      {/* Badge le plus proche */}
      {isNearest && (
        <div className={styles.nearestBadge}>
          <span className={styles.badgeIcon}>⭐</span>
          <span>{t('provider.nearest')}</span>
        </div>
      )}

      {/* En-tête avec avatar et infos */}
      <div className={styles.header}>
        <div className={styles.avatarContainer}>
          {!imageError && profilePhoto ? (
            <Image
              src={profilePhoto.startsWith('http') ? profilePhoto : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080'}${profilePhoto}`}
              alt={name}
              width={compact ? 48 : 64}
              height={compact ? 48 : 64}
              className={styles.avatar}
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {name?.charAt(0) || 'P'}
            </div>
          )}
          {is_available && (
            <span className={`${styles.statusDot} ${is_available_now ? styles.online : styles.scheduled}`} />
          )}
        </div>

        <div className={styles.info}>
          <h3 className={styles.name}>{name}</h3>
          {business_name && business_name !== name && (
            <p className={styles.businessName}>{business_name}</p>
          )}
          <div className={styles.rating}>
            <div className={styles.stars}>{renderStars(parseFloat(rating) || 0)}</div>
            <span className={styles.ratingValue}>{(parseFloat(rating) || 0).toFixed(1)}</span>
            <span className={styles.reviewCount}>({total_reviews || 0} {t('common.reviews')})</span>
          </div>
        </div>
      </div>

      {/* Informations de distance et disponibilité */}
      <div className={styles.details}>
        <div className={styles.distanceSection}>
          <div className={styles.distance}>
            <span className={styles.distanceIcon}>📍</span>
            <span className={styles.distanceText}>
              {t('provider.distance', { distance: distance_formatted || `${distance?.toFixed(1)} km` })}
            </span>
          </div>

          {/* Badge de frais de distance */}
          {distanceCalculation.is_in_radius ? (
            <div className={styles.inRadiusBadge}>
              <span className={styles.badgeIconSmall}>✅</span>
              <span>{t('provider.noDistanceFee')}</span>
            </div>
          ) : (
            <button
              className={styles.distanceFeeBadge}
              onClick={openDistanceModal}
              type="button"
            >
              <span className={styles.badgeIconSmall}>ℹ️</span>
              <span className={styles.distanceFeeAmount}>
                {t('provider.distanceFeeAmount', { fee: distanceCalculation.fee.toFixed(0), currency })}
              </span>
              <span className={styles.infoLink}>{t('provider.seeDetails')}</span>
            </button>
          )}
        </div>

        {/* Détails des frais de distance (si hors rayon) */}
        {showDistanceDetails && !distanceCalculation.is_in_radius && !compact && (
          <div className={styles.distanceFeeDetails}>
            <div className={styles.feeBreakdown}>
              <span>{t('provider.interventionRadius', { radius: distanceCalculation.intervention_radius_km })}</span>
              <span>{t('provider.extraDistance', { distance: Math.ceil(distanceCalculation.extra_distance_km) })}</span>
              <span>{t('provider.rate', { rate: distanceCalculation.price_per_extra_km, currency })}</span>
            </div>
          </div>
        )}

        <div className={styles.availability}>
          {is_available_now ? (
            <span className={styles.availableNow}>
              <span className={styles.availIcon}>🟢</span>
              {t('provider.available')}
            </span>
          ) : is_available ? (
            <span className={styles.availableLater}>
              <span className={styles.availIcon}>📅</span>
              {t('provider.availableFrom')} {next_availability || '---'}
            </span>
          ) : (
            <span className={styles.unavailable}>
              <span className={styles.availIcon}>🔴</span>
              {t('provider.unavailable')}
            </span>
          )}
        </div>
      </div>

      {/* Prix */}
      <div className={styles.priceSection}>
        <div className={styles.priceMain}>
          <span className={styles.priceLabel}>{t('provider.totalPrice')}</span>
          <span className={styles.priceValue}>
            <Price amount={dynamicPrice || calculated_price} />
          </span>
        </div>

        <button
          className={styles.breakdownToggle}
          onClick={toggleBreakdown}
          type="button"
        >
          {showBreakdown ? t('provider.hideDetails') : t('provider.priceDetails')}
          <span className={`${styles.chevron} ${showBreakdown ? styles.open : ''}`}>▼</span>
        </button>
      </div>

      {/* Breakdown du prix - toujours monté pour calculer le prix dynamique */}
      <div className={styles.breakdownContainer} style={{ display: showBreakdown ? 'block' : 'none' }}>
        {serviceId ? (
          <PriceBreakdown
            key={`provider-${id}-${formulaType}`}
            serviceId={serviceId}
            formulaType={formulaType}
            distanceKm={distance || 0}
            compact={true}
            onPriceChange={handlePriceChange}
          />
        ) : price_breakdown ? (
          <PriceBreakdown breakdown={price_breakdown} compact={true} />
        ) : null}
      </div>

      {/* Durée du service */}
      {duration_minutes && !compact && (
        <div className={styles.duration}>
          <span className={styles.durationIcon}>⏱️</span>
          <span>{t('provider.estimatedDurationMin', { duration: duration_minutes })}</span>
        </div>
      )}

      {/* Bouton de sélection */}
      {onSelect && (
        <button
          className={`${styles.selectButton} ${selected ? styles.selectedBtn : ''}`}
          onClick={handleSelect}
          type="button"
        >
          {selected ? `✓ ${t('provider.selected')}` : t('provider.select')}
        </button>
      )}

      {/* Modal explicative des frais de déplacement */}
      <DistanceFeeModal
        isOpen={showDistanceModal}
        onClose={() => setShowDistanceModal(false)}
        provider={provider}
        clientLocation={clientLocation}
        distanceCalculation={distanceCalculation}
      />
    </div>
  );
}
