/**
 * Script de traduction automatique des services FR -> ES avec DeepL API
 * Usage: node scripts/translate-services-to-spanish.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEEPL_API_KEY = '4274f47f-77b2-4358-ab8b-53c99ca149ca:fx';
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
const SOURCE_LANG = 'FR';
const TARGET_LANG = 'ES';

// Chemins des fichiers
const SERVICES_FILE = path.join(__dirname, '../src/i18n/translations/services.ts');

/**
 * Traduit un texte via DeepL API
 */
async function translateText(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return text;
  }

  try {
    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: text,
        source_lang: SOURCE_LANG,
        target_lang: TARGET_LANG,
        preserve_formatting: '1',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`DeepL API error: ${response.status} - ${error}`);
      return text;
    }

    const data = await response.json();
    return data.translations[0].text;
  } catch (error) {
    console.error(`Translation error for "${text.substring(0, 50)}...": ${error.message}`);
    return text;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🌍 GlamGo Services Translation Script (FR → ES)');
  console.log('===============================================\n');

  // Lire le fichier
  console.log('📖 Reading services.ts...');
  let content = fs.readFileSync(SERVICES_FILE, 'utf-8');

  // Extraire tous les services qui n'ont pas 'es' dans title
  const serviceRegex = /'([^']+)':\s*{\s*title:\s*{\s*fr:\s*'([^']+)',\s*ar:\s*'([^']+)',\s*en:\s*'([^']+)'(?:,\s*es:\s*'([^']+)')?\s*},\s*description:\s*{\s*fr:\s*'([^']+)',\s*ar:\s*'([^']+)',\s*en:\s*'([^']+)'(?:,\s*es:\s*'([^']+)')?\s*}\s*}/g;

  const services = [];
  let match;

  while ((match = serviceRegex.exec(content)) !== null) {
    const [fullMatch, key, frTitle, arTitle, enTitle, esTitle, frDesc, arDesc, enDesc, esDesc] = match;

    if (!esTitle || !esDesc) {
      services.push({
        key,
        frTitle,
        arTitle,
        enTitle,
        esTitle: esTitle || null,
        frDesc,
        arDesc,
        enDesc,
        esDesc: esDesc || null,
        fullMatch
      });
    }
  }

  console.log(`📊 Found ${services.length} services to translate\n`);

  if (services.length === 0) {
    console.log('✅ All services are already translated!');
    return;
  }

  // Traduire chaque service
  console.log('🔄 Translating services with DeepL API...\n');

  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    console.log(`[${i + 1}/${services.length}] Translating: ${service.key}`);

    // Traduire le titre s'il n'existe pas
    if (!service.esTitle) {
      service.esTitle = await translateText(service.frTitle);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Traduire la description si elle n'existe pas
    if (!service.esDesc) {
      service.esDesc = await translateText(service.frDesc);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Construire le nouveau texte
    const newText = `'${service.key}': {
    title: { fr: '${service.frTitle}', ar: '${service.arTitle}', en: '${service.enTitle}', es: '${service.esTitle}' },
    description: {
      fr: '${service.frDesc}',
      ar: '${service.arDesc}',
      en: '${service.enDesc}',
      es: '${service.esDesc}'
    }
  }`;

    // Remplacer dans le contenu
    content = content.replace(service.fullMatch, newText);
  }

  // Mettre à jour les fonctions utilitaires pour accepter 'es'
  content = content.replace(
    /language: 'fr' \| 'ar' \| 'en'/g,
    "language: 'fr' | 'ar' | 'en' | 'es'"
  );

  // Sauvegarder
  console.log('\n📝 Saving updated services.ts...');
  fs.writeFileSync(SERVICES_FILE, content, 'utf-8');

  console.log('✅ Translation completed!');
  console.log(`Updated ${services.length} services`);
  console.log('\n🎉 Done!');
}

// Exécuter
main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
