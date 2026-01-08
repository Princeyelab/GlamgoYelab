/**
 * Script to fix remaining French strings in German translation file
 */

const fs = require('fs');
const path = require('path');

// File path
const DE_FILE = path.join(__dirname, '../src/i18n/translations/de.ts');

// Manual translations
const translations = {
  "price: 'Prix',": "price: 'Preis',",
  "notes: 'Notes',": "notes: 'Hinweise',",
  "rate: 'Noter',": "rate: 'Bewerten',",
  "rating: 'Note',": "rating: 'Bewertung',",
  "reviews: 'Avis',": "reviews: 'Bewertungen',",
  "notVerified: 'Non verifie',": "notVerified: 'Nicht verifiziert',",
  "notLoggedIn: 'Non connecte',": "notLoggedIn: 'Nicht angemeldet',",
  "changePassword: 'Changer le mot de passe',": "changePassword: 'Passwort ändern',",
  "paymentMethods: 'Moyens de paiement',": "paymentMethods: 'Zahlungsmethoden',",
  "changeLanguage: 'Changer la langue',": "changeLanguage: 'Sprache ändern',",
  "notFound: 'Non trouve',": "notFound: 'Nicht gefunden',",
  "title: 'Avis',": "title: 'Bewertungen',",
  "leaveReview: 'Laisser un avis',": "leaveReview: 'Bewertung hinterlassen',",
  "writeReview: 'Ecrire un avis',": "writeReview: 'Bewertung schreiben',",
  "noReviews: 'Aucun avis',": "noReviews: 'Keine Bewertungen',",
  "averageRating: 'Note moyenne',": "averageRating: 'Durchschnittliche Bewertung',",
  "basePrice: 'Prix de base',": "basePrice: 'Grundpreis',",
  "price_too_high: 'Prix trop eleve',": "price_too_high: 'Preis zu hoch',",
  "features: 'Fonctionnalites',": "features: 'Funktionen',",
  "average: 'Moyen',": "average: 'Durchschnittlich',",
  "terrible: 'Terrible',": "terrible: 'Schrecklich',",
  "review: 'Avis',": "review: 'Bewertung',",
  "noActiveJourney: 'Aucun trajet en cours',": "noActiveJourney: 'Keine aktive Route',",
  "changePhoto: 'Changer la photo',": "changePhoto: 'Foto ändern',",
  "changePhotoTitle: 'Changer la photo',": "changePhotoTitle: 'Foto ändern',",
  "notConnected: 'Non connecte',": "notConnected: 'Nicht verbunden',",
  "deleteAccountInfo: 'Fonctionnalite disponible en production',": "deleteAccountInfo: 'Funktion in Produktion verfügbar',",
  "formulaLabel: 'Formule',": "formulaLabel: 'Formel',",
  "standardPrice: 'Prix standard',": "standardPrice: 'Standardpreis',",
  "share: 'Partager',": "share: 'Teilen',",
  "activate: 'Activer',": "activate: 'Aktivieren',",
  "formula: 'Formule',": "formula: 'Formel',",
  "mandatoryEvaluation: 'Evaluation obligatoire',": "mandatoryEvaluation: 'Pflichtbewertung',",
};

console.log('🚀 Correction des traductions allemandes restantes...\\n');

// Read file
console.log('📖 Lecture du fichier de.ts...');
let content = fs.readFileSync(DE_FILE, 'utf8');

// Apply translations
let count = 0;
Object.entries(translations).forEach(([fr, de]) => {
  if (content.includes(fr)) {
    content = content.replace(new RegExp(fr.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&'), 'g'), de);
    count++;
  }
});

// Save
fs.writeFileSync(DE_FILE, content, 'utf8');

console.log(`✅ ${count} traductions corrigées!`);
console.log(`📁 Fichier: ${DE_FILE}\\n`);
console.log('🎉 Terminé!');
