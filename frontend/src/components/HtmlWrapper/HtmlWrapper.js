'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * HtmlWrapper - Composant pour synchroniser lang et dir avec le contexte
 * Ce composant client s'assure que les attributs HTML sont mis à jour
 * dynamiquement lors du changement de langue
 */
export default function HtmlWrapper() {
  const { language, isRTL } = useLanguage();

  useEffect(() => {
    // Mettre à jour les attributs du document
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

      // Ajouter/retirer la classe pour le styling
      if (isRTL) {
        document.documentElement.classList.add('rtl');
        document.body.classList.add('rtl');
      } else {
        document.documentElement.classList.remove('rtl');
        document.body.classList.remove('rtl');
      }
    }
  }, [language, isRTL]);

  return null; // Ce composant ne rend rien visuellement
}
