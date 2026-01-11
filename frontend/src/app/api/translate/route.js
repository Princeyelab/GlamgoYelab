import { NextResponse } from 'next/server';

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

// Cache serveur simple pour éviter les requêtes répétées
const serverCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 heure

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms entre les requêtes

function getCacheKey(texts, targetLang) {
  return `${targetLang}:${texts.join('|||')}`;
}

export async function POST(request) {
  try {
    const { texts, targetLang } = await request.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: 'texts array required' }, { status: 400 });
    }

    // Vérifier le cache serveur
    const cacheKey = getCacheKey(texts, targetLang);
    const cached = serverCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ translations: cached.translations, cached: true });
    }

    const apiKey = process.env.NEXT_PUBLIC_DEEPL_API_KEY;
    if (!apiKey) {
      // Retourner les textes originaux si pas de clé API
      return NextResponse.json({ translations: texts, noApiKey: true });
    }

    // Rate limiting simple
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texts,
        target_lang: targetLang || 'AR',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepL API error:', response.status, errorText);

      // Si rate limit, retourner les textes originaux
      if (response.status === 429) {
        return NextResponse.json({ translations: texts, rateLimited: true });
      }
      return NextResponse.json({ error: 'DeepL API error', details: errorText }, { status: response.status });
    }

    const data = await response.json();
    const translations = data.translations?.map(t => t.text) || texts;

    // Mettre en cache
    serverCache.set(cacheKey, { translations, timestamp: Date.now() });

    // Nettoyer le cache si trop grand
    if (serverCache.size > 1000) {
      const oldestKey = serverCache.keys().next().value;
      serverCache.delete(oldestKey);
    }

    return NextResponse.json({ translations });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json({ translations: texts || [], error: error.message });
  }
}
