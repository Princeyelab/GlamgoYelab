'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  formatPrice as formatPriceUtil,
  loadCurrencyPreference,
  saveCurrencyPreference,
  getAvailableCurrencies,
  getCurrencyInfo
} from '@/lib/currency';

const CurrencyContext = createContext();

// Mémoriser les devises disponibles (ne changent pas)
const availableCurrencies = getAvailableCurrencies();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('MAD');
  const [showOriginalPrice, setShowOriginalPrice] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Charger la préférence sauvegardée
    const savedCurrency = loadCurrencyPreference();
    setCurrency(savedCurrency);
    setIsLoaded(true);
  }, []);

  const changeCurrency = useCallback((newCurrency) => {
    setCurrency(newCurrency);
    saveCurrencyPreference(newCurrency);
  }, []);

  const toggleShowOriginal = useCallback(() => {
    setShowOriginalPrice(prev => !prev);
  }, []);

  const formatPrice = useCallback((amountMAD) => {
    return formatPriceUtil(amountMAD, currency, showOriginalPrice);
  }, [currency, showOriginalPrice]);

  const currencyInfo = useMemo(() => getCurrencyInfo(currency), [currency]);

  const value = useMemo(() => ({
    currency,
    setCurrency: changeCurrency,
    showOriginalPrice,
    setShowOriginalPrice,
    toggleShowOriginal,
    formatPrice,
    currencies: availableCurrencies,
    currencyInfo,
    isLoaded
  }), [currency, changeCurrency, showOriginalPrice, toggleShowOriginal, formatPrice, currencyInfo, isLoaded]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
