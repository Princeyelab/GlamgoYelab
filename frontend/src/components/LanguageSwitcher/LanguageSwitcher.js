'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import styles from './LanguageSwitcher.module.scss';

/**
 * Bouton de changement de langue Français/Arabe
 * Affiche un toggle avec les drapeaux des langues
 */
export default function LanguageSwitcher({ compact = false }) {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      className={`${styles.switcher} ${compact ? styles.compact : ''}`}
      onClick={toggleLanguage}
      title={t('language.switch')}
      aria-label={`Switch to ${language === 'fr' ? 'Arabic' : 'French'}`}
    >
      <span className={styles.flags}>
        <span className={`${styles.flag} ${language === 'fr' ? styles.active : ''}`}>
          🇫🇷
        </span>
        <span className={styles.divider}>/</span>
        <span className={`${styles.flag} ${language === 'ar' ? styles.active : ''}`}>
          🇲🇦
        </span>
      </span>
      {!compact && (
        <span className={styles.label}>
          {t('language.switch')}
        </span>
      )}
    </button>
  );
}
