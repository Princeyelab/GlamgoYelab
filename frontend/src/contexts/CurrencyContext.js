'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import {
  formatPrice as formatPriceUtil,
  loadCurrencyPreference,
  saveCurrencyPreference,
  getAvailableCurrencies,
  getCurrencyInfo
} from '@/lib/currency';

const CurrencyContext = createContext();

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

  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    saveCurrencyPreference(newCurrency);
  };

  const toggleShowOriginal = () => {
    setShowOriginalPrice(!showOriginalPrice);
  };

  const formatPrice = (amountMAD) => {
    return formatPriceUtil(amountMAD, currency, showOriginalPrice);
  };

  const value = {
    currency,
    setCurrency: changeCurrency,
    showOriginalPrice,
    setShowOriginalPrice,
    toggleShowOriginal,
    formatPrice,
    currencies: getAvailableCurrencies(),
    currencyInfo: getCurrencyInfo(currency),
    isLoaded
  };

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
