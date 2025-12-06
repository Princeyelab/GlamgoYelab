'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Hook pour traduire du contenu dynamique (venant de la BDD)
 * Gère automatiquement l'état de chargement et le cache
 *
 * @param {string|string[]|Object} content - Contenu à traduire
 * @param {string[]} keys - Si content est un Object, les clés à traduire
 * @returns {{ translated: any, isLoading: boolean, error: string|null }}
 *
 * @example
 * // Traduire un texte simple
 * const { translated, isLoading } = useTranslatedContent(service.name);
 *
 * @example
 * // Traduire un tableau
 * const { translated, isLoading } = useTranslatedContent([service.name, service.description]);
 *
 * @example
 * // Traduire un objet
 * const { translated, isLoading } = useTranslatedContent(service, ['name', 'description']);
 */
export function useTranslatedContent(content, keys = null) {
  const { language, translateDynamic, translateDynamicBatch, translateDynamicObject } = useLanguage();
  const [translated, setTranslated] = useState(content);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const performTranslation = async () => {
      // Si français, pas besoin de traduire
      if (language === 'fr' || !content) {
        setTranslated(content);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let result;

        if (Array.isArray(content)) {
          // Traduire un tableau de textes
          result = await translateDynamicBatch(content);
        } else if (typeof content === 'object' && keys) {
          // Traduire un objet avec des clés spécifiques
          result = await translateDynamicObject(content, keys);
        } else if (typeof content === 'string') {
          // Traduire un texte simple
          result = await translateDynamic(content);
        } else {
          result = content;
        }

        if (isMounted) {
          setTranslated(result);
        }
      } catch (err) {
        console.error('Translation error:', err);
        if (isMounted) {
          setError(err.message);
          setTranslated(content); // Fallback au contenu original
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    performTranslation();

    return () => {
      isMounted = false;
    };
  }, [content, keys, language, translateDynamic, translateDynamicBatch, translateDynamicObject]);

  return { translated, isLoading, error };
}

/**
 * Hook pour traduire une liste d'éléments (catégories, services, etc.)
 * Optimisé pour les listes avec traduction batch
 *
 * @param {Object[]} items - Liste d'objets à traduire
 * @param {string[]} keys - Clés à traduire dans chaque objet
 * @returns {{ translatedItems: Object[], isLoading: boolean }}
 *
 * @example
 * const { translatedItems, isLoading } = useTranslatedList(categories, ['name', 'description']);
 */
export function useTranslatedList(items, keys) {
  const { language, translateDynamicBatch } = useLanguage();
  const [translatedItems, setTranslatedItems] = useState(items || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const translateList = async () => {
      if (!items || items.length === 0) {
        setTranslatedItems([]);
        return;
      }

      if (language === 'fr') {
        setTranslatedItems(items);
        return;
      }

      setIsLoading(true);

      try {
        // Collecter tous les textes à traduire
        const textsToTranslate = [];
        const textMap = []; // Pour reconstruire les objets après traduction

        items.forEach((item, itemIndex) => {
          keys.forEach(key => {
            if (item[key]) {
              textsToTranslate.push(item[key]);
              textMap.push({ itemIndex, key });
            }
          });
        });

        // Traduire en batch
        const translations = await translateDynamicBatch(textsToTranslate);

        // Reconstruire les objets
        const result = items.map(item => ({ ...item }));
        textMap.forEach((mapping, index) => {
          if (translations[index]) {
            result[mapping.itemIndex][mapping.key] = translations[index];
          }
        });

        if (isMounted) {
          setTranslatedItems(result);
        }
      } catch (error) {
        console.error('List translation error:', error);
        if (isMounted) {
          setTranslatedItems(items); // Fallback
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    translateList();

    return () => {
      isMounted = false;
    };
  }, [items, keys, language, translateDynamicBatch]);

  return { translatedItems, isLoading };
}

export default useTranslatedContent;
