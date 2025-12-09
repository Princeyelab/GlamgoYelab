'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './LanguageDropdown.module.scss';

/**
 * LanguageDropdown Component
 * Dropdown avec 5 langues supportées :
 * - FR (Français)
 * - AR (العربية)
 * - EN (English)
 * - ES (Español)
 * - DE (Deutsch)
 *
 * Affiche les drapeaux emoji et noms natifs
 */

const LANGUAGES = [
  {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷',
    enabled: true,
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇲🇦',
    enabled: true,
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    enabled: true,
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    enabled: true,
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    enabled: true,
  },
];

export default function LanguageDropdown() {
  const { language, switchLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = LANGUAGES.find((lang) => lang.code === language) || LANGUAGES[0];

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (langCode) => {
    switchLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Changer de langue"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className={styles.globeIcon} />
        <span className={styles.currentLang}>{currentLanguage.flag}</span>
        <span className={styles.currentCode}>{currentLanguage.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className={styles.menu} role="listbox">
          {LANGUAGES.filter((lang) => lang.enabled).map((lang) => (
            <button
              key={lang.code}
              className={`${styles.menuItem} ${lang.code === language ? styles.active : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
              role="option"
              aria-selected={lang.code === language}
            >
              <span className={styles.flag}>{lang.flag}</span>
              <div className={styles.langInfo}>
                <span className={styles.nativeName}>{lang.nativeName}</span>
                <span className={styles.langName}>{lang.name}</span>
              </div>
              {lang.code === language && (
                <span className={styles.checkmark}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
