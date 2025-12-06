'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './FormulaSelector.module.scss';
import apiClient from '@/lib/apiClient';
import Price from '@/components/Price';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FormulaSelector({
  serviceId,
  selectedFormula,
  onFormulaChange,
  scheduledTime,
  className
}) {
  const { t, language, translateDynamicBatch } = useLanguage();
  const [formulas, setFormulas] = useState([]);
  const [translatedDescriptions, setTranslatedDescriptions] = useState({});
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currency, formatPrice } = useCurrency();

  const FORMULA_META = {
    standard: { icon: '⚡', color: 'blue', label: t('formula.standard') },
    recurring: { icon: '🔄', color: 'green', label: t('formula.recurring') },
    premium: { icon: '⭐', color: 'purple', label: t('formula.premium') },
    urgent: { icon: '🚨', color: 'red', label: t('formula.urgent') },
    night: { icon: '🌙', color: 'dark', label: t('formula.night') }
  };

  useEffect(() => {
    if (serviceId) {
      fetchFormulas();
    }
  }, [serviceId]);

  // Retraduire quand la langue change
  useEffect(() => {
    if (language === 'ar' && formulas.length > 0) {
      const descriptions = formulas.map(f => f.description || '');
      translateDynamicBatch(descriptions).then(translated => {
        const mapping = {};
        formulas.forEach((f, i) => {
          mapping[f.formula_type] = translated[i];
        });
        setTranslatedDescriptions(mapping);
      }).catch(console.error);
    } else if (language === 'fr') {
      setTranslatedDescriptions({});
    }
  }, [language, formulas, translateDynamicBatch]);

  const fetchFormulas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getServiceFormulas(serviceId);

      if (response.success) {
        const loadedFormulas = response.data?.formulas || response.formulas || [];
        setFormulas(loadedFormulas);
        setService(response.data?.service || response.service || null);

        // Sélectionner standard par défaut si pas de sélection
        if (!selectedFormula && loadedFormulas.length > 0) {
          const standardFormula = loadedFormulas.find(f => f.formula_type === 'standard');
          if (standardFormula) {
            onFormulaChange?.(standardFormula.formula_type, standardFormula);
          }
        }

        // Traduire les descriptions avec DeepL si en arabe
        if (language === 'ar' && loadedFormulas.length > 0) {
          const descriptions = loadedFormulas.map(f => f.description || '');
          translateDynamicBatch(descriptions).then(translated => {
            const mapping = {};
            loadedFormulas.forEach((f, i) => {
              mapping[f.formula_type] = translated[i];
            });
            setTranslatedDescriptions(mapping);
          }).catch(console.error);
        }
      } else {
        setError(response.message || 'Erreur lors du chargement des formules');
      }
    } catch (err) {
      console.error('Erreur chargement formules:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleFormulaSelect = (formula) => {
    onFormulaChange?.(formula.formula_type, formula);
  };

  const isNightTime = () => {
    if (!scheduledTime) return false;
    const hour = new Date(scheduledTime).getHours();
    return hour >= 22 || hour < 6;
  };

  const isUrgent = () => {
    if (!scheduledTime) return false;
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const hoursUntil = (scheduled - now) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil <= 2;
  };

  if (loading) {
    return (
      <div className={`${styles.formulaSelector} ${className || ''}`}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>{t('formula.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.formulaSelector} ${className || ''}`}>
        <div className={styles.error}>
          <span>⚠️ {error}</span>
        </div>
      </div>
    );
  }

  if (formulas.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.formulaSelector} ${className || ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('formula.title')}</h3>
        <p className={styles.subtitle}>
          {t('formula.subtitle')}
          <Link href="/formulas" className={styles.learnMoreLink}>
            {t('formula.learnMore')}
          </Link>
        </p>
      </div>

      <div className={styles.formulaGrid}>
        {formulas.map((formula) => {
          const meta = FORMULA_META[formula.formula_type] || FORMULA_META.standard;
          const isSelected = selectedFormula === formula.formula_type;
          const isNight = formula.formula_type === 'night';
          const isUrgentFormula = formula.formula_type === 'urgent';

          // Recommandations contextuelles
          let recommendation = null;
          if (isNight && isNightTime()) {
            recommendation = t('formula.recommendedForTime');
          } else if (isUrgentFormula && isUrgent()) {
            recommendation = t('formula.suitedForUrgency');
          }

          return (
            <div
              key={formula.id || formula.formula_type}
              className={`${styles.formulaCard} ${styles[meta.color]} ${isSelected ? styles.selected : ''}`}
              onClick={() => handleFormulaSelect(formula)}
            >
              <div className={styles.formulaIcon}>{meta.icon}</div>

              <div className={styles.formulaContent}>
                <div className={styles.formulaHeader}>
                  <span className={styles.formulaName}>{meta.label}</span>
                  <span className={styles.formulaBadge}>
                    {formula.price_modifier_type === 'percentage'
                      ? `${formula.price_modifier_value >= 0 ? '+' : ''}${formula.price_modifier_value}%`
                      : `${formula.price_modifier_value >= 0 ? '+' : ''}${formatPrice(Math.abs(formula.price_modifier_value))}`
                    }
                  </span>
                </div>

                <p className={styles.formulaDescription}>
                  {translatedDescriptions[formula.formula_type] || formula.description}
                </p>

                <div className={styles.formulaPrice}>
                  <span className={styles.priceValue}>
                    <Price amount={formula.calculated_price} />
                  </span>
                </div>

                {recommendation && (
                  <div className={styles.recommendation}>
                    <span>💡 {recommendation}</span>
                  </div>
                )}
              </div>

              {isSelected && (
                <div className={styles.selectedIndicator}>
                  <span>✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {service?.special_rules && Object.keys(service.special_rules).length > 0 && (
        <div className={styles.specialRulesInfo}>
          <span className={styles.infoIcon}>ℹ️</span>
          <span>{t('formula.specialRules')}</span>
        </div>
      )}
    </div>
  );
}
