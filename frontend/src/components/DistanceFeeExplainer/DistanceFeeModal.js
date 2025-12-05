'use client';

import { useEffect } from 'react';
import styles from './DistanceFeeModal.module.css';
import DistanceFeeExplainer from './DistanceFeeExplainer';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Modal explicative des frais de déplacement avec carte visuelle
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - État d'ouverture de la modal
 * @param {Function} props.onClose - Callback de fermeture
 * @param {Object} props.provider - Données du prestataire
 * @param {Object} props.clientLocation - Position du client {lat, lng}
 * @param {Object} props.distanceCalculation - Résultat du calcul de distance
 */
export default function DistanceFeeModal({
  isOpen,
  onClose,
  provider,
  clientLocation,
  distanceCalculation
}) {
  const { t } = useLanguage();

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const providerName = provider?.name
    || provider?.business_name
    || `${provider?.first_name || ''} ${provider?.last_name || ''}`.trim()
    || t('distance.provider');

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <span className={styles.headerIcon}>🚗</span>
            <div>
              <h2 className={styles.title}>{t('distance.title')}</h2>
              <p className={styles.subtitle}>{t('distance.howCalculated', { name: providerName })}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div className={styles.content}>
          <DistanceFeeExplainer
            provider={provider}
            clientLocation={clientLocation}
            distanceCalculation={distanceCalculation}
            showMap={true}
            compact={false}
          />
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerNote}>
            💡 {t('distance.footerNote')}
          </p>
          <button className={styles.closeButton} onClick={onClose}>
            {t('distance.understood')}
          </button>
        </div>
      </div>
    </div>
  );
}
