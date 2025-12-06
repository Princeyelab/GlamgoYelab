'use client';

import { useTranslatedText } from '@/hooks/useDeepLTranslation';
import { fixEncoding } from '@/lib/textUtils';

/**
 * Composant pour afficher du texte traduit automatiquement via DeepL
 * @param {string} text - Texte à traduire
 * @param {string} fallback - Texte de fallback si vide
 * @param {string} as - Type d'élément (span, p, h1, etc.)
 * @param {string} className - Classes CSS
 * @param {boolean} fixEnc - Appliquer fixEncoding
 */
export default function TranslatedText({
  text,
  fallback = '',
  as: Component = 'span',
  className = '',
  fixEnc = true,
  ...props
}) {
  const processedText = fixEnc ? fixEncoding(text || fallback) : (text || fallback);
  const { translated } = useTranslatedText(processedText);

  return (
    <Component className={className} {...props}>
      {translated || processedText}
    </Component>
  );
}

/**
 * Version inline pour les attributs (alt, title, etc.)
 */
export function useTranslatedAttr(text, fallback = '') {
  const processedText = fixEncoding(text || fallback);
  const { translated } = useTranslatedText(processedText);
  return translated || processedText;
}
