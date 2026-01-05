/**
 * Module de moderation de contenu - GlamGo Mobile
 * Bloque: numeros de telephone, insultes, mots grossiers, contenu inapproprie
 */

// ============================================
// LISTES NOIRES - INSULTES ET MOTS INTERDITS
// ============================================

// Insultes francaises
const FRENCH_INSULTS: string[] = [
  // Insultes generales
  'connard', 'connasse', 'con', 'conne', 'salaud', 'salope', 'pute', 'putain',
  'merde', 'enculé', 'encule', 'enculer', 'nique', 'niquer', 'niquée', 'niqué',
  'bâtard', 'batard', 'fils de pute', 'fdp', 'ntm', 'nique ta mere', 'ntm',
  'ta gueule', 'ferme ta gueule', 'ftg', 'tg', 'gueule',
  'bordel', 'bougnoule', 'pd', 'pédé', 'pede', 'pédale', 'pedale', 'tapette',
  'gouine', 'enfoiré', 'enfoire', 'abruti', 'abrutie', 'débile', 'debile',
  'crétin', 'cretin', 'cretine', 'crétine', 'idiot', 'idiote', 'imbécile', 'imbecile',
  'ordure', 'pouffiasse', 'poufiasse', 'grosse', 'gros porc', 'porc', 'truie',
  'clochard', 'clocharde', 'moins que rien', 'sous-merde',

  // Termes sexuels
  'bite', 'bitte', 'couilles', 'couille', 'chatte', 'nichon', 'nichons',
  'seins', 'cul', 'fesse', 'fesses', 'branler', 'branleur', 'branlette',
  'sucer', 'suceur', 'suceuse', 'baiser', 'baiseur', 'baise',

  // Abreviations SMS/Internet
  'tg', 'stfu', 'gtfo', 'wtf', 'ntm', 'nkl', 'bdp', 'bdk', 'tmtc',
  'ptdr', 'jpms', 'jpp', 'fdp', 'ftg', 'slt', 'stp', 'stv',

  // Menaces et violence
  'je vais te tuer', 'je te tue', 'tu vas mourir', 'creve', 'crève',
  'je vais te frapper', 'je te frappe', 'je vais te casser', 'casse toi',
  'degage', 'dégage', 'barre toi', 'fous le camp', 'va te faire',
  'harceler', 'stalker', 'je te suis',

  // Termes racistes/xenophobes
  'negre', 'nègre', 'negro', 'arabe', 'sale arabe', 'sale noir', 'sale blanc',
  'bougnoule', 'bougnoul', 'raton', 'melon', 'bicot', 'youpin', 'feuj',
  'rebeu', 'renoi', 'babtou', 'gwer', 'toubab', 'roumi',
];

// Insultes arabes (Darija marocaine + arabe standard)
const ARABIC_INSULTS: string[] = [
  // Darija - ecriture arabe
  'زمل', 'قحبة', 'كلب', 'حمار', 'نيك', 'زب', 'زبي', 'تبون', 'تبونك',
  'سيفتك', 'معفن', 'مقود', 'كحبة', 'شرموطة', 'عاهرة', 'لقحاب',
  'واد القحبة', 'ولد القحبة', 'بنت القحبة',

  // Darija - transcription latine (toutes variations)
  'zml', 'zaml', 'zamil', 'zemel', 'zaamel',
  'qhba', 'qahba', 'kahba', '9ahba', '9hba', 'gahba',
  'kelb', 'kalb', 'klb',
  'hmar', 'himar', '7mar', '7imar',
  'nik', 'nyk', 'neek', 'niik',
  'zb', 'zeb', 'zebi', 'zbi', 'zbbi',
  'tboun', 'tbon', 'tebon', 'tbonk', 'teboun',
  'siftk', 'siftek',
  'm3fn', 'maafn', 'maafen',
  'mkawd', 'mkawed', 'me9wed',
  'chrmouta', 'sharmota', 'sharmouta', 'charmota', 'char9', 'chra9',
  'l9hab', 'l9ahab', 'le9hab',
  'wld l9hba', 'wld lqhba', 'wald l9ahba', 'weld lkahba',
  'bent l9hba', 'bnt l9hba', 'bint lqahba',

  // Autres insultes darija
  'khanzir', '5anzir', 'khnzir', // cochon
  'bghl', 'baghl', 'beghl', // mule (insulte)
  'msskhout', 'meskhout', 'mskht',
  'tel3 lik', '7chouma', 'hchouma',
  'sir t9awed', 'sir t9wed', 'sir tnik',
  'a]nikou', 'ynikou', 'ynik', 'tnik', 'tnikou',

  // Menaces en arabe
  'ghadi n9tlek', 'gadi n9tlk', 'غادي نقتلك',
  'nderbek', 'n9tl3ek', 'نضربك',
  'tmout', 'mout', 'تموت',

  // Insultes en arabe standard
  'كس امك', 'كسمك', 'يلعن', 'العن', 'عرص', 'منيوك', 'متناك',
  'ksmk', 'ks omk', 'ks mok', 'kisomok',
  'yla3an', 'la3an', 'l3n',
  '3rs', 'ars', '3ars',
];

// ============================================
// PATTERNS DE DETECTION
// ============================================

// Patterns pour detecter les numeros de telephone
const PHONE_PATTERNS: RegExp[] = [
  // Numeros marocains
  /0[567]\d{8}/g,                           // 0612345678
  /\+212\s?[567]\d{8}/g,                    // +212612345678
  /00212\s?[567]\d{8}/g,                    // 00212612345678

  // Format avec espaces/tirets
  /0[567][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/g,

  // Format obfusque (06*12*34*56*78)
  /0[567][\s*#._\-x]+\d{1,2}[\s*#._\-x]+\d{1,2}[\s*#._\-x]+\d{1,2}[\s*#._\-x]+\d{1,2}/gi,

  // Numeros ecrits en lettres partiellement
  /zero\s*[567]|zéro\s*[567]|sfr\s*[567]/gi,

  // Format international generique
  /\+?\d{10,14}/g,

  // Format francais
  /\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/g,
];

// Patterns pour detecter les coordonnees de contact
const CONTACT_PATTERNS: RegExp[] = [
  // Emails
  /[\w.+-]+@[\w-]+\.[\w.-]+/gi,

  // WhatsApp
  /wa\.me\/\d+/gi,
  /whatsapp/gi,
  /what\s*s?\s*app/gi,

  // Reseaux sociaux
  /facebook\.com/gi,
  /fb\.com/gi,
  /instagram\.com/gi,
  /insta\s*:/gi,
  /snapchat/gi,
  /snap\s*:/gi,
  /telegram/gi,
  /tiktok/gi,
  /twitter/gi,
  /linkedin/gi,

  // Abreviations reseaux sociaux
  /\b(wa|tg|snap|insta|fb)\s*:/gi,
  /\bmon\s+(snap|insta|fb|whatsapp|numero)\b/gi,
  /\b(ajoute|ajt|add)\s*(moi)?\s*(sur|on)?\s*(snap|insta|fb|whatsapp)\b/gi,
];

// Patterns pour noms de fichiers suspects
const SUSPICIOUS_FILENAME_PATTERNS: RegExp[] = [
  /nude/i,
  /naked/i,
  /porn/i,
  /xxx/i,
  /sex/i,
  /adult/i,
  /nsfw/i,
  /explicit/i,
  /onlyfans/i,
  /leak/i,
  /intime/i,
  /privé/i,
  /prive/i,
  /déshabill/i,
  /deshabill/i,
  /bite/i,
  /chatte/i,
  /nichon/i,
  /sein/i,
  /compromett/i,
  /chantage/i,
  /revenge/i,
];

// ============================================
// TYPES
// ============================================

export interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
  category?: 'insult' | 'racism' | 'threat' | 'contact' | 'phone' | 'inappropriate';
  flaggedContent?: string[];
}

export interface ImageModerationResult {
  isAllowed: boolean;
  reason?: string;
  requiresConfirmation?: boolean;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Normalise le texte pour la detection
 * - Minuscules
 * - Supprime les accents
 * - Decode le leet speak
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase();

  // Supprimer les accents
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Decoder le leet speak basique
  const leetMap: Record<string, string> = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '8': 'b',
    '@': 'a',
    '$': 's',
  };

  for (const [leet, letter] of Object.entries(leetMap)) {
    normalized = normalized.split(leet).join(letter);
  }

  // Supprimer les espaces multiples
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Verifie si le texte contient des insultes
 */
function containsInsults(text: string): { found: boolean; matches: string[] } {
  const normalized = normalizeText(text);
  const matches: string[] = [];

  // Verifier les insultes francaises
  for (const insult of FRENCH_INSULTS) {
    const insultNormalized = normalizeText(insult);
    const regex = new RegExp(`\\b${insultNormalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(normalized)) {
      matches.push(insult);
    }
  }

  // Verifier les insultes arabes
  for (const insult of ARABIC_INSULTS) {
    // Pour l'arabe, verifier aussi le texte original (caracteres arabes)
    if (text.includes(insult) || normalized.includes(normalizeText(insult))) {
      matches.push(insult);
    }
  }

  return { found: matches.length > 0, matches };
}

/**
 * Verifie si le texte contient des numeros de telephone
 */
function containsPhoneNumber(text: string): { found: boolean; matches: string[] } {
  const matches: string[] = [];

  for (const pattern of PHONE_PATTERNS) {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found);
    }
  }

  return { found: matches.length > 0, matches: [...new Set(matches)] };
}

/**
 * Verifie si le texte contient des coordonnees de contact
 */
function containsContactInfo(text: string): { found: boolean; matches: string[] } {
  const matches: string[] = [];

  for (const pattern of CONTACT_PATTERNS) {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found);
    }
  }

  return { found: matches.length > 0, matches: [...new Set(matches)] };
}

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Modere un message texte
 * Retourne si le message est autorise et la raison du blocage
 */
export function moderateMessage(content: string): ModerationResult {
  if (!content || content.trim().length === 0) {
    return { isAllowed: true };
  }

  // 1. Verifier les numeros de telephone
  const phoneCheck = containsPhoneNumber(content);
  if (phoneCheck.found) {
    return {
      isAllowed: false,
      reason: 'Le partage de numeros de telephone n\'est pas autorise pour votre securite.',
      category: 'phone',
      flaggedContent: phoneCheck.matches,
    };
  }

  // 2. Verifier les coordonnees de contact
  const contactCheck = containsContactInfo(content);
  if (contactCheck.found) {
    return {
      isAllowed: false,
      reason: 'Le partage de coordonnees personnelles n\'est pas autorise.',
      category: 'contact',
      flaggedContent: contactCheck.matches,
    };
  }

  // 3. Verifier les insultes
  const insultCheck = containsInsults(content);
  if (insultCheck.found) {
    return {
      isAllowed: false,
      reason: 'Votre message contient des propos inappropries ou offensants.',
      category: 'insult',
      flaggedContent: insultCheck.matches,
    };
  }

  return { isAllowed: true };
}

/**
 * Modere un nom de fichier image
 */
export function moderateImageFilename(filename: string): ImageModerationResult {
  if (!filename) {
    return { isAllowed: true };
  }

  const lowerFilename = filename.toLowerCase();

  for (const pattern of SUSPICIOUS_FILENAME_PATTERNS) {
    if (pattern.test(lowerFilename)) {
      return {
        isAllowed: false,
        reason: 'Ce fichier semble contenir du contenu inapproprie.',
      };
    }
  }

  return { isAllowed: true, requiresConfirmation: true };
}

/**
 * Verifie les extensions autorisees pour les images
 */
export function isAllowedImageExtension(filename: string): boolean {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedExtensions.includes(ext);
}

/**
 * Verifie la taille du fichier (max 5MB)
 */
export function isAllowedFileSize(sizeInBytes: number): boolean {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return sizeInBytes <= maxSize;
}

/**
 * Messages d'avertissement par categorie
 */
export const MODERATION_WARNINGS: Record<string, string> = {
  phone: 'Pour votre securite, ne partagez pas votre numero de telephone. Utilisez uniquement le chat de l\'application.',
  contact: 'Le partage de coordonnees personnelles (email, reseaux sociaux) n\'est pas autorise.',
  insult: 'Les propos offensants, insultes et menaces sont strictement interdits et peuvent entrainer la suspension de votre compte.',
  inappropriate: 'Ce contenu n\'est pas approprie pour cette plateforme.',
  racism: 'Les propos discriminatoires sont strictement interdits.',
  threat: 'Les menaces sont interdites et peuvent faire l\'objet de poursuites legales.',
};

export default {
  moderateMessage,
  moderateImageFilename,
  isAllowedImageExtension,
  isAllowedFileSize,
  MODERATION_WARNINGS,
};
