/**
 * Script pour corriger les traductions allemandes du dashboard prestataire
 */

const fs = require('fs');
const path = require('path');

const DE_FILE = path.join(__dirname, '../src/i18n/translations/de.ts');

console.log('🚀 Correction des traductions allemandes du dashboard prestataire...\\n');

// Lire le fichier
let content = fs.readFileSync(DE_FILE, 'utf8');

// Traductions à corriger
const fixes = [
  // Provider section
  { search: "reject: 'Refuser',", replace: "reject: 'Ablehnen'," },
  { search: "arrived: 'Je suis arrive',", replace: "arrived: 'Ich bin angekommen'," },
  { search: "totalEarnings: 'Gains totaux',", replace: "totalEarnings: 'Gesamteinkommen'," },
  { search: "responseTime: 'Temps de reponse',", replace: "responseTime: 'Antwortzeit'," },
  { search: "orderExpiredMessage: 'Vous n\\'avez pas repondu a temps. La commande a ete automatiquement annulee.',", replace: "orderExpiredMessage: 'Sie haben nicht rechtzeitig geantwortet. Die Bestellung wurde automatisch storniert.'," },
  { search: "online: 'EN LIGNE',", replace: "online: 'ONLINE'," },
  { search: "offline: 'HORS LIGNE',", replace: "offline: 'OFFLINE'," },
  { search: "revenues: 'Revenus',", replace: "revenues: 'Einnahmen'," },
  { search: "settings: 'Parametres',", replace: "settings: 'Einstellungen'," },
  { search: "help: 'Aide',", replace: "help: 'Hilfe'," },
  { search: "completion: 'Completion',", replace: "completion: 'Abschlussrate'," },
  { search: "updateLocation: 'Mettre a jour la position',", replace: "updateLocation: 'Position aktualisieren'," },
  { search: "permissionDenied: 'Permission refusee',", replace: "permissionDenied: 'Berechtigung verweigert'," },
  { search: "locationUpdated: 'Position mise a jour',", replace: "locationUpdated: 'Position aktualisiert'," },
  { search: "availabilityError: 'Erreur de disponibilite',", replace: "availabilityError: 'Verfügbarkeitsfehler'," },
  { search: "statusAccepted: 'Akzeptiere',", replace: "statusAccepted: 'Akzeptiert'," },
  { search: "statusCompleted: 'Termine',", replace: "statusCompleted: 'Abgeschlossen'," },
  { search: "statusCancelled: 'Annule',", replace: "statusCancelled: 'Storniert'," },
  { search: "statusPaid: 'Paye',", replace: "statusPaid: 'Bezahlt'," },

  // Provider Bookings section
  { search: "new: 'Nouveaux',", replace: "new: 'Neu'," },

  // Completion variants
  { search: "    completed: 'Terminees',", replace: "    completed: 'Abgeschlossen'," },
  { search: "    completed: 'Termines',", replace: "    completed: 'Abgeschlossen'," },

  // Bookings section
  { search: "yesCancel: 'Oui, annuler',", replace: "yesCancel: 'Ja, stornieren'," },
  { search: "cannotCancel: 'Impossible d\\'annuler la reservation',", replace: "cannotCancel: 'Buchung kann nicht storniert werden'," },
];

let changesCount = 0;

fixes.forEach(fix => {
  if (content.includes(fix.search)) {
    content = content.replace(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&'), 'g'), fix.replace);
    changesCount++;
    console.log(`✓ Corrigé: ${fix.search.substring(0, 50)}...`);
  }
});

// Vérifier si la section time existe, sinon l'ajouter
if (!content.includes('  time: {')) {
  // Trouver un bon endroit pour insérer la section time (après common ou bookings)
  const insertAfter = '  bookings: {';
  const bookingsEndIndex = content.indexOf('  },\\n\\n  // Provider screens');

  if (bookingsEndIndex > 0) {
    const timeSection = `\\n  // Time periods\\n  time: {\\n    today: 'Heute',\\n    week: 'Woche',\\n    month: 'Monat',\\n  },\\n`;
    content = content.slice(0, bookingsEndIndex + 5) + timeSection + content.slice(bookingsEndIndex + 5);
    changesCount++;
    console.log('✓ Section time ajoutée');
  }
}

// Sauvegarder
fs.writeFileSync(DE_FILE, content, 'utf8');

console.log(`\\n✅ ${changesCount} traductions corrigées!`);
console.log(`📁 Fichier: ${DE_FILE}\\n`);
console.log('🎉 Terminé!');
