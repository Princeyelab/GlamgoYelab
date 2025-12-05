'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './AddressAutocomplete.module.scss';

// Quartiers et zones populaires par ville au Maroc
const MOROCCO_SUGGESTIONS = [
  // Casablanca
  { name: 'Maarif, Casablanca', lat: 33.5731, lng: -7.6298 },
  { name: 'Anfa, Casablanca', lat: 33.5950, lng: -7.6367 },
  { name: 'Ain Diab, Casablanca', lat: 33.5920, lng: -7.6700 },
  { name: 'Bourgogne, Casablanca', lat: 33.5850, lng: -7.6250 },
  { name: 'Gauthier, Casablanca', lat: 33.5900, lng: -7.6200 },
  { name: 'Racine, Casablanca', lat: 33.5880, lng: -7.6350 },
  { name: 'Oasis, Casablanca', lat: 33.5650, lng: -7.6150 },
  { name: 'Californie, Casablanca', lat: 33.5500, lng: -7.5900 },
  { name: 'Sidi Maarouf, Casablanca', lat: 33.5350, lng: -7.6500 },
  { name: 'Hay Hassani, Casablanca', lat: 33.5600, lng: -7.6800 },
  { name: 'Centre Ville, Casablanca', lat: 33.5897, lng: -7.6031 },
  { name: 'Derb Sultan, Casablanca', lat: 33.5750, lng: -7.6100 },
  // Rabat
  { name: 'Agdal, Rabat', lat: 33.9911, lng: -6.8498 },
  { name: 'Hassan, Rabat', lat: 34.0209, lng: -6.8416 },
  { name: 'Souissi, Rabat', lat: 33.9800, lng: -6.8600 },
  { name: 'Hay Riad, Rabat', lat: 33.9650, lng: -6.8750 },
  { name: 'Océan, Rabat', lat: 34.0150, lng: -6.8550 },
  { name: 'Yacoub El Mansour, Rabat', lat: 33.9950, lng: -6.8900 },
  { name: 'Centre Ville, Rabat', lat: 34.0132, lng: -6.8326 },
  // Marrakech
  { name: 'Guéliz, Marrakech', lat: 31.6340, lng: -8.0100 },
  { name: 'Hivernage, Marrakech', lat: 31.6200, lng: -8.0200 },
  { name: 'Médina, Marrakech', lat: 31.6295, lng: -7.9811 },
  { name: 'Palmeraie, Marrakech', lat: 31.6700, lng: -7.9700 },
  { name: 'Targa, Marrakech', lat: 31.6500, lng: -8.0400 },
  { name: 'Semlalia, Marrakech', lat: 31.6280, lng: -8.0050 },
  { name: 'Majorelle, Marrakech', lat: 31.6417, lng: -8.0031 },
  { name: 'Centre Ville, Marrakech', lat: 31.6315, lng: -8.0083 },
  // Tanger
  { name: 'Centre Ville, Tanger', lat: 35.7673, lng: -5.7998 },
  { name: 'Malabata, Tanger', lat: 35.7900, lng: -5.7600 },
  { name: 'Iberia, Tanger', lat: 35.7750, lng: -5.8100 },
  { name: 'Moujahidine, Tanger', lat: 35.7600, lng: -5.8200 },
  { name: 'Médina, Tanger', lat: 35.7850, lng: -5.8133 },
  // Fès
  { name: 'Ville Nouvelle, Fès', lat: 34.0331, lng: -5.0003 },
  { name: 'Médina, Fès', lat: 34.0617, lng: -4.9750 },
  { name: 'Route Sefrou, Fès', lat: 34.0100, lng: -4.9800 },
  { name: 'Narjiss, Fès', lat: 34.0450, lng: -5.0150 },
  { name: 'Centre Ville, Fès', lat: 34.0346, lng: -5.0003 },
  // Agadir
  { name: 'Centre Ville, Agadir', lat: 30.4278, lng: -9.5981 },
  { name: 'Talborjt, Agadir', lat: 30.4200, lng: -9.5900 },
  { name: 'Hay Mohammadi, Agadir', lat: 30.4350, lng: -9.6100 },
  { name: 'Founty, Agadir', lat: 30.4050, lng: -9.6200 },
  // Meknès
  { name: 'Centre Ville, Meknès', lat: 33.8935, lng: -5.5473 },
  { name: 'Hamria, Meknès', lat: 33.8850, lng: -5.5550 },
  // Oujda
  { name: 'Centre Ville, Oujda', lat: 34.6814, lng: -1.9086 },
  // Kenitra
  { name: 'Centre Ville, Kenitra', lat: 34.2610, lng: -6.5802 },
  // Tétouan
  { name: 'Centre Ville, Tétouan', lat: 35.5785, lng: -5.3684 },
  // Safi
  { name: 'Centre Ville, Safi', lat: 32.2994, lng: -9.2372 },
  // Mohammédia
  { name: 'Centre Ville, Mohammédia', lat: 33.6866, lng: -7.3828 },
  // El Jadida
  { name: 'Centre Ville, El Jadida', lat: 33.2316, lng: -8.5007 },
];

/**
 * Composant d'autocomplétion d'adresse pour le Maroc
 * Fonctionne avec ou sans clé Google Maps API
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder = 'Tapez votre adresse (ex: Maarif, Guéliz...)',
  className = '',
  error = '',
  id = 'address',
  name = 'address',
  required = false,
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef(null);

  // Charger Google Places API (optionnel)
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsGoogleLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'VOTRE_CLE_ICI' || apiKey === 'votre_clé_google_maps_ici') {
      return; // Pas de clé, utiliser les suggestions locales
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr&region=MA`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleLoaded(true);
      }
    };
    document.head.appendChild(script);
  }, []);

  // Initialiser Google Places Autocomplete si disponible
  useEffect(() => {
    if (!isGoogleLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'ma' },
        fields: ['formatted_address', 'geometry', 'name'],
      });

      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;

        const address = place.formatted_address || place.name;
        onChange({ target: { name, value: address } });

        if (onPlaceSelected) {
          onPlaceSelected({
            address,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          });
        }
        setShowSuggestions(false);
      });
    } catch (err) {
      console.error('Erreur Google Places:', err);
    }
  }, [isGoogleLoaded, onChange, onPlaceSelected, name]);

  // Filtrer les suggestions locales
  const filterSuggestions = useCallback((searchText) => {
    if (!searchText || searchText.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const search = searchText.toLowerCase().trim();
    const filtered = MOROCCO_SUGGESTIONS.filter(s =>
      s.name.toLowerCase().includes(search)
    ).slice(0, 8);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(-1);
  }, []);

  // Gérer la saisie
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(e);

    // Toujours filtrer les suggestions locales (même si Google est chargé)
    // Google affichera ses propres suggestions dans le dropdown natif
    if (!isGoogleLoaded) {
      filterSuggestions(newValue);
    }
  };

  // Gérer le focus
  const handleFocus = () => {
    if (!isGoogleLoaded && value && value.length >= 2) {
      filterSuggestions(value);
    }
  };

  // Sélectionner une suggestion
  const handleSelectSuggestion = (suggestion) => {
    onChange({ target: { name, value: suggestion.name } });

    if (onPlaceSelected) {
      onPlaceSelected({
        address: suggestion.name,
        latitude: suggestion.lat,
        longitude: suggestion.lng,
      });
    }

    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Navigation au clavier
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.autocompleteWrapper}>
      <div className={styles.inputContainer}>
        <span className={styles.inputIcon}>📍</span>
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className={`${className} ${styles.input} ${error ? styles.inputError : ''}`}
          placeholder={placeholder}
          autoComplete="off"
          required={required}
        />
      </div>

      {/* Liste de suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <ul ref={suggestionsRef} className={styles.suggestionsList}>
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.name}-${index}`}
              className={`${styles.suggestionItem} ${index === selectedIndex ? styles.selected : ''}`}
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className={styles.suggestionIcon}>📍</span>
              <span className={styles.suggestionText}>{suggestion.name}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Aide */}
      {!isGoogleLoaded && !showSuggestions && (!value || value.length < 2) && (
        <span className={styles.hint}>
          Tapez au moins 2 caractères (ex: Casa, Maarif, Guéliz, Agdal...)
        </span>
      )}
    </div>
  );
}
