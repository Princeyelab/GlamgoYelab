'use client';

import { useEffect, useRef, useCallback } from 'react';
import styles from './NearbyProvidersList.module.scss';

/**
 * Carte des prestataires avec Leaflet (API native)
 * Gestion manuelle du cycle de vie pour compatibilité React 18 strict mode
 */
export default function ProvidersMap({
  clientLocation,
  providers = [],
  nearest,
  radius = 30,
  selectedProviderId,
  onProviderSelect
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const clientMarkerRef = useRef(null);
  const leafletRef = useRef(null);

  // Créer les icônes Leaflet
  const createIcons = useCallback((L) => {
    const createIcon = (color, size = 25) => {
      return L.divIcon({
        className: styles.customMarker,
        html: `
          <div style="
            background: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size]
      });
    };

    return {
      clientIcon: L.divIcon({
        className: styles.clientMarker,
        html: `
          <div style="
            background: #3B82F6;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 2px 10px rgba(59, 130, 246, 0.5);
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
      }),
      nearestIcon: createIcon('#F59E0B', 35),
      providerIcon: createIcon('#10B981', 28),
      selectedIcon: createIcon('#8B5CF6', 32)
    };
  }, []);

  // Créer le contenu popup pour un prestataire
  const createProviderPopupContent = useCallback((provider) => {
    const isNearest = nearest && provider.id === nearest.id;
    const distanceText = provider.distance_formatted || `${provider.distance?.toFixed(1)} km`;
    // Formatage du prix en MAD (Dirham marocain)
    const formatMAD = (amount) => `${Math.round(amount || 0)} DH`;
    const priceText = formatMAD(provider.calculated_price);
    const distanceFeeText = provider.distance_fee > 0
      ? `(dont ${formatMAD(provider.distance_fee)} frais de déplacement)`
      : '';

    // Nom du prestataire avec fallbacks
    const providerName = provider.name
      || provider.business_name
      || (provider.first_name && provider.last_name ? `${provider.first_name} ${provider.last_name}` : null)
      || provider.first_name
      || 'Prestataire';

    return `
      <div class="${styles.popupContent}">
        <div class="${styles.popupHeader}">
          ${isNearest ? `<span class="${styles.nearestTag}">⭐ Le plus proche</span>` : ''}
          <h4>${providerName}</h4>
          ${parseFloat(provider.rating) > 0 ? `
            <div class="${styles.popupRating}">
              ⭐ ${parseFloat(provider.rating).toFixed(1)} (${provider.total_reviews || 0} avis)
            </div>
          ` : ''}
        </div>
        <div class="${styles.popupDetails}">
          <div class="${styles.popupDistance}">📍 À ${distanceText}</div>
          <div class="${styles.popupAvailability}">
            ${provider.is_available_now
              ? `<span class="${styles.available}">🟢 Disponible</span>`
              : `<span class="${styles.scheduled}">📅 ${provider.next_availability || 'Sur rendez-vous'}</span>`
            }
          </div>
        </div>
        <div class="${styles.popupPrice}">
          <span class="${styles.priceLabel}">Prix total:</span>
          <span class="${styles.priceValue}">${priceText}</span>
          ${distanceFeeText ? `<span class="${styles.distanceFee}">${distanceFeeText}</span>` : ''}
        </div>
        <button class="${styles.popupButton}" data-provider-id="${provider.id}">
          Sélectionner
        </button>
      </div>
    `;
  }, [nearest]);

  // Initialiser la carte (une seule fois)
  useEffect(() => {
    if (!clientLocation?.lat || !clientLocation?.lng || !containerRef.current) {
      return;
    }

    // Éviter la double initialisation
    if (mapInstanceRef.current) {
      return;
    }

    const initMap = async () => {
      // Import dynamique de Leaflet
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      leafletRef.current = L;

      // Vérifier que le conteneur existe toujours et n'a pas déjà une carte
      if (!containerRef.current || containerRef.current._leaflet_id) {
        return;
      }

      // Fix pour les icônes Leaflet
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const center = [clientLocation.lat, clientLocation.lng];
      const icons = createIcons(L);

      // Créer la carte
      const map = L.map(containerRef.current, {
        center: center,
        zoom: 12,
        scrollWheelZoom: true
      });

      mapInstanceRef.current = map;

      // Ajouter la couche de tuiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // Ajouter le cercle de rayon
      circleRef.current = L.circle(center, {
        radius: radius * 1000,
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5'
      }).addTo(map);

      // Marqueur client
      clientMarkerRef.current = L.marker(center, { icon: icons.clientIcon })
        .addTo(map)
        .bindPopup(`
          <div class="${styles.popupContent}">
            <strong>📍 Votre position</strong>
            <p>Les prestataires sont recherchés dans un rayon de ${radius} km</p>
          </div>
        `);
    };

    initMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      leafletRef.current = null;
      markersRef.current = [];
      circleRef.current = null;
      clientMarkerRef.current = null;
    };
  }, [clientLocation?.lat, clientLocation?.lng, radius, createIcons]);

  // Mettre à jour les marqueurs des prestataires (quand providers change)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;

    if (!map || !L) {
      return;
    }

    // Supprimer les anciens marqueurs des prestataires
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    const icons = createIcons(L);

    // Tracker les positions pour détecter les doublons
    const usedPositions = new Map();

    providers.forEach((provider) => {
      let lat = parseFloat(provider.latitude);
      let lng = parseFloat(provider.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`⚠️ Prestataire ${provider.id} ignoré: coordonnées invalides`);
        return;
      }

      // Créer une clé pour cette position
      const posKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;

      // Si cette position est déjà utilisée, ajouter un décalage
      if (usedPositions.has(posKey)) {
        const count = usedPositions.get(posKey);
        // Décalage en cercle autour du point (environ 30m)
        const angle = (count * 60) * (Math.PI / 180); // 60° entre chaque marqueur
        const offset = 0.0003; // ~30 mètres
        lat += Math.cos(angle) * offset;
        lng += Math.sin(angle) * offset;
        usedPositions.set(posKey, count + 1);
      } else {
        usedPositions.set(posKey, 1);
      }

      let icon = icons.providerIcon;
      if (selectedProviderId === provider.id) {
        icon = icons.selectedIcon;
      } else if (nearest && provider.id === nearest.id) {
        icon = icons.nearestIcon;
      }

      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(createProviderPopupContent(provider));

      marker.on('click', () => {
        if (onProviderSelect) {
          onProviderSelect(provider);
        }
      });

      // Gérer le clic sur le bouton dans le popup
      marker.on('popupopen', () => {
        const popupEl = marker.getPopup().getElement();
        const btn = popupEl?.querySelector(`[data-provider-id="${provider.id}"]`);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            if (onProviderSelect) {
              onProviderSelect(provider);
            }
          };
        }
      });

      markersRef.current.push(marker);
    });

  }, [providers, nearest, selectedProviderId, onProviderSelect, createIcons, createProviderPopupContent]);

  if (!clientLocation?.lat || !clientLocation?.lng) {
    return (
      <div className={styles.mapPlaceholder}>
        <span>Position non disponible</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={styles.map}
      style={{ minHeight: '400px' }}
    />
  );
}
