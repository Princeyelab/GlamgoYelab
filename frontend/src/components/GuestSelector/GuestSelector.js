'use client';

import { useState, useEffect } from 'react';
import styles from './GuestSelector.module.scss';
import Price from '@/components/Price';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * GuestSelector - Sélecteur de nombre de personnes
 * Utilisé pour les services type "Chef à domicile"
 * Prix = prix_par_personne x nombre_de_personnes
 */
export default function GuestSelector({
  value,
  onChange,
  minGuests = 2,
  maxGuests = 12,
  pricePerPerson,
  disabled = false,
  className
}) {
  const { t, toArabicNumerals } = useLanguage();
  const totalPrice = value * pricePerPerson;

  const handleDecrement = () => {
    if (value > minGuests && !disabled) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < maxGuests && !disabled) {
      onChange(value + 1);
    }
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.label}>{t('guestSelector.numberOfPeople')}</span>
        <span className={styles.pricePerPerson}>
          <Price amount={pricePerPerson} />{t('guestSelector.perPerson')}
        </span>
      </div>

      {/* Stepper */}
      <div className={styles.stepperContainer}>
        <button
          type="button"
          className={`${styles.stepperButton} ${value <= minGuests ? styles.stepperButtonDisabled : ''}`}
          onClick={handleDecrement}
          disabled={disabled || value <= minGuests}
        >
          <span className={styles.stepperButtonText}>-</span>
        </button>

        <div className={styles.valueContainer}>
          <span className={styles.valueText}>{toArabicNumerals(value)}</span>
          <span className={styles.valueLabel}>
            {value > 1 ? t('guestSelector.people') : t('guestSelector.person')}
          </span>
        </div>

        <button
          type="button"
          className={`${styles.stepperButton} ${value >= maxGuests ? styles.stepperButtonDisabled : ''}`}
          onClick={handleIncrement}
          disabled={disabled || value >= maxGuests}
        >
          <span className={styles.stepperButtonText}>+</span>
        </button>
      </div>

      {/* Total Price */}
      <div className={styles.totalContainer}>
        <span className={styles.totalLabel}>{t('guestSelector.totalServicePrice')}</span>
        <span className={styles.totalPrice}>
          <Price amount={totalPrice} />
        </span>
      </div>

      {/* Info */}
      <div className={styles.infoContainer}>
        <span className={styles.infoIcon}>👨‍🍳</span>
        <span className={styles.infoText}>
          {t('guestSelector.chefInfo', { count: toArabicNumerals(value) })}
        </span>
      </div>
    </div>
  );
}
