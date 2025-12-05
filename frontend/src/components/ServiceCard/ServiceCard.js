'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './ServiceCard.module.scss';
import { fixEncoding } from '@/lib/textUtils';
import { getServiceImageUrl } from '@/lib/serviceImages';
import Price from '@/components/Price';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ServiceCard({ service }) {
  const { t } = useLanguage();
  const {
    id,
    name,
    slug,
    description,
    price,
    base_price,
    category_name,
    average_rating,
    total_reviews,
    estimated_duration,
    duration_minutes,
    image,
    image_url,
  } = service;

  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const imageUrl = getServiceImageUrl(service, '400x300');

  return (
    <Link href={`/services/${id}`} className={styles.serviceCard} prefetch={true}>
      <div className={styles.imageContainer}>
        {imageError ? (
          <div className={styles.imagePlaceholder}>
            <span>🛠️</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={name}
            className={styles.image}
            onError={handleImageError}
          />
        )}
      </div>

      <div className={styles.content}>
        {category_name && <span className={styles.category}>{fixEncoding(category_name)}</span>}

        <h3 className={styles.title}>{fixEncoding(name)}</h3>

        <p className={styles.description}>{fixEncoding(description)}</p>

        <div className={styles.footer}>
          <div>
            <div className={styles.price}>
              <Price amount={price || base_price} />
              <span> {t('card.perService')}</span>
            </div>
            {(estimated_duration || duration_minutes) && (
              <div className={styles.duration}>
                ⏱ {estimated_duration || `${duration_minutes} min`}
              </div>
            )}
          </div>

          {average_rating && (
            <div className={styles.rating}>
              <span className={styles.star}>★</span>
              <span>
                {parseFloat(average_rating).toFixed(1)} ({total_reviews || 0})
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
