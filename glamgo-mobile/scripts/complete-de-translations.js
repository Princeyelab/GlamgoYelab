/**
 * Script rapide pour compléter les traductions allemandes essentielles
 * Traduit les chaînes les plus courantes restées en français
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier
const DE_FILE = path.join(__dirname, '../src/i18n/translations/de.ts');

// Mapping manuel des traductions courantes manquantes
const manualTranslations = {
  // Auth
  "votre@email.com": "ihre@email.de",
  "Format d'email invalide": "Ungültiges E-Mail-Format",
  "S'inscrire": "Registrieren",
  "Continuer en tant qu'invite": "Als Gast fortfahren",
  "Retour a l'accueil": "Zurück zur Startseite",
  "Creer un compte": "Konto erstellen",
  "Je suis...": "Ich bin...",
  "Client": "Kunde",
  "Prestataire": "Dienstleister",

  // Signup
  "Infos": "Info",
  "Paiement": "Zahlung",
  "Preferences": "Präferenzen",
  "Prenom requis (min 2 caracteres)": "Vorname erforderlich (mind. 2 Zeichen)",
  "Nom requis (min 2 caracteres)": "Nachname erforderlich (mind. 2 Zeichen)",
  "Telephone requis": "Telefon erforderlich",
  "Format: 06/07 suivi de 8 chiffres": "Format: 06/07 gefolgt von 8 Ziffern",
  "Date de naissance requise": "Geburtsdatum erforderlich",
  "Vous devez avoir au moins 18 ans": "Sie müssen mindestens 18 Jahre alt sein",
  "Vous devez accepter les conditions": "Sie müssen die Bedingungen akzeptieren",
  "Adresse requise": "Adresse erforderlich",
  "Ville requise": "Stadt erforderlich",
  "Veuillez selectionner au moins un service": "Bitte wählen Sie mindestens einen Service aus",
  "Erreur d'inscription": "Registrierungsfehler",
  "Une erreur est survenue lors de l'inscription. Veuillez reessayer.": "Beim Registrieren ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
  "Informations personnelles": "Persönliche Informationen",
  "Votre adresse": "Ihre Adresse",
  "Mode de paiement": "Zahlungsmethode",
  "Vos preferences": "Ihre Präferenzen",
  "Creez votre compte GlamGo": "Erstellen Sie Ihr GlamGo-Konto",
  "Ou souhaitez-vous recevoir vos prestations ?": "Wo möchten Sie Ihre Dienstleistungen erhalten?",
  "Selectionnez votre mode de paiement": "Wählen Sie Ihre Zahlungsmethode",
  "Personnalisez votre experience": "Personalisieren Sie Ihre Erfahrung",
  "Votre prenom": "Ihr Vorname",
  "Votre nom": "Ihr Nachname",
  "Date de naissance": "Geburtsdatum",
  "Selectionnez votre date": "Wählen Sie Ihr Datum",
  "Retapez votre mot de passe": "Passwort wiederholen",
  "J'accepte les": "Ich akzeptiere die",
  "conditions generales": "Allgemeinen Geschäftsbedingungen",
  "politique de confidentialite": "Datenschutzrichtlinie",
  "Adresse complete": "Vollständige Adresse",
  "Commencez a taper votre adresse...": "Beginnen Sie mit der Eingabe Ihrer Adresse...",
  "Ville": "Stadt",
  "Selectionnez une ville": "Wählen Sie eine Stadt",
  "Choisir une ville": "Stadt wählen",
  "Numero de carte invalide (16 chiffres)": "Ungültige Kartennummer (16 Ziffern)",
  "Carte expiree": "Karte abgelaufen",
  "CVV invalide": "CVV ungültig",
  "Configurez votre mode de paiement. La carte bancaire permet un paiement securise.": "Richten Sie Ihre Zahlungsmethode ein. Die Bankkarte ermöglicht eine sichere Zahlung.",
  "Precedent": "Zurück",
  "Selectionnez les services qui vous interessent pour des recommandations personnalisees.": "Wählen Sie die Dienstleistungen aus, die Sie interessieren, für personalisierte Empfehlungen.",
  "Chargement des services...": "Dienste laden...",
  "Aucun service disponible pour le moment.": "Derzeit keine Dienstleistungen verfügbar.",
  "Terminer l'inscription": "Registrierung abschließen",
  "Selectionnez au moins un service pour continuer": "Wählen Sie mindestens einen Service aus, um fortzufahren",

  // Home
  "Bonjour": "Hallo",
  "Bienvenue": "Willkommen",
  "Rechercher un service...": "Service suchen...",
  "Services populaires": "Beliebte Dienste",
  "Prestataires a proximite": "Anbieter in der Nähe",
  "Reservations recentes": "Kürzliche Buchungen",
  "Aucun prestataire a proximite": "Keine Anbieter in der Nähe",
  "Services en vedette": "Vorgestellte Dienste",
  "Categories": "Kategorien",

  // Services
  "Tous les services": "Alle Dienste",
  "Services GlamGo": "GlamGo-Dienste",
  "{count} services a domicile": "{count} Dienstleistungen zu Hause",
  "Categorie": "Kategorie",
  "Duree": "Dauer",
  "Description": "Beschreibung",
  "Selectionner": "Auswählen",
  "Aucun service disponible": "Keine Dienste verfügbar",
  "Aucun service trouve": "Kein Service gefunden",
  'Aucun resultat pour "{query}"': 'Keine Ergebnisse für "{query}"',
  "Effacer la recherche": "Suche löschen",
  "dans cette categorie": "in dieser Kategorie",
  "Prix max": "Höchstpreis",

  // Booking
  "Choisir une date": "Datum wählen",
  "Choisir une heure": "Uhrzeit wählen",
  "Choisir un prestataire": "Anbieter wählen",
  "Entrez votre adresse": "Geben Sie Ihre Adresse ein",
  "Utiliser ma position actuelle": "Meinen aktuellen Standort verwenden",
  "Instructions speciales...": "Besondere Anweisungen...",
  "Frais de service": "Servicegebühr",
  "Reserver maintenant": "Jetzt buchen",
  "Especes": "Bargeld",
  "Appliquer": "Anwenden",
  "Nombre d'invites": "Anzahl Gäste",

  // Statuses
  "En attente de confirmation": "Warte auf Bestätigung",
  "Acceptee": "Akzeptiert",
  "Prestataire a confirme": "Anbieter hat bestätigt",
  "Prestataire en route": "Anbieter unterwegs",
  "Prestataire est arrive": "Anbieter ist angekommen",
  "Service en cours": "Service läuft",
  "En attente de votre avis": "Warte auf Ihre Bewertung",
  "Service termine": "Service abgeschlossen",

  // Bookings
  "Mes reservations": "Meine Buchungen",
  "Gerez vos rendez-vous beaute": "Verwalten Sie Ihre Schönheitstermine",
  "Historique": "Verlauf",
  "Aucune reservation": "Keine Buchungen",
  "Aucune reservation a venir": "Keine bevorstehenden Buchungen",
  "Aucun historique": "Kein Verlauf",
  "Aucune reservation passee": "Keine vergangenen Buchungen",
  "Vous n'avez aucune reservation programmee. Explorez nos services!": "Sie haben keine geplanten Buchungen. Entdecken Sie unsere Dienstleistungen!",
  "Votre historique de reservations apparaitra ici.": "Ihr Buchungsverlauf wird hier angezeigt.",
  "Parcourir les services": "Dienste durchsuchen",
  "Voir les details": "Details anzeigen",
  "Voulez-vous vraiment annuler cette reservation?": "Möchten Sie diese Buchung wirklich stornieren?",
  "Impossible d'annuler la reservation": "Buchung kann nicht storniert werden",
  "Votre avis a ete enregistre.": "Ihre Bewertung wurde gespeichert.",

  // Provider
  "Demandes": "Anfragen",
  "Mes services": "Meine Dienste",
  "Nouvelle demande": "Neue Anfrage",
  "Demandes en attente": "Ausstehende Anfragen",
  "Demandes acceptees": "Akzeptierte Anfragen",
  "Accepter": "Akzeptieren",
  "Demarrer le trajet": "Route starten",
  "Commencer le service": "Service beginnen",
  "Terminer le service": "Service beenden",
  "Gains de la semaine": "Einnahmen der Woche",
  "Services termines": "Abgeschlossene Dienste",
  "Aucune demande": "Keine Anfragen",
  "Commande expiree": "Bestellung abgelaufen",
  "Vous n'avez pas repondu a temps. La commande a ete automatiquement annulee.": "Sie haben nicht rechtzeitig geantwortet. Die Bestellung wurde automatisch storniert.",
  "Temps restant": "Verbleibende Zeit",
  "Vous recevez des demandes": "Sie erhalten Anfragen",
  "Appuyez pour passer en ligne": "Tippen um online zu gehen",
  "Aucune reservation active": "Keine aktiven Buchungen",
  "Passez en ligne pour recevoir des demandes": "Gehen Sie online, um Anfragen zu erhalten",
  "Actions rapides": "Schnellaktionen",
  "Commandes": "Bestellungen",
  "Performance": "Leistung",
  "Veuillez activer la localisation": "Bitte aktivieren Sie die Standortdienste",
  "Erreur de localisation": "Standortfehler",
  "Accepte": "Akzeptiert",
  "Mes Demandes": "Meine Anfragen",
  "commande(s) active(s)": "aktive Bestellung(en)",
  "Aucune nouvelle demande": "Keine neuen Anfragen",
  "Aucune reservation en cours": "Keine laufenden Buchungen",
  "Aucune reservation terminee": "Keine abgeschlossenen Buchungen",
  "Montant": "Betrag",
  "pour repondre": "zum Antworten",
  "Annuler cette reservation?": "Diese Buchung stornieren?",

  // Messages
  "Messages": "Nachrichten",
  "Ecrire un message...": "Nachricht schreiben...",
  "Tapez votre message...": "Geben Sie Ihre Nachricht ein...",
  "Aucun message": "Keine Nachrichten",
  "Commencez la conversation": "Unterhaltung beginnen",

  // Settings
  "Conditions d'utilisation": "Nutzungsbedingungen",
  "Politique de confidentialite": "Datenschutzrichtlinie",
};

console.log('🚀 Complétion des traductions allemandes...\n');

// Lire le fichier
console.log('📖 Lecture du fichier de.ts...');
let content = fs.readFileSync(DE_FILE, 'utf8');

// Appliquer les traductions
let count = 0;
Object.entries(manualTranslations).forEach(([fr, de]) => {
  // Échapper les caractères spéciaux pour regex
  const escapedFr = fr
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/'/g, "\\'");

  const escapedDe = de.replace(/'/g, "\\'");

  // Pattern pour trouver la chaîne
  const pattern = new RegExp(`:\\s*'${escapedFr}'`, 'g');

  if (pattern.test(content)) {
    const replacement = `: '${escapedDe}'`;
    content = content.replace(pattern, replacement);
    count++;
  }
});

// Sauvegarder
fs.writeFileSync(DE_FILE, content, 'utf8');

console.log(`✅ ${count} traductions corrigées!`);
console.log(`📁 Fichier: ${DE_FILE}\n`);
console.log('🎉 Terminé!');
