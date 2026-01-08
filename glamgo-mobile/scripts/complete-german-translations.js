/**
 * Script complet pour traduire toutes les chaînes françaises restantes en allemand
 * Basé sur l'analyse détaillée de 221+ chaînes non traduites
 * Utilise DeepL API pour la traduction automatique
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

// Mapping manuel des traductions critiques identifiées
// Ces traductions sont générées à partir de l'analyse complète du fichier de.ts
const manualTranslations = {
  // Welcome Section
  "Beaute, menage, reparations...\\nTout ce dont vous avez besoin, a portee de main": "Schönheit, Reinigung, Reparaturen...\\nAlles, was Sie brauchen, in Reichweite",

  // Auth Section
  "Une erreur est survenue lors de l\\'inscription. Veuillez reessayer.": "Beim Registrieren ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
  "J\\'accepte les": "Ich akzeptiere die",
  "Retour a l\\'accueil": "Zurück zur Startseite",
  "Continuer en tant qu\\'invite": "Als Gast fortfahren",
  "Ou continuer avec": "Oder fortfahren mit",
  "S\\'inscrire": "Registrieren",
  "Bienvenue sur GlamGo": "Willkommen bei GlamGo",
  "Creer un compte": "Konto erstellen",
  "Format d\\'email invalide": "Ungültiges E-Mail-Format",
  "Erreur d\\'inscription": "Registrierungsfehler",

  // Booking Section
  "Reservation": "Buchung",
  "Nouvelle reservation": "Neue Buchung",
  "Recapitulatif": "Zusammenfassung",
  "Sous-total": "Zwischensumme",
  "Confirmer la reservation": "Buchung bestätigen",
  "Code promo": "Gutscheincode",
  "Invites": "Gäste",
  "Nombre d\\'invites": "Anzahl der Gäste",

  // Booking Status
  "En attente": "Ausstehend",
  "Confirmee": "Bestätigt",
  "En route": "Unterwegs",
  "Arrive": "Angekommen",
  "En cours": "In Bearbeitung",
  "Avis en attente": "Bewertung ausstehend",
  "Terminee": "Abgeschlossen",
  "Annulee": "Storniert",
  "Refusee": "Abgelehnt",
  "Expiree": "Abgelaufen",

  // Bookings List
  "A venir": "Bevorstehend",
  "Passees": "Vergangen",
  "Annuler la reservation": "Buchung stornieren",
  "Merci!": "Danke!",
  "Reserver a nouveau": "Erneut buchen",
  "Suivre": "Verfolgen",
  "Vous n\\'avez aucune reservation programmee. Explorez nos services!": "Sie haben keine geplanten Buchungen. Entdecken Sie unsere Dienstleistungen!",

  // Provider Section
  "Tableau de bord": "Dashboard",
  "Disponibilite": "Verfügbarkeit",
  "Gains du jour": "Tageseinnahmen",
  "Gains du mois": "Monatseinnahmen",
  "Membre depuis": "Mitglied seit",
  "Repondez avant": "Antworten Sie vor",
  "Notes du client": "Kundennotizen",

  // Notifications
  "Chargement du suivi...": "Tracking wird geladen...",
  "Chargement du profil...": "Profil wird geladen...",
  "Chargement du tableau de bord...": "Dashboard wird geladen...",
  "Chargement du trajet...": "Route wird geladen...",
  "Retour au tableau de bord": "Zurück zum Dashboard",

  // Services
  "Tous": "Alle",
  "Nouveau": "Neu",
  "Populaire": "Beliebt",
  "Filtres": "Filter",
  "Trier par": "Sortieren nach",
  "Fourchette de prix": "Preisspanne",
  "Prix min": "Mindestpreis",

  // Service Management
  "Service cree mais erreur lors de l\\'upload des images": "Service erstellt, aber Fehler beim Hochladen der Bilder",
  "Confirmer le paiement pour activer l\\'abonnement": "Zahlung bestätigen, um das Abonnement zu aktivieren",
  "Retirer du catalogue": "Aus dem Katalog entfernen",
  "Les formules vous permettent d\\'apparaitre dans les recherches specifiques des clients. Plus vous activez de formules, plus vous serez visible !": "Formeln ermöglichen es Ihnen, in spezifischen Kundensuchen zu erscheinen. Je mehr Formeln Sie aktivieren, desto sichtbarer sind Sie!",
  "Paiement securise. Votre carte ne sera debitee qu\\'apres le service.": "Sichere Zahlung. Ihre Karte wird erst nach dem Service belastet.",
  "Recapitulatif du prix": "Preisübersicht",

  // Order Detail
  "Chargement du suivi...": "Tracking wird geladen...",
  "Au-dela de 15 km, des frais de {price} DH/km s\\'appliquent selon nos CGU.": "Über 15 km hinaus fallen gemäß unseren AGB Gebühren von {price} DH/km an.",
  "Voir la carte": "Karte anzeigen",
  "Annulation gratuite : le client a annule plus de 2h avant le RDV. Aucune compensation n\\'est prevue dans ce cas selon les CGU.": "Kostenlose Stornierung: Der Kunde hat mehr als 2 Stunden vor dem Termin storniert. In diesem Fall ist keine Entschädigung gemäß den AGB vorgesehen.",
  "Bareme des frais d\\'annulation (CGU) :": "Stornierungsgebührentabelle (AGB):",
  "Plus de 2h avant le RDV → GRATUIT (0 DH)": "Mehr als 2 Stunden vor dem Termin → KOSTENLOS (0 DH)",
  "Entre 1h et 2h avant → 20 DH": "Zwischen 1 und 2 Stunden vorher → 20 DH",
  "Moins de 1h avant → 50 DH": "Weniger als 1 Stunde vorher → 50 DH",
  "Plus de 2h avant RDV : GRATUIT (0 DH)": "Mehr als 2 Std. vor Termin: KOSTENLOS (0 DH)",
  "Entre 1h et 2h avant : 20 DH": "Zwischen 1 und 2 Std. vorher: 20 DH",
  "Moins de 1h avant : 50 DH": "Weniger als 1 Std. vorher: 50 DH",
  "Erreur lors du chargement": "Fehler beim Laden",
  "Adresse trop courte (min 10 caracteres)": "Adresse zu kurz (mind. 10 Zeichen)",
  "Ce service exclusif sera realise par le prestataire qui l\\'a cree.": "Dieser exklusive Service wird vom Anbieter durchgeführt, der ihn erstellt hat.",

  // Cancellation
  "Des frais de {fee} MAD ({percentage}%) seront appliques.\\n\\nVoulez-vous continuer ?": "Es fallen Gebühren von {fee} MAD ({percentage}%) an.\\n\\nMöchten Sie fortfahren?",
  "Temps avant le RDV: {hours}h": "Zeit bis zum Termin: {hours}h",
  "ATTENTION - Vous etes en route vers le client.\\n\\n- Des points de penalite seront appliques a votre compte\\n- Votre score prestataire sera impacte\\n- Plusieurs annulations peuvent entrainer une suspension temporaire\\n\\nSelon les CGU GlamGo, l\\'annulation en cours de trajet est reservee aux cas d\\'urgence.": "ACHTUNG - Sie sind auf dem Weg zum Kunden.\\n\\n- Strafpunkte werden Ihrem Konto belastet\\n- Ihre Anbieter-Bewertung wird beeinträchtigt\\n- Mehrere Stornierungen können zu einer vorübergehenden Sperrung führen\\n\\nGemäß den GlamGo-AGB ist die Stornierung während der Fahrt Notfällen vorbehalten.",
  "Cette commande est deja acceptee": "Diese Bestellung ist bereits akzeptiert",
  "Le prestataire est en route. Des frais d\\'annulation peuvent s\\'appliquer selon la distance parcourue.": "Der Anbieter ist unterwegs. Stornierungsgebühren können je nach zurückgelegter Entfernung anfallen.",
  "Le prestataire est arrive. L\\'annulation n\\'est plus possible.": "Der Anbieter ist angekommen. Stornierung ist nicht mehr möglich.",
  "La prestation est en cours. L\\'annulation n\\'est plus possible.": "Der Service läuft. Stornierung ist nicht mehr möglich.",
  "ou signaler un probleme": "oder ein Problem melden",

  // Emergency
  "Bienvenue chez GlamGo": "Willkommen bei GlamGo",

  // Review
  "Le paiement au prestataire sera declenche apres votre evaluation. Vous ne pourrez pas faire de nouvelle reservation avant d\\'avoir evalue.": "Die Zahlung an den Anbieter wird nach Ihrer Bewertung ausgelöst. Sie können keine neue Buchung vornehmen, bevor Sie bewertet haben.",
  "Non merci": "Nein danke",
  "Vous devez evaluer votre prestation pour que le paiement soit declenche. Vous ne pourrez pas faire de nouvelle reservation avant d\\'avoir evalue.": "Sie müssen Ihren Service bewerten, damit die Zahlung ausgelöst wird. Sie können keine neue Buchung vornehmen, bevor Sie bewertet haben.",

  // Provider Signup
  "votre.email@exemple.com": "ihre.email@beispiel.de",
  "Vous pourrez selectionner vos services et gerer votre disponibilite apres l\\'inscription.": "Sie können Ihre Services auswählen und Ihre Verfügbarkeit nach der Registrierung verwalten.",
  "Pour la securite de tous, nous verifions l\\'identite de nos prestataires": "Zur Sicherheit aller überprüfen wir die Identität unserer Anbieter",
  "Prenez en photo le recto et le verso de votre carte d\\'identite": "Fotografieren Sie Vorder- und Rückseite Ihres Ausweises",
  "En tant que prestataire GlamGo, je m\\'engage a :": "Als GlamGo-Anbieter verpflichte ich mich zu:",
  "Veuillez autoriser l\\'acces a la galerie": "Bitte erlauben Sie den Zugriff auf die Galerie",
  "Veuillez autoriser l\\'acces a la camera": "Bitte erlauben Sie den Zugriff auf die Kamera",

  // Password Reset
  "Mot de passe oublie": "Passwort vergessen",
  "Si un compte existe avec l\\'adresse {email}, vous recevrez un lien pour reinitialiser votre mot de passe.": "Wenn ein Konto mit der Adresse {email} existiert, erhalten Sie einen Link zum Zurücksetzen Ihres Passworts.",

  // Onboarding
  "Calcul du prix final :": "Berechnung des Endpreises:",
  "Paiement par carte bancaire (debite a la fin)": "Zahlung per Bankkarte (am Ende belastet)",
  "Evaluation ponctualite et respect du prix": "Bewertung der Pünktlichkeit und Preiseinhaltuung",
  "Definition de votre zone d\\'intervention (rayon en km)": "Definition Ihrer Einsatzzone (Radius in km)",
  "Definition de votre rayon d\\'intervention": "Definition Ihres Einsatzradius",
  "Navigation vers le Client": "Navigation zum Kunden",
  "Definissez votre rayon d\\'action": "Definieren Sie Ihren Aktionsradius",
  "Plus de 2h avant": "Mehr als 2 Std. vorher",

  // Payment
  "Numero de carte": "Kartennummer",
  "Numero de carte invalide": "Ungültige Kartennummer",
  "Payer plus tard": "Später zahlen",
  "Votre abonnement sera en attente de paiement. Vous ne pourrez pas profiter de tous les avantages tant que le paiement n\\'est pas effectue.": "Ihr Abonnement wird auf Zahlung warten. Sie können nicht alle Vorteile nutzen, bis die Zahlung erfolgt ist.",

  // Journey
  "Chargement du trajet...": "Route wird geladen...",
  "En attente du client": "Warten auf den Kunden",
  "Arrive chez le client": "Beim Kunden angekommen",

  // Chat Rules
  "Pour votre securite et celle de tous les utilisateurs :\\n\\n- Le partage de numeros de telephone est interdit\\n- Le partage de reseaux sociaux (WhatsApp, Instagram, Snapchat...) est interdit\\n- Les insultes et propos inappropries sont bloques\\n- Les photos inappropriees sont detectees et bloquees\\n\\nToute violation peut entrainer la suspension de votre compte.": "Zu Ihrer Sicherheit und der aller Benutzer:\\n\\n- Das Teilen von Telefonnummern ist verboten\\n- Das Teilen von sozialen Netzwerken (WhatsApp, Instagram, Snapchat...) ist verboten\\n- Beleidigungen und unangemessene Bemerkungen werden blockiert\\n- Unangemessene Fotos werden erkannt und blockiert\\n\\nJeder Verstoß kann zur Sperrung Ihres Kontos führen.",
  "Cette commande est finalisee. Le chat n\\'est plus disponible.": "Diese Bestellung ist abgeschlossen. Der Chat ist nicht mehr verfügbar.",

  // Chatbot Yamina - Réponses longues
  "Vous avez le choix ! Payez par carte bancaire directement dans l\\'app (c\\'est 100% securise), ou en especes au prestataire si vous preferez.": "Sie haben die Wahl! Zahlen Sie per Bankkarte direkt in der App (100% sicher) oder bar beim Anbieter, wenn Sie möchten.",
  "Pas de souci, ca arrive ! Allez dans \\\"Mes reservations\\\" et cliquez sur \\\"Annuler\\\". Si c\\'est au moins 2h avant le rendez-vous, c\\'est gratuit.": "Kein Problem, das kommt vor! Gehen Sie zu \\\"Meine Buchungen\\\" und klicken Sie auf \\\"Stornieren\\\". Wenn es mindestens 2 Stunden vor dem Termin ist, ist es kostenlos.",
  "Dites-moi ce qui s\\'est passe. Vous pouvez signaler le souci depuis votre commande, ou m\\'ecrire a support@glamgo.ma.": "Sagen Sie mir, was passiert ist. Sie können das Problem von Ihrer Bestellung aus melden oder mir an support@glamgo.ma schreiben.",
  "Je suis Yamina, votre assistante personnelle GlamGo ! Je suis la pour repondre a toutes vos questions et vous faciliter la vie. N\\'hesitez pas, je suis disponible 24h/24 !": "Ich bin Yamina, Ihre persönliche GlamGo-Assistentin! Ich bin hier, um alle Ihre Fragen zu beantworten und Ihnen das Leben zu erleichtern. Zögern Sie nicht, ich bin rund um die Uhr verfügbar!",
  "Vous etes libre de choisir ! Carte bancaire (100% securise dans l\\'app) ou especes au prestataire.": "Sie können frei wählen! Bankkarte (100% sicher in der App) oder bar beim Anbieter.",
  "Je suis la pour vous ! Si j\\'arrive pas a vous aider, ecrivez a support@glamgo.ma et l\\'equipe vous repondra dans les 24h.": "Ich bin für Sie da! Wenn ich Ihnen nicht helfen kann, schreiben Sie an support@glamgo.ma und das Team wird Ihnen innerhalb von 24 Stunden antworten.",
  "A tres bientot ! N\\'hesitez pas a revenir me voir si vous avez des questions. Prenez soin de vous !": "Bis bald! Zögern Sie nicht, wiederzukommen, wenn Sie Fragen haben. Passen Sie auf sich auf!",
  "Apres chaque prestation, vous pouvez noter et laisser un commentaire. C\\'est super important pour les autres clientes et pour les prestataires !": "Nach jedem Service können Sie bewerten und einen Kommentar hinterlassen. Das ist sehr wichtig für andere Kunden und für die Anbieter!",
  "Ne vous inquietez pas ! D\\'autres prestataires sont disponibles.": "Keine Sorge! Andere Anbieter sind verfügbar.",
  "Position du client": "Kundenstandort",
};

/**
 * Détecte si une chaîne est probablement en français
 */
function isFrench(text) {
  if (!text || text.length < 3) return false;

  const lowerText = text.toLowerCase();

  // Mots français typiques
  const FRENCH_INDICATORS = [
    'vous', 'votre', 'les', 'des', 'une', 'pour', 'avec', 'sur', 'dans',
    'est', 'sont', 'avoir', 'faire', 'être', 'quel', 'quelle',
    'comment', 'pourquoi', 'quand', 'où', 'qui', 'que', 'cette', 'ce',
    'mes', 'mon', 'ma', 'ses', 'son', 'sa', 'nos', 'notre',
    'veuillez', 'selectionnez', 'choisir', 'entrez', 'tapez',
    'reserver', 'reservation', 'prestataire', 'client',
  ];

  const hasFrenchWords = FRENCH_INDICATORS.some(word =>
    lowerText.split(/\s+/).includes(word) || lowerText.includes(word)
  );

  // Caractères spéciaux français
  const hasFrenchChars = /[àâäéèêëïîôùûüÿæœç]/i.test(text);

  // Patterns français typiques
  const hasFrenchPatterns = /(qu'|d'|l'|n'|s'|c'|j')/.test(lowerText);

  return hasFrenchWords || hasFrenchChars || hasFrenchPatterns;
}

/**
 * Traduit un texte avec DeepL API
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
  console.log('🚀 Traduction complète des chaînes allemandes manquantes...\\n');

  // Lire le fichier
  console.log('📖 Lecture du fichier de.ts...');
  let content = fs.readFileSync(DE_FILE, 'utf8');
  const originalContent = content;

  // Appliquer d'abord les traductions manuelles
  console.log('\\n📝 Application des traductions manuelles préparées...');
  let manualCount = 0;
  Object.entries(manualTranslations).forEach(([fr, de]) => {
    // Échapper les caractères spéciaux pour regex
    const escapedFr = fr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedDe = de.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    // Pattern pour trouver la chaîne
    const pattern = new RegExp(`:\\s*'${escapedFr}'`, 'g');

    if (pattern.test(content)) {
      const replacement = `: '${escapedDe}'`;
      content = content.replace(pattern, replacement);
      manualCount++;
      console.log(`   ✓ "${fr.substring(0, 50)}${fr.length > 50 ? '...' : ''}"`);
    }
  });

  console.log(`\\n✅ ${manualCount} traductions manuelles appliquées`);

  // Extraire toutes les valeurs de chaînes restantes
  console.log('\\n🔍 Recherche des chaînes françaises restantes...');
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

  console.log(`   Trouvé ${matches.length} chaînes françaises supplémentaires à traduire\\n`);

  if (matches.length === 0) {
    console.log('✅ Aucune traduction manquante détectée!');
  } else {
    // Traduire chaque chaîne
    console.log('🌍 Traduction automatique en cours...\\n');
    const translations = new Map();
    let count = 0;

    for (const item of matches) {
      count++;
      console.log(`   ${count}/${matches.length}: "${item.value.substring(0, 60)}${item.value.length > 60 ? '...' : ''}"`);

      const translated = await translateText(item.value);

      if (translated !== item.value) {
        translations.set(item.value, translated);
      }

      // Délai pour éviter la limite de taux (350ms)
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    console.log(`\\n✅ ${translations.size} traductions automatiques effectuées\\n`);

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
  }

  // Vérifier si des changements ont été faits
  if (content === originalContent) {
    console.log('⚠️  Aucun changement n\'a été appliqué au fichier');
  } else {
    // Sauvegarder
    fs.writeFileSync(DE_FILE, content, 'utf8');
    console.log('✅ Fichier de.ts mis à jour avec succès!');
    console.log(`📁 Emplacement: ${DE_FILE}`);
    console.log(`📊 Total: ${manualCount} traductions manuelles + ${matches.length} détectées\\n`);
  }

  console.log('🎉 Terminé!');
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
