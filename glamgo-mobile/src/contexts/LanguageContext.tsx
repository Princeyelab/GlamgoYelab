/**
 * Language Context - GlamGo Mobile
 * Gestion de la langue et du support RTL
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fr, ar, en, type TranslationKeys } from '../i18n/translations';

const LANGUAGE_STORAGE_KEY = '@glamgo_language';

export type Language = 'fr' | 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

// Get nested value from translation object
function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return undefined;
    }
  }
  return typeof result === 'string' ? result : undefined;
}

// Replace params in translation string (supports both {key} and {{key}} formats)
function replaceParams(str: string, params: Record<string, string | number>): string {
  let result = str;
  for (const [key, value] of Object.entries(params)) {
    // Replace {{key}} format first (double braces)
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    // Then replace {key} format (single braces)
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved === 'fr' || saved === 'ar' || saved === 'en') {
          setLanguageState(saved);
        }
      } catch (error) {
        console.log('[LanguageContext] Error loading language:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadLanguage();
  }, []);

  // Set language - RTL is handled manually via isRTL styles
  const setLanguage = useCallback(async (newLang: Language) => {
    // Save preference
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch (error) {
      console.log('[LanguageContext] Error saving language:', error);
    }

    // Update state - RTL styles are applied via isRTL conditional styles
    setLanguageState(newLang);
  }, []);

  // Translation function
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    // Select translations based on language
    const translations = language === 'ar' ? ar : language === 'en' ? en : fr;

    // Try to get the translation
    let translation = getNestedValue(translations, key);

    // Fallback to French if translation missing
    if (!translation && (language === 'ar' || language === 'en')) {
      translation = getNestedValue(fr, key);
    }

    // Fallback to key if no translation found
    if (!translation) {
      console.log(`[LanguageContext] Missing translation for key: ${key}`);
      return key;
    }

    // Replace params if provided
    if (params) {
      return replaceParams(translation, params);
    }

    return translation;
  }, [language]);

  const isRTL = language === 'ar';

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    isRTL,
    isLoaded,
  }), [language, setLanguage, t, isRTL, isLoaded]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook for components that just need translation function
export function useTranslation() {
  const { t, isRTL, language } = useLanguage();
  return { t, isRTL, language };
}
