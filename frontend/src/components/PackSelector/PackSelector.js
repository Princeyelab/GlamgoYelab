'use client';

import { useState, useEffect } from 'react';
import styles from './PackSelector.module.scss';
import Price from '@/components/Price';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * PackSelector - Sélecteur de pack/forfait
 * Utilisé pour les services type "Coach Sportif"
 * Packs avec nombre de séances et prix fixes
 */

export const COACH_PACKS = [
  {
    id: 'decouverte',
    name: 'Découverte',
    sessions: 4,
    price: 700,
    pricePerSession: 175,
    icon: '🎯',
  },
  {
    id: 'classique',
    name: 'Classique',
    sessions: 8,
    price: 1200,
    pricePerSession: 150,
    discount: 17,
    popular: true,
    icon: '⭐',
  },
  {
    id: 'intensif',
    name: 'Intensif',
    sessions: 12,
    price: 1500,
    pricePerSession: 125,
    discount: 29,
    icon: '💪',
  },
];

export default function PackSelector({
  packs = COACH_PACKS,
  selectedPackId,
  onChange,
  disabled = false,
  className
}) {
  const { t, toArabicNumerals } = useLanguage();
  const selectedPack = packs.find(p => p.id === selectedPackId);

  const handleSelect = (packId) => {
    if (!disabled) {
      onChange(packId);
    }
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.label}>{t('packSelector.chooseProgram')}</span>
      </div>

      {/* Pack Options */}
      <div className={styles.packsContainer}>
        {packs.map((pack) => {
          const isSelected = pack.id === selectedPackId;

          return (
            <button
              key={pack.id}
              type="button"
              className={`${styles.packCard} ${isSelected ? styles.packCardSelected : ''} ${pack.popular ? styles.packCardPopular : ''}`}
              onClick={() => handleSelect(pack.id)}
              disabled={disabled}
            >
              {/* Popular Badge */}
              {pack.popular && (
                <div className={styles.popularBadge}>
                  <span className={styles.popularBadgeText}>{t('packSelector.popular')}</span>
                </div>
              )}

              {/* Radio Button */}
              <div className={styles.radioContainer}>
                <div className={`${styles.radioOuter} ${isSelected ? styles.radioOuterSelected : ''}`}>
                  {isSelected && <div className={styles.radioInner} />}
                </div>
              </div>

              {/* Pack Info */}
              <div className={styles.packInfo}>
                <div className={styles.packHeader}>
                  <span className={styles.packIcon}>{pack.icon}</span>
                  <span className={`${styles.packName} ${isSelected ? styles.packNameSelected : ''}`}>
                    {t('packSelector.pack')} {pack.name}
                  </span>
                </div>
                <span className={styles.packSessions}>
                  {toArabicNumerals(pack.sessions)} {t('packSelector.sessions')}
                </span>
              </div>

              {/* Price */}
              <div className={styles.priceContainer}>
                <span className={`${styles.packPrice} ${isSelected ? styles.packPriceSelected : ''}`}>
                  <Price amount={pack.price} />
                </span>
                {pack.discount && (
                  <span className={styles.discountBadge}>
                    -{toArabicNumerals(pack.discount)}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Pack Summary */}
      {selectedPack && (
        <div className={styles.summaryContainer}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>{t('packSelector.selectedProgram')}</span>
            <span className={styles.summaryValue}>
              {selectedPack.icon} {selectedPack.name} ({toArabicNumerals(selectedPack.sessions)} {t('packSelector.sessions')})
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>{t('packSelector.pricePerSession')}</span>
            <span className={styles.summaryValue}>
              <Price amount={selectedPack.pricePerSession} />
            </span>
          </div>
          <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
            <span className={styles.totalLabel}>{t('packSelector.totalPrice')}</span>
            <span className={styles.totalPrice}>
              <Price amount={selectedPack.price} />
            </span>
          </div>
        </div>
      )}

      {/* Info */}
      <div className={styles.infoContainer}>
        <span className={styles.infoIcon}>🏋️</span>
        <span className={styles.infoText}>
          {t('packSelector.info')}
        </span>
      </div>
    </div>
  );
}
