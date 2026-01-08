/**
 * Script de traduction automatique FR -> DE avec DeepL API
 * Usage: node scripts/translate-to-german.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEEPL_API_KEY = '4274f47f-77b2-4358-ab8b-53c99ca149ca:fx';
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
const SOURCE_LANG = 'FR';
const TARGET_LANG = 'DE';

// Chemins des fichiers
const FR_FILE = path.join(__dirname, '../src/i18n/translations/fr.ts');
const DE_FILE = path.join(__dirname, '../src/i18n/translations/de.ts');

// Termes à ne pas traduire ou à adapter manuellement
const PRESERVE_TERMS = {
  'DH': 'DH', // Dirhams marocains
  'MAD': 'MAD',
  'GlamGo': 'GlamGo',
  'WhatsApp': 'WhatsApp',
  'GPS': 'GPS',
  'Yamina': 'Yamina', // Nom de l'assistante
  'RDV': 'Termin',
  'CGU': 'AGB',
};

// Regex pour protéger les variables {xxx}
const VARIABLE_REGEX = /\{[^}]+\}/g;

/**
 * Protège les variables en les remplaçant par des placeholders
 */
function protectVariables(text) {
  const variables = [];
  const protected = text.replace(VARIABLE_REGEX, (match) => {
    variables.push(match);
    return `__VAR${variables.length - 1}__`;
  });
  return { protected, variables };
}

/**
 * Restaure les variables après traduction
 */
function restoreVariables(text, variables) {
  let restored = text;
  variables.forEach((variable, index) => {
    restored = restored.replace(`__VAR${index}__`, variable);
  });
  return restored;
}

/**
 * Traduit un texte avec DeepL
 */
async function translateText(text) {
  if (!text || text.trim() === '') return text;

  // Vérifier si c'est un terme à préserver
  if (PRESERVE_TERMS[text]) {
    return PRESERVE_TERMS[text];
  }

  // Protéger les variables
  const { protected, variables } = protectVariables(text);

  try {
    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        auth_key: DEEPL_API_KEY,
        text: protected,
        source_lang: SOURCE_LANG,
        target_lang: TARGET_LANG,
        preserve_formatting: '1',
        tag_handling: 'xml',
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const translated = data.translations[0].text;

    // Restaurer les variables
    return restoreVariables(translated, variables);
  } catch (error) {
    console.error(`Erreur de traduction pour "${text}":`, error.message);
    return text; // Retourner le texte original en cas d'erreur
  }
}

/**
 * Extrait les chaînes du fichier TypeScript
 */
function extractStrings(content) {
  const strings = [];
  const regex = /:\s*['"`]((?:[^'"`\\]|\\.)*)['"`]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const str = match[1]
      .replace(/\\n/g, '\n')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');

    if (str && !strings.includes(str)) {
      strings.push(str);
    }
  }

  return strings;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de la traduction FR -> DE avec DeepL...\n');

  // Lire le fichier source
  console.log('📖 Lecture du fichier fr.ts...');
  let frContent = fs.readFileSync(FR_FILE, 'utf8');

  // Extraire toutes les chaînes à traduire
  console.log('🔍 Extraction des chaînes à traduire...');
  const strings = extractStrings(frContent);
  console.log(`   Trouvé ${strings.length} chaînes uniques\n`);

  // Traduire chaque chaîne avec un délai pour éviter de surcharger l'API
  console.log('🌍 Traduction en cours...');
  const translations = new Map();
  let count = 0;

  for (const str of strings) {
    count++;

    // Afficher la progression tous les 50 éléments
    if (count % 50 === 0) {
      console.log(`   ${count}/${strings.length} traductions effectuées...`);
    }

    const translated = await translateText(str);
    translations.set(str, translated);

    // Petit délai pour ne pas surcharger l'API (100ms)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`✅ ${count} traductions terminées\n`);

  // Créer le contenu DE
  console.log('📝 Génération du fichier de.ts...');
  let deContent = frContent;

  // Remplacer l'en-tête
  deContent = deContent.replace(
    '/**\n * Traductions françaises pour GlamGo Mobile\n */',
    '/**\n * Deutsche Übersetzungen für GlamGo Mobile\n * German translations for GlamGo Mobile\n */'
  );

  // Remplacer l'export
  deContent = deContent.replace('export const fr = {', 'export const de = {');

  // Remplacer toutes les chaînes
  translations.forEach((translated, original) => {
    // Échapper les caractères spéciaux pour regex
    const escapedOriginal = original
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\n/g, '\\n');

    const escapedTranslated = translated
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n');

    // Remplacer avec différents formats de quotes
    const patterns = [
      new RegExp(`:\\s*'${escapedOriginal}'`, 'g'),
      new RegExp(`:\\s*"${escapedOriginal}"`, 'g'),
      new RegExp(`:\\s*\`${escapedOriginal}\``, 'g'),
    ];

    patterns.forEach(pattern => {
      deContent = deContent.replace(pattern, `: '${escapedTranslated}'`);
    });
  });

  // Sauvegarder le fichier
  fs.writeFileSync(DE_FILE, deContent, 'utf8');

  console.log('✅ Fichier de.ts créé avec succès!');
  console.log(`📁 Emplacement: ${DE_FILE}`);
  console.log(`📊 ${translations.size} traductions appliquées\n`);
  console.log('🎉 Traduction terminée!');
}

// Exécuter
main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
