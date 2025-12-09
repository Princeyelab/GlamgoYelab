'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './ServiceCard.module.scss';
import { fixEncoding } from '@/lib/textUtils';
import { getServiceImageUrl } from '@/lib/serviceImages';
import Price from '@/components/Price';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ServiceCard({ service }) {
  const { t, language, translateDynamicBatch } = useLanguage();
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

  // Textes originaux (français)
  const fixedName = fixEncoding(name);
  const fixedDesc = fixEncoding(description);
  const fixedCategory = category_name ? fixEncoding(category_name) : null;

  // États pour les traductions DeepL
  const [translatedName, setTranslatedName] = useState(fixedName);
  const [translatedDesc, setTranslatedDesc] = useState(fixedDesc);
  const [translatedCategory, setTranslatedCategory] = useState(fixedCategory);

  // Utiliser DeepL pour traduire en arabe
  useEffect(() => {
    if (language !== 'ar') {
      // En français, utiliser le texte original
      setTranslatedName(fixedName);
      setTranslatedDesc(fixedDesc);
      setTranslatedCategory(fixedCategory);
      return;
    }

    // Traduire avec DeepL
    const textsToTranslate = [fixedName, fixedDesc, fixedCategory].filter(Boolean);

    translateDynamicBatch(textsToTranslate).then(translations => {
      let idx = 0;
      if (fixedName) setTranslatedName(translations[idx++]);
      if (fixedDesc) setTranslatedDesc(translations[idx++]);
      if (fixedCategory) setTranslatedCategory(translations[idx]);
    }).catch(err => {
      console.error('DeepL translation failed:', err);
    });
  }, [language, fixedName, fixedDesc, fixedCategory, translateDynamicBatch]);

  const handleImageError = () => {
    setImageError(true);
  };

  const imageUrl = getServiceImageUrl(service, '400x300');

  return (
    <Link prefetch={false} href={`/services/${id}`} className={styles.serviceCard} prefetch={true}>
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
        {translatedCategory && <span className={styles.category}>{translatedCategory}</span>}

        <h3 className={styles.title}>{translatedName}</h3>

        <p className={styles.description}>{translatedDesc}</p>

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
