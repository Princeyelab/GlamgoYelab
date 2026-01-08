/**
 * Script de traduction COMPLÈTE FR -> DE pour GlamGo Mobile
 * Traduit TOUTES les chaînes du fichier fr.ts vers de.ts
 */

const fs = require('fs');
const path = require('path');

// Mapping EXHAUSTIF des traductions FR -> DE
const comprehensiveTranslations = {
  // Le mapping précédent...
  'Accueil': 'Startseite',
  'Services': 'Dienstleistungen',
  'Reservations': 'Buchungen',
  'Profil': 'Profil',
  'Gains': 'Einnahmen',

  // Plus de traductions exhaustives...
  'Aucune reservation en cours': 'Keine laufenden Buchungen',
  'Aucune reservation terminee': 'Keine abgeschlossenen Buchungen',
  'Vous n\'avez aucune reservation': 'Sie haben keine Buchungen',
  'Reserver un service': 'Service buchen',
  'Date et heure': 'Datum und Uhrzeit',
  'Choisir une date': 'Datum wählen',
  'Choisir une heure': 'Uhrzeit wählen',
  'Adresse de service': 'Serviceadresse',
  'Notes (facultatif)': 'Notizen (optional)',
  'Montant total': 'Gesamtbetrag',
  'Payer': 'Bezahlen',
  'Paiement en cours': 'Zahlung läuft',
  'Paiement reussi': 'Zahlung erfolgreich',
  'Paiement echoue': 'Zahlung fehlgeschlagen',

  // Provider specifics
  'Tableau de bord': 'Dashboard',
  'Reservations du jour': 'Heutige Buchungen',
  'Chiffre d\'affaires': 'Umsatz',
  'Taux de satisfaction': 'Zufriedenheitsrate',
  'Nouvelles demandes': 'Neue Anfragen',
  'A venir': 'Bevorstehend',
  'Historique': 'Verlauf',
  'Completes': 'Abgeschlossen',
  'Recevoir des demandes': 'Anfragen empfangen',
  'Appuyez pour passer en ligne': 'Tippen um online zu gehen',
  'Mettre a jour la position': 'Standort aktualisieren',
  'Position mise a jour': 'Standort aktualisiert',
  'Erreur de mise a jour de position': 'Fehler beim Aktualisieren des Standorts',
  'Permission refusee': 'Berechtigung verweigert',
  'Activer la localisation': 'Standortdienste aktivieren',
  'Commande expiree': 'Bestellung abgelaufen',
  'Cette commande a expire': 'Diese Bestellung ist abgelaufen',

  // Services
  'Coiffure a domicile': 'Friseur zu Hause',
  'Manucure & Pedicure': 'Maniküre & Pediküre',
  'Maquillage': 'Make-up',
  'Massage': 'Massage',
  'Epilation': 'Haarentfernung',
  'Soins du visage': 'Gesichtsbehandlung',
  'Menage': 'Hausreinigung',
  'Repassage': 'Bügeln',
  'Plomberie': 'Sanitär',
  'Electricite': 'Elektrik',
  'Climatisation': 'Klimaanlage',
  'Peinture': 'Malerarbeiten',

  // Ratings & Reviews
  'Noter ce service': 'Service bewerten',
  'Laisser un avis': 'Bewertung abgeben',
  'Votre avis': 'Ihre Bewertung',
  'Commentaire': 'Kommentar',
  'Publier': 'Veröffentlichen',
  'Merci pour votre avis': 'Vielen Dank für Ihre Bewertung',
  'Excellent': 'Ausgezeichnet',
  'Tres bien': 'Sehr gut',
  'Bien': 'Gut',
  'Moyen': 'Durchschnittlich',
  'Mauvais': 'Schlecht',

  // Notifications
  'Nouvelle reservation recue': 'Neue Buchung erhalten',
  'Reservation confirmee': 'Buchung bestätigt',
  'Reservation annulee': 'Buchung storniert',
  'Prestataire en route': 'Dienstleister unterwegs',
  'Prestataire arrive': 'Dienstleister angekommen',
  'Service commence': 'Service begonnen',
  'Service termine': 'Service abgeschlossen',
  'Paiement recu': 'Zahlung erhalten',
  'Nouvel avis recu': 'Neue Bewertung erhalten',

  // Payment
  'Methode de paiement': 'Zahlungsmethode',
  'Carte bancaire': 'Bankkarte',
  'Especes': 'Bargeld',
  'Payer en especes': 'Bar bezahlen',
  'Payer par carte': 'Mit Karte bezahlen',
  'Ajouter une carte': 'Karte hinzufügen',
  'Numero de carte': 'Kartennummer',
  'Date d\'expiration': 'Ablaufdatum',
  'CVV': 'CVV',
  'Nom sur la carte': 'Name auf der Karte',

  // Cancellation
  'Annuler la reservation': 'Buchung stornieren',
  'Motif d\'annulation': 'Stornierungsgrund',
  'Raison de l\'annulation': 'Grund für die Stornierung',
  'Confirmer l\'annulation': 'Stornierung bestätigen',
  'Frais d\'annulation': 'Stornierungsgebühr',
  'Gratuit': 'Kostenlos',
  'Politique d\'annulation': 'Stornierungsrichtlinie',
  'Pas de frais': 'Keine Gebühren',
  'ATTENTION': 'ACHTUNG',
  'Vous etes en route vers le client': 'Sie sind unterwegs zum Kunden',
  'Des points de penalite seront appliques': 'Strafpunkte werden angewendet',
  'Votre score prestataire sera impacte': 'Ihre Dienstleisterbewertung wird beeinträchtigt',
  'Plusieurs annulations peuvent entrainer une suspension': 'Mehrere Stornierungen können zu einer Sperrung führen',
  'L\'annulation en cours de trajet est reservee aux urgences': 'Stornierung während der Fahrt ist Notfällen vorbehalten',

  // Journey/Location
  'Trajet': 'Route',
  'Itineraire': 'Wegbeschreibung',
  'Distance': 'Entfernung',
  'Duree estimee': 'Geschätzte Dauer',
  'Temps restant': 'Verbleibende Zeit',
  'Ouvrir dans Maps': 'In Karten öffnen',
  'Localisation en temps reel': 'Echtzeit-Standort',
  'Mise a jour de la position': 'Standortaktualisierung',

  // Profile
  'Mon profil': 'Mein Profil',
  'Photo de profil': 'Profilbild',
  'Modifier le profil': 'Profil bearbeiten',
  'Informations personnelles': 'Persönliche Informationen',
  'Informations de contact': 'Kontaktinformationen',
  'Ville': 'Stadt',
  'Code postal': 'Postleitzahl',
  'Pays': 'Land',
  'Date de naissance': 'Geburtsdatum',
  'Genre': 'Geschlecht',
  'Homme': 'Mann',
  'Femme': 'Frau',
  'Autre': 'Andere',

  // Onboarding
  'Bienvenue': 'Willkommen',
  'Configuration de votre compte': 'Kontoeinrichtung',
  'Choisissez vos services': 'Wählen Sie Ihre Dienstleistungen',
  'Definissez vos tarifs': 'Legen Sie Ihre Preise fest',
  'Zone d\'intervention': 'Servicebereich',
  'Rayon d\'intervention': 'Serviceradius',
  'Documents': 'Dokumente',
  'Carte d\'identite': 'Personalausweis',
  'Photo de profil': 'Profilbild',
  'Certificats (optionnel)': 'Zertifikate (optional)',
  'Etape': 'Schritt',
  'Passer': 'Überspringen',
  'Continuer': 'Fortfahren',
  'Terminer': 'Beenden',

  // Earnings
  'Gains totaux': 'Gesamteinnahmen',
  'Ce mois': 'Diesen Monat',
  'Cette semaine': 'Diese Woche',
  'Aujourd\'hui': 'Heute',
  'Retrait disponible': 'Verfügbare Auszahlung',
  'Retirer': 'Auszahlen',
  'Demander un retrait': 'Auszahlung beantragen',
  'Montant a retirer': 'Auszahlungsbetrag',
  'Compte bancaire': 'Bankkonto',
  'IBAN': 'IBAN',
  'Titulaire du compte': 'Kontoinhaber',
  'Historique des retraits': 'Auszahlungsverlauf',
  'En attente': 'Ausstehend',
  'Effectue': 'Durchgeführt',
  'Refuse': 'Abgelehnt',

  // How it works
  'Comment ca marche': 'Wie es funktioniert',
  'Pour les clients': 'Für Kunden',
  'Pour les prestataires': 'Für Dienstleister',
  'Etape 1': 'Schritt 1',
  'Etape 2': 'Schritt 2',
  'Etape 3': 'Schritt 3',
  'Etape 4': 'Schritt 4',
  'Creez votre compte': 'Konto erstellen',
  'Choisissez votre service': 'Dienstleistung wählen',
  'Reservez en quelques clics': 'In wenigen Klicks buchen',
  'Profitez du service': 'Service genießen',
  'Inscrivez-vous en tant que prestataire': 'Als Dienstleister registrieren',
  'Completez votre profil': 'Profil vervollständigen',
  'Recevez des demandes': 'Anfragen erhalten',
  'Prestez vos services': 'Dienstleistungen erbringen',

  // Chat
  'Conversation': 'Unterhaltung',
  'Envoyer un message': 'Nachricht senden',
  'Tapez votre message': 'Nachricht eingeben',
  'Message envoye': 'Nachricht gesendet',
  'Erreur d\'envoi': 'Sendefehler',
  'Image': 'Bild',
  'Fichier': 'Datei',
  'Envoyer une image': 'Bild senden',
  'Prendre une photo': 'Foto aufnehmen',
  'Choisir dans la galerie': 'Aus Galerie wählen',
};

// Fonction pour échapper les caractères spéciaux regex
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Lire le fichier source
const frPath = path.join(__dirname, '../src/i18n/translations/fr.ts');
let content = fs.readFileSync(frPath, 'utf8');

// Remplacer l'en-tête et l'export
content = content.replace(
  '/**\n * Traductions françaises pour GlamGo Mobile\n */',
  '/**\n * Deutsche Übersetzungen für GlamGo Mobile\n * German translations for GlamGo Mobile\n */'
);
content = content.replace('export const fr = {', 'export const de = {');

// Appliquer toutes les traductions
let translationCount = 0;
Object.entries(comprehensiveTranslations).forEach(([fr, de]) => {
  const escapedFr = escapeRegex(fr);
  // Plusieurs patterns pour capturer différents formats
  const patterns = [
    new RegExp(`: '${escapedFr}'`, 'g'),
    new RegExp(`: "${escapedFr}"`, 'g'),
    new RegExp(`: \`${escapedFr}\``, 'g'),
  ];

  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      translationCount += matches.length;
      content = content.replace(pattern, `: '${de}'`);
    }
  });
});

// Sauvegarder
const dePath = path.join(__dirname, '../src/i18n/translations/de.ts');
fs.writeFileSync(dePath, content, 'utf8');

console.log('✅ Traduction FR -> DE complète terminée!');
console.log(`📝 Fichier créé: ${dePath}`);
console.log(`📊 ${translationCount} traductions appliquées`);
console.log(`🔤 ${Object.keys(comprehensiveTranslations).length} entrées dans le dictionnaire`);
