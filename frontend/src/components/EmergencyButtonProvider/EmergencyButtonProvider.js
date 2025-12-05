'use client';

import { useState } from 'react';
import styles from './EmergencyButtonProvider.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';

const EMERGENCY_REASONS = [
  { id: 'client_behavior', label: 'Comportement inapproprie du client', icon: '⚠️' },
  { id: 'safety', label: 'Je ne me sens pas en securite', icon: '🚨' },
  { id: 'aggression', label: 'Agression ou menace', icon: '🚫' },
  { id: 'address_issue', label: 'Probleme d\'acces a l\'adresse', icon: '📍' },
  { id: 'other', label: 'Autre urgence', icon: '📞' }
];

// Numeros d'urgence Maroc
const EMERGENCY_NUMBERS = {
  police: { number: '19', label: 'Police', icon: '👮' },
  gendarmerie: { number: '177', label: 'Gendarmerie Royale', icon: '🛡️' },
  samu: { number: '15', label: 'SAMU / Urgences medicales', icon: '🚑' },
  support: { number: '+212522000000', label: 'Support GlamGo', icon: '📞' }
};

export default function EmergencyButtonProvider({ orderId, clientName, onEmergencyReported }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [notifyPolice, setNotifyPolice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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
      setError('Veuillez selectionner une raison');
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
        // Fermer le modal apres 5 secondes
        setTimeout(() => {
          setShowModal(false);
          setSuccess(false);
        }, 5000);
      } else {
        setError(response.message || 'Erreur lors du signalement');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du signalement');
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
        aria-label="Signaler une urgence"
      >
        <span className={styles.emergencyIcon}>🆘</span>
        <span className={styles.emergencyText}>Urgence</span>
      </button>

      {/* Modal d'urgence */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {success ? (
              <div className={styles.successContent}>
                <div className={styles.successIcon}>✅</div>
                <h2>Signalement envoye</h2>
                <p>Notre equipe de support a ete alertee et vous contactera dans les plus brefs delais.</p>

                {notifyPolice && (
                  <div className={styles.policeAlert}>
                    <span className={styles.policeIcon}>🚨</span>
                    <p>Votre demande d'alerte police a ete notee.</p>
                  </div>
                )}

                <div className={styles.emergencyNumbers}>
                  <p className={styles.numbersTitle}>Numeros d'urgence Maroc :</p>
                  <div className={styles.numbersGrid}>
                    <button
                      className={styles.numberButton}
                      onClick={() => handleCall(EMERGENCY_NUMBERS.police.number)}
                    >
                      <span>{EMERGENCY_NUMBERS.police.icon}</span>
                      <span>{EMERGENCY_NUMBERS.police.label}</span>
                      <strong>{EMERGENCY_NUMBERS.police.number}</strong>
                    </button>
                    <button
                      className={styles.numberButton}
                      onClick={() => handleCall(EMERGENCY_NUMBERS.samu.number)}
                    >
                      <span>{EMERGENCY_NUMBERS.samu.icon}</span>
                      <span>{EMERGENCY_NUMBERS.samu.label}</span>
                      <strong>{EMERGENCY_NUMBERS.samu.number}</strong>
                    </button>
                  </div>
                </div>

                <button
                  className={styles.callButton}
                  onClick={() => handleCall(EMERGENCY_NUMBERS.support.number)}
                >
                  📞 Appeler le support GlamGo
                </button>
              </div>
            ) : (
              <>
                <div className={styles.modalHeader}>
                  <div className={styles.headerIcon}>🆘</div>
                  <div>
                    <h2>Signaler une urgence</h2>
                    <p className={styles.headerSubtitle}>
                      Un probleme avec le client {clientName || ''} ?
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
                    <p className={styles.urgentTitle}>🚨 En cas de DANGER IMMEDIAT :</p>
                    <div className={styles.urgentButtons}>
                      <button
                        className={styles.policeButton}
                        onClick={() => handleCall(EMERGENCY_NUMBERS.police.number)}
                      >
                        <span className={styles.buttonIcon}>👮</span>
                        <span className={styles.buttonLabel}>Police</span>
                        <span className={styles.buttonNumber}>19</span>
                      </button>
                      <button
                        className={styles.gendarmerieButton}
                        onClick={() => handleCall(EMERGENCY_NUMBERS.gendarmerie.number)}
                      >
                        <span className={styles.buttonIcon}>🛡️</span>
                        <span className={styles.buttonLabel}>Gendarmerie</span>
                        <span className={styles.buttonNumber}>177</span>
                      </button>
                      <button
                        className={styles.samuButton}
                        onClick={() => handleCall(EMERGENCY_NUMBERS.samu.number)}
                      >
                        <span className={styles.buttonIcon}>🚑</span>
                        <span className={styles.buttonLabel}>SAMU</span>
                        <span className={styles.buttonNumber}>15</span>
                      </button>
                    </div>
                  </div>

                  <div className={styles.divider}>
                    <span>ou signalez a GlamGo</span>
                  </div>

                  <div className={styles.reasonsSection}>
                    <label className={styles.sectionLabel}>Quel est le probleme ?</label>
                    <div className={styles.reasonsList}>
                      {EMERGENCY_REASONS.map((reason) => (
                        <button
                          key={reason.id}
                          className={`${styles.reasonButton} ${selectedReason === reason.id ? styles.selected : ''}`}
                          onClick={() => setSelectedReason(reason.id)}
                          disabled={loading}
                        >
                          <span className={styles.reasonIcon}>{reason.icon}</span>
                          <span className={styles.reasonLabel}>{reason.label}</span>
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
                          🚔 Demander une alerte aux autorites
                        </span>
                      </label>
                      <p className={styles.policeHint}>
                        GlamGo transmettra votre signalement avec les details de localisation
                      </p>
                    </div>
                  )}

                  <div className={styles.additionalSection}>
                    <label className={styles.sectionLabel}>
                      Details supplementaires (optionnel)
                    </label>
                    <textarea
                      className={styles.textarea}
                      placeholder="Decrivez brievement la situation..."
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
                    Annuler
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleSubmitEmergency}
                    disabled={loading || !selectedReason}
                  >
                    {loading ? 'Envoi...' : '🆘 Envoyer le signalement'}
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
