/**
 * Services nécessitant un diplôme - GlamGo Mobile
 * Synchronisé avec la web app - Gestion par catégorie
 */

// Catégories nécessitant un diplôme avec leurs labels (fr et ar)
export const DIPLOMA_CATEGORIES: Record<string, {
  label: { fr: string; ar: string };
  description: { fr: string; ar: string };
  icon: string
}> = {
  beaute: {
    label: { fr: 'Diplôme Coiffure/Beauté', ar: 'شهادة تصفيف الشعر/التجميل' },
    description: { fr: 'Certificat de coiffure ou esthétique', ar: 'شهادة تصفيف الشعر او التجميل' },
    icon: '💇',
  },
  'bien-etre': {
    label: { fr: 'Diplôme Bien-être', ar: 'شهادة الرفاهية' },
    description: { fr: 'Certificat massage, yoga ou coaching', ar: 'شهادة التدليك، اليوغا او التدريب' },
    icon: '💆',
  },
  maison: {
    label: { fr: 'Diplôme Cuisine', ar: 'شهادة الطبخ' },
    description: { fr: 'Certificat de cuisine ou restauration', ar: 'شهادة الطبخ او المطاعم' },
    icon: '👨‍🍳',
  },
};

// Mapping service -> catégorie de diplôme requise
const SERVICE_TO_DIPLOMA_CATEGORY: Record<string, string> = {
  // Beauté - coiffure
  'coiffure homme simple': 'beaute',
  'coiffure homme premium': 'beaute',
  'coiffure express': 'beaute',
  'coiffure classique': 'beaute',
  'coiffure mariage': 'beaute',
  'coiffure mariage & événement': 'beaute',
  'taille de barbe': 'beaute',
  'pack coiffure + barbe': 'beaute',

  // Bien-être
  'massage relaxant': 'bien-etre',
  'hammam & gommage': 'bien-etre',
  'soin premium argan': 'bien-etre',
  'yoga': 'bien-etre',
  'coach sportif': 'bien-etre',
  'danse orientale': 'bien-etre',

  // Maison - chef
  'chef à domicile - 2 personnes': 'maison',
  'chef à domicile - 4 personnes': 'maison',
  'chef à domicile - 8 personnes': 'maison',
};

// Mots-clés pour matcher les services par catégorie
const DIPLOMA_KEYWORDS: Record<string, string[]> = {
  beaute: ['coiffure', 'barbe', 'coiffeur'],
  'bien-etre': ['massage', 'hammam', 'gommage', 'argan', 'yoga', 'coach', 'danse'],
  maison: ['chef'],
};

/**
 * Obtient la catégorie de diplôme requise pour un service
 * @param serviceName - Le nom du service
 * @returns Le slug de la catégorie ou null si pas de diplôme requis
 */
export const getDiplomaCategory = (serviceName: string): string | null => {
  if (!serviceName) return null;

  const normalizedName = serviceName.toLowerCase().trim();

  // Vérifier correspondance exacte
  if (SERVICE_TO_DIPLOMA_CATEGORY[normalizedName]) {
    return SERVICE_TO_DIPLOMA_CATEGORY[normalizedName];
  }

  // Vérifier par mots-clés
  for (const [category, keywords] of Object.entries(DIPLOMA_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedName.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
};

/**
 * Vérifie si un service nécessite un diplôme
 * @param serviceName - Le nom du service
 * @returns true si un diplôme est requis
 */
export const serviceRequiresDiploma = (serviceName: string): boolean => {
  return getDiplomaCategory(serviceName) !== null;
};

/**
 * Obtient les catégories de diplômes requises pour une liste de services
 * @param serviceNames - Liste des noms de services
 * @returns Set des catégories de diplômes requises
 */
export const getRequiredDiplomaCategories = (serviceNames: string[]): Set<string> => {
  const categories = new Set<string>();

  for (const name of serviceNames) {
    const category = getDiplomaCategory(name);
    if (category) {
      categories.add(category);
    }
  }

  return categories;
};

/**
 * Vérifie si au moins un des services sélectionnés nécessite un diplôme
 * @param serviceNames - Liste des noms de services
 * @returns true si au moins un service nécessite un diplôme
 */
export const anyServiceRequiresDiploma = (serviceNames: string[]): boolean => {
  return serviceNames.some(name => serviceRequiresDiploma(name));
};

/**
 * Obtient les infos d'une catégorie de diplôme
 */
export const getDiplomaCategoryInfo = (categorySlug: string) => {
  return DIPLOMA_CATEGORIES[categorySlug] || null;
};
