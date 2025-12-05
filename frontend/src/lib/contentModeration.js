/**
 * Systeme de moderation de contenu pour le chat
 * Detecte et bloque les messages injurieux, racistes, menacants
 */

// Mots interdits en francais (insults, racisme, menaces)
const FORBIDDEN_WORDS_FR = [
  // Insultes generales
  'connard', 'connasse', 'con', 'conne', 'salaud', 'salope', 'pute', 'putain',
  'merde', 'enculé', 'enculer', 'nique', 'niquer', 'ntm', 'niquetamere',
  'fdp', 'fils de pute', 'pd', 'pédé', 'pédale', 'tapette', 'tarlouze',
  'batard', 'bâtard', 'abruti', 'débile', 'crétin', 'idiot', 'imbécile',
  'ordure', 'pourriture', 'déchet', 'clochard', 'bouffon', 'tocard',
  'branleur', 'branlé', 'couille', 'couilles', 'bite', 'queue', 'chatte',
  'trouduc', 'trou du cul', 'encule', 'enculée', 'baiser', 'foutre',
  'gueule', 'ta gueule', 'ferme ta gueule', 'ftg',

  // Abreviations et variantes SMS/Internet
  'tg', 'stfu', 'gtfo', 'wtf', 'ntr', 'nkl', 'ntm ', 'nktm', 'nmtpm',
  'bdp', 'bdk', 'ptdr fdp', 'slt fdp', 'wsh fdp', 'hey fdp',
  'vtf', 'vtff', 'vte', 'vtnc', 'tmm', 'tmtc pd', 'jsp pd',
  'ptain', 'ptn', 'mrd', 'ctb', 'tgueule', 'tagueule', 'frmtg',
  'enc', 'encl', 'nkta', 'nik', 'nikta', 'niksa', 'nikmok',
  'suce', 'sucemoi', 'smd', 'sucezmoi', 'lms', 'lmdc',
  'casse toi', 'dgage', 'degage', 'barre toi', 'fous le camp',
  'jtm pd', 'jte nique', 'jtnique', 'jtenique', 'jtnik',
  'wllh ntm', 'wlh ntm', 'wallah ntm', 'sah ntm',
  'zebi', 'zbi', 'zeb', 'zebbi', 'zbii',

  // Racisme et xenophobie
  'negre', 'nègre', 'negro', 'nigga', 'nig', 'noir de merde', 'sale noir',
  'bougnoule', 'bougnoul', 'arabe de merde', 'sale arabe', 'bicot', 'raton',
  'melon', 'feuj', 'youpin', 'youtre', 'sale juif', 'juif de merde',
  'chinetoque', 'bridé', 'sale chinois', 'ching chong', 'chintok',
  'gwer', 'gaouri', 'roumi', 'sale blanc', 'sale francais',
  'bamboula', 'macaque', 'singe', 'gorille',

  // Menaces
  'je vais te tuer', 'je te tue', 'je vais te buter', 'je te bute',
  'je vais te frapper', 'je te frappe', 'je vais te casser', 'tu vas mourir',
  'tu es mort', 't\'es mort', 'mort', 'crever', 'creve', 'suicide',
  'je sais ou tu habites', 'je connais ton adresse', 'attention a toi',
  'tu vas voir', 'tu vas payer', 'je vais te retrouver', 'vengeance',
  'agression', 'violence', 'viol', 'violer',

  // Harcelement
  'harceler', 'harcelement', 'stalker', 'je te suis'
];

// Mots interdits en arabe (darija marocain + arabe standard)
const FORBIDDEN_WORDS_AR = [
  // Insultes darija
  'زمل', 'زامل', 'قحبة', 'قحب', 'كلب', 'حمار', 'بغل',
  'تبون', 'تبونك', 'نيك', 'نيكني', 'زب', 'زبي',
  'حشيش', 'كحل', 'ماك', 'مقود', 'معيور', 'معيورة',
  'لحوى', 'سربي', 'سرباي', 'خنزير', 'وجه الخنزير',
  'زعطوط', 'بهيم', 'حيوان', 'بوزبال',
  // Abreviations darija en lettres latines
  'zml', 'zaml', 'zamil', 'zeml', 'zmla', 'zamlat',
  'qhba', 'qahba', 'kahba', '9ahba', '9hba', 'khba',
  'tboun', 'tbon', 'tbonk', 'tbounk', 'tbnek',
  'nik', 'nік', 'n9', 'neek', 'nyk', 'nikni', 'nikmok', 'nikbok',
  'zb', 'zbi', 'zebi', 'zebb', 'zob', 'zobi',
  'm9wd', 'me9wed', 'mekwed', 'm9wed',
  '3yoor', '3ayor', 'ma3yoor', 'ma3yora',
  'kelb', 'klb', '7mar', 'hmar', 'bghl', 'bral',
  'khanzir', '5nzir', 'knzir',
  'bhim', 'bhima', 'byhem', 'behim',
  'lhwa', 'l7wa', 'lahwa', 'serbi', 'srbay', 'serbay',

  // Insultes arabes standard
  'كس', 'كسك', 'طيز', 'خرا', 'عاهرة', 'شرموط', 'شرموطة',
  'منيك', 'ابن الشرموطة', 'ابن القحبة', 'ولد الزنا',
  'ملعون', 'ابن الحرام', 'كافر', 'مرتد',

  // Racisme
  'عزي', 'حرطاني', 'عبد', 'وصيف', 'كحلوش',

  // Menaces
  'غادي نقتلك', 'انقتلك', 'غادي نضربك', 'نضربك',
  'غادي تموت', 'موت', 'تقتل', 'قتل', 'اغتصاب'
];

// Patterns pour detecter les numeros de telephone et contacts
const CONTACT_PATTERNS = [
  /\+?\d{10,}/g,                        // Numeros de telephone
  /\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/g, // Format FR
  /0[567]\d{8}/g,                       // Mobile marocain
  /[\w.+-]+@[\w-]+\.[\w.-]+/gi,         // Emails
  /(?:facebook|instagram|whatsapp|telegram|snapchat|tiktok|twitter|linkedin)[\s:@]?\s*[\w.]+/gi,
  /(?:fb|insta|snap|tg|wa)[\s:@]?\s*[\w.]+/gi,
  /wa\.me\/\d+/gi,                      // Liens WhatsApp
  /@[\w]+/g                              // Handles sociaux
];

/**
 * Normalise le texte pour la detection (supprime accents, casse, espaces multiples)
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[0-9]/g, match => {
      // Leet speak: remplace les chiffres par lettres equivalentes
      const leetMap = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b' };
      return leetMap[match] || match;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detecte les mots interdits dans le texte
 */
function detectForbiddenWords(text) {
  const normalizedText = normalizeText(text);
  const foundWords = [];

  // Verification mots francais
  for (const word of FORBIDDEN_WORDS_FR) {
    const normalizedWord = normalizeText(word);
    // Cherche le mot complet ou comme partie d'un mot
    const regex = new RegExp(`\\b${normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    if (regex.test(normalizedText) || normalizedText.includes(normalizedWord)) {
      foundWords.push({ word, language: 'fr' });
    }
  }

  // Verification mots arabes
  for (const word of FORBIDDEN_WORDS_AR) {
    if (text.includes(word)) {
      foundWords.push({ word, language: 'ar' });
    }
  }

  return foundWords;
}

/**
 * Detecte les tentatives de partage de contact
 */
function detectContactSharing(text) {
  const contacts = [];

  for (const pattern of CONTACT_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      contacts.push(...matches);
    }
  }

  return contacts;
}

/**
 * Resultat de la moderation
 * @typedef {Object} ModerationResult
 * @property {boolean} isAllowed - Si le message est autorise
 * @property {string} reason - Raison du blocage si bloque
 * @property {string} category - Categorie de violation (insult, racism, threat, contact)
 * @property {string[]} flaggedContent - Contenu signale
 */

/**
 * Modere un message et retourne le resultat
 * @param {string} message - Le message a moderer
 * @returns {ModerationResult}
 */
export function moderateMessage(message) {
  if (!message || typeof message !== 'string') {
    return { isAllowed: true };
  }

  const text = message.trim();

  if (text.length === 0) {
    return { isAllowed: true };
  }

  // 1. Detecter les mots interdits
  const forbiddenWords = detectForbiddenWords(text);

  if (forbiddenWords.length > 0) {
    // Categoriser le type de violation
    const word = forbiddenWords[0].word.toLowerCase();
    let category = 'insult';
    let reason = 'Ce message contient un langage inapproprie.';

    // Verifier si c'est du racisme
    const racistWords = ['negre', 'nègre', 'negro', 'bougnoule', 'bicot', 'youpin', 'chinetoque',
      'bridé', 'bamboula', 'macaque', 'عزي', 'حرطاني', 'عبد', 'كحلوش'];
    if (racistWords.some(w => normalizeText(word).includes(normalizeText(w)) || word.includes(w))) {
      category = 'racism';
      reason = 'Les propos racistes ou discriminatoires sont strictement interdits.';
    }

    // Verifier si c'est une menace
    const threatWords = ['tuer', 'buter', 'frapper', 'mourir', 'mort', 'crever', 'violence', 'viol',
      'نقتلك', 'نضربك', 'تموت', 'قتل', 'اغتصاب'];
    if (threatWords.some(w => normalizeText(word).includes(normalizeText(w)) || word.includes(w))) {
      category = 'threat';
      reason = 'Les menaces sont strictement interdites et peuvent etre signalees aux autorites.';
    }

    return {
      isAllowed: false,
      reason,
      category,
      flaggedContent: forbiddenWords.map(w => w.word)
    };
  }

  // 2. Detecter les partages de contact
  const contacts = detectContactSharing(text);

  if (contacts.length > 0) {
    return {
      isAllowed: false,
      reason: 'Le partage de coordonnees personnelles (telephone, email, reseaux sociaux) est interdit pour votre securite.',
      category: 'contact',
      flaggedContent: contacts
    };
  }

  return { isAllowed: true };
}

/**
 * Censure les mots interdits dans un message (remplace par ***)
 * @param {string} message - Le message a censurer
 * @returns {string} Message censure
 */
export function censorMessage(message) {
  if (!message) return message;

  let censored = message;

  // Censurer mots francais
  for (const word of FORBIDDEN_WORDS_FR) {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    censored = censored.replace(regex, '*'.repeat(word.length));
  }

  // Censurer mots arabes
  for (const word of FORBIDDEN_WORDS_AR) {
    censored = censored.split(word).join('*'.repeat(word.length));
  }

  return censored;
}

/**
 * Moderation des images - Detection de contenu inapproprie
 * Utilise l'analyse du nom de fichier et demande confirmation pour les images
 */

// Patterns de noms de fichiers suspects
const SUSPICIOUS_FILENAME_PATTERNS = [
  /nude/i, /naked/i, /porn/i, /xxx/i, /sex/i, /adult/i,
  /nsfw/i, /explicit/i, /onlyfans/i, /leak/i, /intime/i,
  /privé/i, /prive/i, /nue?s?$/i, /hot/i, /sexy/i,
  /dick/i, /cock/i, /pussy/i, /ass/i, /boob/i, /tit/i,
  /bite/i, /chatte/i, /cul/i, /sein/i, /nichon/i,
  /fesse/i, /nu$/i, /déshabill/i, /deshabill/i,
  /compromett/i, /compromis/i, /chantage/i, /blackmail/i,
  /revenge/i, /leaked/i, /stolen/i, /volé/i, /vole/i
];

// Extensions de fichiers autorisees
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/**
 * Modere une image avant upload
 * @param {File} file - Le fichier image a moderer
 * @returns {Promise<ModerationResult>}
 */
export async function moderateImage(file) {
  if (!file) {
    return { isAllowed: false, reason: 'Aucun fichier fourni.' };
  }

  const fileName = file.name.toLowerCase();
  const fileExtension = '.' + fileName.split('.').pop();

  // Verifier l'extension
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(fileExtension)) {
    return {
      isAllowed: false,
      reason: 'Format de fichier non autorise. Utilisez JPG, PNG, WEBP ou GIF.',
      category: 'format'
    };
  }

  // Verifier la taille (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return {
      isAllowed: false,
      reason: 'Image trop volumineuse (maximum 5 MB).',
      category: 'size'
    };
  }

  // Verifier le nom de fichier pour patterns suspects
  for (const pattern of SUSPICIOUS_FILENAME_PATTERNS) {
    if (pattern.test(fileName)) {
      return {
        isAllowed: false,
        reason: 'Le nom de ce fichier suggere un contenu inapproprie. Le partage de photos compromettantes ou a caractere intime est strictement interdit.',
        category: 'inappropriate',
        flaggedContent: [fileName]
      };
    }
  }

  // Verifier que le type MIME correspond a une image
  if (!file.type.startsWith('image/')) {
    return {
      isAllowed: false,
      reason: 'Le fichier n\'est pas une image valide.',
      category: 'format'
    };
  }

  // Verification supplementaire via analyse basique de l'image
  try {
    const imageCheckResult = await analyzeImageContent(file);
    if (!imageCheckResult.isAllowed) {
      return imageCheckResult;
    }
  } catch (err) {
    console.error('Erreur analyse image:', err);
    // En cas d'erreur d'analyse, on laisse passer mais avec avertissement cote serveur
  }

  return { isAllowed: true };
}

/**
 * Analyse basique du contenu de l'image
 * Verifie les metadonnees et caracteristiques suspectes
 */
async function analyzeImageContent(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Verifier si l'image a des dimensions suspectes (tres petite = possible image encodee)
        if (img.width < 10 || img.height < 10) {
          resolve({
            isAllowed: false,
            reason: 'Image invalide ou corrompue.',
            category: 'invalid'
          });
          return;
        }

        // Verifier ratio extreme (pourrait etre une image cachee)
        const ratio = img.width / img.height;
        if (ratio > 20 || ratio < 0.05) {
          resolve({
            isAllowed: false,
            reason: 'Format d\'image non standard.',
            category: 'format'
          });
          return;
        }

        resolve({ isAllowed: true });
      };

      img.onerror = () => {
        resolve({
          isAllowed: false,
          reason: 'Impossible de charger l\'image. Fichier peut-etre corrompu.',
          category: 'invalid'
        });
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      resolve({
        isAllowed: false,
        reason: 'Erreur lors de la lecture du fichier.',
        category: 'error'
      });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Message d'avertissement a afficher avant l'upload d'image
 */
export const IMAGE_UPLOAD_WARNING = `⚠️ Avertissement Important

Le partage d'images est soumis aux regles suivantes:
• Photos de travail uniquement (coiffure, maquillage, ongles, etc.)
• INTERDIT: Photos personnelles, intimes ou compromettantes
• INTERDIT: Photos contenant des informations de contact
• INTERDIT: Photos de documents d'identite

Toute violation entrainera la suspension immediate du compte.`;

/**
 * Verifie si une image semble etre une photo professionnelle/de service
 * (heuristique basique)
 */
export function getImageUploadGuidelines() {
  return {
    allowed: [
      'Photos du travail effectue (avant/apres)',
      'Photos de materiel professionnel',
      'Photos liees au service en cours'
    ],
    forbidden: [
      'Photos personnelles ou intimes',
      'Photos compromettantes',
      'Photos d\'identite ou documents',
      'Screenshots de conversations',
      'Photos contenant numeros de telephone'
    ]
  };
}

export default moderateMessage;
