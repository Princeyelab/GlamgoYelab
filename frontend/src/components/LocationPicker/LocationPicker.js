'use client';

import { useState, useEffect } from 'react';
import './LocationPicker.scss';

/**
 * LocationPicker - Sélectionner une adresse avec géolocalisation
 *
 * Props:
 * - onLocationSelect: callback avec {lat, lng, address}
 * - initialLocation: {lat, lng, address} pour pré-remplir
 * - height: hauteur (non utilisé dans cette version simplifiée)
 *
 * @author Claude Code
 */
export default function LocationPicker({
  onLocationSelect,
  initialLocation = null,
  height = 400
}) {
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [coordinates, setCoordinates] = useState(
    initialLocation ? {
      latitude: initialLocation.lat,
      longitude: initialLocation.lng
    } : null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (initialLocation) {
      setAddress(initialLocation.address);
      setCoordinates({
        latitude: initialLocation.lat,
        longitude: initialLocation.lng
      });
    }
  }, [initialLocation]);

  const handleAddressChange = (e) => {
    const newAddress = e.target.value;
    setAddress(newAddress);

    if (onLocationSelect && coordinates) {
      onLocationSelect({
        address: newAddress,
        lat: coordinates.latitude,
        lng: coordinates.longitude,
      });
    }
  };

  const getCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationError('Votre navigateur ne supporte pas la géolocalisation');
      return;
    }

    setIsGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        setCoordinates(coords);
        setIsGettingLocation(false);

        // Géocodage inversé pour obtenir l'adresse
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          );
          const data = await response.json();
          const fetchedAddress = data.display_name || `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;

          setAddress(fetchedAddress);

          if (onLocationSelect) {
            onLocationSelect({
              address: fetchedAddress,
              lat: coords.latitude,
              lng: coords.longitude,
            });
          }
        } catch (error) {
          console.error('Erreur géocodage:', error);
          const fallbackAddress = `Position GPS: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
          setAddress(fallbackAddress);

          if (onLocationSelect) {
            onLocationSelect({
              address: fallbackAddress,
              lat: coords.latitude,
              lng: coords.longitude,
            });
          }
        }
      },
      (error) => {
        setIsGettingLocation(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Vous avez refusé le partage de votre position');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Position indisponible');
            break;
          case error.TIMEOUT:
            setLocationError('Délai dépassé pour obtenir la position');
            break;
          default:
            setLocationError('Erreur lors de la récupération de la position');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setLocationError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery + ', Marrakech, Morocco'
        )}&format=json&limit=5`
      );
      const data = await response.json();

      setSearchResults(data);
    } catch (error) {
      console.error('Erreur recherche adresse:', error);
      setLocationError('Erreur lors de la recherche d\'adresse');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const coords = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon)
    };

    setCoordinates(coords);
    setAddress(result.display_name);
    setSearchResults([]);
    setSearchQuery('');

    if (onLocationSelect) {
      onLocationSelect({
        address: result.display_name,
        lat: coords.latitude,
        lng: coords.longitude,
      });
    }
  };

  const clearLocation = () => {
    setCoordinates(null);
    setLocationError('');
  };

  return (
    <div className="location-picker">
      <div className="search-section">
        <div className="form-group">
          <label>Rechercher une adresse</label>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Rechercher une adresse à Marrakech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="btn-search"
            >
              {isSearching ? 'Recherche...' : '🔍 Rechercher'}
            </button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="search-result-item"
                onClick={() => handleSelectSearchResult(result)}
              >
                📍 {result.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="address-field">
        <label>
          Adresse complète <span className="required">*</span>
        </label>
        <textarea
          value={address}
          onChange={handleAddressChange}
          placeholder="Ex: 123 Avenue Mohammed V, Guéliz, Marrakech"
          className="textarea"
          rows={3}
          required
        />
      </div>

      <div className="gps-section">
        <div className="gps-header">
          <span className="gps-icon">📍</span>
          <div className="gps-info">
            <strong>Partager ma position GPS</strong>
            <p className="hint">
              Recommandé pour aider le prestataire à vous trouver facilement
            </p>
          </div>
        </div>

        {!coordinates ? (
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="btn-geolocation"
          >
            {isGettingLocation ? (
              <>⏳ Récupération en cours...</>
            ) : (
              <>📍 Utiliser ma position actuelle</>
            )}
          </button>
        ) : (
          <div className="gps-active">
            <div className="gps-details">
              <span className="success-icon">✅</span>
              <div className="coords">
                <strong>Position GPS partagée</strong>
                <p className="coords-text">
                  Lat: {coordinates.latitude.toFixed(6)},
                  Lng: {coordinates.longitude.toFixed(6)}
                </p>
                {coordinates.accuracy && (
                  <p className="accuracy">
                    Précision: ±{Math.round(coordinates.accuracy)}m
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={clearLocation}
              className="btn-clear"
            >
              Supprimer
            </button>
          </div>
        )}

        {locationError && (
          <div className="error">
            ⚠️ {locationError}
          </div>
        )}
      </div>

      {address && (
        <div className="selected-address">
          ✅ <strong>Adresse sélectionnée :</strong> {address}
        </div>
      )}
    </div>
  );
}
