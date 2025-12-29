'use client';

import { useState, useEffect } from 'react';
import styles from './ProviderPriorityBadge.module.scss';
import apiClient from '@/lib/apiClient';
import { calculatePriorityLevel, PRIORITY_CONFIG } from '@/lib/providerPriority';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProviderPriorityBadge({ provider, showDetails = false }) {
  const { t, isRTL } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [priorityData, setPriorityData] = useState(null);

  const rating = provider?.rating ? parseFloat(provider.rating) : 0;
  const reviewCount = provider?.review_count || 0;

  const priority = calculatePriorityLevel(rating, reviewCount);

  useEffect(() => {
    if (expanded && !priorityData) {
      fetchPriorityData();
    }
  }, [expanded]);

  const fetchPriorityData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getProviderPriorityStatus();
      if (response.success) {
        setPriorityData(response.data);
      }
    } catch (err) {
      console.error('Error fetching priority data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityDescription = () => {
    switch (priority.level) {
      case 'EXCELLENT':
        return t('providerPriority.descExcellent');
      case 'GOOD':
        return t('providerPriority.descGood');
      case 'AVERAGE':
        return t('providerPriority.descAverage');
      case 'LOW':
        return t('providerPriority.descLow');
      case 'CRITICAL':
        return t('providerPriority.descCritical');
      case 'NEW':
        return t('providerPriority.descNew');
      default:
        return '';
    }
  };

  return (
    <div className={styles.priorityBadgeContainer} dir={isRTL ? 'rtl' : 'ltr'}>
      <button
        className={`${styles.priorityBadge} ${styles[priority.level.toLowerCase()]}`}
        onClick={() => showDetails && setExpanded(!expanded)}
        title={getPriorityDescription()}
      >
        <span className={styles.icon}>{priority.icon}</span>
        <span className={styles.label}>{t(priority.labelKey)}</span>
        {showDetails && (
          <span className={styles.expandIcon}>{expanded ? '▲' : '▼'}</span>
        )}
      </button>

      {showDetails && expanded && (
        <>
          <div className={styles.overlay} onClick={() => setExpanded(false)} />
          <div className={styles.priorityDetails}>
            <button className={styles.closeButton} onClick={() => setExpanded(false)}>✕</button>
            {loading ? (
              <div className={styles.loading}>{t('providerPriority.loading')}</div>
            ) : (
              <>
                <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{rating.toFixed(1)}</span>
                  <span className={styles.statLabel}>{t('providerPriority.averageRating')}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{reviewCount}</span>
                  <span className={styles.statLabel}>{t('providerPriority.reviewsReceived')}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{priority.delay}s</span>
                  <span className={styles.statLabel}>{t('providerPriority.receptionDelay')}</span>
                </div>
              </div>

              <div className={styles.description}>
                <p>{getPriorityDescription()}</p>
              </div>

              <div className={styles.thresholds}>
                <h4>{t('providerPriority.thresholds')}</h4>
                <div className={styles.thresholdsList}>
                  <div className={`${styles.threshold} ${rating >= PRIORITY_CONFIG.EXCELLENT_RATING ? styles.active : ''}`}>
                    <span className={styles.thresholdIcon}>⭐</span>
                    <span>{t('providerPriority.excellent')}: {PRIORITY_CONFIG.EXCELLENT_RATING}+ {t('providerPriority.stars')}</span>
                  </div>
                  <div className={`${styles.threshold} ${rating >= PRIORITY_CONFIG.GOOD_RATING && rating < PRIORITY_CONFIG.EXCELLENT_RATING ? styles.active : ''}`}>
                    <span className={styles.thresholdIcon}>✨</span>
                    <span>{t('providerPriority.good')}: {PRIORITY_CONFIG.GOOD_RATING}+ {t('providerPriority.stars')}</span>
                  </div>
                  <div className={`${styles.threshold} ${rating >= PRIORITY_CONFIG.AVERAGE_RATING && rating < PRIORITY_CONFIG.GOOD_RATING ? styles.active : ''}`}>
                    <span className={styles.thresholdIcon}>📊</span>
                    <span>{t('providerPriority.normal')}: {PRIORITY_CONFIG.AVERAGE_RATING}+ {t('providerPriority.stars')}</span>
                  </div>
                  <div className={`${styles.threshold} ${rating < PRIORITY_CONFIG.AVERAGE_RATING ? styles.active : ''}`}>
                    <span className={styles.thresholdIcon}>⚠️</span>
                    <span>{t('providerPriority.low')}: {t('providerPriority.lessThan')} {PRIORITY_CONFIG.AVERAGE_RATING} {t('providerPriority.stars')}</span>
                  </div>
                </div>
              </div>

              {priority.level === 'CRITICAL' && (
                <div className={styles.warning}>
                  <span className={styles.warningIcon}>🚨</span>
                  <div>
                    <strong>{t('providerPriority.warning')}</strong>
                    <p>{t('providerPriority.warningText', { threshold: PRIORITY_CONFIG.BLOCK_RATING_THRESHOLD })}</p>
                  </div>
                </div>
              )}

              {priority.level === 'LOW' && (
                <div className={styles.tips}>
                  <h4>{t('providerPriority.tipsTitle')}</h4>
                  <ul>
                    <li>{t('providerPriority.tip1')}</li>
                    <li>{t('providerPriority.tip2')}</li>
                    <li>{t('providerPriority.tip3')}</li>
                    <li>{t('providerPriority.tip4')}</li>
                  </ul>
                </div>
              )}
            </>
          )}
          </div>
        </>
      )}
    </div>
  );
}
