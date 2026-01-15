'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './AddressAutocomplete.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';

// Quartiers et zones populaires par ville au Maroc
const MOROCCO_SUGGESTIONS = [
  // Casablanca
  { nameKey: 'address.maarif', nameFr: 'Maarif, Casablanca', nameAr: 'المعاريف، الدار البيضاء', lat: 33.5731, lng: -7.6298 },
  { nameKey: 'address.anfa', nameFr: 'Anfa, Casablanca', nameAr: 'أنفا، الدار البيضاء', lat: 33.5950, lng: -7.6367 },
  { nameKey: 'address.ainDiab', nameFr: 'Ain Diab, Casablanca', nameAr: 'عين الذئاب، الدار البيضاء', lat: 33.5920, lng: -7.6700 },
  { nameKey: 'address.bourgogne', nameFr: 'Bourgogne, Casablanca', nameAr: 'بورغون، الدار البيضاء', lat: 33.5850, lng: -7.6250 },
  { nameKey: 'address.gauthier', nameFr: 'Gauthier, Casablanca', nameAr: 'غوتييه، الدار البيضاء', lat: 33.5900, lng: -7.6200 },
  { nameKey: 'address.racine', nameFr: 'Racine, Casablanca', nameAr: 'راسين، الدار البيضاء', lat: 33.5880, lng: -7.6350 },
  { nameKey: 'address.oasis', nameFr: 'Oasis, Casablanca', nameAr: 'الواحة، الدار البيضاء', lat: 33.5650, lng: -7.6150 },
  { nameKey: 'address.californie', nameFr: 'Californie, Casablanca', nameAr: 'كاليفورنيا، الدار البيضاء', lat: 33.5500, lng: -7.5900 },
  { nameKey: 'address.sidiMaarouf', nameFr: 'Sidi Maarouf, Casablanca', nameAr: 'سيدي معروف، الدار البيضاء', lat: 33.5350, lng: -7.6500 },
  { nameKey: 'address.hayHassaniCasa', nameFr: 'Hay Hassani, Casablanca', nameAr: 'حي الحسني، الدار البيضاء', lat: 33.5600, lng: -7.6800 },
  { nameKey: 'address.centreVilleCasa', nameFr: 'Centre Ville, Casablanca', nameAr: 'وسط المدينة، الدار البيضاء', lat: 33.5897, lng: -7.6031 },
  { nameKey: 'address.derbSultan', nameFr: 'Derb Sultan, Casablanca', nameAr: 'درب السلطان، الدار البيضاء', lat: 33.5750, lng: -7.6100 },
  // Rabat
  { nameKey: 'address.agdal', nameFr: 'Agdal, Rabat', nameAr: 'أكدال، الرباط', lat: 33.9911, lng: -6.8498 },
  { nameKey: 'address.hassan', nameFr: 'Hassan, Rabat', nameAr: 'حسان، الرباط', lat: 34.0209, lng: -6.8416 },
  { nameKey: 'address.souissi', nameFr: 'Souissi, Rabat', nameAr: 'السويسي، الرباط', lat: 33.9800, lng: -6.8600 },
  { nameKey: 'address.hayRiad', nameFr: 'Hay Riad, Rabat', nameAr: 'حي الرياض، الرباط', lat: 33.9650, lng: -6.8750 },
  { nameKey: 'address.ocean', nameFr: 'Océan, Rabat', nameAr: 'أوسيان، الرباط', lat: 34.0150, lng: -6.8550 },
  { nameKey: 'address.yacoubElMansour', nameFr: 'Yacoub El Mansour, Rabat', nameAr: 'يعقوب المنصور، الرباط', lat: 33.9950, lng: -6.8900 },
  { nameKey: 'address.centreVilleRabat', nameFr: 'Centre Ville, Rabat', nameAr: 'وسط المدينة، الرباط', lat: 34.0132, lng: -6.8326 },
  // Marrakech
  { nameKey: 'address.gueliz', nameFr: 'Guéliz, Marrakech', nameAr: 'جيليز، مراكش', lat: 31.6340, lng: -8.0100 },
  { nameKey: 'address.hivernage', nameFr: 'Hivernage, Marrakech', nameAr: 'الحيفرناج، مراكش', lat: 31.6200, lng: -8.0200 },
  { nameKey: 'address.medinaMarrakech', nameFr: 'Médina, Marrakech', nameAr: 'المدينة القديمة، مراكش', lat: 31.6295, lng: -7.9811 },
  { nameKey: 'address.palmeraie', nameFr: 'Palmeraie, Marrakech', nameAr: 'النخيل، مراكش', lat: 31.6700, lng: -7.9700 },
  { nameKey: 'address.targa', nameFr: 'Targa, Marrakech', nameAr: 'تارغة، مراكش', lat: 31.6500, lng: -8.0400 },
  { nameKey: 'address.semlalia', nameFr: 'Semlalia, Marrakech', nameAr: 'السملالية، مراكش', lat: 31.6280, lng: -8.0050 },
  { nameKey: 'address.majorelle', nameFr: 'Majorelle, Marrakech', nameAr: 'ماجوريل، مراكش', lat: 31.6417, lng: -8.0031 },
  { nameKey: 'address.centreVilleMarrakech', nameFr: 'Centre Ville, Marrakech', nameAr: 'وسط المدينة، مراكش', lat: 31.6315, lng: -8.0083 },
  // Tanger
  { nameKey: 'address.centreVilleTanger', nameFr: 'Centre Ville, Tanger', nameAr: 'وسط المدينة، طنجة', lat: 35.7673, lng: -5.7998 },
  { nameKey: 'address.malabata', nameFr: 'Malabata, Tanger', nameAr: 'ملاباطا، طنجة', lat: 35.7900, lng: -5.7600 },
  { nameKey: 'address.iberia', nameFr: 'Iberia, Tanger', nameAr: 'إيبيريا، طنجة', lat: 35.7750, lng: -5.8100 },
  { nameKey: 'address.moujahidine', nameFr: 'Moujahidine, Tanger', nameAr: 'المجاهدين، طنجة', lat: 35.7600, lng: -5.8200 },
  { nameKey: 'address.medinaTanger', nameFr: 'Médina, Tanger', nameAr: 'المدينة القديمة، طنجة', lat: 35.7850, lng: -5.8133 },
  // Fès
  { nameKey: 'address.villeNouvelleFes', nameFr: 'Ville Nouvelle, Fès', nameAr: 'المدينة الجديدة، فاس', lat: 34.0331, lng: -5.0003 },
  { nameKey: 'address.medinaFes', nameFr: 'Médina, Fès', nameAr: 'المدينة القديمة، فاس', lat: 34.0617, lng: -4.9750 },
  { nameKey: 'address.routeSefrou', nameFr: 'Route Sefrou, Fès', nameAr: 'طريق صفرو، فاس', lat: 34.0100, lng: -4.9800 },
  { nameKey: 'address.narjiss', nameFr: 'Narjiss, Fès', nameAr: 'النرجس، فاس', lat: 34.0450, lng: -5.0150 },
  { nameKey: 'address.centreVilleFes', nameFr: 'Centre Ville, Fès', nameAr: 'وسط المدينة، فاس', lat: 34.0346, lng: -5.0003 },
  // Agadir
  { nameKey: 'address.centreVilleAgadir', nameFr: 'Centre Ville, Agadir', nameAr: 'وسط المدينة، أكادير', lat: 30.4278, lng: -9.5981 },
  { nameKey: 'address.talborjt', nameFr: 'Talborjt, Agadir', nameAr: 'تالبرجت، أكادير', lat: 30.4200, lng: -9.5900 },
  { nameKey: 'address.hayMohammadi', nameFr: 'Hay Mohammadi, Agadir', nameAr: 'حي المحمدي، أكادير', lat: 30.4350, lng: -9.6100 },
  { nameKey: 'address.founty', nameFr: 'Founty, Agadir', nameAr: 'فونتي، أكادير', lat: 30.4050, lng: -9.6200 },
  // Meknès
  { nameKey: 'address.centreVilleMeknes', nameFr: 'Centre Ville, Meknès', nameAr: 'وسط المدينة، مكناس', lat: 33.8935, lng: -5.5473 },
  { nameKey: 'address.hamria', nameFr: 'Hamria, Meknès', nameAr: 'الحمرية، مكناس', lat: 33.8850, lng: -5.5550 },
  // Oujda
  { nameKey: 'address.centreVilleOujda', nameFr: 'Centre Ville, Oujda', nameAr: 'وسط المدينة، وجدة', lat: 34.6814, lng: -1.9086 },
  // Kenitra
  { nameKey: 'address.centreVilleKenitra', nameFr: 'Centre Ville, Kenitra', nameAr: 'وسط المدينة، القنيطرة', lat: 34.2610, lng: -6.5802 },
  // Tétouan
  { nameKey: 'address.centreVilleTetouan', nameFr: 'Centre Ville, Tétouan', nameAr: 'وسط المدينة، تطوان', lat: 35.5785, lng: -5.3684 },
  // Safi
  { nameKey: 'address.centreVilleSafi', nameFr: 'Centre Ville, Safi', nameAr: 'وسط المدينة، آسفي', lat: 32.2994, lng: -9.2372 },
  // Mohammédia
  { nameKey: 'address.centreVilleMohammedia', nameFr: 'Centre Ville, Mohammédia', nameAr: 'وسط المدينة، المحمدية', lat: 33.6866, lng: -7.3828 },
  // El Jadida
  { nameKey: 'address.centreVilleElJadida', nameFr: 'Centre Ville, El Jadida', nameAr: 'وسط المدينة، الجديدة', lat: 33.2316, lng: -8.5007 },
];

/**
 * Composant d'autocomplétion d'adresse pour le Maroc
 * Fonctionne avec ou sans clé Google Maps API
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder,
  className = '',
  error = '',
  id = 'address',
  name = 'address',
  required = false,
}) {
  const { t, isRTL } = useLanguage();
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const debounceRef = useRef(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const suggestionsRef = useRef(null);

  // Placeholder traduit
  const defaultPlaceholder = isRTL
    ? 'اكتب عنوانك الكامل (مثال: 123 شارع محمد الخامس، جيليز، مراكش)'
    : 'Tapez votre adresse complète (ex: 123 Avenue Mohammed V, Guéliz, Marrakech)';

  // Hint traduit
  const hintText = isRTL
    ? 'اكتب على الأقل حرفين (مثال: كازا، المعاريف، جيليز، أكدال...)'
    : 'Tapez au moins 2 caractères (ex: Casa, Maarif, Guéliz, Agdal...)';

  // Obtenir le nom localisé
  const getLocalizedName = (suggestion) => {
    return isRTL ? suggestion.nameAr : suggestion.nameFr;
  };

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${isRTL ? 'ar' : 'fr'}&region=MA`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleLoaded(true);
      }
    };
    document.head.appendChild(script);
  }, [isRTL]);

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

  // Géolocalisation automatique
  const handleGeolocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert(isRTL ? 'الموقع الجغرافي غير مدعوم في متصفحك' : 'La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setIsGeolocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocoding avec Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `lat=${latitude}&` +
            `lon=${longitude}&` +
            `format=json&` +
            `addressdetails=1&` +
            `accept-language=${isRTL ? 'ar' : 'fr'}`,
            {
              headers: {
                'User-Agent': 'GlamGo-App/1.0'
              }
            }
          );

          if (!response.ok) throw new Error('Reverse geocoding failed');

          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          // Mettre à jour le champ
          onChange({ target: { name, value: address } });

          // Notifier le parent avec les coordonnées
          if (onPlaceSelected) {
            onPlaceSelected({
              address,
              latitude,
              longitude,
            });
          }

          setShowSuggestions(false);
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          alert(isRTL ? 'فشل في الحصول على العنوان' : 'Impossible de récupérer l\'adresse');
        } finally {
          setIsGeolocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGeolocating(false);

        let errorMessage = isRTL ? 'فشل في تحديد الموقع' : 'Erreur de géolocalisation';

        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = isRTL
            ? 'الرجاء السماح بالوصول إلى موقعك في إعدادات المتصفح'
            : 'Veuillez autoriser l\'accès à votre position dans les paramètres du navigateur';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = isRTL ? 'الموقع غير متاح' : 'Position indisponible';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = isRTL ? 'انتهى الوقت المحدد' : 'Délai d\'attente dépassé';
        }

        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [isRTL, onChange, onPlaceSelected, name]);

  // Recherche via OpenStreetMap Nominatim (adresses réelles)
  const searchNominatim = useCallback(async (searchText) => {
    if (!searchText || searchText.length < 3) return [];

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchText)}&` +
        `countrycodes=ma&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `accept-language=${isRTL ? 'ar' : 'fr'}`,
        {
          headers: {
            'User-Agent': 'GlamGo-App/1.0'
          }
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.map(item => ({
        nameKey: `nominatim-${item.place_id}`,
        nameFr: item.display_name,
        nameAr: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        isNominatim: true
      }));
    } catch (error) {
      console.error('Nominatim search error:', error);
      return [];
    }
  }, [isRTL]);

  // Filtrer les suggestions (locales + Nominatim)
  const filterSuggestions = useCallback(async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const search = searchText.toLowerCase().trim();

    // Suggestions locales (quartiers prédéfinis)
    const localFiltered = MOROCCO_SUGGESTIONS.filter(s =>
      s.nameFr.toLowerCase().includes(search) ||
      s.nameAr.includes(search)
    ).slice(0, 4);

    // Afficher d'abord les suggestions locales
    if (localFiltered.length > 0) {
      setSuggestions(localFiltered);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    }

    // Si 3+ caractères, chercher aussi via Nominatim
    if (searchText.length >= 3) {
      const nominatimResults = await searchNominatim(searchText);

      // Combiner: locales d'abord, puis Nominatim
      const combined = [...localFiltered, ...nominatimResults].slice(0, 8);

      if (combined.length > 0) {
        setSuggestions(combined);
        setShowSuggestions(true);
      } else if (localFiltered.length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }

    setSelectedIndex(-1);
  }, [searchNominatim]);

  // Gérer la saisie avec debounce pour l'API
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(e);

    // Annuler le debounce précédent
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Toujours filtrer les suggestions locales immédiatement
    if (!isGoogleLoaded) {
      // Afficher les locales immédiatement
      const search = newValue.toLowerCase().trim();
      if (search.length >= 2) {
        const localFiltered = MOROCCO_SUGGESTIONS.filter(s =>
          s.nameFr.toLowerCase().includes(search) ||
          s.nameAr.includes(search)
        ).slice(0, 4);

        if (localFiltered.length > 0) {
          setSuggestions(localFiltered);
          setShowSuggestions(true);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }

      // Debounce pour l'appel Nominatim (300ms)
      if (newValue.length >= 3) {
        setIsSearching(true);
        debounceRef.current = setTimeout(() => {
          filterSuggestions(newValue);
          setIsSearching(false);
        }, 300);
      }
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
    const localizedName = getLocalizedName(suggestion);
    onChange({ target: { name, value: localizedName } });

    if (onPlaceSelected) {
      onPlaceSelected({
        address: localizedName,
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

  // Nettoyer le debounce au démontage
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

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
    <div className={styles.autocompleteWrapper} dir={isRTL ? 'rtl' : 'ltr'}>
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
          placeholder={placeholder || defaultPlaceholder}
          autoComplete="off"
          required={required}
        />
        {isSearching && <span className={styles.loadingIcon}>⏳</span>}
        <button
          type="button"
          onClick={handleGeolocation}
          disabled={isGeolocating}
          className={styles.geoButton}
          title={isRTL ? 'استخدم موقعي الحالي' : 'Utiliser ma position actuelle'}
        >
          {isGeolocating ? '⏳' : '📍'}
        </button>
      </div>

      {/* Liste de suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <ul ref={suggestionsRef} className={styles.suggestionsList}>
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.nameKey}-${index}`}
              className={`${styles.suggestionItem} ${index === selectedIndex ? styles.selected : ''}`}
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className={styles.suggestionIcon}>📍</span>
              <span className={styles.suggestionText}>{getLocalizedName(suggestion)}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Aide */}
      {!isGoogleLoaded && !showSuggestions && (!value || value.length < 2) && (
        <span className={styles.hint}>
          {hintText}
        </span>
      )}
    </div>
  );
}
