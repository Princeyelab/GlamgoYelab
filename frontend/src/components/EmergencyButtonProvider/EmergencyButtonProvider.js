'use client';

import { useState } from 'react';
import styles from './EmergencyButtonProvider.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { useLanguage } from '@/contexts/LanguageContext';

// Numeros d'urgence Maroc
const EMERGENCY_NUMBERS = {
  police: { number: '19', icon: '👮' },
  gendarmerie: { number: '177', icon: '🛡️' },
  samu: { number: '15', icon: '🚑' },
  support: { number: '+212522000000', icon: '📞' }
};

export default function EmergencyButtonProvider({ orderId, clientName, onEmergencyReported }) {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [notifyPolice, setNotifyPolice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const EMERGENCY_REASONS = [
    { id: 'client_behavior', labelKey: 'emergency.reasonClientBehavior', icon: '⚠️' },
    { id: 'safety', labelKey: 'emergency.reasonSafety', icon: '🚨' },
    { id: 'aggression', labelKey: 'emergency.reasonAggression', icon: '🚫' },
    { id: 'address_issue', labelKey: 'emergency.reasonAddressIssue', icon: '📍' },
    { id: 'other', labelKey: 'emergency.reasonOther', icon: '📞' }
  ];

  const handleOpenModal = () => {
    setShowModal(true);
    setSelectedReason(null);
    setAdditionalInfo('');
    setNotifyPolice(false);
    setError('');
    setSuccess(false);
  };

  const handleCloseModal = () => {
    if (!loading) {
      setShowModal(false);
    }
  };

  const handleSubmitEmergency = async () => {
    if (!selectedReason) {
      setError(t('emergency.selectReason'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.reportEmergency(orderId, {
        reason: selectedReason,
        additional_info: additionalInfo.trim(),
        notify_police: notifyPolice,
        reporter_type: 'provider'
      });

      if (response.success) {
        setSuccess(true);
        if (onEmergencyReported) {
          onEmergencyReported(response.data);
        }
        setTimeout(() => {
          setShowModal(false);
          setSuccess(false);
        }, 5000);
      } else {
        setError(response.message || t('emergency.errorSending'));
      }
    } catch (err) {
      setError(err.message || t('emergency.errorSending'));
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (number) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <>
      {/* Bouton d'urgence flottant */}
      <button
        className={styles.emergencyButton}
        onClick={handleOpenModal}
        aria-label={t('emergency.buttonLabel')}
      >
        <span className={styles.emergencyIcon}>🆘</span>
        <span className={styles.emergencyText}>{t('emergency.buttonText')}</span>
      </button>

      {/* Modal d'urgence */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {success ? (
              <div className={styles.successContent}>
                <div className={styles.successIcon}>✅</div>
                <h2>{t('emergency.successTitle')}</h2>
                <p>{t('emergency.successMessage')}</p>

                {notifyPolice && (
                  <div className={styles.policeAlert}>
                    <span className={styles.policeIcon}>🚨</span>
                    <p>{t('emergency.policeAlertNoted')}</p>
                  </div>
                )}

                <div className={styles.emergencyNumbers}>
                  <p className={styles.numbersTitle}>{t('emergency.numbersTitle')}</p>
                  <div className={styles.numbersGrid}>
                    <button
                      className={styles.numberButton}
                      onClick={() => handleCall(EMERGENCY_NUMBERS.police.number)}
                    >
                      <span>{EMERGENCY_NUMBERS.police.icon}</span>
                      <span>{t('emergency.police')}</span>
                      <strong>{EMERGENCY_NUMBERS.police.number}</strong>
                    </button>
                    <button
                      className={styles.numberButton}
                      onClick={() => handleCall(EMERGENCY_NUMBERS.samu.number)}
                    >
                      <span>{EMERGENCY_NUMBERS.samu.icon}</span>
                      <span>{t('emergency.samuFull')}</span>
                      <strong>{EMERGENCY_NUMBERS.samu.number}</strong>
                    </button>
                  </div>
                </div>

                <button
                  className={styles.callButton}
                  onClick={() => handleCall(EMERGENCY_NUMBERS.support.number)}
                >
                  📞 {t('emergency.callSupport')}
                </button>
              </div>
            ) : (
              <>
                <div className={styles.modalHeader}>
                  <div className={styles.headerIcon}>🆘</div>
                  <div>
                    <h2>{t('emergency.title')}</h2>
                    <p className={styles.headerSubtitle}>
                      {t('emergency.subtitleProvider', { clientName: clientName || '' })}
                    </p>
                  </div>
                  <button
                    className={styles.closeButton}
                    onClick={handleCloseModal}
                    disabled={loading}
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.modalBody}>
                  {/* Section appels d'urgence */}
                  <div className={styles.urgentCallsSection}>
                    <p className={styles.urgentTitle}>🚨 {t('emergency.dangerTitle')}</p>
                    <div className={styles.urgentButtons}>
                      <button
                        className={styles.policeButton}
                        onClick={() => handleCall(EMERGENCY_NUMBERS.police.number)}
                      >
                        <span className={styles.buttonIcon}>👮</span>
                        <span className={styles.buttonLabel}>{t('emergency.police')}</span>
                        <span className={styles.buttonNumber}>19</span>
                      </button>
                      <button
                        className={styles.gendarmerieButton}
                        onClick={() => handleCall(EMERGENCY_NUMBERS.gendarmerie.number)}
                      >
                        <span className={styles.buttonIcon}>🛡️</span>
                        <span className={styles.buttonLabel}>{t('emergency.gendarmerie')}</span>
                        <span className={styles.buttonNumber}>177</span>
                      </button>
                      <button
                        className={styles.samuButton}
                        onClick={() => handleCall(EMERGENCY_NUMBERS.samu.number)}
                      >
                        <span className={styles.buttonIcon}>🚑</span>
                        <span className={styles.buttonLabel}>{t('emergency.samu')}</span>
                        <span className={styles.buttonNumber}>15</span>
                      </button>
                    </div>
                  </div>

                  <div className={styles.divider}>
                    <span>{t('emergency.dividerText')}</span>
                  </div>

                  <div className={styles.reasonsSection}>
                    <label className={styles.sectionLabel}>{t('emergency.whatProblem')}</label>
                    <div className={styles.reasonsList}>
                      {EMERGENCY_REASONS.map((reason) => (
                        <button
                          key={reason.id}
                          className={`${styles.reasonButton} ${selectedReason === reason.id ? styles.selected : ''}`}
                          onClick={() => setSelectedReason(reason.id)}
                          disabled={loading}
                        >
                          <span className={styles.reasonIcon}>{reason.icon}</span>
                          <span className={styles.reasonLabel}>{t(reason.labelKey)}</span>
                          {selectedReason === reason.id && (
                            <span className={styles.checkIcon}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option alerte police */}
                  {(selectedReason === 'safety' || selectedReason === 'aggression') && (
                    <div className={styles.policeOption}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={notifyPolice}
                          onChange={(e) => setNotifyPolice(e.target.checked)}
                          disabled={loading}
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>
                          🚔 {t('emergency.requestPoliceAlert')}
                        </span>
                      </label>
                      <p className={styles.policeHint}>
                        {t('emergency.policeHint')}
                      </p>
                    </div>
                  )}

                  <div className={styles.additionalSection}>
                    <label className={styles.sectionLabel}>
                      {t('emergency.additionalDetails')}
                    </label>
                    <textarea
                      className={styles.textarea}
                      placeholder={t('emergency.placeholder')}
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      maxLength={500}
                      disabled={loading}
                      rows={3}
                    />
                    <span className={styles.charCount}>{additionalInfo.length}/500</span>
                  </div>

                  {error && (
                    <div className={styles.errorMessage}>
                      <span>⚠️</span> {error}
                    </div>
                  )}
                </div>

                <div className={styles.modalFooter}>
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                    disabled={loading}
                  >
                    {t('emergency.cancel')}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleSubmitEmergency}
                    disabled={loading || !selectedReason}
                  >
                    {loading ? t('emergency.sending') : `🆘 ${t('emergency.sendReport')}`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
