/**
 * Script de traduction des services FR -> DE avec DeepL API
 * Traduit les noms et descriptions de services pour l'allemand
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEEPL_API_KEY = '4274f47f-77b2-4358-ab8b-53c99ca149ca:fx';
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
const SOURCE_LANG = 'FR';
const TARGET_LANG = 'DE';

// Chemin du fichier services
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
        context: context,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        // Attendre un peu plus longtemps en cas de limite
        console.log(`   ⏳ Limite de taux atteinte, attente de 2 secondes...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Réessayer
        return translateText(text, context);
      }
      throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.translations[0].text;
  } catch (error) {
    console.error(`Erreur de traduction pour "${text}":`, error.message);
    return text;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de la traduction des services FR -> DE...\n');

  // Lire le fichier services
  console.log('📖 Lecture du fichier services.ts...');
  let content = fs.readFileSync(SERVICES_FILE, 'utf8');

  // Extraire toutes les traductions FR
  const frPattern = /fr:\s*\{\s*title:\s*'([^']+)',\s*description:\s*'([^']+)'/g;
  const services = [];
  let match;

  while ((match = frPattern.exec(content)) !== null) {
    services.push({
      title: match[1],
      description: match[2],
    });
  }

  console.log(`   Trouvé ${services.length} services à traduire\n`);

  // Traduire chaque service
  console.log('🌍 Traduction en cours...');
  const translations = [];

  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    console.log(`   ${i + 1}/${services.length}: ${service.title}`);

    const titleDE = await translateText(service.title, 'beauty service name');
    await new Promise(resolve => setTimeout(resolve, 150));

    const descriptionDE = await translateText(service.description, 'beauty service description');
    await new Promise(resolve => setTimeout(resolve, 150));

    translations.push({
      titleFR: service.title,
      descriptionFR: service.description,
      titleDE,
      descriptionDE,
    });
  }

  console.log(`\n✅ ${translations.length} services traduits\n`);

  // Ajouter les traductions DE au fichier
  console.log('📝 Ajout des traductions allemandes au fichier...');

  // Pour chaque service, ajouter la traduction DE après ES
  translations.forEach(t => {
    // Trouver le service et ajouter la traduction DE
    const serviceRegex = new RegExp(
      `(es:\\s*\\{\\s*title:\\s*'[^']*',\\s*description:\\s*'[^']*'\\s*\\})`,
      'g'
    );

    content = content.replace(serviceRegex, (match, esBlock) => {
      // Vérifier si c'est le bon service en cherchant le titre FR avant
      const beforeMatch = content.substring(0, content.indexOf(match));
      if (beforeMatch.includes(`fr: { title: '${t.titleFR}'`)) {
        const deBlock = `de: { title: '${t.titleDE}', description: '${t.descriptionDE}' }`;
        return `${esBlock},\n    ${deBlock}`;
      }
      return match;
    });
  });

  // Sauvegarder
  fs.writeFileSync(SERVICES_FILE, content, 'utf8');

  console.log('✅ Fichier services.ts mis à jour!');
  console.log(`📁 Emplacement: ${SERVICES_FILE}`);
  console.log(`📊 ${translations.length} traductions DE ajoutées\n`);
  console.log('🎉 Traduction des services terminée!');
}

// Exécuter
main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
