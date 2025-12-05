/**
 * Gestionnaire de devises pour GlamGo
 * Devise de base: MAD (Dirham marocain)
 */

// Taux de conversion (MAD vers autres devises)
// Ces taux devraient être mis à jour régulièrement via une API
const exchangeRates = {
  MAD: 1,
  EUR: 0.092,    // 1 MAD = 0.092 EUR
  USD: 0.099,    // 1 MAD = 0.099 USD
  GBP: 0.079,    // 1 MAD = 0.079 GBP
  CHF: 0.088,    // 1 MAD = 0.088 CHF
  CAD: 0.135,    // 1 MAD = 0.135 CAD
  AED: 0.364,    // 1 MAD = 0.364 AED
  SAR: 0.372,    // 1 MAD = 0.372 SAR
  TND: 0.31,     // 1 MAD = 0.31 TND
  DZD: 13.4,     // 1 MAD = 13.4 DZD
};

// Informations sur les devises
const currencyInfo = {
  MAD: { symbol: 'DH', name: 'Dirham marocain', locale: 'fr-MA', position: 'after' },
  EUR: { symbol: '€', name: 'Euro', locale: 'fr-FR', position: 'after' },
  USD: { symbol: '$', name: 'Dollar américain', locale: 'en-US', position: 'before' },
  GBP: { symbol: '£', name: 'Livre sterling', locale: 'en-GB', position: 'before' },
  CHF: { symbol: 'CHF', name: 'Franc suisse', locale: 'fr-CH', position: 'after' },
  CAD: { symbol: '$', name: 'Dollar canadien', locale: 'en-CA', position: 'before' },
  AED: { symbol: 'AED', name: 'Dirham émirati', locale: 'ar-AE', position: 'after' },
  SAR: { symbol: 'SAR', name: 'Riyal saoudien', locale: 'ar-SA', position: 'after' },
  TND: { symbol: 'DT', name: 'Dinar tunisien', locale: 'fr-TN', position: 'after' },
  DZD: { symbol: 'DA', name: 'Dinar algérien', locale: 'fr-DZ', position: 'after' },
};

/**
 * Convertir un montant de MAD vers une autre devise
 */
export function convertFromMAD(amountMAD, targetCurrency = 'MAD') {
  const rate = exchangeRates[targetCurrency];
  if (!rate) return amountMAD;
  return amountMAD * rate;
}

/**
 * Convertir un montant vers MAD
 */
export function convertToMAD(amount, sourceCurrency = 'MAD') {
  const rate = exchangeRates[sourceCurrency];
  if (!rate) return amount;
  return amount / rate;
}

/**
 * Formater un prix avec le symbole de devise
 */
export function formatPrice(amountMAD, currency = 'MAD', showOriginal = false) {
  const info = currencyInfo[currency];
  if (!info) {
    return `${amountMAD} MAD`;
  }

  const convertedAmount = convertFromMAD(amountMAD, currency);
  const formattedNumber = formatNumber(convertedAmount, currency);

  let formatted;
  if (info.position === 'before') {
    formatted = `${info.symbol}${formattedNumber}`;
  } else {
    formatted = `${formattedNumber} ${info.symbol}`;
  }

  // Optionnellement afficher le prix original en MAD
  if (showOriginal && currency !== 'MAD') {
    formatted += ` (${Math.round(amountMAD)} MAD)`;
  }

  return formatted;
}

/**
 * Formater un nombre selon la devise
 */
function formatNumber(amount, currency) {
  const info = currencyInfo[currency];

  // Pour MAD, afficher sans décimales
  if (currency === 'MAD') {
    return Math.round(amount).toString();
  }

  // Pour EUR/USD/GBP, afficher 2 décimales
  if (['EUR', 'USD', 'GBP', 'CHF', 'CAD'].includes(currency)) {
    return amount.toFixed(2);
  }

  // Pour les autres, arrondir
  return Math.round(amount).toString();
}

/**
 * Obtenir la liste des devises disponibles
 */
export function getAvailableCurrencies() {
  return Object.keys(currencyInfo).map(code => ({
    code,
    ...currencyInfo[code]
  }));
}

/**
 * Obtenir les informations d'une devise
 */
export function getCurrencyInfo(code) {
  return currencyInfo[code] || currencyInfo.MAD;
}

/**
 * Détecter la devise selon la localisation du navigateur
 */
export function detectUserCurrency() {
  if (typeof navigator === 'undefined') return 'MAD';

  const language = navigator.language || navigator.userLanguage || 'fr-MA';

  // Mapping langue/pays -> devise
  const languageToCurrency = {
    'fr-MA': 'MAD',
    'ar-MA': 'MAD',
    'fr-FR': 'EUR',
    'en-US': 'USD',
    'en-GB': 'GBP',
    'fr-CH': 'CHF',
    'de-CH': 'CHF',
    'en-CA': 'CAD',
    'fr-CA': 'CAD',
    'ar-AE': 'AED',
    'ar-SA': 'SAR',
    'fr-TN': 'TND',
    'ar-TN': 'TND',
    'fr-DZ': 'DZD',
    'ar-DZ': 'DZD',
  };

  // Chercher correspondance exacte
  if (languageToCurrency[language]) {
    return languageToCurrency[language];
  }

  // Chercher par préfixe de langue
  const langPrefix = language.split('-')[0];
  if (langPrefix === 'ar') return 'MAD'; // Arabe -> MAD par défaut
  if (langPrefix === 'fr') return 'EUR'; // Français -> EUR
  if (langPrefix === 'en') return 'USD'; // Anglais -> USD

  return 'MAD'; // Par défaut
}

/**
 * Sauvegarder la devise préférée
 */
export function saveCurrencyPreference(currency) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('preferred_currency', currency);
  }
}

/**
 * Charger la devise préférée
 */
export function loadCurrencyPreference() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('preferred_currency') || detectUserCurrency();
  }
  return 'MAD';
}

export default {
  convertFromMAD,
  convertToMAD,
  formatPrice,
  getAvailableCurrencies,
  getCurrencyInfo,
  detectUserCurrency,
  saveCurrencyPreference,
  loadCurrencyPreference
};
