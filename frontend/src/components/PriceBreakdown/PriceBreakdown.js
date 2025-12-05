'use client';

import { useState, useEffect } from 'react';
import styles from './PriceBreakdown.module.scss';
import apiClient from '@/lib/apiClient';
import Price from '@/components/Price';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PriceBreakdown({
  serviceId,
  formulaType = 'standard',
  scheduledTime,
  durationHours = 1,
  distanceKm = 0,
  quantity = 1,
  onPriceChange,
  className,
  compact = false,
  breakdown: propBreakdown // Permet de passer un breakdown directement
}) {
  const [breakdown, setBreakdown] = useState(propBreakdown || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currency } = useCurrency();
  const { t } = useLanguage();

  // Si un breakdown est passé en prop, l'utiliser directement
  useEffect(() => {
    if (propBreakdown) {
      setBreakdown(propBreakdown);
    }
  }, [propBreakdown]);

  // Calculer via l'API quand les paramètres changent
  useEffect(() => {
    if (!propBreakdown && serviceId) {
      calculatePrice();
    }
  }, [serviceId, formulaType, scheduledTime, durationHours, distanceKm, quantity]);

  const calculatePrice = async (retryWithStandard = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentFormula = retryWithStandard ? 'standard' : formulaType;

      const params = {
        service_id: serviceId,
        formula_type: currentFormula,
        scheduled_time: scheduledTime || new Date().toISOString(),
        duration_hours: durationHours,
        distance_km: distanceKm,
        quantity: quantity
      };

      const response = await apiClient.calculatePrice(params);

      if (response.success) {
        const data = response.data?.breakdown || response.breakdown;
        setBreakdown(data);
        onPriceChange?.(data);
      } else {
        // Si la formule n'est pas disponible, réessayer avec 'standard'
        if (!retryWithStandard && response.message?.includes('non disponible')) {
          return calculatePrice(true);
        }
        setError(response.message || t('price.calculationError'));
      }
    } catch (err) {
      // Si la formule n'est pas disponible, réessayer avec 'standard'
      if (!retryWithStandard && err.message?.includes('non disponible')) {
        return calculatePrice(true);
      }
      console.error('Erreur calcul prix:', err);
      setError(err.message || t('price.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  // Si pas de serviceId ET pas de breakdown passé en prop, ne rien afficher
  if (!serviceId && !propBreakdown) {
    return null;
  }

  if (loading) {
    return (
      <div className={`${styles.priceBreakdown} ${className || ''} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>{t('price.calculating')}</span>
        </div>
      </div>
    );
  }

  // En cas d'erreur, ne pas bloquer la page - retourner null
  if (error) {
    return null;
  }

  if (!breakdown) {
    return null;
  }

  // Vue compacte (pour récapitulatif)
  if (compact) {
    return (
      <div className={`${styles.priceBreakdown} ${className || ''} ${styles.compact}`}>
        <div className={styles.compactView}>
          <div className={styles.compactRow}>
            <span>{t('price.basePrice')}</span>
            <span><Price amount={breakdown.base_price} /></span>
          </div>

          {breakdown.formula_modifier !== 0 && (
            <div className={styles.compactRow}>
              <span>{t('price.formula')} {breakdown.formula_modifier_display}</span>
              <span className={breakdown.formula_modifier > 0 ? styles.positive : styles.negative}>
                {breakdown.formula_modifier > 0 ? '+' : ''}<Price amount={breakdown.formula_modifier} />
              </span>
            </div>
          )}

          {breakdown.distance_fee > 0 && (
            <div className={styles.compactRow}>
              <span>
                {t('price.distanceFee')}
                {breakdown.extra_distance_km > 0 && (
                  <span className={styles.distanceDetail}>
                    {' '}({Math.ceil(breakdown.extra_distance_km)} km × {breakdown.price_per_extra_km || 5} {currency})
                  </span>
                )}
              </span>
              <span>+<Price amount={breakdown.distance_fee} /></span>
            </div>
          )}

          {breakdown.distance_fee === 0 && breakdown.distance_km > 0 && (
            <div className={styles.compactRow}>
              <span className={styles.inRadius}>{t('price.noDistanceFee')}</span>
              <span className={styles.freeLabel}>{t('price.included')}</span>
            </div>
          )}

          {breakdown.night_fee > 0 && (
            <div className={styles.compactRow}>
              <span>
                {t('price.nightSupplement')} 🌙
                {breakdown.night_nights_count > 1 && (
                  <span className={styles.nightsBadge}>
                    {breakdown.night_nights_count} {t('price.nights')}
                  </span>
                )}
              </span>
              <span>+<Price amount={breakdown.night_fee} /></span>
            </div>
          )}

          <div className={`${styles.compactRow} ${styles.total}`}>
            <span>{t('price.total')}</span>
            <span><Price amount={breakdown.total} /></span>
          </div>
        </div>
      </div>
    );
  }

  // Vue détaillée
  return (
    <div className={`${styles.priceBreakdown} ${className || ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('price.details')}</h3>
        {breakdown.service && (
          <span className={styles.serviceName}>{breakdown.service.name}</span>
        )}
        {breakdown.formula_type && breakdown.formula_type !== 'standard' && (
          <span className={styles.formulaBadge}>
            {t('price.formula')}: {breakdown.formula_type}
          </span>
        )}
      </div>

      <div className={styles.breakdownList}>
        {/* Prix de base */}
        <div className={styles.breakdownItem}>
          <div className={styles.itemLabel}>
            <span className={styles.itemIcon}>💰</span>
            <span>{t('price.basePrice')}</span>
          </div>
          <span className={styles.itemValue}>
            <Price amount={breakdown.base_price} />
          </span>
        </div>

        {/* Modificateur de formule */}
        {parseFloat(breakdown.formula_modifier) !== 0 && (
          <div className={styles.breakdownItem}>
            <div className={styles.itemLabel}>
              <span className={styles.itemIcon}>📋</span>
              <span>{t('price.formula')} ({breakdown.formula_modifier_display})</span>
            </div>
            <span className={`${styles.itemValue} ${breakdown.formula_modifier > 0 ? styles.positive : styles.negative}`}>
              {breakdown.formula_modifier > 0 ? '+' : ''}<Price amount={breakdown.formula_modifier} />
            </span>
          </div>
        )}

        {/* Durée */}
        {breakdown.duration_hours > 1 && (
          <div className={styles.breakdownItem}>
            <div className={styles.itemLabel}>
              <span className={styles.itemIcon}>⏱️</span>
              <span>{t('price.duration')} ({breakdown.duration_hours}h)</span>
            </div>
            <span className={styles.itemValue}>×{breakdown.duration_hours}</span>
          </div>
        )}

        {/* Quantité */}
        {breakdown.quantity > 1 && (
          <div className={styles.breakdownItem}>
            <div className={styles.itemLabel}>
              <span className={styles.itemIcon}>📦</span>
              <span>{t('price.quantity')}</span>
            </div>
            <span className={styles.itemValue}>×{breakdown.quantity}</span>
          </div>
        )}

        {/* Frais de déplacement */}
        {breakdown.distance_fee > 0 ? (
          <div className={styles.distanceSection}>
            <div className={`${styles.breakdownItem} ${styles.distanceItem}`}>
              <div className={styles.itemLabel}>
                <span className={styles.itemIcon}>🚗</span>
                <span>{t('price.distanceFee')}</span>
              </div>
              <span className={`${styles.itemValue} ${styles.positive}`}>
                +<Price amount={breakdown.distance_fee} />
              </span>
            </div>
            <div className={styles.distanceExplanation}>
              <div className={styles.distanceRow}>
                <span>{t('price.totalDistance')}</span>
                <span>{(breakdown.distance_km || 0).toFixed(1)} km</span>
              </div>
              <div className={styles.distanceRow}>
                <span>{t('price.freeRadius')}</span>
                <span>{breakdown.intervention_radius_km || 10} km</span>
              </div>
              <div className={styles.distanceRow}>
                <span>{t('price.excessDistance')}</span>
                <span>{Math.ceil(breakdown.extra_distance_km || 0)} km</span>
              </div>
              <div className={styles.distanceRow}>
                <span>{t('price.rate')}</span>
                <span>{breakdown.price_per_extra_km || 5} {currency}/km</span>
              </div>
            </div>
          </div>
        ) : breakdown.distance_km > 0 && (
          <div className={styles.breakdownItem}>
            <div className={styles.itemLabel}>
              <span className={styles.itemIcon}>✅</span>
              <span>{t('price.travel')} ({(breakdown.distance_km || 0).toFixed(1)} km)</span>
            </div>
            <span className={`${styles.itemValue} ${styles.included}`}>
              {t('price.included')}
            </span>
          </div>
        )}

        {/* Supplément nuit */}
        {breakdown.night_fee > 0 && (
          <div className={styles.nightSection}>
            <div className={`${styles.breakdownItem} ${styles.nightItem}`}>
              <div className={styles.itemLabel}>
                <span className={styles.itemIcon}>🌙</span>
                <span>
                  {t('price.nightSupplement')}
                  {breakdown.night_nights_count > 1 && (
                    <span className={styles.nightsBadgeDetail}>
                      ({breakdown.night_nights_count} {t('price.consecutiveNights')})
                    </span>
                  )}
                </span>
              </div>
              <span className={`${styles.itemValue} ${styles.positive}`}>
                +<Price amount={breakdown.night_fee} />
              </span>
            </div>
            {breakdown.night?.explanation && (
              <div className={styles.nightExplanation}>
                <span className={styles.nightExplanationIcon}>ℹ️</span>
                <span>{breakdown.night.explanation}</span>
              </div>
            )}
          </div>
        )}

        <div className={styles.divider}></div>

        {/* Sous-total */}
        <div className={styles.breakdownItem}>
          <div className={styles.itemLabel}>
            <span>{t('price.subtotal')}</span>
          </div>
          <span className={styles.itemValue}>
            <Price amount={breakdown.subtotal} />
          </span>
        </div>

        {/* Commission GlamGo */}
        <div className={`${styles.breakdownItem} ${styles.commission}`}>
          <div className={styles.itemLabel}>
            <span className={styles.itemIcon}>🏷️</span>
            <span>{t('price.commission')} ({breakdown.commission_rate})</span>
          </div>
          <span className={styles.itemValue}>
            <Price amount={breakdown.commission_glamgo} />
          </span>
        </div>

        <div className={styles.divider}></div>

        {/* Total */}
        <div className={`${styles.breakdownItem} ${styles.totalRow}`}>
          <div className={styles.itemLabel}>
            <span>{t('price.totalToPay')}</span>
          </div>
          <span className={styles.totalValue}>
            <Price amount={breakdown.total} />
          </span>
        </div>

        {/* Montant prestataire */}
        <div className={`${styles.breakdownItem} ${styles.providerRow}`}>
          <div className={styles.itemLabel}>
            <span className={styles.itemIcon}>👤</span>
            <span>{t('price.providerEarnings')}</span>
          </div>
          <span className={styles.providerValue}>
            <Price amount={breakdown.provider_amount} />
          </span>
        </div>
      </div>

      {/* Indicateur nuit */}
      {breakdown.is_night_service && (
        <div className={styles.nightIndicator}>
          <span>🌙 {t('price.nightService')}</span>
        </div>
      )}
    </div>
  );
}
