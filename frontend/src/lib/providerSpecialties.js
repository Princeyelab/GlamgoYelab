// Spécialités des prestataires basées sur les services GlamGo
// ⚠️ SYNCHRONISÉ avec categoryServices.js et la base de données

export const PROVIDER_SPECIALTIES = {
  // ==================== BEAUTÉ ====================
  coiffure_homme: {
    value: 'coiffure_homme',
    label: 'Coiffure Homme',
    labelAr: 'حلاقة رجال',
    icon: '💇‍♂️',
    category: 'beaute'
  },
  coiffure_femme: {
    value: 'coiffure_femme',
    label: 'Coiffure Femme',
    labelAr: 'تصفيف شعر نساء',
    icon: '💇‍♀️',
    category: 'beaute'
  },
  barbier: {
    value: 'barbier',
    label: 'Barbier',
    labelAr: 'حلاق',
    icon: '🧔',
    category: 'beaute'
  },
  maquillage: {
    value: 'maquillage',
    label: 'Maquillage',
    labelAr: 'مكياج',
    icon: '💄',
    category: 'beaute'
  },
  manucure_pedicure: {
    value: 'manucure_pedicure',
    label: 'Manucure & Pédicure',
    labelAr: 'مانيكير وباديكير',
    icon: '💅',
    category: 'beaute'
  },
  epilation: {
    value: 'epilation',
    label: 'Épilation',
    labelAr: 'إزالة الشعر',
    icon: '✨',
    category: 'beaute'
  },

  // ==================== BIEN-ÊTRE ====================
  massage: {
    value: 'massage',
    label: 'Massage',
    labelAr: 'تدليك',
    icon: '💆',
    category: 'bien-etre'
  },
  coaching_sport: {
    value: 'coaching_sport',
    label: 'Coaching Sportif',
    labelAr: 'تدريب رياضي',
    icon: '🏋️',
    category: 'bien-etre'
  },
  coaching_nutrition: {
    value: 'coaching_nutrition',
    label: 'Coaching Nutrition',
    labelAr: 'تدريب تغذية',
    icon: '🥗',
    category: 'bien-etre'
  },

  // ==================== MAISON ====================
  menage: {
    value: 'menage',
    label: 'Ménage',
    labelAr: 'تنظيف منزلي',
    icon: '🧹',
    category: 'maison'
  },
  bricolage: {
    value: 'bricolage',
    label: 'Bricolage',
    labelAr: 'أعمال يدوية',
    icon: '🔧',
    category: 'maison'
  },
  jardinage: {
    value: 'jardinage',
    label: 'Jardinage',
    labelAr: 'بستنة',
    icon: '🌱',
    category: 'maison'
  },
  cuisine: {
    value: 'cuisine',
    label: 'Cuisine',
    labelAr: 'طبخ',
    icon: '👨‍🍳',
    category: 'maison'
  },

  // ==================== VOITURE ====================
  mecanique_auto: {
    value: 'mecanique_auto',
    label: 'Mécanique Auto',
    labelAr: 'ميكانيك سيارات',
    icon: '🔩',
    category: 'voiture'
  },
  nettoyage_auto: {
    value: 'nettoyage_auto',
    label: 'Nettoyage Auto',
    labelAr: 'غسيل سيارات',
    icon: '🚗',
    category: 'voiture'
  },

  // ==================== ANIMAUX ====================
  toilettage_animaux: {
    value: 'toilettage_animaux',
    label: 'Toilettage',
    labelAr: 'تجميل حيوانات',
    icon: '🐕',
    category: 'animaux'
  },
  garde_animaux: {
    value: 'garde_animaux',
    label: 'Garde Animaux',
    labelAr: 'رعاية حيوانات',
    icon: '🏠',
    category: 'animaux'
  },
  transport_animaux: {
    value: 'transport_animaux',
    label: 'Transport Animaux',
    labelAr: 'نقل حيوانات',
    icon: '🚐',
    category: 'animaux'
  },
  nettoyage_animaux: {
    value: 'nettoyage_animaux',
    label: 'Nettoyage Espace',
    labelAr: 'تنظيف مساحة',
    icon: '🧼',
    category: 'animaux'
  }
};

// Liste ordonnée des spécialités pour l'affichage
export const SPECIALTY_LIST = Object.values(PROVIDER_SPECIALTIES);

// Spécialités groupées par catégorie
export const SPECIALTIES_BY_CATEGORY = {
  beaute: SPECIALTY_LIST.filter(s => s.category === 'beaute'),
  'bien-etre': SPECIALTY_LIST.filter(s => s.category === 'bien-etre'),
  maison: SPECIALTY_LIST.filter(s => s.category === 'maison'),
  voiture: SPECIALTY_LIST.filter(s => s.category === 'voiture'),
  animaux: SPECIALTY_LIST.filter(s => s.category === 'animaux')
};

// Labels de catégories (Français)
export const CATEGORY_LABELS = {
  beaute: 'Beauté',
  'bien-etre': 'Bien-être',
  maison: 'Maison',
  voiture: 'Voiture',
  animaux: 'Animaux'
};

// Labels de catégories (Arabe)
export const CATEGORY_LABELS_AR = {
  beaute: 'الجمال',
  'bien-etre': 'الرفاهية',
  maison: 'المنزل',
  voiture: 'السيارة',
  animaux: 'الحيوانات'
};

// Fonction pour obtenir le label de catégorie traduit
export const getCategoryLabel = (categorySlug, language = 'fr') => {
  if (language === 'ar') {
    return CATEGORY_LABELS_AR[categorySlug] || CATEGORY_LABELS[categorySlug] || categorySlug;
  }
  return CATEGORY_LABELS[categorySlug] || categorySlug;
};

// Fonction pour obtenir le label de spécialité traduit
export const getSpecialtyLabel = (specialty, language = 'fr') => {
  if (language === 'ar' && specialty.labelAr) {
    return specialty.labelAr;
  }
  return specialty.label;
};

// Clés de traduction pour les catégories
export const CATEGORY_LABEL_KEYS = {
  beaute: 'categories.beauty',
  'bien-etre': 'categories.wellness',
  maison: 'categories.home',
  voiture: 'categories.car',
  animaux: 'categories.pets'
};

// Spécialités nécessitant un diplôme/certificat
export const SPECIALTIES_REQUIRING_DIPLOMA = [
  'coiffure_homme',
  'coiffure_femme',
  'barbier',
  'maquillage',
  'massage',
  'coaching_sport',
  'coaching_nutrition',
  'mecanique_auto'
];

// Fonction pour obtenir une spécialité par sa valeur
export const getSpecialtyByValue = (value) => {
  return PROVIDER_SPECIALTIES[value] || null;
};

// Fonction pour vérifier si une spécialité nécessite un diplôme
export const requiresDiploma = (value) => {
  return SPECIALTIES_REQUIRING_DIPLOMA.includes(value);
};

// Mapping spécialité -> services correspondants
// ⚠️ SYNCHRONISÉ avec categoryServices.js et la base de données
export const SPECIALTY_TO_SERVICES = {
  // Beauté
  coiffure_homme: ['Coiffure Homme Simple', 'Coiffure Homme Premium', 'Coupe classique homme', 'Coupe tendance homme'],
  coiffure_femme: ['Coupe cheveux courts', 'Coupe cheveux longs', 'Coloration cheveux courts', 'Coloration cheveux longs'],
  barbier: ['Taille de Barbe', 'Pack Coiffure + Barbe', 'Taille de barbe classique', 'Barbe et contours', 'Rasage à l\'ancienne', 'Soin barbe'],
  maquillage: ['Maquillage jour', 'Maquillage soirée', 'Maquillage mariage'],
  manucure_pedicure: ['Manucure femme', 'Manucure homme', 'Pédicure spa'],
  epilation: ['Jambes complètes femme', 'Sourcils et visage', 'Torse ou dos', 'Bras complets'],

  // Bien-être
  massage: ['Massage tonique', 'Massage sportif', 'Massage thaïlandais', 'Massage marocain traditionnel'],
  coaching_sport: ['Yoga', 'Pilates', 'Étirements guidés', 'Musculation personnalisée', 'Méditation et respiration'],
  coaching_nutrition: ['Coaching nutrition'],

  // Maison
  menage: ['Ménage classique', 'Ménage approfondi', 'Nettoyage après événement', 'Nettoyage de printemps', 'Nettoyage cuisine', 'Nettoyage salle de bain', 'Service repassage'],
  bricolage: ['Montage meuble', 'Changement d\'ampoule', 'Petits travaux plomberie', 'Perçage et fixation', 'Petit déménagement'],
  jardinage: ['Entretien pelouse', 'Taille haies', 'Plantation fleurs'],
  cuisine: ['Préparation repas', 'Chef événementiel', 'Coaching cuisine'],

  // Voiture
  mecanique_auto: ['Vidange huile', 'Changement ampoule voiture', 'Changement essuie-glace', 'Changement pneu'],
  nettoyage_auto: ['Nettoyage extérieur seul', 'Nettoyage intérieur seul', 'Combo intérieur + extérieur'],

  // Animaux
  toilettage_animaux: ['Toilettage chien'],
  garde_animaux: ['Promenade chien', 'Gardiennage à domicile', 'Gardiennage longue durée', 'Nourrissage animaux'],
  transport_animaux: ['Transport animaux'],
  nettoyage_animaux: ['Nettoyage espace animal']
};

// Fonction pour obtenir les services d'une spécialité
export const getServicesForSpecialty = (specialtyValue) => {
  return SPECIALTY_TO_SERVICES[specialtyValue] || [];
};

// Fonction pour obtenir la clé de traduction (retourne le label direct)
export const getSpecialtyLabelKey = (value) => {
  const specialty = getSpecialtyByValue(value);
  return specialty ? specialty.label : value;
};
