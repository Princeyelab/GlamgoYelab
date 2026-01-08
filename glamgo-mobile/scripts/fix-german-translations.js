/**
 * Script pour corriger les traductions allemandes manquantes
 * Retraduit les chaînes qui sont restées en français
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEEPL_API_KEY = '4274f47f-77b2-4358-ab8b-53c99ca149ca:fx';
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
const SOURCE_LANG = 'FR';
const TARGET_LANG = 'DE';

// Chemin du fichier
const DE_FILE = path.join(__dirname, '../src/i18n/translations/de.ts');

// Mots français typiques pour détecter les textes non traduits
const FRENCH_INDICATORS = [
  'vous', 'votre', 'les', 'des', 'une', 'pour', 'avec', 'sur', 'dans',
  'est', 'sont', 'avoir', 'faire', 'être', 'quel', 'quelle',
  'comment', 'pourquoi', 'quand', 'où', 'qui', 'que', 'cette', 'ce',
  'mes', 'mon', 'ma', 'ses', 'son', 'sa', 'nos', 'notre',
  'veuillez', 'selectionnez', 'choisir', 'entrez', 'tapez'
];

/**
 * Détecte si une chaîne est probablement en français
 */
function isFrench(text) {
  if (!text || text.length < 3) return false;

  const lowerText = text.toLowerCase();

  // Vérifier les indicateurs français
  const hasFrenchWords = FRENCH_INDICATORS.some(word =>
    lowerText.split(/\s+/).includes(word) || lowerText.includes(word)
  );

  // Vérifier les caractères spéciaux français
  const hasFrenchChars = /[àâäéèêëïîôùûüÿæœç]/i.test(text);

  // Vérifier les patterns français typiques
  const hasFrenchPatterns = /(qu'|d'|l'|n'|s'|c'|j')/.test(lowerText);

  return hasFrenchWords || hasFrenchChars || hasFrenchPatterns;
}

/**
 * Traduit un texte avec DeepL
 */
async function translateText(text) {
  if (!text || text.trim() === '') return text;

  // Protéger les variables {xxx}
  const variables = [];
  let protected = text.replace(/\{[^}]+\}/g, (match) => {
    variables.push(match);
    return `__VAR${variables.length - 1}__`;
  });

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.log(`   ⏳ Limite de taux, attente de 5 secondes...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return translateText(text); // Réessayer
      }
      throw new Error(`DeepL API error: ${response.status}`);
    }

    const data = await response.json();
    let translated = data.translations[0].text;

    // Restaurer les variables
    variables.forEach((variable, index) => {
      translated = translated.replace(`__VAR${index}__`, variable);
    });

    return translated;
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`);
    return text; // Retourner l'original en cas d'erreur
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Correction des traductions allemandes manquantes...\n');

  // Lire le fichier
  console.log('📖 Lecture du fichier de.ts...');
  let content = fs.readFileSync(DE_FILE, 'utf8');
  const originalContent = content;

  // Extraire toutes les valeurs de chaînes
  const regex = /:\s*'([^'\\]*(\\.[^'\\]*)*)'/g;
  const matches = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const value = match[1]
      .replace(/\\n/g, '\n')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');

    if (isFrench(value)) {
      matches.push({
        original: match[0],
        value: value,
        index: match.index
      });
    }
  }

  console.log(`   Trouvé ${matches.length} chaînes en français à traduire\n`);

  if (matches.length === 0) {
    console.log('✅ Aucune traduction manquante détectée!');
    return;
  }

  // Traduire chaque chaîne
  console.log('🌍 Traduction en cours...\n');
  const translations = new Map();
  let count = 0;

  for (const item of matches) {
    count++;
    console.log(`   ${count}/${matches.length}: "${item.value.substring(0, 60)}${item.value.length > 60 ? '...' : ''}"`);

    const translated = await translateText(item.value);

    if (translated !== item.value) {
      translations.set(item.value, translated);
    }

    // Délai pour éviter la limite de taux (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`\n✅ ${translations.size} traductions effectuées\n`);

  // Remplacer dans le contenu
  console.log('📝 Mise à jour du fichier...');
  translations.forEach((translated, original) => {
    // Échapper les caractères spéciaux pour regex
    const escapedOriginal = original
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\n/g, '\\n')
      .replace(/'/g, "\\'");

    const escapedTranslated = translated
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n');

    // Remplacer toutes les occurrences
    const pattern = new RegExp(`:\\s*'${escapedOriginal}'`, 'g');
    const replacement = `: '${escapedTranslated}'`;

    content = content.replace(pattern, replacement);
  });

  // Vérifier si des changements ont été faits
  if (content === originalContent) {
    console.log('⚠️  Aucun changement n\'a été appliqué au fichier');
  } else {
    // Sauvegarder
    fs.writeFileSync(DE_FILE, content, 'utf8');
    console.log('✅ Fichier de.ts mis à jour avec succès!');
    console.log(`📁 Emplacement: ${DE_FILE}`);
    console.log(`📊 ${translations.size} traductions corrigées\n`);
  }

  console.log('🎉 Terminé!');
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
