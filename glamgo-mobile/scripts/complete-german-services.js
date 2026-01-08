/**
 * Script complet pour ajouter toutes les traductions allemandes manquantes aux services
 */

const fs = require('fs');
const path = require('path');

const SERVICES_FILE = path.join(__dirname, '../src/i18n/translations/services.ts');

console.log('🚀 Ajout des traductions allemandes manquantes aux services...\\n');

// Lire le fichier
let content = fs.readFileSync(SERVICES_FILE, 'utf8');

// Traductions à ajouter (identifiées manuellement)
const fixes = [
  // Coiffure Homme Simple - ligne 100-106
  {
    search: "title: { fr: 'Coiffure Homme Simple', ar: 'قص شعر رجالي بسيط', en: 'Simple Men\\'s Haircut', es: 'Corte de cabello masculino simple' },",
    replace: "title: { fr: 'Coiffure Homme Simple', ar: 'قص شعر رجالي بسيط', en: 'Simple Men\\'s Haircut', es: 'Corte de cabello masculino simple', de: 'Einfacher Herrenhaarschnitt' },"
  },
  {
    search: "      es: 'Corte de cabello clásico para hombre. Champú y peinado incluidos.'\\n    }\\n  },\\n  'Coiffure Homme Premium':",
    replace: "      es: 'Corte de cabello clásico para hombre. Champú y peinado incluidos.',\\n      de: 'Klassischer Herrenhaarschnitt. Shampoo und Styling inklusive.'\\n    }\\n  },\\n  'Coiffure Homme Premium':"
  },

  // Coiffure Homme Premium - ligne 109 (title only)
  {
    search: "title: { fr: 'Coiffure Homme Premium', ar: 'قص شعر رجالي فاخر', en: 'Premium Men\\'s Haircut', es: 'Corte de cabello masculino premium' },",
    replace: "title: { fr: 'Coiffure Homme Premium', ar: 'قص شعر رجالي فاخر', en: 'Premium Men\\'s Haircut', es: 'Corte de cabello masculino premium', de: 'Premium Herrenhaarschnitt' },"
  },

  // Soin Premium Argan - ligne 204
  {
    search: "      es: 'Tratamiento lujoso con aceite de argán marroquí. Hidratación intensa.'\\n    }\\n  },",
    replace: "      es: 'Tratamiento lujoso con aceite de argán marroquí. Hidratación intensa.',\\n      de: 'Luxusbehandlung mit marokkanischem Arganöl. Intensive Feuchtigkeitspflege.'\\n    }\\n  },"
  },

  // Gardiennage d'Animaux - ligne 238
  {
    search: "title: { fr: \\\"Gardiennage d'Animaux\\\", ar: 'رعاية الحيوانات', en: 'Pet Sitting', es: 'Cuidado de mascotas' },",
    replace: "title: { fr: \\\"Gardiennage d'Animaux\\\", ar: 'رعاية الحيوانات', en: 'Pet Sitting', es: 'Cuidado de mascotas', de: 'Tierbetreuung' },"
  },
  {
    search: "      es: 'Cuidado de sus mascotas durante su ausencia.'\\n    }\\n  },\\n  \\\"Promenade d'Animaux\\\":",
    replace: "      es: 'Cuidado de sus mascotas durante su ausencia.',\\n      de: 'Betreuung Ihrer Haustiere während Ihrer Abwesenheit.'\\n    }\\n  },\\n  \\\"Promenade d'Animaux\\\":"
  },

  // Promenade d'Animaux - ligne 245
  {
    search: "title: { fr: \\\"Promenade d'Animaux\\\", ar: 'تمشية الحيوانات', en: 'Pet Walking', es: 'Paseo de mascotas' },",
    replace: "title: { fr: \\\"Promenade d'Animaux\\\", ar: 'تمشية الحيوانات', en: 'Pet Walking', es: 'Paseo de mascotas', de: 'Tierspaziergänge' },"
  },
  {
    search: "      es: 'Paseos para sus mascotas.'\\n    }\\n  },\\n\\n  // === EPILATION",
    replace: "      es: 'Paseos para sus mascotas.',\\n      de: 'Spaziergänge für Ihre Haustiere.'\\n    }\\n  },\\n\\n  // === EPILATION"
  },

  // Smooth Femme - ligne 254
  {
    search: "title: { fr: 'Smooth Femme', ar: 'ازالة شعر نسائي', en: 'Women\\'s Hair Removal', es: 'Depilación femenina' },",
    replace: "title: { fr: 'Smooth Femme', ar: 'ازالة شعر نسائي', en: 'Women\\'s Hair Removal', es: 'Depilación femenina', de: 'Damen-Haarentfernung' },"
  },
  {
    search: "      es: 'Depilación femenina.'\\n    }\\n  },\\n  'Smooth Femme Full':",
    replace: "      es: 'Depilación femenina.',\\n      de: 'Haarentfernung für Damen.'\\n    }\\n  },\\n  'Smooth Femme Full':"
  },

  // Smooth Femme Full - ligne 261
  {
    search: "title: { fr: 'Smooth Femme Full', ar: 'ازالة شعر نسائي كامل', en: 'Full Women\\'s Hair Removal', es: 'Depilación femenina completa' },",
    replace: "title: { fr: 'Smooth Femme Full', ar: 'ازالة شعر نسائي كامل', en: 'Full Women\\'s Hair Removal', es: 'Depilación femenina completa', de: 'Komplette Damen-Haarentfernung' },"
  },
  {
    search: "      es: 'Depilación femenina completa.'\\n    }\\n  },\\n  'Smooth Homme':",
    replace: "      es: 'Depilación femenina completa.',\\n      de: 'Komplette Haarentfernung für Damen.'\\n    }\\n  },\\n  'Smooth Homme':"
  },

  // Smooth Homme - ligne 268
  {
    search: "title: { fr: 'Smooth Homme', ar: 'ازالة شعر رجالي', en: 'Men\\'s Hair Removal', es: 'Depilación masculina' },",
    replace: "title: { fr: 'Smooth Homme', ar: 'ازالة شعر رجالي', en: 'Men\\'s Hair Removal', es: 'Depilación masculina', de: 'Herren-Haarentfernung' },"
  },
  {
    search: "      es: 'Depilación masculina.'\\n    }\\n  },\\n  'Smooth Homme Full':",
    replace: "      es: 'Depilación masculina.',\\n      de: 'Haarentfernung für Herren.'\\n    }\\n  },\\n  'Smooth Homme Full':"
  },

  // Smooth Homme Full - ligne 275
  {
    search: "title: { fr: 'Smooth Homme Full', ar: 'ازالة شعر رجالي كامل', en: 'Full Men\\'s Hair Removal', es: 'Depilación masculina completa' },",
    replace: "title: { fr: 'Smooth Homme Full', ar: 'ازالة شعر رجالي كامل', en: 'Full Men\\'s Hair Removal', es: 'Depilación masculina completa', de: 'Komplette Herren-Haarentfernung' },"
  },
  {
    search: "      es: 'Depilación masculina completa.'\\n    }\\n  },\\n\\n  // === MANUCURE",
    replace: "      es: 'Depilación masculina completa.',\\n      de: 'Komplette Haarentfernung für Herren.'\\n    }\\n  },\\n\\n  // === MANUCURE"
  },

  // Manucure Gel - ligne 296
  {
    search: "      es: 'Manicura con esmalte de gel de larga duración. Hasta 3 semanas de belleza.'\\n    }\\n  },",
    replace: "      es: 'Manicura con esmalte de gel de larga duración. Hasta 3 semanas de belleza.',\\n      de: 'Maniküre mit lang anhaltendem Gel-Lack. Bis zu 3 Wochen Schönheit.'\\n    }\\n  },"
  }
];

let changesCount = 0;

fixes.forEach(fix => {
  if (content.includes(fix.search)) {
    content = content.replace(fix.search, fix.replace);
    changesCount++;
    console.log(`✓ Traduction ajoutée`);
  }
});

// Sauvegarder
fs.writeFileSync(SERVICES_FILE, content, 'utf8');

console.log(`\\n✅ ${changesCount} traductions allemandes ajoutées!`);
console.log(`📁 Fichier: ${SERVICES_FILE}\\n`);
console.log('🎉 Terminé!');
