/**
 * Module de moderation de contenu - GlamGo Mobile
 * Bloque: numeros de telephone, insultes, mots grossiers, contenu inapproprie
 * Supporte: FR, EN, AR (standard + Darija), contournements
 */

// ============================================
// LISTES NOIRES - INSULTES ET MOTS INTERDITS
// ============================================

// Insultes francaises directes
const FRENCH_DIRECT_INSULTS: string[] = [
  'conn', 'encul', 'salo', 'pute', 'fdp', 'batard', 'bâtard', 'merd', 'ordur',
  'cretin', 'crétin', 'debile', 'débile', 'tare', 'taré', 'tarée',
  'connard', 'connasse', 'salaud', 'salope', 'putain', 'enculé', 'encule',
  'enculer', 'nique', 'niquer', 'niquée', 'niqué', 'fils de pute', 'ntm',
  'nique ta mere', 'ta gueule', 'ferme ta gueule', 'ftg', 'tg', 'gueule',
  'bordel', 'bougnoule', 'pd', 'pédé', 'pede', 'pédale', 'pedale', 'tapette',
  'gouine', 'enfoiré', 'enfoire', 'abruti', 'abrutie', 'idiot', 'idiote',
  'imbécile', 'imbecile', 'pouffiasse', 'poufiasse', 'grosse', 'gros porc',
  'porc', 'truie', 'clochard', 'clocharde', 'moins que rien', 'sous-merde',
  'bite', 'bitte', 'couilles', 'couille', 'chatte', 'nichon', 'nichons',
  'branler', 'branleur', 'branlette', 'sucer', 'suceur', 'suceuse',
  'baiser', 'baiseur', 'baise', 'nkl', 'bdp', 'bdk',
];

// Attaques verbales francaises (patterns)
const FRENCH_VERBAL_ATTACK_PATTERNS: RegExp[] = [
  /va\s+te\s+.*/gi,
  /ferme\s+ta\s+.*/gi,
  /t'?es\s+qu'?un/gi,
  /tu\s+sers\s+[àa]\s+rien/gi,
  /ta\s+m[eè]re\s+.*/gi,
  /je\s+vais\s+te\s+tuer/gi,
  /je\s+te\s+tue/gi,
  /tu\s+vas\s+mourir/gi,
  /cr[eè]ve/gi,
  /je\s+vais\s+te\s+frapper/gi,
  /casse\s+toi/gi,
  /d[eé]gage/gi,
  /barre\s+toi/gi,
  /fous\s+le\s+camp/gi,
  /va\s+te\s+faire/gi,
];

// Insultes anglaises directes
const ENGLISH_DIRECT_INSULTS: string[] = [
  'fuck', 'fck', 'fuk', 'fuq', 'f*ck', 'f**k',
  'shit', 'sh1t', 'sh!t', 's**t',
  'bitch', 'b1tch', 'b!tch', 'biatch',
  'asshole', 'a**hole', 'assh0le',
  'bastard', 'b@stard',
  'slut', 'sl*t',
  'whore', 'wh0re',
  'dick', 'd1ck', 'd!ck',
  'pussy', 'puss',
  'cunt', 'c*nt',
  'ass', 'arse',
];

// Discours haineux anglais
const ENGLISH_HATE_SPEECH: string[] = [
  'motherf', 'motherfucker', 'mf', 'mofo',
  'sonofab', 'son of a bitch', 'sob',
  'retard', 'r3tard',
  'moron', 'm0ron',
  'idiot', '1diot',
  'nigger', 'nigga', 'n1gga', 'n*gga',
  'faggot', 'fag', 'f@g',
];

// Expressions toxiques anglaises
const ENGLISH_TOXIC_EXPRESSIONS: string[] = [
  'fuck you', 'fck you', 'fk u', 'fu',
  'go die', 'go and die',
  'kill yourself', 'kys',
  'go to hell',
  'you are nothing', 'ur nothing',
  'i hate you', 'hate u',
  'stfu', 'gtfo', 'wtf',
];

// Insultes arabes classiques
const ARABIC_CLASSIC_INSULTS: string[] = [
  // Ecriture arabe
  'كلب', 'حمار', 'قذر', 'وسخ', 'حقير', 'لعنة', 'خنزير', 'تافه',
  'زمل', 'قحبة', 'نيك', 'زب', 'زبي', 'تبون', 'تبونك', 'سيفتك',
  'معفن', 'مقود', 'كحبة', 'شرموطة', 'عاهرة', 'لقحاب', 'كس امك',
  'كسمك', 'يلعن', 'العن', 'عرص', 'منيوك', 'متناك',
  // Transcription latine
  'kelb', 'kalb', 'klb', 'k3lb',
  'hmar', 'himar', '7mar', '7imar', 'ahmar',
  'qazir', 'wskh', 'ws5', 'wasekh', 'wosokh',
  '7a9ir', 'ha9ir', 'haqir',
  'la3na', 'l3na', 'laana',
  'khanzir', '5anzir', 'khnzir', 'khenzir',
  'tafeh', 'tafih',
];

// Attaques familiales arabes (blocage fort)
const ARABIC_FAMILY_ATTACKS: string[] = [
  // Ecriture arabe
  'ابن', 'زانية', 'قحبة', 'شرموط',
  'واد القحبة', 'ولد القحبة', 'بنت القحبة',
  // Transcription latine
  'ibn', 'ebn', '2bn',
  'zaniya', 'zanya',
  'qahba', 'kahba', '9ahba', 'gahba', 'k@hba', 'k4hba',
  'sharmout', 'sharmouta', 'charmota', 'chrmouta', 'chrmota',
  'wld l9hba', 'wld lqhba', 'wald l9ahba', 'weld lkahba',
  'bent l9hba', 'bnt l9hba', 'bint lqahba',
];

// Darija - Animaux / mepris
const DARIJA_ANIMAL_INSULTS: string[] = [
  'hmar', '7mar', 'himar', '7imar',
  'kelb', 'klb', 'kalb', 'k3lb',
  'khanzir', '5anzir', 'khnzir', '5nzir',
  'bghl', 'baghl', 'beghl', 'bghel',
  'far', 'f@r', // souris/rat
  'dib', 'd1b', // loup (pejoratif)
];

// Darija - Vulgarites
const DARIJA_VULGAR: string[] = [
  'wskh', 'ws5', 'wasekh', 'wosokh', 'wsekh',
  'qhb', 'qahb', '9ahb', '9a7b', 'qahba', '9ahba', 'kahba',
  'zaml', 'zml', 'zamel', 'z@mel', 'z4mel', 'zamelh',
  'zmer', 'zmr', 'zemer',
  'nik', 'nyk', 'neek', 'niik', 'n1k',
  'zb', 'zeb', 'zebi', 'zbi', 'zbbi', 'z3b',
  'tboun', 'tbon', 'tebon', 'tbonk', 'teboun', 'tbun',
  'm3fn', 'maafn', 'maafen', 'm3fen',
  'mkawd', 'mkawed', 'me9wed', 'm9wed',
  'l9hab', 'l9ahab', 'le9hab', 'lkahab',
];

// Darija - Attaques personnelles (patterns)
const DARIJA_PERSONAL_ATTACK_PATTERNS: RegExp[] = [
  /ntya\s+ma\s+.*/gi,
  /nta\s+ma\s+.*/gi,
  /ma\s+tswa\s+walo/gi,
  /ma\s+tsawi\s+walo/gi,
  /sir\s+t9awed/gi,
  /sir\s+t9wed/gi,
  /sir\s+tnik/gi,
];

// Darija - Famille (blocage fort)
const DARIJA_FAMILY_ATTACKS: string[] = [
  'wld', 'weld', 'wald', 'wild', // fils de...
  'bnt', 'bent', 'bint', // fille de...
  'mok', 'mmok', 'mmo', 'mmk', // ta mere
  'bak', 'babak', 'bbak', // ton pere
  'wld lqhba', 'weld l9ahba', 'wld kahba',
  'bnt lqhba', 'bent l9ahba', 'bnt kahba',
  'nik mok', 'nyk mmok', 'nik mmk',
  'nik babak', 'nyk bak',
];

// Racines d'insultes arabes/darija a bloquer
const ARABIC_DARIJA_ROOTS: string[] = [
  'kahba', '9ahba', 'qahba', 'gahba',
  '3atay', 'atay', '3tay',
  'zamel', 'zamelh', 'zml',
  'kelb', 'kalb', 'klb',
  'hmar', '7mar',
  'ahbal', 'a7bal', '2hbal',
  'bhim', 'bhiim', 'b7im',
  'hayawan', '7ayawan', 'haywan',
];

// Emojis toxiques (a combiner avec du texte)
const TOXIC_EMOJIS: string[] = ['🤬', '🤮', '💩', '🐷', '🐕', '🖕', '💀'];

// ============================================
// PATTERNS DE DETECTION
// ============================================

// Patterns pour detecter les numeros de telephone
const PHONE_PATTERNS: RegExp[] = [
  /0[567]\d{8}/g,
  /\+212\s?[567]\d{8}/g,
  /00212\s?[567]\d{8}/g,
  /0[567][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/g,
  /0[567][\s*#._\-x]+\d{1,2}[\s*#._\-x]+\d{1,2}[\s*#._\-x]+\d{1,2}[\s*#._\-x]+\d{1,2}/gi,
  /zero\s*[567]|zéro\s*[567]|sfr\s*[567]/gi,
  /\+?\d{10,14}/g,
  /\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/g,
];

// Patterns pour detecter les coordonnees de contact
const CONTACT_PATTERNS: RegExp[] = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/gi,
  /wa\.me\/\d+/gi,
  /whatsapp/gi,
  /what\s*s?\s*app/gi,
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
  /\b(wa|tg|snap|insta|fb)\s*:/gi,
  /\bmon\s+(snap|insta|fb|whatsapp|numero)\b/gi,
  /\b(ajoute|ajt|add)\s*(moi)?\s*(sur|on)?\s*(snap|insta|fb|whatsapp)\b/gi,
];

// Patterns pour noms de fichiers suspects
const SUSPICIOUS_FILENAME_PATTERNS: RegExp[] = [
  /nude/i, /naked/i, /porn/i, /xxx/i, /sex/i, /adult/i, /nsfw/i,
  /explicit/i, /onlyfans/i, /leak/i, /intime/i, /privé/i, /prive/i,
  /déshabill/i, /deshabill/i, /bite/i, /chatte/i, /nichon/i,
  /sein/i, /compromett/i, /chantage/i, /revenge/i,
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
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase();

  // Supprimer les accents
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Decoder le leet speak et caracteres speciaux
  const leetMap: Record<string, string> = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b',
    '@': 'a', '$': 's', '!': 'i', '*': '', '#': '', '_': '', '.': '',
  };

  for (const [leet, letter] of Object.entries(leetMap)) {
    normalized = normalized.split(leet).join(letter);
  }

  // Reduire les repetitions (coooon -> con)
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');

  // Supprimer les espaces entre lettres isolees (f d p -> fdp)
  normalized = normalized.replace(/\b([a-z])\s+(?=[a-z]\b)/gi, '$1');

  // Supprimer les espaces multiples
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Verifie les patterns regex
 */
function matchesPatterns(text: string, patterns: RegExp[]): boolean {
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Verifie si le texte contient des mots de la liste
 */
function containsWords(text: string, words: string[]): { found: boolean; matches: string[] } {
  const normalized = normalizeText(text);
  const matches: string[] = [];

  for (const word of words) {
    const wordNormalized = normalizeText(word);
    // Chercher le mot comme partie du texte (pas seulement mot entier)
    if (normalized.includes(wordNormalized)) {
      matches.push(word);
    }
    // Aussi chercher avec bordures de mots pour les mots courts
    if (wordNormalized.length >= 3) {
      const regex = new RegExp(`\\b${wordNormalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
      if (regex.test(normalized)) {
        if (!matches.includes(word)) matches.push(word);
      }
    }
  }

  return { found: matches.length > 0, matches };
}

/**
 * Verifie si le texte contient des insultes (toutes langues)
 */
function containsInsults(text: string): { found: boolean; matches: string[] } {
  const allMatches: string[] = [];

  // Combiner toutes les listes d'insultes
  const allInsults = [
    ...FRENCH_DIRECT_INSULTS,
    ...ENGLISH_DIRECT_INSULTS,
    ...ENGLISH_HATE_SPEECH,
    ...ENGLISH_TOXIC_EXPRESSIONS,
    ...ARABIC_CLASSIC_INSULTS,
    ...ARABIC_FAMILY_ATTACKS,
    ...DARIJA_ANIMAL_INSULTS,
    ...DARIJA_VULGAR,
    ...DARIJA_FAMILY_ATTACKS,
    ...ARABIC_DARIJA_ROOTS,
  ];

  const wordCheck = containsWords(text, allInsults);
  if (wordCheck.found) {
    allMatches.push(...wordCheck.matches);
  }

  // Verifier les patterns d'attaques verbales
  const allPatterns = [
    ...FRENCH_VERBAL_ATTACK_PATTERNS,
    ...DARIJA_PERSONAL_ATTACK_PATTERNS,
  ];

  if (matchesPatterns(text, allPatterns)) {
    allMatches.push('[pattern detected]');
  }

  // Verifier l'arabe original (caracteres arabes)
  const arabicInsults = [
    ...ARABIC_CLASSIC_INSULTS.filter(i => /[\u0600-\u06FF]/.test(i)),
    ...ARABIC_FAMILY_ATTACKS.filter(i => /[\u0600-\u06FF]/.test(i)),
  ];
  for (const insult of arabicInsults) {
    if (text.includes(insult)) {
      if (!allMatches.includes(insult)) allMatches.push(insult);
    }
  }

  // Verifier emojis toxiques combines avec du texte
  const hasText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim().length > 0;
  if (hasText) {
    for (const emoji of TOXIC_EMOJIS) {
      if (text.includes(emoji)) {
        allMatches.push(emoji);
      }
    }
  }

  return { found: allMatches.length > 0, matches: [...new Set(allMatches)] };
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

  // 3. Verifier les insultes (FR, EN, AR, Darija)
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
