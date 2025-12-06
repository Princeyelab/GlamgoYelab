'use client';

import { useState } from 'react';
import styles from './ReviewModal.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { fixEncoding } from '@/lib/textUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import TranslatedText from '@/components/TranslatedText';

export default function ReviewModal({ order, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [serviceQuality, setServiceQuality] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError(t('review.pleaseRate'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const reviewData = {
        rating,
        comment: comment.trim() || null,
        service_quality: serviceQuality || null,
        punctuality: punctuality || null,
        professionalism: professionalism || null
      };

      const response = await apiClient.createReview(order.id, reviewData);

      if (response.success) {
        onSuccess && onSuccess(response.data);
        onClose();
      } else {
        setError(response.message || t('review.errorSending'));
      }
    } catch (err) {
      setError(err.message || t('review.errorSending'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (currentRating, setRatingFunc, showHover = false) => {
    const stars = [];
    const displayRating = showHover && hoverRating > 0 ? hoverRating : currentRating;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={`${styles.star} ${i <= displayRating ? styles.filled : ''}`}
          onClick={() => setRatingFunc(i)}
          onMouseEnter={() => showHover && setHoverRating(i)}
          onMouseLeave={() => showHover && setHoverRating(0)}
          disabled={submitting}
        >
          ★
        </button>
      );
    }
    return stars;
  };

  const renderSmallStars = (currentRating, setRatingFunc) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={`${styles.smallStar} ${i <= currentRating ? styles.filled : ''}`}
          onClick={() => setRatingFunc(i)}
          disabled={submitting}
        >
          ★
        </button>
      );
    }
    return stars;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{t('review.title')}</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.orderInfo}>
            <TranslatedText as="p" className={styles.serviceName} text={order.service_name} fallback={t('review.service')} />
            <p className={styles.providerName}>
              {t('review.provider')}: {order.provider_name || t('provider.defaultName')}
            </p>
          </div>

          <div className={styles.mainRating}>
            <label>{t('review.globalRating')} *</label>
            <div className={styles.starsContainer}>
              {renderStars(rating, setRating, true)}
            </div>
            <p className={styles.ratingText}>
              {rating === 0 && t('review.clickToRate')}
              {rating === 1 && t('review.veryUnsatisfied')}
              {rating === 2 && t('review.unsatisfied')}
              {rating === 3 && t('review.correct')}
              {rating === 4 && t('review.satisfied')}
              {rating === 5 && t('review.excellent')}
            </p>
          </div>

          <div className={styles.detailedRatings}>
            <h4>{t('review.detailedRatings')}</h4>

            <div className={styles.ratingRow}>
              <span>{t('review.serviceQuality')}</span>
              <div className={styles.smallStars}>
                {renderSmallStars(serviceQuality, setServiceQuality)}
              </div>
            </div>

            <div className={styles.ratingRow}>
              <span>{t('review.punctuality')}</span>
              <div className={styles.smallStars}>
                {renderSmallStars(punctuality, setPunctuality)}
              </div>
            </div>

            <div className={styles.ratingRow}>
              <span>{t('review.professionalism')}</span>
              <div className={styles.smallStars}>
                {renderSmallStars(professionalism, setProfessionalism)}
              </div>
            </div>
          </div>

          <div className={styles.commentSection}>
            <label htmlFor="comment">{t('review.commentLabel')}</label>
            <textarea
              id="comment"
              className={styles.commentInput}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('review.commentPlaceholder')}
              rows={4}
              disabled={submitting}
              maxLength={500}
            />
            <span className={styles.charCount}>{comment.length}/500</span>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
          >
            {submitting ? t('review.submitting') : t('review.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
