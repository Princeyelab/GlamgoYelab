'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Hook centralisé pour la traduction DeepL de contenu dynamique
 * Gère automatiquement le cache, les états de chargement et les erreurs
 */

// Cache global partagé entre tous les composants
const globalCache = new Map();

/**
 * Hook pour traduire un objet avec des champs spécifiques
 * @param {Object} data - Objet à traduire (service, category, order, etc.)
 * @param {string[]} fields - Champs à traduire ['name', 'description']
 * @returns {{ translated: Object, isLoading: boolean }}
 */
export function useTranslatedData(data, fields = ['name', 'description']) {
  const { language, translateDynamicBatch } = useLanguage();
  const [translated, setTranslated] = useState(data);
  const [isLoading, setIsLoading] = useState(false);
  const prevDataRef = useRef(null);
  const prevLangRef = useRef(language);

  // Mémoriser les fields pour éviter les re-renders infinis
  const fieldsKey = fields.join(',');
  const stableFields = useMemo(() => fields, [fieldsKey]);

  useEffect(() => {
    if (!data || language === 'fr') {
      setTranslated(data);
      return;
    }

    // Éviter les traductions répétées pour les mêmes données
    const dataKey = JSON.stringify(data);
    if (prevDataRef.current === dataKey && prevLangRef.current === language) {
      return;
    }
    prevDataRef.current = dataKey;
    prevLangRef.current = language;

    const translateData = async () => {
      // Vérifier le cache global
      const cacheKey = `obj:${dataKey}:${fieldsKey}:${language}`;
      if (globalCache.has(cacheKey)) {
        setTranslated(globalCache.get(cacheKey));
        return;
      }

      const textsToTranslate = stableFields.map(f => data[f] || '').filter(Boolean);
      if (textsToTranslate.length === 0) {
        setTranslated(data);
        return;
      }

      setIsLoading(true);
      try {
        const translations = await translateDynamicBatch(textsToTranslate);
        const result = { ...data };
        let idx = 0;
        stableFields.forEach(field => {
          if (data[field]) {
            result[field] = translations[idx++] || data[field];
          }
        });
        globalCache.set(cacheKey, result);
        setTranslated(result);
      } catch (err) {
        console.error('Translation error:', err);
        setTranslated(data);
      } finally {
        setIsLoading(false);
      }
    };

    translateData();
  }, [data, stableFields, fieldsKey, language, translateDynamicBatch]);

  return { translated, isLoading };
}

/**
 * Hook pour traduire une liste d'objets
 * @param {Object[]} items - Liste d'objets à traduire
 * @param {string[]} fields - Champs à traduire
 * @returns {{ translatedItems: Object[], isLoading: boolean }}
 */
export function useTranslatedList(items, fields = ['name', 'description']) {
  const { language, translateDynamicBatch } = useLanguage();
  const [translatedItems, setTranslatedItems] = useState(items || []);
  const [isLoading, setIsLoading] = useState(false);
  const prevItemsRef = useRef(null);
  const prevLangRef = useRef(language);

  // Mémoriser les fields pour éviter les re-renders infinis
  const fieldsKey = fields.join(',');
  const stableFields = useMemo(() => fields, [fieldsKey]);

  useEffect(() => {
    if (!items || items.length === 0) {
      setTranslatedItems([]);
      return;
    }

    if (language === 'fr') {
      setTranslatedItems(items);
      return;
    }

    // Éviter les traductions répétées
    const itemsKey = JSON.stringify(items.map(i => stableFields.map(f => i[f])));
    if (prevItemsRef.current === itemsKey && prevLangRef.current === language) {
      return;
    }
    prevItemsRef.current = itemsKey;
    prevLangRef.current = language;

    const translateList = async () => {
      // Collecter tous les textes
      const allTexts = [];
      const textMap = [];

      items.forEach((item, itemIdx) => {
        stableFields.forEach(field => {
          if (item[field]) {
            allTexts.push(item[field]);
            textMap.push({ itemIdx, field });
          }
        });
      });

      if (allTexts.length === 0) {
        setTranslatedItems(items);
        return;
      }

      setIsLoading(true);
      try {
        const translations = await translateDynamicBatch(allTexts);
        const result = items.map(item => ({ ...item }));

        textMap.forEach((mapping, idx) => {
          result[mapping.itemIdx][mapping.field] = translations[idx] || items[mapping.itemIdx][mapping.field];
        });

        setTranslatedItems(result);
      } catch (err) {
        console.error('List translation error:', err);
        setTranslatedItems(items);
      } finally {
        setIsLoading(false);
      }
    };

    translateList();
  }, [items, stableFields, fieldsKey, language, translateDynamicBatch]);

  return { translatedItems, isLoading };
}

/**
 * Hook pour traduire un texte simple
 * @param {string} text - Texte à traduire
 * @returns {{ translated: string, isLoading: boolean }}
 */
export function useTranslatedText(text) {
  const { language, translateDynamic } = useLanguage();
  const [translated, setTranslated] = useState(text || '');
  const [isLoading, setIsLoading] = useState(false);
  const prevTextRef = useRef(null);
  const prevLangRef = useRef(language);

  useEffect(() => {
    if (!text || language === 'fr') {
      setTranslated(text || '');
      return;
    }

    // Éviter les traductions répétées
    if (prevTextRef.current === text && prevLangRef.current === language) {
      return;
    }
    prevTextRef.current = text;
    prevLangRef.current = language;

    const cacheKey = `txt:${text}:${language}`;
    if (globalCache.has(cacheKey)) {
      setTranslated(globalCache.get(cacheKey));
      return;
    }

    setIsLoading(true);
    translateDynamic(text)
      .then(result => {
        globalCache.set(cacheKey, result);
        setTranslated(result);
      })
      .catch(() => setTranslated(text))
      .finally(() => setIsLoading(false));
  }, [text, language, translateDynamic]);

  return { translated, isLoading };
}

/**
 * Hook pour traduire plusieurs textes indépendants
 * @param {Object} texts - Objet { key: 'texte à traduire' }
 * @returns {{ translated: Object, isLoading: boolean }}
 */
export function useTranslatedTexts(texts) {
  const { language, translateDynamicBatch } = useLanguage();
  const [translated, setTranslated] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const lastKeyRef = useRef('');
  const lastLangRef = useRef('');
  const textsRef = useRef(texts);
  const isMountedRef = useRef(true);

  // Toujours garder la ref à jour
  textsRef.current = texts;

  // Créer une clé stable basée sur le contenu
  const textsKey = texts ? Object.entries(texts).map(([k, v]) => `${k}:${v || ''}`).join('|') : '';

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const currentTexts = textsRef.current;

    // Si français ou pas de textes, juste retourner les textes originaux
    if (!currentTexts || Object.keys(currentTexts).length === 0 || language === 'fr') {
      setTranslated(currentTexts || {});
      lastKeyRef.current = textsKey;
      lastLangRef.current = language;
      return;
    }

    // Éviter les traductions répétées
    if (lastKeyRef.current === textsKey && lastLangRef.current === language) {
      return;
    }

    lastKeyRef.current = textsKey;
    lastLangRef.current = language;

    const keys = Object.keys(currentTexts);
    const values = keys.map(k => currentTexts[k]).filter(Boolean);

    if (values.length === 0) {
      setTranslated(currentTexts);
      return;
    }

    // Capturer les valeurs actuelles pour la closure
    const capturedTexts = { ...currentTexts };

    setIsLoading(true);

    translateDynamicBatch(values)
      .then(translations => {
        if (!isMountedRef.current) return;
        const result = {};
        let idx = 0;
        keys.forEach(key => {
          result[key] = capturedTexts[key] ? translations[idx++] : capturedTexts[key];
        });
        setTranslated(result);
      })
      .catch(() => {
        if (isMountedRef.current) setTranslated(capturedTexts);
      })
      .finally(() => {
        if (isMountedRef.current) setIsLoading(false);
      });
  // Utiliser textsKey comme dépendance stable au lieu de texts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textsKey, language]);

  return { translated, isLoading };
}

export default useTranslatedData;
