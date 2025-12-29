/**
 * Gestionnaire de devises pour GlamGo Mobile
 * Devise de base: MAD (Dirham marocain)
 */

// Taux de conversion (MAD vers autres devises)
const exchangeRates: Record<string, number> = {
  MAD: 1,
  EUR: 0.092,
  USD: 0.099,
  GBP: 0.079,
  CHF: 0.088,
  CAD: 0.135,
  AED: 0.364,
  SAR: 0.372,
  TND: 0.31,
  DZD: 13.4,
};

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  position: 'before' | 'after';
}

const currencyInfo: Record<string, CurrencyInfo> = {
  MAD: { code: 'MAD', symbol: 'DH', name: 'Dirham marocain', position: 'after' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', position: 'after' },
  USD: { code: 'USD', symbol: '$', name: 'Dollar US', position: 'before' },
  GBP: { code: 'GBP', symbol: '£', name: 'Livre sterling', position: 'before' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Franc suisse', position: 'after' },
  CAD: { code: 'CAD', symbol: '$', name: 'Dollar canadien', position: 'before' },
  AED: { code: 'AED', symbol: 'AED', name: 'Dirham emirat', position: 'after' },
  SAR: { code: 'SAR', symbol: 'SAR', name: 'Riyal saoudien', position: 'after' },
  TND: { code: 'TND', symbol: 'DT', name: 'Dinar tunisien', position: 'after' },
  DZD: { code: 'DZD', symbol: 'DA', name: 'Dinar algerien', position: 'after' },
};

export function convertFromMAD(amountMAD: number, targetCurrency: string = 'MAD'): number {
  const rate = exchangeRates[targetCurrency];
  if (!rate) return amountMAD;
  return amountMAD * rate;
}

export function formatPrice(amountMAD: number, currency: string = 'MAD', showOriginal: boolean = false): string {
  const info = currencyInfo[currency];
  if (!info) return `${amountMAD} DH`;

  const convertedAmount = convertFromMAD(amountMAD, currency);
  const formattedNumber = formatNumber(convertedAmount, currency);

  let formatted: string;
  if (info.position === 'before') {
    formatted = `${info.symbol}${formattedNumber}`;
  } else {
    formatted = `${formattedNumber} ${info.symbol}`;
  }

  if (showOriginal && currency !== 'MAD') {
    formatted += ` (${Math.round(amountMAD)} DH)`;
  }

  return formatted;
}

function formatNumber(amount: number, currency: string): string {
  if (currency === 'MAD') {
    return Math.round(amount).toString();
  }
  if (['EUR', 'USD', 'GBP', 'CHF', 'CAD'].includes(currency)) {
    return amount.toFixed(2);
  }
  return Math.round(amount).toString();
}

export function getAvailableCurrencies(): CurrencyInfo[] {
  return Object.values(currencyInfo);
}

export function getCurrencyInfo(code: string): CurrencyInfo {
  return currencyInfo[code] || currencyInfo.MAD;
}
