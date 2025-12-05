'use client';

import { useState, useEffect } from 'react';
import styles from './ProviderPriorityBadge.module.scss';
import apiClient from '@/lib/apiClient';
import { calculatePriorityLevel, generatePerformanceReport, PRIORITY_CONFIG } from '@/lib/providerPriority';

export default function ProviderPriorityBadge({ provider, showDetails = false }) {
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
        return 'Vous recevez les commandes en priorite absolue';
      case 'GOOD':
        return 'Vous recevez les commandes avec un leger delai';
      case 'AVERAGE':
        return 'Vous recevez les commandes normalement';
      case 'LOW':
        return 'Votre priorite est reduite. Ameliorez vos notes!';
      case 'CRITICAL':
        return 'Attention! Risque de suspension si la note ne s\'ameliore pas';
      case 'NEW':
        return 'Completez plus de prestations pour augmenter votre priorite';
      default:
        return '';
    }
  };

  return (
    <div className={styles.priorityBadgeContainer}>
      <button
        className={`${styles.priorityBadge} ${styles[priority.level.toLowerCase()]}`}
        onClick={() => showDetails && setExpanded(!expanded)}
        title={getPriorityDescription()}
      >
        <span className={styles.icon}>{priority.icon}</span>
        <span className={styles.label}>{priority.label}</span>
        {showDetails && (
          <span className={styles.expandIcon}>{expanded ? '▲' : '▼'}</span>
        )}
      </button>

      {showDetails && expanded && (
        <div className={styles.priorityDetails}>
          {loading ? (
            <div className={styles.loading}>Chargement...</div>
          ) : (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{rating.toFixed(1)}</span>
                  <span className={styles.statLabel}>Note moyenne</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{reviewCount}</span>
                  <span className={styles.statLabel}>Avis recus</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{priority.delay}s</span>
                  <span className={styles.statLabel}>Delai reception</span>
                </div>
              </div>

              <div className={styles.description}>
                <p>{getPriorityDescription()}</p>
              </div>

              <div className={styles.thresholds}>
                <h4>Seuils de priorite</h4>
                <div className={styles.thresholdsList}>
                  <div className={`${styles.threshold} ${rating >= PRIORITY_CONFIG.EXCELLENT_RATING ? styles.active : ''}`}>
                    <span className={styles.thresholdIcon}>⭐</span>
                    <span>Excellent: {PRIORITY_CONFIG.EXCELLENT_RATING}+ etoiles</span>
                  </div>
                  <div className={`${styles.threshold} ${rating >= PRIORITY_CONFIG.GOOD_RATING && rating < PRIORITY_CONFIG.EXCELLENT_RATING ? styles.active : ''}`}>
                    <span className={styles.thresholdIcon}>✨</span>
                    <span>Bon: {PRIORITY_CONFIG.GOOD_RATING}+ etoiles</span>
                  </div>
                  <div className={`${styles.threshold} ${rating >= PRIORITY_CONFIG.AVERAGE_RATING && rating < PRIORITY_CONFIG.GOOD_RATING ? styles.active : ''}`}>
                    <span className={styles.thresholdIcon}>📊</span>
                    <span>Normal: {PRIORITY_CONFIG.AVERAGE_RATING}+ etoiles</span>
                  </div>
                  <div className={`${styles.threshold} ${rating < PRIORITY_CONFIG.AVERAGE_RATING ? styles.active : ''}`}>
                    <span className={styles.thresholdIcon}>⚠️</span>
                    <span>Faible: moins de {PRIORITY_CONFIG.AVERAGE_RATING} etoiles</span>
                  </div>
                </div>
              </div>

              {priority.level === 'CRITICAL' && (
                <div className={styles.warning}>
                  <span className={styles.warningIcon}>🚨</span>
                  <div>
                    <strong>Attention!</strong>
                    <p>Votre compte risque une suspension si votre note reste en dessous de {PRIORITY_CONFIG.BLOCK_RATING_THRESHOLD} etoiles.</p>
                  </div>
                </div>
              )}

              {priority.level === 'LOW' && (
                <div className={styles.tips}>
                  <h4>Conseils pour ameliorer votre note</h4>
                  <ul>
                    <li>Soyez ponctuel a vos rendez-vous</li>
                    <li>Communiquez clairement avec vos clients</li>
                    <li>Assurez un service de qualite</li>
                    <li>Demandez des avis apres chaque prestation</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
