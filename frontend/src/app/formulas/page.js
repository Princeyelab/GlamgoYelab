'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';
import Price from '@/components/Price';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Page informative sur les formules de tarification GlamGo
 *
 * Cette page explique en detail chaque formule disponible :
 * - Standard : tarif de base
 * - Recurrent : -10% pour abonnements
 * - Premium : +30% avec produits haut de gamme
 * - Urgent : +50 MAD pour intervention rapide
 * - Nuit : +30 MAD pour horaires 22h-6h
 */
export default function FormulasPage() {
  const { t, language, isRTL } = useLanguage();
  const [activeFormula, setActiveFormula] = useState('standard');

  // Definitions des formules avec exemples
  const formulas = [
    {
      id: 'standard',
      name: t('formulasPage.standard'),
      icon: '⚡',
      color: '#3B82F6',
      modifier: '0%',
      modifierType: 'percentage',
      description: t('formulasPage.standardDesc'),
      details: [
        t('formulasPage.standardDetail1'),
        t('formulasPage.standardDetail2'),
        t('formulasPage.standardDetail3'),
        t('formulasPage.standardDetail4')
      ],
      conditions: {
        notice: t('formulasPage.conditionNotice24h'),
        cancellation: t('formulasPage.conditionCancellation4h')
      },
      example: {
        service: t('formulasPage.exampleService'),
        basePrice: 150,
        finalPrice: 150
      }
    },
    {
      id: 'recurring',
      name: t('formulasPage.recurring'),
      icon: '🔄',
      color: '#10B981',
      modifier: '-10%',
      modifierType: 'percentage',
      description: t('formulasPage.recurringDesc'),
      details: [
        t('formulasPage.recurringDetail1'),
        t('formulasPage.recurringDetail2'),
        t('formulasPage.recurringDetail3'),
        t('formulasPage.recurringDetail4'),
        t('formulasPage.recurringDetail5')
      ],
      conditions: {
        minBookings: t('formulasPage.conditionMinBookings'),
        validity: t('formulasPage.conditionValidity'),
        notice: t('formulasPage.conditionNotice24h')
      },
      example: {
        service: t('formulasPage.exampleService'),
        basePrice: 150,
        finalPrice: 135
      }
    },
    {
      id: 'premium',
      name: t('formulasPage.premium'),
      icon: '⭐',
      color: '#8B5CF6',
      modifier: '+30%',
      modifierType: 'percentage',
      description: t('formulasPage.premiumDesc'),
      details: [
        t('formulasPage.premiumDetail1'),
        t('formulasPage.premiumDetail2'),
        t('formulasPage.premiumDetail3'),
        t('formulasPage.premiumDetail4'),
        t('formulasPage.premiumDetail5')
      ],
      conditions: {
        products: t('formulasPage.conditionProducts'),
        guarantee: t('formulasPage.conditionGuarantee'),
        providers: t('formulasPage.conditionProviders')
      },
      example: {
        service: t('formulasPage.exampleService'),
        basePrice: 150,
        finalPrice: 195
      }
    },
    {
      id: 'urgent',
      name: t('formulasPage.urgent'),
      icon: '🚨',
      color: '#EF4444',
      modifier: '+50 MAD',
      modifierType: 'fixed',
      description: t('formulasPage.urgentDesc'),
      details: [
        t('formulasPage.urgentDetail1'),
        t('formulasPage.urgentDetail2'),
        t('formulasPage.urgentDetail3'),
        t('formulasPage.urgentDetail4'),
        t('formulasPage.urgentDetail5')
      ],
      conditions: {
        delay: t('formulasPage.conditionDelay2h'),
        availability: t('formulasPage.condition7days'),
        confirmation: t('formulasPage.conditionInstant')
      },
      example: {
        service: t('formulasPage.exampleService'),
        basePrice: 150,
        finalPrice: 200
      }
    },
    {
      id: 'night',
      name: t('formulasPage.night'),
      icon: '🌙',
      color: '#1E3A5F',
      modifier: '+30 MAD',
      modifierType: 'fixed',
      description: t('formulasPage.nightDesc'),
      details: [
        t('formulasPage.nightDetail1'),
        t('formulasPage.nightDetail2'),
        t('formulasPage.nightDetail3'),
        t('formulasPage.nightDetail4'),
        t('formulasPage.nightDetail5')
      ],
      conditions: {
        hours: '22h00 - 06h00',
        availability: t('formulasPage.conditionAvailability'),
        notice: t('formulasPage.conditionAdvanceBooking')
      },
      example: {
        service: t('formulasPage.exampleService'),
        basePrice: 150,
        finalPrice: 180
      }
    }
  ];

  // FAQ sur les formules
  const faq = [
    {
      question: t('formulasPage.faq1Question'),
      answer: t('formulasPage.faq1Answer')
    },
    {
      question: t('formulasPage.faq2Question'),
      answer: t('formulasPage.faq2Answer')
    },
    {
      question: t('formulasPage.faq3Question'),
      answer: t('formulasPage.faq3Answer')
    },
    {
      question: t('formulasPage.faq4Question'),
      answer: t('formulasPage.faq4Answer')
    },
    {
      question: t('formulasPage.faq5Question'),
      answer: t('formulasPage.faq5Answer')
    },
    {
      question: t('formulasPage.faq6Question'),
      answer: t('formulasPage.faq6Answer')
    }
  ];

  const activeFormulaData = formulas.find(f => f.id === activeFormula);

  return (
    <div className={styles.formulasPage} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <Link href="/services" className={styles.backLink}>
            {isRTL ? '→' : '←'} {t('formulasPage.backToServices')}
          </Link>
          <h1 className={styles.title}>{t('formulasPage.pageTitle')}</h1>
          <p className={styles.subtitle}>
            {t('formulasPage.pageSubtitle')}
          </p>
        </div>

        {/* Selecteur de formules */}
        <div className={styles.formulaSelector}>
          {formulas.map((formula) => (
            <button
              key={formula.id}
              className={`${styles.formulaTab} ${activeFormula === formula.id ? styles.active : ''}`}
              onClick={() => setActiveFormula(formula.id)}
              style={{ '--formula-color': formula.color }}
            >
              <span className={styles.formulaIcon}>{formula.icon}</span>
              <span className={styles.formulaName}>{formula.name}</span>
              <span className={styles.formulaModifier}>{formula.modifier}</span>
            </button>
          ))}
        </div>

        {/* Detail de la formule active */}
        {activeFormulaData && (
          <div className={styles.formulaDetail} style={{ '--formula-color': activeFormulaData.color }}>
            <div className={styles.formulaHeader}>
              <div className={styles.formulaIconLarge}>{activeFormulaData.icon}</div>
              <div className={styles.formulaInfo}>
                <h2 className={styles.formulaTitle}>{t('formulasPage.formula')} {activeFormulaData.name}</h2>
                <p className={styles.formulaDescription}>{activeFormulaData.description}</p>
              </div>
              <div className={styles.formulaModifierBadge}>
                {activeFormulaData.modifier}
              </div>
            </div>

            <div className={styles.formulaContent}>
              {/* Avantages */}
              <div className={styles.formulaSection}>
                <h3>{t('formulasPage.advantages')}</h3>
                <ul className={styles.advantagesList}>
                  {activeFormulaData.details.map((detail, index) => (
                    <li key={index}>
                      <span className={styles.checkIcon}>✓</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Conditions */}
              <div className={styles.formulaSection}>
                <h3>{t('formulasPage.conditions')}</h3>
                <div className={styles.conditionsList}>
                  {Object.entries(activeFormulaData.conditions).map(([key, value]) => (
                    <div key={key} className={styles.conditionItem}>
                      <span className={styles.conditionLabel}>
                        {key === 'notice' && '⏰'}
                        {key === 'cancellation' && '❌'}
                        {key === 'minBookings' && '📅'}
                        {key === 'validity' && '📆'}
                        {key === 'products' && '🎁'}
                        {key === 'guarantee' && '✅'}
                        {key === 'providers' && '👤'}
                        {key === 'delay' && '⚡'}
                        {key === 'availability' && '📍'}
                        {key === 'confirmation' && '✔️'}
                        {key === 'hours' && '🕐'}
                      </span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exemple de calcul */}
              <div className={styles.formulaSection}>
                <h3>{t('formulasPage.calculationExample')}</h3>
                <div className={styles.priceExample}>
                  <div className={styles.priceRow}>
                    <span>{t('formulasPage.service')}: {activeFormulaData.example.service}</span>
                    <span><Price amount={activeFormulaData.example.basePrice} /></span>
                  </div>
                  {activeFormulaData.modifierType === 'percentage' && activeFormulaData.modifier !== '0%' && (
                    <div className={styles.priceRow}>
                      <span>{t('formulasPage.formula')} {activeFormulaData.name} ({activeFormulaData.modifier})</span>
                      <span className={activeFormulaData.modifier.startsWith('-') ? styles.discount : styles.surcharge}>
                        {activeFormulaData.modifier.startsWith('-') ? '' : '+'}
                        <Price amount={activeFormulaData.example.finalPrice - activeFormulaData.example.basePrice} />
                      </span>
                    </div>
                  )}
                  {activeFormulaData.modifierType === 'fixed' && (
                    <div className={styles.priceRow}>
                      <span>{t('formulasPage.supplement')} {activeFormulaData.name}</span>
                      <span className={styles.surcharge}>
                        {activeFormulaData.modifier}
                      </span>
                    </div>
                  )}
                  <div className={`${styles.priceRow} ${styles.totalRow}`}>
                    <span>{t('formulasPage.total')}</span>
                    <span className={styles.totalPrice}>
                      <Price amount={activeFormulaData.example.finalPrice} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tableau comparatif */}
        <div className={styles.comparisonSection}>
          <h2>{t('formulasPage.comparisonTable')}</h2>
          <div className={styles.comparisonTable}>
            <table>
              <thead>
                <tr>
                  <th>{t('formulasPage.formula')}</th>
                  <th>{t('formulasPage.priceModification')}</th>
                  <th>{t('formulasPage.bookingDelay')}</th>
                  <th>{t('formulasPage.idealFor')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className={styles.formulaBadge} style={{ background: '#3B82F6' }}>⚡ {t('formulasPage.standard')}</span></td>
                  <td>{t('formulasPage.basePrice')}</td>
                  <td>{t('formulasPage.recommended24h')}</td>
                  <td>{t('formulasPage.occasionalNeeds')}</td>
                </tr>
                <tr>
                  <td><span className={styles.formulaBadge} style={{ background: '#10B981' }}>🔄 {t('formulasPage.recurring')}</span></td>
                  <td>-10%</td>
                  <td>{t('formulasPage.recommended24h')}</td>
                  <td>{t('formulasPage.regularUse')}</td>
                </tr>
                <tr>
                  <td><span className={styles.formulaBadge} style={{ background: '#8B5CF6' }}>⭐ {t('formulasPage.premium')}</span></td>
                  <td>+30%</td>
                  <td>{t('formulasPage.recommended24h')}</td>
                  <td>{t('formulasPage.superiorQuality')}</td>
                </tr>
                <tr>
                  <td><span className={styles.formulaBadge} style={{ background: '#EF4444' }}>🚨 {t('formulasPage.urgent')}</span></td>
                  <td>+50 MAD</td>
                  <td>{t('formulasPage.immediate')}</td>
                  <td>{t('formulasPage.emergencies')}</td>
                </tr>
                <tr>
                  <td><span className={styles.formulaBadge} style={{ background: '#1E3A5F' }}>🌙 {t('formulasPage.night')}</span></td>
                  <td>+30 MAD</td>
                  <td>{t('formulasPage.accordingAvailability')}</td>
                  <td>{t('formulasPage.lateHours')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Frais supplementaires */}
        <div className={styles.additionalFeesSection}>
          <h2>{t('formulasPage.additionalFees')}</h2>
          <div className={styles.feeCards}>
            <div className={styles.feeCard}>
              <div className={styles.feeIcon}>🚗</div>
              <h3>{t('formulasPage.travelFees')}</h3>
              <p>{t('formulasPage.travelFeesDesc')}</p>
              <div className={styles.feeExample}>
                {t('formulasPage.travelFeesExample')}
              </div>
            </div>
            <div className={styles.feeCard}>
              <div className={styles.feeIcon}>🌙</div>
              <h3>{t('formulasPage.nightSupplement')}</h3>
              <p>{t('formulasPage.nightSupplementDesc')}</p>
              <div className={styles.feeExample}>
                {t('formulasPage.appliedAutomatically')}
              </div>
            </div>
            <div className={styles.feeCard}>
              <div className={styles.feeIcon}>🏷️</div>
              <h3>{t('formulasPage.glamgoCommission')}</h3>
              <p>{t('formulasPage.commissionDesc')}</p>
              <div className={styles.feeExample}>
                {t('formulasPage.includedInPrice')}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className={styles.faqSection}>
          <h2>{t('formulasPage.faqTitle')}</h2>
          <div className={styles.faqList}>
            {faq.map((item, index) => (
              <details key={index} className={styles.faqItem}>
                <summary className={styles.faqQuestion}>
                  {item.question}
                </summary>
                <p className={styles.faqAnswer}>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className={styles.ctaSection}>
          <h2>{t('formulasPage.ctaTitle')}</h2>
          <p>{t('formulasPage.ctaSubtitle')}</p>
          <Link href="/services" className={styles.ctaButton}>
            {t('formulasPage.viewServices')}
          </Link>
        </div>
      </div>
    </div>
  );
}
