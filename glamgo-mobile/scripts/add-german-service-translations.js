/**
 * Script pour ajouter les traductions allemandes manquantes aux services
 */

const fs = require('fs');
const path = require('path');

const SERVICES_FILE = path.join(__dirname, '../src/i18n/translations/services.ts');

// Traductions allemandes manquantes
const germanTranslations = {
  'Coiffure Homme Simple': {
    title: ', de: \'Einfacher Herrenhaarschnitt\'',
    description: ',\n      de: \'Klassischer Herrenhaarschnitt. Shampoo und Styling inklusive.\''
  },
  'Coiffure Homme Premium': {
    title: ', de: \'Premium Herrenhaarschnitt\'',
    description: '' // Already has German translation
  },
  "Gardiennage d'Animaux": {
    title: ', de: \'Tierbetreuung\'',
    description: ',\n      de: \'Betreuung Ihrer Haustiere während Ihrer Abwesenheit.\''
  },
  "Promenade d'Animaux": {
    title: ', de: \'Tierspaziergang\'',
    description: ',\n      de: \'Spaziergänge für Ihre Haustiere.\''
  },
  'Smooth Femme': {
    title: ', de: \'Damen-Haarentfernung\'',
    description: ',\n      de: \'Haarentfernung für Damen.\''
  },
  'Smooth Femme Full': {
    title: ', de: \'Komplette Damen-Haarentfernung\'',
    description: ',\n      de: \'Komplette Haarentfernung für Damen.\''
  },
  'Smooth Homme': {
    title: ', de: \'Herren-Haarentfernung\'',
    description: ',\n      de: \'Haarentfernung für Herren.\''
  },
  'Smooth Homme Full': {
    title: ', de: \'Komplette Herren-Haarentfernung\'',
    description: ',\n      de: \'Komplette Haarentfernung für Herren.\''
  }
};

console.log('🚀 Ajout des traductions allemandes manquantes aux services...\\n');

// Lire le fichier
let content = fs.readFileSync(SERVICES_FILE, 'utf8');
let changesCount = 0;

// Appliquer les corrections
Object.entries(germanTranslations).forEach(([serviceName, translations]) => {
  // Corriger les titres manquants
  if (translations.title) {
    // Pattern: title: { fr: 'ServiceName', ..., es: 'xxx' },
    const titlePattern = new RegExp(
      `('${serviceName.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&')}':\\s*{[^}]*es:\\s*'[^']*')\\s*}`,
      'g'
    );

    if (titlePattern.test(content)) {
      content = content.replace(titlePattern, `$1${translations.title} }`);
      changesCount++;
      console.log(`✓ Ajouté traduction allemande du titre: ${serviceName}`);
    }
  }

  // Corriger les descriptions manquantes
  if (translations.description) {
    // Pattern: description après le service
    const descPattern = new RegExp(
      `('${serviceName.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&')}':[\\s\\S]*?description:\\s*{[^}]*es:\\s*'[^']*')\\s*}`,
      'g'
    );

    if (descPattern.test(content)) {
      content = content.replace(descPattern, `$1${translations.description} }`);
      changesCount++;
      console.log(`✓ Ajouté traduction allemande de la description: ${serviceName}`);
    }
  }
});

// Sauvegarder
fs.writeFileSync(SERVICES_FILE, content, 'utf8');

console.log(`\\n✅ ${changesCount} traductions allemandes ajoutées!`);
console.log(`📁 Fichier: ${SERVICES_FILE}\\n`);
console.log('🎉 Terminé!');
