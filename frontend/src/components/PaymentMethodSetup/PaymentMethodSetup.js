'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import './PaymentMethodSetup.scss';

/**
 * PaymentMethodSetup - Validation carte bancaire + IBAN prestataire
 *
 * Props:
 * - onSuccess: callback après validation réussie
 * - userType: 'client' | 'provider'
 * - skipable: boolean (peut-on passer cette étape?)
 * - demoMode: boolean (utilise l'endpoint de démo public)
 * - onSkip: callback quand l'utilisateur skip cette étape (optionnel)
 *
 * @author Claude Code
 */
export default function PaymentMethodSetup({ onSuccess, userType = 'client', skipable = false, demoMode = false, onSkip }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [cardData, setCardData] = useState({
    card_number: '',
    card_exp_month: '',
    card_exp_year: '',
    card_cvv: ''
  });
  const [bankData, setBankData] = useState({
    iban: '',
    bank_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleCardChange = (field, value) => {
    setCardData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleBankChange = (field, value) => {
    setBankData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateCard = () => {
    const newErrors = {};

    // Numéro carte (Luhn algorithm)
    const cardNumber = cardData.card_number.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cardNumber)) {
      newErrors.card_number = t('paymentSetup.cardNumberInvalid');
    }

    // Expiration
    const month = parseInt(cardData.card_exp_month);
    const year = parseInt(cardData.card_exp_year);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (month < 1 || month > 12) {
      newErrors.card_exp_month = t('paymentSetup.monthInvalid');
    }
    if (year < currentYear) {
      newErrors.card_exp_year = t('paymentSetup.cardExpired');
    }
    if (year === currentYear && month < currentMonth) {
      newErrors.card_exp_year = t('paymentSetup.cardExpired');
    }

    // CVV
    if (!/^\d{3}$/.test(cardData.card_cvv)) {
      newErrors.card_cvv = t('paymentSetup.cvvInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateIBAN = () => {
    const newErrors = {};

    // Format IBAN Maroc : MA + 24 chiffres
    const iban = bankData.iban.replace(/\s/g, '');
    if (!/^MA\d{24}$/.test(iban)) {
      newErrors.iban = t('paymentSetup.ibanInvalid');
    }

    if (!bankData.bank_name || bankData.bank_name.length < 3) {
      newErrors.bank_name = t('paymentSetup.bankNameRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCardSubmit = async () => {
    if (!validateCard()) return;

    setLoading(true);
    setErrors({});

    try {
      // Utiliser l'endpoint de démo si demoMode est activé
      const endpoint = demoMode ? '/payment/demo/validate-card' : '/payment/validate-card';
      const response = await api.post(endpoint, cardData);

      if (userType === 'provider') {
        // Prestataire : passer à l'IBAN
        setStep(2);
      } else {
        // Client : terminé
        if (onSuccess) {
          onSuccess(response);
        }
      }
    } catch (error) {
      setErrors({
        submit: error.message || t('paymentSetup.cardValidationError')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBankSubmit = async () => {
    if (!validateIBAN()) return;

    setLoading(true);
    setErrors({});

    try {
      // En mode démo, simuler la réussite sans appeler le backend
      if (demoMode) {
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 500));
        const demoResponse = {
          success: true,
          message: 'Compte bancaire enregistré (mode démo)',
          iban: bankData.iban.replace(/\s/g, ''),
          bank_name: bankData.bank_name
        };
        if (onSuccess) {
          onSuccess(demoResponse);
        }
        return;
      }

      const response = await api.post('/provider/payment/bank-account', {
        iban: bankData.iban.replace(/\s/g, ''),
        bank_name: bankData.bank_name
      });

      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      setErrors({
        submit: error.message || t('paymentSetup.ibanSaveError')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (skipable) {
      if (onSkip) {
        onSkip();
      } else if (onSuccess) {
        onSuccess({ skipped: true });
      }
    }
  };

  return (
    <div className="payment-setup">
      {/* Étape 1 : Carte bancaire */}
      {step === 1 && (
        <div className="step-card">
          <div className="step-header">
            <span className="step-icon">💳</span>
            <h3>{t('paymentSetup.cardTitle')}</h3>
          </div>

          <p className="info">
            {t('paymentSetup.cardInfo')}
          </p>

          <div className="test-card-info" style={{
            background: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>🧪 {t('paymentSetup.testModeInfo')}</strong> {t('paymentSetup.testCard')} <code style={{background: '#fff', padding: '2px 6px', borderRadius: '3px'}}>4242 4242 4242 4242</code> {t('paymentSetup.testCardSuccess')}
          </div>

          <div className="form">
            <div className="form-group">
              <label>{t('paymentSetup.cardNumber')}</label>
              <input
                type="text"
                placeholder={t('paymentSetup.cardNumberPlaceholder')}
                maxLength="19"
                value={cardData.card_number}
                onChange={(e) => {
                  let value = e.target.value.replace(/\s/g, '');
                  value = value.replace(/(\d{4})/g, '$1 ').trim();
                  handleCardChange('card_number', value);
                }}
                className={errors.card_number ? 'error' : ''}
              />
              {errors.card_number && <span className="error-msg">{errors.card_number}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('paymentSetup.expiryMonth')}</label>
                <select
                  value={cardData.card_exp_month}
                  onChange={(e) => handleCardChange('card_exp_month', e.target.value)}
                  className={errors.card_exp_month ? 'error' : ''}
                >
                  <option value="">MM</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {month.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                {errors.card_exp_month && <span className="error-msg">{errors.card_exp_month}</span>}
              </div>

              <div className="form-group">
                <label>{t('paymentSetup.expiryYear')}</label>
                <select
                  value={cardData.card_exp_year}
                  onChange={(e) => handleCardChange('card_exp_year', e.target.value)}
                  className={errors.card_exp_year ? 'error' : ''}
                >
                  <option value="">AAAA</option>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.card_exp_year && <span className="error-msg">{errors.card_exp_year}</span>}
              </div>

              <div className="form-group">
                <label>{t('paymentSetup.cvv')}</label>
                <input
                  type="text"
                  placeholder={t('paymentSetup.cvvPlaceholder')}
                  maxLength="3"
                  value={cardData.card_cvv}
                  onChange={(e) => handleCardChange('card_cvv', e.target.value.replace(/\D/g, ''))}
                  className={errors.card_cvv ? 'error' : ''}
                />
                {errors.card_cvv && <span className="error-msg">{errors.card_cvv}</span>}
              </div>
            </div>
          </div>

          {errors.submit && <div className="error-banner">{errors.submit}</div>}

          <button
            className="btn-validate"
            onClick={handleCardSubmit}
            disabled={loading}
          >
            {loading ? t('paymentSetup.validating') : t('paymentSetup.validateCard')}
          </button>

          {skipable && (
            <button className="btn-skip" onClick={handleSkip}>
              {t('paymentSetup.skipStep')}
            </button>
          )}

          <p className="security-info">
            🔒 {t('paymentSetup.securePayment')}
          </p>
        </div>
      )}

      {/* Étape 2 : IBAN (prestataires uniquement) */}
      {step === 2 && userType === 'provider' && (
        <div className="step-card">
          <div className="step-header">
            <span className="step-icon">🏦</span>
            <h3>{t('paymentSetup.bankTitle')}</h3>
          </div>

          <p className="info">
            {t('paymentSetup.bankInfo')}
          </p>

          <div className="test-card-info" style={{
            background: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>🧪 {t('paymentSetup.testModeInfo')}</strong> {t('paymentSetup.testIban')} <code style={{background: '#fff', padding: '2px 6px', borderRadius: '3px'}}>MA00 1111 1111 1111 1111 1111 11</code>
          </div>

          <div className="form">
            <div className="form-group">
              <label>{t('paymentSetup.iban')}</label>
              <input
                type="text"
                placeholder={t('paymentSetup.ibanPlaceholder')}
                maxLength="32"
                value={bankData.iban}
                onChange={(e) => {
                  let value = e.target.value.toUpperCase();
                  // Formater avec espaces
                  value = value.replace(/\s/g, '');
                  value = value.replace(/(.{4})/g, '$1 ').trim();
                  handleBankChange('iban', value);
                }}
                className={errors.iban ? 'error' : ''}
              />
              {errors.iban && <span className="error-msg">{errors.iban}</span>}
              <span className="helper-text">{t('paymentSetup.ibanFormat')}</span>
            </div>

            <div className="form-group">
              <label>{t('paymentSetup.bankName')}</label>
              <select
                value={bankData.bank_name}
                onChange={(e) => handleBankChange('bank_name', e.target.value)}
                className={errors.bank_name ? 'error' : ''}
              >
                <option value="">{t('paymentSetup.selectBank')}</option>
                <option value="Attijariwafa Bank">Attijariwafa Bank</option>
                <option value="Banque Populaire">Banque Populaire</option>
                <option value="BMCE Bank">BMCE Bank</option>
                <option value="BMCI">BMCI</option>
                <option value="CIH Bank">CIH Bank</option>
                <option value="Crédit Agricole">Crédit Agricole</option>
                <option value="Crédit du Maroc">Crédit du Maroc</option>
                <option value="Société Générale">Société Générale</option>
                <option value="Autre">Autre</option>
              </select>
              {errors.bank_name && <span className="error-msg">{errors.bank_name}</span>}
            </div>
          </div>

          {errors.submit && <div className="error-banner">{errors.submit}</div>}

          <button
            className="btn-validate"
            onClick={handleBankSubmit}
            disabled={loading}
          >
            {loading ? t('paymentSetup.saving') : t('paymentSetup.saveIban')}
          </button>

          {skipable && (
            <button className="btn-skip" onClick={handleSkip}>
              {t('paymentSetup.skipStep')}
            </button>
          )}

          <p className="security-info">
            🔒 {t('paymentSetup.secureInfo')}
          </p>
        </div>
      )}
    </div>
  );
}
