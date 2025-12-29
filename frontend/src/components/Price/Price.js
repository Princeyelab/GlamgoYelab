'use client';

import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Price({ amount, className = '', showOriginal = null }) {
  const { formatPrice, showOriginalPrice, isLoaded } = useCurrency();
  const { toArabicNumerals } = useLanguage();

  // Si amount n'est pas défini ou invalide
  if (amount === null || amount === undefined || isNaN(parseFloat(amount))) {
    return <span className={className}>-</span>;
  }

  const amountNum = parseFloat(amount);

  // Pendant le chargement, afficher le prix en MAD par défaut
  if (!isLoaded) {
    return <span className={className}>{toArabicNumerals(Math.round(amountNum))} MAD</span>;
  }

  // Déterminer si on doit afficher le prix original
  const showOrig = showOriginal !== null ? showOriginal : showOriginalPrice;

  // Appliquer la conversion des chiffres arabes
  const formattedPrice = formatPrice(amountNum);
  const arabicPrice = toArabicNumerals(formattedPrice);

  return (
    <span className={className}>
      {arabicPrice}
    </span>
  );
}
