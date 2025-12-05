'use client';

import { useCurrency } from '@/contexts/CurrencyContext';

export default function Price({ amount, className = '', showOriginal = null }) {
  const { formatPrice, showOriginalPrice, isLoaded } = useCurrency();

  // Si amount n'est pas défini ou invalide
  if (amount === null || amount === undefined || isNaN(parseFloat(amount))) {
    return <span className={className}>-</span>;
  }

  const amountNum = parseFloat(amount);

  // Pendant le chargement, afficher le prix en MAD par défaut
  if (!isLoaded) {
    return <span className={className}>{Math.round(amountNum)} MAD</span>;
  }

  // Déterminer si on doit afficher le prix original
  const showOrig = showOriginal !== null ? showOriginal : showOriginalPrice;

  return (
    <span className={className}>
      {formatPrice(amountNum)}
    </span>
  );
}
