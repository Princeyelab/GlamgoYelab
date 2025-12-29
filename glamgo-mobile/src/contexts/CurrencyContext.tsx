/**
 * Currency Context - GlamGo Mobile
 * Gestion de la devise selectionnee
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  formatPrice as formatPriceUtil,
  getAvailableCurrencies,
  getCurrencyInfo,
  CurrencyInfo,
} from '../lib/utils/currency';

const CURRENCY_STORAGE_KEY = '@glamgo_currency';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  showOriginalPrice: boolean;
  setShowOriginalPrice: (show: boolean) => void;
  toggleShowOriginal: () => void;
  formatPrice: (amountMAD: number) => string;
  currencies: CurrencyInfo[];
  currencyInfo: CurrencyInfo;
  isLoaded: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const availableCurrencies = getAvailableCurrencies();

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState('MAD');
  const [showOriginalPrice, setShowOriginalPrice] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const saved = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
        if (saved) {
          setCurrencyState(saved);
        }
      } catch (error) {
        console.log('Error loading currency preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadCurrency();
  }, []);

  const setCurrency = useCallback(async (newCurrency: string) => {
    setCurrencyState(newCurrency);
    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
    } catch (error) {
      console.log('Error saving currency preference:', error);
    }
  }, []);

  const toggleShowOriginal = useCallback(() => {
    setShowOriginalPrice(prev => !prev);
  }, []);

  const formatPrice = useCallback((amountMAD: number) => {
    return formatPriceUtil(amountMAD, currency, showOriginalPrice);
  }, [currency, showOriginalPrice]);

  const currencyInfo = useMemo(() => getCurrencyInfo(currency), [currency]);

  const value = useMemo(() => ({
    currency,
    setCurrency,
    showOriginalPrice,
    setShowOriginalPrice,
    toggleShowOriginal,
    formatPrice,
    currencies: availableCurrencies,
    currencyInfo,
    isLoaded,
  }), [currency, setCurrency, showOriginalPrice, toggleShowOriginal, formatPrice, currencyInfo, isLoaded]);

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
