/**
 * Hook centralise pour les donnees traduites
 * Traduit automatiquement services, categories et autres donnees
 * Utilise par toute l'application - client ET provider
 */

import { useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Service, Category } from '../types/service';
import {
  getServiceTranslation,
  getCategoryTranslation,
  getFormulaTranslation,
} from '../i18n/translations/services';

/**
 * Service avec champs traduits
 */
export interface TranslatedService extends Service {
  translatedTitle: string;
  translatedDescription: string;
  translatedCategoryName: string;
}

/**
 * Categorie avec champs traduits
 */
export interface TranslatedCategory extends Category {
  translatedName: string;
}

/**
 * Traduit un service
 */
export function translateService(
  service: Service,
  language: 'fr' | 'ar'
): TranslatedService {
  const title = service.title || (service as any).name || '';
  const translated = getServiceTranslation(title, language);
  const categoryName = service.category?.name || '';

  return {
    ...service,
    translatedTitle: translated.title || title,
    translatedDescription: translated.description || service.description || '',
    translatedCategoryName: getCategoryTranslation(categoryName, language) || categoryName,
  };
}

/**
 * Traduit une categorie
 */
export function translateCategory(
  category: Category,
  language: 'fr' | 'ar'
): TranslatedCategory {
  return {
    ...category,
    translatedName: getCategoryTranslation(category.name, language) || category.name,
  };
}

/**
 * Hook pour obtenir des services traduits
 */
export function useTranslatedServices(services: Service[]): TranslatedService[] {
  const { language } = useLanguage();

  return useMemo(() => {
    return services.map(service => translateService(service, language));
  }, [services, language]);
}

/**
 * Hook pour obtenir des categories traduites
 */
export function useTranslatedCategories(categories: Category[]): TranslatedCategory[] {
  const { language } = useLanguage();

  return useMemo(() => {
    return categories.map(category => translateCategory(category, language));
  }, [categories, language]);
}

/**
 * Hook pour obtenir un service traduit
 */
export function useTranslatedService(service: Service | null): TranslatedService | null {
  const { language } = useLanguage();

  return useMemo(() => {
    if (!service) return null;
    return translateService(service, language);
  }, [service, language]);
}

/**
 * Hook principal - retourne des helpers de traduction
 */
export function useTranslation() {
  const { language, t, isRTL } = useLanguage();

  const translateServiceFn = useMemo(() => {
    return (service: Service) => translateService(service, language);
  }, [language]);

  const translateCategoryFn = useMemo(() => {
    return (category: Category) => translateCategory(category, language);
  }, [language]);

  const translateServicesFn = useMemo(() => {
    return (services: Service[]) => services.map(s => translateService(s, language));
  }, [language]);

  const translateCategoriesFn = useMemo(() => {
    return (categories: Category[]) => categories.map(c => translateCategory(c, language));
  }, [language]);

  const translateFormulaFn = useMemo(() => {
    return (name: string) => getFormulaTranslation(name, language);
  }, [language]);

  return {
    language,
    t,
    isRTL,
    translateService: translateServiceFn,
    translateCategory: translateCategoryFn,
    translateServices: translateServicesFn,
    translateCategories: translateCategoriesFn,
    translateFormula: translateFormulaFn,
  };
}

export default useTranslation;
