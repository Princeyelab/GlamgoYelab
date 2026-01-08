/**
 * Script de traduction automatique FR -> ES avec DeepL API
 * Usage: node scripts/translate-to-spanish.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEEPL_API_KEY = '4274f47f-77b2-4358-ab8b-53c99ca149ca:fx';
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
const SOURCE_LANG = 'FR';
const TARGET_LANG = 'ES';

// Chemins des fichiers
const FR_FILE = path.join(__dirname, '../src/i18n/translations/fr.ts');
const ES_FILE = path.join(__dirname, '../src/i18n/translations/es.ts');

// Termes à ne pas traduire ou à adapter manuellement
const PRESERVE_TERMS = {
  'DH': 'DH', // Dirhams marocains
  'MAD': 'MAD',
  'GlamGo': 'GlamGo',
  'WhatsApp': 'WhatsApp',
  'GPS': 'GPS',
  'Yamina': 'Yamina', // Nom de l'assistante
  'RDV': 'cita',
  'CGU': 'Términos de Servicio',
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
  variables.forEach((v, i) => {
    restored = restored.replace(`__VAR${i}__`, v);
  });
  return restored;
}

/**
 * Traduit un texte via DeepL API
 */
async function translateText(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return text;
  }

  // Protéger les variables
  const { protected: protectedText, variables } = protectVariables(text);

  try {
    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: protectedText,
        source_lang: SOURCE_LANG,
        target_lang: TARGET_LANG,
        preserve_formatting: '1',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`DeepL API error: ${response.status} - ${error}`);
      return text; // Retourner le texte original en cas d'erreur
    }

    const data = await response.json();
    let translated = data.translations[0].text;

    // Restaurer les variables
    translated = restoreVariables(translated, variables);

    // Appliquer les termes préservés
    for (const [fr, es] of Object.entries(PRESERVE_TERMS)) {
      // Ne remplacer que si le terme espagnol est différent
      if (fr !== es) {
        const regex = new RegExp(fr, 'gi');
        translated = translated.replace(regex, es);
      }
    }

    return translated;
  } catch (error) {
    console.error(`Translation error for "${text.substring(0, 50)}...": ${error.message}`);
    return text;
  }
}

/**
 * Traduit récursivement un objet
 */
async function translateObject(obj, depth = 0, path = '') {
  const result = {};
  const entries = Object.entries(obj);

  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof value === 'string') {
      // Traduire la chaîne
      result[key] = await translateText(value);

      // Afficher la progression
      if (depth <= 1) {
        process.stdout.write(`\r  Translating: ${currentPath.padEnd(40)} `);
      }

      // Pause pour respecter les limites de l'API (délai augmenté pour éviter rate limiting)
      await new Promise(resolve => setTimeout(resolve, 500));
    } else if (typeof value === 'object' && value !== null) {
      // Récursion pour les objets imbriqués
      result[key] = await translateObject(value, depth + 1, currentPath);
    } else {
      // Garder les autres types tels quels
      result[key] = value;
    }
  }

  return result;
}

/**
 * Parse le fichier fr.ts pour extraire l'objet de traduction
 */
function parseFrFile(content) {
  // Supprimer les commentaires et les types TypeScript
  let cleanContent = content
    // Supprimer les commentaires multi-lignes
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Supprimer les commentaires de ligne
    .replace(/\/\/.*$/gm, '')
    // Supprimer l'export type à la fin
    .replace(/export\s+type\s+\w+\s*=\s*typeof\s+\w+;?/g, '');

  // Extraire le contenu entre "export const fr = {" et le dernier "};"
  const match = cleanContent.match(/export\s+const\s+fr\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
  if (!match) {
    throw new Error('Could not parse fr.ts file structure');
  }

  let objStr = match[1];

  // Convertir les template literals en strings normales
  // Remplacer `...` par '...' en gérant les sauts de ligne
  objStr = objStr.replace(/`([^`]*)`/g, (match, content) => {
    // Échapper les apostrophes et les sauts de ligne
    const escaped = content
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n');
    return `'${escaped}'`;
  });

  // Évaluer l'objet
  try {
    const fn = new Function(`return ${objStr}`);
    return fn();
  } catch (e) {
    // En cas d'erreur, essayer de sauvegarder le contenu nettoyé pour debug
    fs.writeFileSync(path.join(__dirname, 'debug-parsed.txt'), objStr);
    throw new Error(`Failed to parse translations object: ${e.message}`);
  }
}

/**
 * Génère le contenu du fichier es.ts
 */
function generateEsFile(translations) {
  const jsonStr = JSON.stringify(translations, null, 2);

  // Convertir le JSON en format TypeScript valide
  // - Supprimer les guillemets autour des clés simples
  // - Remplacer les guillemets doubles par des guillemets simples pour les valeurs
  let tsContent = jsonStr
    .replace(/"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/g, '$1:') // Clés sans guillemets
    .replace(/: "((?:[^"\\]|\\.)*)"/g, (match, p1) => {
      // Échapper les apostrophes et utiliser des guillemets simples
      const escaped = p1.replace(/'/g, "\\'").replace(/\\"/g, '"');
      return `: '${escaped}'`;
    });

  return `/**
 * Spanish translations for GlamGo Mobile
 * Auto-generated from fr.ts using DeepL API
 * Generated on: ${new Date().toISOString()}
 *
 * Note: Review and adjust technical terms if needed
 */

export const es = ${tsContent};
`;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🌍 GlamGo Translation Script (FR → ES)');
  console.log('=====================================\n');

  // Lire le fichier source
  console.log('📖 Reading fr.ts...');
  const frContent = fs.readFileSync(FR_FILE, 'utf-8');

  // Parser le fichier
  console.log('🔍 Parsing translations...');
  const frTranslations = parseFrFile(frContent);

  // Compter le nombre de chaînes
  function countStrings(obj) {
    let count = 0;
    for (const value of Object.values(obj)) {
      if (typeof value === 'string') count++;
      else if (typeof value === 'object' && value !== null) count += countStrings(value);
    }
    return count;
  }
  const totalStrings = countStrings(frTranslations);
  console.log(`📊 Found ${totalStrings} strings to translate\n`);

  // Traduire
  console.log('🔄 Translating with DeepL API...');
  console.log('   (This may take a few minutes)\n');

  const startTime = Date.now();
  const esTranslations = await translateObject(frTranslations);
  const duration = Math.round((Date.now() - startTime) / 1000);

  console.log(`\n\n✅ Translation completed in ${duration} seconds`);

  // Générer le fichier
  console.log('📝 Generating es.ts...');
  const esContent = generateEsFile(esTranslations);
  fs.writeFileSync(ES_FILE, esContent, 'utf-8');

  console.log(`✅ Saved to: ${ES_FILE}`);
  console.log('\n🎉 Done! Please review the generated file for any adjustments needed.');
}

// Exécuter
main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
