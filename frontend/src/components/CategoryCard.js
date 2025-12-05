'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './CategoryCard.module.scss';
import { fixEncoding } from '@/lib/textUtils';
import { useLanguage } from '@/contexts/LanguageContext';

// Mapping des images par catégorie (vraies photos Unsplash)
const CATEGORY_IMAGES = {
  // Catégories principales
  'beaute': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=250&fit=crop',
  'maison': 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=250&fit=crop',
  'voiture': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=250&fit=crop',
  'animaux': 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=250&fit=crop',
  'animal': 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=250&fit=crop',
  'bien-etre': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop',
  'bien_etre': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop',

  // Sous-catégories Beauté
  'coiffure': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=250&fit=crop',
  'coiffure-homme': 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=250&fit=crop',
  'coiffure-femme': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=250&fit=crop',
  'esthetique': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=250&fit=crop',
  'manucure-pedicure': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=250&fit=crop',
  'maquillage': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=250&fit=crop',
  'massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop',
  'epilation-femme': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=250&fit=crop',
  'epilation-homme': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop',

  // Sous-catégories Maison
  'nettoyage': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=250&fit=crop',
  'menage': 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&h=250&fit=crop',
  'plomberie': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=250&fit=crop',
  'electricite': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=250&fit=crop',
  'jardinage': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=250&fit=crop',
  'bricolage': 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&h=250&fit=crop',
  'cuisine': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=250&fit=crop',
  'cuisine-domicile': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=250&fit=crop',

  // Sous-catégories Voiture
  'lavage': 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=250&fit=crop',
  'lavage-auto': 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=250&fit=crop',
  'mecanique': 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400&h=250&fit=crop',
  'mecanique-domicile': 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400&h=250&fit=crop',

  // Sous-catégories Animaux
  'toilettage': 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400&h=250&fit=crop',
  'soins-animaux': 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=250&fit=crop',
  'veterinaire': 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400&h=250&fit=crop',

  // Bien-être
  'coaching': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop',
};

export default function CategoryCard({ category }) {
  const { t } = useLanguage();
  const { id, name, slug, description, services_count, image_url } = category;
  const [imageError, setImageError] = useState(false);

  // Générer un slug à partir du nom si non fourni
  const getSlug = () => {
    if (slug) return slug;
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const imageUrl = image_url || CATEGORY_IMAGES[getSlug()] || 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=250&fit=crop';

  return (
    <Link
      href={`/services?category=${id}`}
      className={styles.categoryCard}
    >
      <div className={styles.imageWrapper}>
        {imageError ? (
          <div className={styles.imagePlaceholder}>
            <span>{name.charAt(0)}</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={name}
            className={styles.image}
            onError={() => setImageError(true)}
          />
        )}
        <div className={styles.overlay}></div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{fixEncoding(name)}</h3>
        <p className={styles.description}>{fixEncoding(description)}</p>
        {services_count > 0 && (
          <p className={styles.count}>
            {t('card.servicesAvailable', { count: services_count })}
          </p>
        )}
      </div>
    </Link>
  );
}
