'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { getServiceImageUrl } from '@/lib/serviceImages';
import { fixEncoding } from '@/lib/textUtils';
import ServicePrice from '@/components/Price/ServicePrice';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslatedTexts } from '@/hooks/useDeepLTranslation';

export default function ServiceDetailPage() {
  const params = useParams();
  const { t, language, toArabicNumerals } = useLanguage();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await apiClient.getService(params.id);
        if (response.success) {
          setService(response.data);
        } else {
          setError(t('serviceDetail.notFound'));
        }
      } catch (err) {
        setError(err.message || t('message.error'));
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchService();
    }
  }, [params.id, t]);

  // Traduction DeepL du contenu dynamique
  const { translated } = useTranslatedTexts({
    name: service ? fixEncoding(service.name) : '',
    description: service ? fixEncoding(service.description) : '',
    category: service?.category_name ? fixEncoding(service.category_name) : '',
  });

  if (loading) {
    return (
      <div className={styles.serviceDetailPage}>
        <div className="container">
          <div className={styles.loading}>{t('message.loading')}</div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className={styles.serviceDetailPage}>
        <div className="container">
          <Link href="/services" className={styles.backLink}>
            ← {t('serviceDetail.backToServices')}
          </Link>
          <div className={styles.error}>{t('serviceDetail.notFound')}</div>
        </div>
      </div>
    );
  }

  const {
    name,
    description,
    price,
    base_price,
    category_name,
    average_rating,
    total_reviews,
    estimated_duration,
    duration_minutes,
  } = service;

  const imageUrl = getServiceImageUrl(service, '800x600');
  const displayPrice = price || base_price;
  const displayDuration = estimated_duration || (duration_minutes ? `${toArabicNumerals(duration_minutes)} ${t('common.min')}` : null);

  // Utiliser les traductions DeepL
  const translatedName = translated.name || fixEncoding(name);
  const translatedDesc = translated.description || fixEncoding(description);
  const translatedCategory = translated.category || (category_name ? fixEncoding(category_name) : null);

  // Mode enchères désactivé
  const isBiddingEnabled = false;

  return (
    <div className={styles.serviceDetailPage}>
      <div className="container">
        <Link href="/services" className={styles.backLink}>
          ← {t('serviceDetail.backToServices')}
        </Link>

        <div className={styles.serviceDetail}>
          <div className={styles.imageSection}>
            <img
              src={imageUrl}
              alt={translatedName}
              className={styles.image}
            />
          </div>

          <div className={styles.contentSection}>
            {translatedCategory && <span className={styles.category}>{translatedCategory}</span>}

            <h1 className={styles.title}>{translatedName}</h1>

            {average_rating && (
              <div className={styles.rating}>
                <span className={styles.star}>★</span>
                <span className={styles.ratingValue}>
                  {toArabicNumerals(parseFloat(average_rating).toFixed(1))}
                </span>
                <span className={styles.reviewsCount}>
                  ({toArabicNumerals(total_reviews || 0)} {t('serviceDetail.reviews')})
                </span>
              </div>
            )}

            <p className={styles.description}>{translatedDesc}</p>

            {isBiddingEnabled && (
              <div className={styles.biddingBanner}>
                <div className={styles.biddingIcon}>🎯</div>
                <div className={styles.biddingInfo}>
                  <strong>{t('serviceDetail.biddingAvailable')}</strong>
                  <p>{t('serviceDetail.biddingDesc')}</p>
                  <p className={styles.priceRange}>
                    {t('serviceDetail.priceFrom')}: <ServicePrice amount={displayPrice} inline={true} /> ({t('serviceDetail.noMaxLimit')})
                  </p>
                </div>
              </div>
            )}

            <div className={styles.details}>
              {!isBiddingEnabled && displayPrice && (
                <ServicePrice amount={displayPrice} label={t('serviceDetail.basePrice')} />
              )}

              {displayDuration && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>{t('serviceDetail.estimatedDuration')}</span>
                  <span className={styles.detailValue}>⏱ {displayDuration}</span>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <Link href={`/booking/${params.id}${isBiddingEnabled ? '?mode=bidding' : ''}`}>
                <Button variant="primary" size="large">
                  {isBiddingEnabled ? t('serviceDetail.requestOffers') : t('serviceDetail.bookNow')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
