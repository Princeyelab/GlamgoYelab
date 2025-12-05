'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './DistanceFeeExplainer.module.css';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * DistanceFeeExplainer - Composant explicatif des frais de déplacement
 *
 * Affiche une visualisation interactive des frais kilométriques avec :
 * - Carte interactive (si coordonnées disponibles)
 * - Étapes de calcul détaillées
 * - Message explicatif pour le client
 *
 * @param {Object} props
 * @param {Object} props.provider - Données du prestataire (latitude, longitude, intervention_radius_km, etc.)
 * @param {Object} props.clientLocation - Position du client {lat, lng}
 * @param {Object} props.distanceCalculation - Résultat du calcul de distance
 * @param {boolean} props.showMap - Afficher la carte (défaut: true)
 * @param {boolean} props.compact - Mode compact (défaut: false)
 */
export default function DistanceFeeExplainer({
  provider,
  clientLocation,
  distanceCalculation,
  showMap = true,
  compact = false
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { currency } = useCurrency();
  const { t } = useLanguage();

  // Extraire les données du calcul
  const {
    distance_km = 0,
    is_in_radius = true,
    intervention_radius_km = 10,
    extra_distance_km = 0,
    price_per_extra_km = 5,
    fee = 0,
    explanation
  } = distanceCalculation || {};

  // Coordonnées
  const providerLat = parseFloat(provider?.latitude || provider?.current_latitude || 0);
  const providerLng = parseFloat(provider?.longitude || provider?.current_longitude || 0);
  const clientLat = parseFloat(clientLocation?.lat || 0);
  const clientLng = parseFloat(clientLocation?.lng || 0);

  // Initialiser la carte Leaflet
  useEffect(() => {
    if (!showMap || !mapRef.current || mapInstanceRef.current) return;
    if (!providerLat || !providerLng || !clientLat || !clientLng) return;

    // Charger Leaflet dynamiquement
    const loadMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        // Nettoyer si déjà initialisé
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // Centre entre les deux points
        const centerLat = (providerLat + clientLat) / 2;
        const centerLng = (providerLng + clientLng) / 2;

        // Créer la carte
        const map = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
          dragging: !compact,
          scrollWheelZoom: false
        }).setView([centerLat, centerLng], 12);

        // Tuile de carte
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        // Cercle du rayon d'intervention (zone gratuite)
        const radiusCircle = L.circle([providerLat, providerLng], {
          radius: intervention_radius_km * 1000,
          color: '#22c55e',
          fillColor: '#22c55e',
          fillOpacity: 0.15,
          weight: 2,
          dashArray: '5, 5'
        }).addTo(map);

        // Icône prestataire
        const providerIcon = L.divIcon({
          className: styles.providerMarker,
          html: '<div class="marker-icon provider">👨‍💼</div>',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });

        // Icône client
        const clientIcon = L.divIcon({
          className: styles.clientMarker,
          html: '<div class="marker-icon client">📍</div>',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });

        // Marqueurs
        L.marker([providerLat, providerLng], { icon: providerIcon })
          .bindPopup(`<strong>${t('distance.provider')}</strong><br>${t('distance.radius')}: ${intervention_radius_km} km`)
          .addTo(map);

        L.marker([clientLat, clientLng], { icon: clientIcon })
          .bindPopup(`<strong>${t('distance.yourPosition')}</strong><br>${t('distance.distanceLabel')}: ${distance_km.toFixed(1)} km`)
          .addTo(map);

        // Ligne de distance
        const lineColor = is_in_radius ? '#22c55e' : '#ef4444';
        L.polyline([[providerLat, providerLng], [clientLat, clientLng]], {
          color: lineColor,
          weight: 3,
          dashArray: is_in_radius ? null : '10, 10',
          opacity: 0.8
        }).addTo(map);

        // Ajuster le zoom pour voir tous les éléments
        const bounds = L.latLngBounds([
          [providerLat, providerLng],
          [clientLat, clientLng]
        ]);
        map.fitBounds(bounds.pad(0.3));

        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (error) {
        console.error('Erreur chargement carte:', error);
      }
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showMap, providerLat, providerLng, clientLat, clientLng, intervention_radius_km, distance_km, is_in_radius, compact]);

  // Étapes de calcul
  const calculationSteps = explanation?.steps || [
    {
      step: 1,
      label: t('distance.totalDistance'),
      value: `${distance_km.toFixed(1)} km`,
      icon: '📍'
    },
    {
      step: 2,
      label: t('distance.freeRadius'),
      value: `${intervention_radius_km} km`,
      icon: '🎯'
    },
    {
      step: 3,
      label: t('distance.excessDistance'),
      value: `${Math.ceil(extra_distance_km)} km`,
      icon: '📏',
      calculation: is_in_radius ? t('distance.none') : `${distance_km.toFixed(1)} - ${intervention_radius_km} = ${extra_distance_km.toFixed(1)} km`
    },
    {
      step: 4,
      label: t('distance.title'),
      value: `${fee.toFixed(2)} ${currency}`,
      icon: '💰',
      calculation: is_in_radius ? t('distance.free') : `${Math.ceil(extra_distance_km)} km × ${price_per_extra_km} ${currency} = ${fee.toFixed(2)} ${currency}`
    }
  ];

  // Mode compact
  if (compact) {
    return (
      <div className={styles.compactExplainer}>
        <div className={styles.compactHeader}>
          <span className={styles.compactIcon}>{is_in_radius ? '✅' : 'ℹ️'}</span>
          <span className={styles.compactText}>
            {is_in_radius
              ? t('distance.noFee')
              : t('distance.feeAmount', { amount: fee.toFixed(0), currency })
            }
          </span>
        </div>
        {!is_in_radius && (
          <div className={styles.compactDetails}>
            <span>{distance_km.toFixed(1)} km</span>
            <span>•</span>
            <span>{t('distance.freeRadius')}: {intervention_radius_km} km</span>
            <span>•</span>
            <span>{price_per_extra_km} {currency}/km</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.explainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {is_in_radius ? `✅ ${t('distance.freeZone')}` : `📍 ${t('distance.title')}`}
        </h3>
        <p className={styles.subtitle}>
          {is_in_radius
            ? t('distance.inRadius', { distance: distance_km.toFixed(1), radius: intervention_radius_km })
            : t('distance.outOfRadius', { distance: distance_km.toFixed(1), radius: intervention_radius_km })
          }
        </p>
      </div>

      {/* Carte visuelle */}
      {showMap && providerLat && providerLng && clientLat && clientLng && (
        <div className={styles.mapContainer}>
          <div ref={mapRef} className={styles.map} />
          <div className={styles.mapLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendCircle} style={{ backgroundColor: '#22c55e' }} />
              <span>{t('distance.freeZone')} ({intervention_radius_km} km)</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendLine} style={{ backgroundColor: is_in_radius ? '#22c55e' : '#ef4444' }} />
              <span>{t('distance.distanceLabel')} ({distance_km.toFixed(1)} km)</span>
            </div>
          </div>
        </div>
      )}

      {/* Étapes de calcul */}
      <div className={styles.calculationSteps}>
        <h4 className={styles.stepsTitle}>{t('distance.calculationDetail')}</h4>
        {calculationSteps.map((step, index) => (
          <div
            key={step.step}
            className={`${styles.step} ${index === calculationSteps.length - 1 ? styles.stepFinal : ''}`}
          >
            <div className={styles.stepNumber}>
              <span>{step.icon || step.step}</span>
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepLabel}>{step.label}</div>
              <div className={styles.stepValue}>{step.value}</div>
              {step.calculation && (
                <div className={styles.stepCalculation}>{step.calculation}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message d'information */}
      <div className={`${styles.infoBox} ${is_in_radius ? styles.infoBoxSuccess : styles.infoBoxWarning}`}>
        <span className={styles.infoIcon}>{is_in_radius ? '💡' : '📢'}</span>
        <span className={styles.infoText}>
          {is_in_radius
            ? t('distance.inRadiusInfo')
            : t('distance.outOfRadiusInfo')
          }
        </span>
      </div>

      {/* Résumé des frais */}
      {!is_in_radius && (
        <div className={styles.feeSummary}>
          <div className={styles.feeLabel}>{t('distance.title')}</div>
          <div className={styles.feeAmount}>+{fee.toFixed(2)} {currency}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Badge compact pour afficher les frais de distance
 */
export function DistanceFeeBadge({ distanceCalculation, onClick }) {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const { is_in_radius, fee = 0, distance_km = 0 } = distanceCalculation || {};

  if (is_in_radius) {
    return (
      <div className={styles.badge} onClick={onClick}>
        <span className={styles.badgeIcon}>✅</span>
        <span className={styles.badgeText}>{t('distance.noFee')}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.badge} ${styles.badgeWarning}`} onClick={onClick}>
      <span className={styles.badgeIcon}>📍</span>
      <span className={styles.badgeText}>
        +{fee.toFixed(0)} {currency} ({distance_km.toFixed(1)} km)
      </span>
      {onClick && <span className={styles.badgeInfo}>ℹ️</span>}
    </div>
  );
}

/**
 * Alerte de frais de distance pour les cartes prestataires
 */
export function DistanceFeeAlert({ distanceCalculation, provider }) {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const {
    is_in_radius,
    fee = 0,
    distance_km = 0,
    intervention_radius_km = 10,
    extra_distance_km = 0,
    price_per_extra_km = 5
  } = distanceCalculation || {};

  if (is_in_radius) {
    return (
      <div className={styles.alertSuccess}>
        <span className={styles.alertIcon}>✅</span>
        <span className={styles.alertText}>
          {t('distance.noFeeInZone')}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.alert}>
      <div className={styles.alertHeader}>
        <span className={styles.alertIcon}>ℹ️</span>
        <strong>{t('distance.title')} : +{fee.toFixed(2)} {currency}</strong>
      </div>
      <p className={styles.alertExplanation}>
        {t('distance.alertExplanation', { radius: intervention_radius_km, distance: distance_km.toFixed(1) })}
      </p>
      <div className={styles.alertBreakdown}>
        <span>{t('distance.radius')} : {intervention_radius_km} km</span>
        <span>{t('distance.additionalDistance')} : {Math.ceil(extra_distance_km)} km</span>
        <span>{t('distance.rate')} : {price_per_extra_km} {currency}/km</span>
      </div>
    </div>
  );
}
