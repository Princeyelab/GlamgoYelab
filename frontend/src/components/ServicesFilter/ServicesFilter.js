'use client';

import { useState, useMemo, useEffect } from 'react';
import ServiceCard from '@/components/ServiceCard';
import styles from './ServicesFilter.module.scss';
import { fixEncoding } from '@/lib/textUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslatedList } from '@/hooks/useDeepLTranslation';

const RADIUS_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 15, label: '15 km' },
  { value: 20, label: '20 km' },
  { value: 30, label: '30 km' },
];

export default function ServicesFilter({ services, categories, initialCategoryId = 'all', initialSearch = '' }) {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [searchRadius, setSearchRadius] = useState(10);

  // Traduire les noms des catégories avec DeepL
  const { translatedItems: translatedCategories } = useTranslatedList(categories, ['name']);

  // Charger le rayon depuis localStorage au montage
  useEffect(() => {
    const savedRadius = localStorage.getItem('searchRadius');
    if (savedRadius) {
      setSearchRadius(parseInt(savedRadius));
    }
  }, []);

  // Mettre à jour le terme de recherche si initialSearch change
  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);

  // Sauvegarder le rayon dans localStorage quand il change
  const handleRadiusChange = (value) => {
    setSearchRadius(value);
    localStorage.setItem('searchRadius', value.toString());
  };

  // Obtenir les IDs des sous-catégories d'une catégorie parente
  const getSubcategoryIds = (parentId) => {
    const category = categories.find(cat => cat.id === parseInt(parentId));
    if (category && category.sub_categories && category.sub_categories.length > 0) {
      return category.sub_categories.map(sub => sub.id);
    }
    return [];
  };

  // Filtrer les services
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      let matchesCategory = selectedCategory === 'all';

      if (!matchesCategory) {
        const categoryId = parseInt(selectedCategory);
        // Vérifier si c'est une catégorie parente (qui a des sous-catégories)
        const subcategoryIds = getSubcategoryIds(categoryId);

        if (subcategoryIds.length > 0) {
          // C'est une catégorie parente, inclure les services de ses sous-catégories
          matchesCategory = subcategoryIds.includes(service.category_id);
        } else {
          // C'est une sous-catégorie directe
          matchesCategory = service.category_id === categoryId;
        }
      }

      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            service.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, searchTerm, categories]);

  return (
    <>
      <div className={styles.filters}>
        <div className={styles.filtersRow}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder={t('services.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.radiusFilter}>
            <label className={styles.radiusLabel}>
              <span className={styles.radiusIcon}>📍</span>
              {t('services.radius')}:
            </label>
            <select
              value={searchRadius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
              className={styles.radiusSelect}
            >
              {RADIUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.categoryFilters}>
          <button
            className={`${styles.categoryBtn} ${selectedCategory === 'all' ? styles.active : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            {t('services.allCategories')}
          </button>
          {translatedCategories.map((category) => (
            <button
              key={category.id}
              className={`${styles.categoryBtn} ${selectedCategory === String(category.id) ? styles.active : ''}`}
              onClick={() => setSelectedCategory(String(category.id))}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className={styles.noResults}>
          <p>{t('services.noResults')}</p>
          <p className={styles.noResultsHint}>
            {t('services.noResultsHint')}
          </p>
        </div>
      ) : (
        <>
          <p className={styles.resultsCount}>
            {t('services.resultsCount', { count: filteredServices.length })}
          </p>
          <div className={styles.servicesGrid}>
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
