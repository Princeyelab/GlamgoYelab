'use client';

/**
 * SatisfactionModal - Questionnaire de satisfaction post-prestation
 *
 * Modal avec stepper en 3 etapes:
 * 1. Note qualite (obligatoire)
 * 2. Details: ponctualite, prix, professionnalisme
 * 3. Commentaire et photos (optionnels)
 *
 * GlamGo - Marrakech
 * @since 2025-11-28
 */

import { useState, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import Price from '@/components/Price';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './SatisfactionModal.module.scss';

/**
 * Composant etoile pour les ratings
 */
const StarRating = ({ value, onChange, size = 'normal', disabled = false, t }) => {
  const [hoverValue, setHoverValue] = useState(0);

  const handleClick = (rating) => {
    if (!disabled && onChange) {
      onChange(rating);
    }
  };

  const getStarLabel = (star) => {
    if (star === 1) return t('satisfaction.starLabel', { n: star });
    return t('satisfaction.starsLabel', { n: star });
  };

  return (
    <div className={`${styles.starRating} ${styles[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${styles.star} ${(hoverValue || value) >= star ? styles.filled : ''} ${disabled ? styles.disabled : ''}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onMouseLeave={() => !disabled && setHoverValue(0)}
          role="button"
          aria-label={getStarLabel(star)}
        >
          {(hoverValue || value) >= star ? '\u2605' : '\u2606'}
        </span>
      ))}
    </div>
  );
};

/**
 * Labels descriptifs pour les notes (clés de traduction)
 */
const ratingLabelKeys = {
  0: 'satisfaction.ratingClick',
  1: 'satisfaction.ratingVeryUnsatisfied',
  2: 'satisfaction.ratingUnsatisfied',
  3: 'satisfaction.ratingCorrect',
  4: 'satisfaction.ratingSatisfied',
  5: 'satisfaction.ratingExcellent'
};

export default function SatisfactionModal({ order, onClose, onSubmit }) {
  // Etape actuelle (1, 2 ou 3)
  const [step, setStep] = useState(1);
  const { currency } = useCurrency();
  const { t, isRTL, language, toArabicNumerals, formatNumber, locale } = useLanguage();

  // Donnees du formulaire
  const [formData, setFormData] = useState({
    quality_rating: 0,
    punctuality: null,
    price_respected: null,
    professionalism_rating: 0,
    comment: '',
    photos: [],
    tip: 0,
    customTip: '',
    showCustomTip: false
  });

  // Etats UI
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  /**
   * Met a jour une valeur du formulaire
   */
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  }, []);

  /**
   * Validation etape 1
   */
  const validateStep1 = () => {
    if (formData.quality_rating === 0) {
      setError(t('satisfaction.errorQuality'));
      return false;
    }
    return true;
  };

  /**
   * Validation etape 2
   */
  const validateStep2 = () => {
    if (formData.punctuality === null) {
      setError(t('satisfaction.errorPunctuality'));
      return false;
    }
    if (formData.price_respected === null) {
      setError(t('satisfaction.errorPrice'));
      return false;
    }
    return true;
  };

  /**
   * Passer a l'etape suivante
   */
  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(prev => Math.min(prev + 1, 3));
    setError('');
  };

  /**
   * Revenir a l'etape precedente
   */
  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  /**
   * Soumettre le questionnaire
   */
  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;

    setSubmitting(true);
    setError('');

    // Calculer le pourboire final
    const tipAmount = formData.customTip ? parseInt(formData.customTip) || 0 : formData.tip;

    try {
      const response = await apiClient.submitSatisfaction(order.id, {
        quality_rating: formData.quality_rating,
        punctuality: formData.punctuality,
        price_respected: formData.price_respected,
        professionalism_rating: formData.professionalism_rating > 0 ? formData.professionalism_rating : null,
        comment: formData.comment.trim() || null,
        photos: formData.photos,
        tip: tipAmount > 0 ? tipAmount : null
      });

      if (response.success) {
        if (onSubmit) {
          onSubmit(response.data);
        }
        onClose();
      } else {
        setError(response.message || t('satisfaction.errorSubmit'));
      }
    } catch (err) {
      setError(err.message || t('satisfaction.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Gestion upload photos (simplifie - a ameliorer)
   */
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    // TODO: Implementer upload vers serveur
    // Pour l'instant on stocke juste les noms
    const photoNames = files.map(f => f.name);
    updateField('photos', [...formData.photos, ...photoNames].slice(0, 4));
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2>{t('satisfaction.title')}</h2>
          <p>{t('satisfaction.subtitle')}</p>
          <button className={styles.closeButton} onClick={onClose} aria-label={t('satisfaction.close')}>
            &times;
          </button>
        </div>

        {/* Stepper */}
        <div className={styles.stepper}>
          <div className={`${styles.step} ${step >= 1 ? styles.active : ''} ${step > 1 ? styles.completed : ''}`}>
            <span className={styles.stepNumber}>{toArabicNumerals(1)}</span>
            <span className={styles.stepLabel}>{t('satisfaction.stepQuality')}</span>
          </div>
          <div className={styles.stepLine}></div>
          <div className={`${styles.step} ${step >= 2 ? styles.active : ''} ${step > 2 ? styles.completed : ''}`}>
            <span className={styles.stepNumber}>{toArabicNumerals(2)}</span>
            <span className={styles.stepLabel}>{t('satisfaction.stepDetails')}</span>
          </div>
          <div className={styles.stepLine}></div>
          <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
            <span className={styles.stepNumber}>{toArabicNumerals(3)}</span>
            <span className={styles.stepLabel}>{t('satisfaction.stepComment')}</span>
          </div>
        </div>

        {/* Contenu des etapes */}
        <div className={styles.content}>
          {/* Etape 1: Note qualite */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <h3>{t('satisfaction.qualityQuestion')}</h3>

              <div className={styles.ratingContainer}>
                <StarRating
                  value={formData.quality_rating}
                  onChange={(val) => updateField('quality_rating', val)}
                  size="large"
                  t={t}
                />
                <p className={styles.ratingLabel}>
                  {t(ratingLabelKeys[formData.quality_rating])}
                </p>
              </div>

              <button
                className={styles.btnNext}
                disabled={formData.quality_rating === 0}
                onClick={nextStep}
              >
                {t('satisfaction.next')}
              </button>
            </div>
          )}

          {/* Etape 2: Details */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <div className={styles.question}>
                <label>{t('satisfaction.punctualityQuestion')}</label>
                <div className={styles.radioGroup}>
                  <button
                    className={`${styles.radioBtn} ${formData.punctuality === true ? styles.selected : ''}`}
                    onClick={() => updateField('punctuality', true)}
                  >
                    <span className={styles.radioIcon}>&#10003;</span> {t('satisfaction.yes')}
                  </button>
                  <button
                    className={`${styles.radioBtn} ${formData.punctuality === false ? styles.selected : ''}`}
                    onClick={() => updateField('punctuality', false)}
                  >
                    <span className={styles.radioIcon}>&#10007;</span> {t('satisfaction.no')}
                  </button>
                </div>
              </div>

              <div className={styles.question}>
                <label>{t('satisfaction.priceQuestion')}</label>
                <div className={styles.radioGroup}>
                  <button
                    className={`${styles.radioBtn} ${formData.price_respected === true ? styles.selected : ''}`}
                    onClick={() => updateField('price_respected', true)}
                  >
                    <span className={styles.radioIcon}>&#10003;</span> {t('satisfaction.yes')}
                  </button>
                  <button
                    className={`${styles.radioBtn} ${formData.price_respected === false ? styles.selected : ''}`}
                    onClick={() => updateField('price_respected', false)}
                  >
                    <span className={styles.radioIcon}>&#10007;</span> {t('satisfaction.no')}
                  </button>
                </div>
              </div>

              <div className={styles.question}>
                <label>{t('satisfaction.professionalismLabel')}</label>
                <StarRating
                  value={formData.professionalism_rating}
                  onChange={(val) => updateField('professionalism_rating', val)}
                  size="small"
                  t={t}
                />
              </div>

              <div className={styles.stepActions}>
                <button className={styles.btnBack} onClick={prevStep}>
                  {t('satisfaction.back')}
                </button>
                <button
                  className={styles.btnNext}
                  disabled={formData.punctuality === null || formData.price_respected === null}
                  onClick={nextStep}
                >
                  {t('satisfaction.next')}
                </button>
              </div>
            </div>
          )}

          {/* Etape 3: Pourboire et Commentaire */}
          {step === 3 && (
            <div className={styles.stepContent}>
              {/* Section Pourboire (uniquement pour paiement par carte) */}
              {order.payment_method === 'card' && (
                <div className={styles.tipSection}>
                  <div className={styles.tipHeader}>
                    <span className={styles.tipIcon}>💝</span>
                    <div>
                      <label>{t('satisfaction.tipQuestion')}</label>
                      <p className={styles.tipHint}>{t('satisfaction.tipHint', { providerName: order.provider_name || order.provider_first_name })}</p>
                    </div>
                  </div>

                  <div className={styles.tipOptions}>
                    {[0, 10, 20, 50].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        className={`${styles.tipOption} ${formData.tip === amount && !formData.showCustomTip ? styles.selected : ''}`}
                        onClick={() => {
                          updateField('tip', amount);
                          updateField('customTip', '');
                          updateField('showCustomTip', false);
                        }}
                      >
                        {amount === 0 ? t('satisfaction.tipNoThanks') : `${toArabicNumerals(amount)} ${currency}`}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`${styles.tipOption} ${styles.tipCustom} ${formData.showCustomTip ? styles.selected : ''}`}
                      onClick={() => {
                        updateField('showCustomTip', true);
                        updateField('tip', 0);
                        updateField('customTip', '');
                        // Focus sur l'input après un court délai
                        setTimeout(() => document.getElementById('customTipInput')?.focus(), 100);
                      }}
                    >
                      {t('satisfaction.tipOther')}
                    </button>
                  </div>

                  {formData.showCustomTip && (
                    <div className={styles.customTipContainer}>
                      <input
                        id="customTipInput"
                        type="number"
                        className={styles.customTipInput}
                        placeholder={t('satisfaction.tipAmountPlaceholder', { currency })}
                        value={formData.customTip}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateField('customTip', value);
                          updateField('tip', value ? parseInt(value) || 0 : 0);
                        }}
                        min="0"
                        max="500"
                      />
                      <span className={styles.currency}>{currency}</span>
                    </div>
                  )}

                  {(formData.tip > 0 || formData.customTip) && (
                    <div className={styles.tipConfirmation}>
                      <span className={styles.tipAmount}>
                        {t('satisfaction.tipLabel')} : <strong>{toArabicNumerals(formData.customTip || formData.tip)} {currency}</strong>
                      </span>
                      <span className={styles.tipMessage}>{t('satisfaction.tipWillBeCharged')}</span>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.question}>
                <label>{t('satisfaction.commentLabel')}</label>
                <textarea
                  className={styles.textarea}
                  placeholder={t('satisfaction.commentPlaceholder')}
                  value={formData.comment}
                  onChange={(e) => updateField('comment', e.target.value)}
                  maxLength={1000}
                  rows={5}
                />
                <span className={styles.charCount}>{toArabicNumerals(formData.comment.length)}/{toArabicNumerals(1000)}</span>
              </div>

              <div className={styles.question}>
                <label>{t('satisfaction.photosLabel')}</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className={styles.fileInput}
                />
                {formData.photos.length > 0 && (
                  <div className={styles.photoList}>
                    {formData.photos.map((photo, idx) => (
                      <span key={idx} className={styles.photoItem}>
                        {photo}
                        <button
                          onClick={() => updateField('photos', formData.photos.filter((_, i) => i !== idx))}
                          className={styles.removePhoto}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.stepActions}>
                <button className={styles.btnBack} onClick={prevStep}>
                  {t('satisfaction.back')}
                </button>
                <button
                  className={styles.btnSubmit}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? t('satisfaction.submitting') : t('satisfaction.submit')}
                </button>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
        </div>

        {/* Resume commande */}
        <div className={styles.orderSummary}>
          <h4>{t('satisfaction.summary')}</h4>
          <div className={styles.summaryItem}>
            <span>{t('satisfaction.service')} :</span>
            <span>{order.service_name}</span>
          </div>
          <div className={styles.summaryItem}>
            <span>{t('satisfaction.provider')} :</span>
            <span>{order.provider_name || `${order.provider_first_name || ''} ${order.provider_last_name || ''}`}</span>
          </div>
          {order.completed_at && (
            <div className={styles.summaryItem}>
              <span>{t('satisfaction.date')} :</span>
              <span>{formatDate(order.completed_at)}</span>
            </div>
          )}
          <div className={styles.summaryItem}>
            <span>{t('satisfaction.price')} :</span>
            <span><Price amount={order.total || order.price} /></span>
          </div>
        </div>
      </div>
    </div>
  );
}
