/**
 * Script pour ajouter les traductions allemandes (DE) au fichier services.ts
 * Ajoute 'de' à côté de 'fr', 'ar', 'en', 'es'
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEEPL_API_KEY = '4274f47f-77b2-4358-ab8b-53c99ca149ca:fx';
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
const SOURCE_LANG = 'FR';
const TARGET_LANG = 'DE';

// Chemin du fichier
const SERVICES_FILE = path.join(__dirname, '../src/i18n/translations/services.ts');

/**
 * Traduit un texte avec DeepL
 */
async function translateText(text, context = '') {
  if (!text || text.trim() === '') return text;

  try {
    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        auth_key: DEEPL_API_KEY,
        text: text,
        source_lang: SOURCE_LANG,
        target_lang: TARGET_LANG,
        preserve_formatting: '1',
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.log(`   ⏳ Limite de taux, attente de 3 secondes...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return translateText(text, context);
      }
      throw new Error(`DeepL API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translations[0].text;
  } catch (error) {
    console.error(`Erreur pour "${text.substring(0, 50)}...":`, error.message);
    return text;
  }
}

async function main() {
  console.log('🚀 Ajout des traductions allemandes (DE) aux services...\n');

  // Lire le fichier
  console.log('📖 Lecture du fichier services.ts...');
  let content = fs.readFileSync(SERVICES_FILE, 'utf8');

  // D'abord, modifier le type Translation pour inclure 'de'
  console.log('📝 Mise à jour du type Translation...');
  content = content.replace(
    /type Translation = \{ fr: string; ar: string; en: string; es: string \};/,
    'type Translation = { fr: string; ar: string; en: string; es: string; de: string };'
  );

  // Extraire tous les objets Translation avec leurs valeurs FR
  const translationPattern = /\{\s*fr:\s*'([^']+)',\s*ar:\s*'[^']*',\s*en:\s*'[^']*',\s*es:\s*'([^']*)'\s*\}/g;
  const matches = [];
  let match;

  while ((match = translationPattern.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      frText: match[1],
      index: match.index
    });
  }

  console.log(`   Trouvé ${matches.length} traductions à compléter\n`);

  // Traduire chaque texte FR vers DE
  console.log('🌍 Traduction en cours...');
  const translations = new Map();

  for (let i = 0; i < matches.length; i++) {
    const item = matches[i];
    console.log(`   ${i + 1}/${matches.length}: "${item.frText.substring(0, 50)}..."`);

    const deText = await translateText(item.frText);
    translations.set(item.fullMatch, deText);

    // Délai pour éviter la limite de taux
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n✅ ${translations.size} traductions effectuées\n`);

  // Remplacer dans le contenu
  console.log('📝 Mise à jour du fichier...');
  translations.forEach((deText, fullMatch) => {
    // Échapper les caractères spéciaux
    const escaped = fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');

    // Créer le nouveau format avec 'de'
    const newMatch = fullMatch.replace(
      /,\s*es:\s*'([^']*)'\s*\}/,
      `, es: '$1', de: '${deText.replace(/'/g, "\\'")}' }`
    );

    content = content.replace(regex, newMatch);
  });

  // Sauvegarder
  fs.writeFileSync(SERVICES_FILE, content, 'utf8');

  console.log('✅ Fichier services.ts mis à jour avec succès!');
  console.log(`📁 Emplacement: ${SERVICES_FILE}`);
  console.log(`📊 ${translations.size} traductions DE ajoutées\n`);
  console.log('🎉 Terminé!');
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
