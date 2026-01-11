'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './LanguageSwitcher.module.scss';

/**
 * Language configuration with flags and labels
 */
const LANGUAGE_CONFIG = {
  fr: { flag: '🇫🇷', label: 'Français', nativeLabel: 'Français' },
  ar: { flag: '🇲🇦', label: 'Arabic', nativeLabel: 'العربية' },
  en: { flag: '🇬🇧', label: 'English', nativeLabel: 'English' },
  es: { flag: '🇪🇸', label: 'Spanish', nativeLabel: 'Español' },
  de: { flag: '🇩🇪', label: 'German', nativeLabel: 'Deutsch' },
};

/**
 * Language switcher dropdown component
 * Supports FR, AR, EN, ES, DE languages
 */
export default function LanguageSwitcher({ compact = false }) {
  const { language, changeLanguage, t, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLanguageSelect = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  const currentLang = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.fr;

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button
        className={`${styles.switcher} ${compact ? styles.compact : ''} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={t('language.switch')}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.currentFlag}>{currentLang.flag}</span>
        {!compact && (
          <span className={styles.currentLabel}>{currentLang.nativeLabel}</span>
        )}
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <ul className={styles.dropdown} role="listbox" aria-label="Language options">
          {(supportedLanguages || ['fr', 'ar', 'en', 'es', 'de']).map((langCode) => {
            const config = LANGUAGE_CONFIG[langCode];
            if (!config) return null;

            return (
              <li key={langCode}>
                <button
                  className={`${styles.option} ${language === langCode ? styles.selected : ''}`}
                  onClick={() => handleLanguageSelect(langCode)}
                  role="option"
                  aria-selected={language === langCode}
                >
                  <span className={styles.optionFlag}>{config.flag}</span>
                  <span className={styles.optionLabel}>{config.nativeLabel}</span>
                  {language === langCode && <span className={styles.checkmark}>✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
