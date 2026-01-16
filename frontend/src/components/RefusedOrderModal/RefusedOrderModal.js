'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/Button';
import styles from './RefusedOrderModal.module.scss';

/**
 * Modal affiché au client quand un prestataire refuse une commande
 * Propose de réserver avec un autre prestataire
 */
export default function RefusedOrderModal({
  isOpen,
  onClose,
  order,
  serviceName,
  serviceId
}) {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRebook = () => {
    setLoading(true);
    // Rediriger vers la page de réservation du service
    const bookingUrl = serviceId
      ? `/booking/${serviceId}`
      : '/services';
    router.push(bookingUrl);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div
        className={`${styles.modalContent} ${isRTL ? styles.rtl : ''}`}
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Icon */}
        <div className={styles.iconContainer}>
          <span className={styles.icon}>😔</span>
        </div>

        {/* Title */}
        <h2 className={styles.title}>
          {t('refusedOrderModal.title') || 'Prestataire non disponible'}
        </h2>

        {/* Message */}
        <p className={styles.message}>
          {t('refusedOrderModal.message') ||
            `Le prestataire que vous avez sélectionné pour "${serviceName || 'ce service'}" n'est malheureusement pas disponible.`}
        </p>

        {/* Sub-message */}
        <p className={styles.subMessage}>
          {t('refusedOrderModal.subMessage') ||
            'Votre commande a été annulée. Vous pouvez réserver avec un autre prestataire.'}
        </p>

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            variant="primary"
            size="medium"
            onClick={handleRebook}
            loading={loading}
            fullWidth
          >
            {t('refusedOrderModal.rebookButton') || 'Choisir un autre prestataire'}
          </Button>
          <Button
            variant="outline"
            size="medium"
            onClick={handleClose}
            fullWidth
          >
            {t('refusedOrderModal.cancelButton') || 'Fermer'}
          </Button>
        </div>

        {/* Info */}
        <p className={styles.info}>
          {t('refusedOrderModal.info') ||
            'Vous serez redirigé vers la page de réservation pour choisir un autre prestataire.'}
        </p>
      </div>
    </div>
  );
}
