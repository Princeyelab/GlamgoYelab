'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';
import Price from '@/components/Price';

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
  const [activeFormula, setActiveFormula] = useState('standard');

  // Definitions des formules avec exemples
  const formulas = [
    {
      id: 'standard',
      name: 'Standard',
      icon: '⚡',
      color: '#3B82F6',
      modifier: '0%',
      modifierType: 'percentage',
      description: 'Tarif de base pour une intervention ponctuelle',
      details: [
        'Prix catalogue sans modification',
        'Reservation 24h a l avance recommandee',
        'Annulation gratuite jusqu a 4h avant',
        'Ideal pour les besoins occasionnels'
      ],
      conditions: {
        notice: '24h de preavis recommande',
        cancellation: 'Gratuite jusqu a 4h avant'
      },
      example: {
        service: 'Coupe Femme',
        basePrice: 150,
        finalPrice: 150
      }
    },
    {
      id: 'recurring',
      name: 'Recurrent',
      icon: '🔄',
      color: '#10B981',
      modifier: '-10%',
      modifierType: 'percentage',
      description: 'Economisez 10% avec un abonnement regulier',
      details: [
        'Reduction de 10% sur le prix de base',
        'Engagement minimum de 4 reservations',
        'Validite de 30 jours',
        'Prestataire prefere assigne',
        'Priorite de reservation'
      ],
      conditions: {
        minBookings: '4 reservations minimum',
        validity: '30 jours',
        notice: '24h de preavis'
      },
      example: {
        service: 'Coupe Femme',
        basePrice: 150,
        finalPrice: 135
      }
    },
    {
      id: 'premium',
      name: 'Premium',
      icon: '⭐',
      color: '#8B5CF6',
      modifier: '+30%',
      modifierType: 'percentage',
      description: 'Service haut de gamme avec produits premium',
      details: [
        'Produits professionnels haut de gamme inclus',
        'Garantie satisfaction ou remboursement',
        'Prestataires certifies Premium',
        'Service personnalise',
        'Suivi qualite renforce'
      ],
      conditions: {
        products: 'Produits premium inclus',
        guarantee: 'Satisfaction garantie',
        providers: 'Prestataires certifies uniquement'
      },
      example: {
        service: 'Coupe Femme',
        basePrice: 150,
        finalPrice: 195
      }
    },
    {
      id: 'urgent',
      name: 'Urgent',
      icon: '🚨',
      color: '#EF4444',
      modifier: '+50 MAD',
      modifierType: 'fixed',
      description: 'Intervention garantie en moins de 2 heures',
      details: [
        'Supplement fixe de 50 MAD',
        'Prestataire disponible immediatement',
        'Intervention garantie sous 2h',
        'Disponible 7j/7',
        'Confirmation instantanee'
      ],
      conditions: {
        delay: 'Sous 2 heures garanties',
        availability: '7 jours sur 7',
        confirmation: 'Instantanee'
      },
      example: {
        service: 'Coupe Femme',
        basePrice: 150,
        finalPrice: 200
      }
    },
    {
      id: 'night',
      name: 'Nuit',
      icon: '🌙',
      color: '#1E3A5F',
      modifier: '+30 MAD',
      modifierType: 'fixed',
      description: 'Service disponible entre 22h et 6h',
      details: [
        'Supplement fixe de 30 MAD',
        'Disponible de 22h a 6h',
        'Prestataires volontaires uniquement',
        'Ideal pour evenements tardifs',
        'Confirmation sous reserve de disponibilite'
      ],
      conditions: {
        hours: '22h00 - 06h00',
        availability: 'Selon disponibilite prestataires',
        notice: 'Reservation anticipee recommandee'
      },
      example: {
        service: 'Coupe Femme',
        basePrice: 150,
        finalPrice: 180
      }
    }
  ];

  // FAQ sur les formules
  const faq = [
    {
      question: 'Comment est calculee la commission GlamGo ?',
      answer: 'GlamGo preleve une commission de 20% sur le montant total de chaque prestation. Cette commission couvre les frais de mise en relation, la garantie de paiement et le support client.'
    },
    {
      question: 'Puis-je changer de formule apres avoir reserve ?',
      answer: 'Vous pouvez modifier votre reservation jusqu a 4 heures avant le service. Les changements de formule peuvent entrainer une difference de prix qui sera ajustee automatiquement.'
    },
    {
      question: 'Comment fonctionne la formule Recurrent ?',
      answer: 'La formule Recurrent vous offre 10% de reduction si vous vous engagez sur au moins 4 reservations en 30 jours. Le meme prestataire vous sera assigne en priorite pour assurer la continuite du service.'
    },
    {
      question: 'Qu est-ce qui est inclus dans la formule Premium ?',
      answer: 'La formule Premium inclut des produits professionnels haut de gamme, une garantie satisfaction, et l acces a nos prestataires certifies Premium qui ont passe des tests de qualite supplementaires.'
    },
    {
      question: 'Les frais de deplacement sont-ils inclus ?',
      answer: 'Les 5 premiers kilometres sont gratuits. Au-dela, un supplement de 2 MAD/km est applique. Ces frais s ajoutent au prix de la formule choisie.'
    },
    {
      question: 'Que se passe-t-il si le prestataire urgent n est pas disponible ?',
      answer: 'En cas d indisponibilite pour une intervention urgente, vous serez rembourse du supplement urgent (50 MAD) et votre reservation sera basculee en formule Standard avec le prochain creneau disponible.'
    }
  ];

  const activeFormulaData = formulas.find(f => f.id === activeFormula);

  return (
    <div className={styles.formulasPage}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <Link href="/services" className={styles.backLink}>
            ← Retour aux services
          </Link>
          <h1 className={styles.title}>Nos formules de tarification</h1>
          <p className={styles.subtitle}>
            Choisissez la formule qui correspond le mieux a vos besoins
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
                <h2 className={styles.formulaTitle}>Formule {activeFormulaData.name}</h2>
                <p className={styles.formulaDescription}>{activeFormulaData.description}</p>
              </div>
              <div className={styles.formulaModifierBadge}>
                {activeFormulaData.modifier}
              </div>
            </div>

            <div className={styles.formulaContent}>
              {/* Avantages */}
              <div className={styles.formulaSection}>
                <h3>Avantages</h3>
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
                <h3>Conditions</h3>
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
                <h3>Exemple de calcul</h3>
                <div className={styles.priceExample}>
                  <div className={styles.priceRow}>
                    <span>Service: {activeFormulaData.example.service}</span>
                    <span><Price amount={activeFormulaData.example.basePrice} /></span>
                  </div>
                  {activeFormulaData.modifierType === 'percentage' && activeFormulaData.modifier !== '0%' && (
                    <div className={styles.priceRow}>
                      <span>Formule {activeFormulaData.name} ({activeFormulaData.modifier})</span>
                      <span className={activeFormulaData.modifier.startsWith('-') ? styles.discount : styles.surcharge}>
                        {activeFormulaData.modifier.startsWith('-') ? '' : '+'}
                        <Price amount={activeFormulaData.example.finalPrice - activeFormulaData.example.basePrice} />
                      </span>
                    </div>
                  )}
                  {activeFormulaData.modifierType === 'fixed' && (
                    <div className={styles.priceRow}>
                      <span>Supplement {activeFormulaData.name}</span>
                      <span className={styles.surcharge}>
                        {activeFormulaData.modifier}
                      </span>
                    </div>
                  )}
                  <div className={`${styles.priceRow} ${styles.totalRow}`}>
                    <span>Total</span>
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
          <h2>Tableau comparatif</h2>
          <div className={styles.comparisonTable}>
            <table>
              <thead>
                <tr>
                  <th>Formule</th>
                  <th>Modification prix</th>
                  <th>Delai reservation</th>
                  <th>Ideal pour</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className={styles.formulaBadge} style={{ background: '#3B82F6' }}>⚡ Standard</span></td>
                  <td>Prix de base</td>
                  <td>24h recommande</td>
                  <td>Besoins ponctuels</td>
                </tr>
                <tr>
                  <td><span className={styles.formulaBadge} style={{ background: '#10B981' }}>🔄 Recurrent</span></td>
                  <td>-10%</td>
                  <td>24h recommande</td>
                  <td>Utilisation reguliere</td>
                </tr>
                <tr>
                  <td><span className={styles.formulaBadge} style={{ background: '#8B5CF6' }}>⭐ Premium</span></td>
                  <td>+30%</td>
                  <td>24h recommande</td>
                  <td>Qualite superieure</td>
                </tr>
                <tr>
                  <td><span className={styles.formulaBadge} style={{ background: '#EF4444' }}>🚨 Urgent</span></td>
                  <td>+50 MAD</td>
                  <td>Immediat</td>
                  <td>Urgences</td>
                </tr>
                <tr>
                  <td><span className={styles.formulaBadge} style={{ background: '#1E3A5F' }}>🌙 Nuit</span></td>
                  <td>+30 MAD</td>
                  <td>Selon dispo</td>
                  <td>Horaires tardifs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Frais supplementaires */}
        <div className={styles.additionalFeesSection}>
          <h2>Frais supplementaires</h2>
          <div className={styles.feeCards}>
            <div className={styles.feeCard}>
              <div className={styles.feeIcon}>🚗</div>
              <h3>Frais de deplacement</h3>
              <p>5 km gratuits, puis 2 MAD/km</p>
              <div className={styles.feeExample}>
                Exemple: 15 km = 20 MAD
              </div>
            </div>
            <div className={styles.feeCard}>
              <div className={styles.feeIcon}>🌙</div>
              <h3>Supplement nuit</h3>
              <p>+30 MAD pour services entre 22h et 6h</p>
              <div className={styles.feeExample}>
                Applique automatiquement
              </div>
            </div>
            <div className={styles.feeCard}>
              <div className={styles.feeIcon}>🏷️</div>
              <h3>Commission GlamGo</h3>
              <p>20% sur le montant total</p>
              <div className={styles.feeExample}>
                Inclus dans le prix affiche
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className={styles.faqSection}>
          <h2>Questions frequentes</h2>
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
          <h2>Pret a reserver ?</h2>
          <p>Decouvrez nos services et choisissez la formule qui vous convient</p>
          <Link href="/services" className={styles.ctaButton}>
            Voir les services
          </Link>
        </div>
      </div>
    </div>
  );
}
