// Spécialités des prestataires basées sur les services GlamGo
// ⚠️ SYNCHRONISÉ avec la base de données - 28 services / 16 spécialités

export const PROVIDER_SPECIALTIES = {
  // ==================== BEAUTÉ (5 spécialités) ====================
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
  epilation_femme: {
    value: 'epilation_femme',
    label: 'Épilation Femme',
    labelAr: 'إزالة الشعر للنساء',
    icon: '✨',
    category: 'beaute'
  },
  epilation_homme: {
    value: 'epilation_homme',
    label: 'Épilation Homme',
    labelAr: 'إزالة الشعر للرجال',
    icon: '✨',
    category: 'beaute'
  },

  // ==================== MAISON (4 spécialités) ====================
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
  chef_domicile: {
    value: 'chef_domicile',
    label: 'Chef à Domicile',
    labelAr: 'طباخ منزلي',
    icon: '👨‍🍳',
    category: 'maison'
  },

  // ==================== VOITURE (1 spécialité) ====================
  nettoyage_auto: {
    value: 'nettoyage_auto',
    label: 'Nettoyage Auto',
    labelAr: 'غسيل سيارات',
    icon: '🚗',
    category: 'voiture'
  },

  // ==================== ANIMAUX (1 spécialité) ====================
  garde_animaux: {
    value: 'garde_animaux',
    label: 'Garde Animaux',
    labelAr: 'رعاية حيوانات',
    icon: '🐕',
    category: 'animaux'
  },

  // ==================== BIEN-ÊTRE (5 spécialités) ====================
  massage: {
    value: 'massage',
    label: 'Massage',
    labelAr: 'تدليك',
    icon: '💆',
    category: 'bien-etre'
  },
  hammam_soins: {
    value: 'hammam_soins',
    label: 'Hammam & Soins',
    labelAr: 'حمام وعناية',
    icon: '🛁',
    category: 'bien-etre'
  },
  yoga: {
    value: 'yoga',
    label: 'Yoga',
    labelAr: 'يوغا',
    icon: '🧘',
    category: 'bien-etre'
  },
  coach_sportif: {
    value: 'coach_sportif',
    label: 'Coach Sportif',
    labelAr: 'مدرب رياضي',
    icon: '🏋️',
    category: 'bien-etre'
  },
  danse: {
    value: 'danse',
    label: 'Danse',
    labelAr: 'رقص',
    icon: '💃',
    category: 'bien-etre'
  }
};

// Liste ordonnée des spécialités pour l'affichage
export const SPECIALTY_LIST = Object.values(PROVIDER_SPECIALTIES);

// Spécialités groupées par catégorie
export const SPECIALTIES_BY_CATEGORY = {
  beaute: SPECIALTY_LIST.filter(s => s.category === 'beaute'),
  maison: SPECIALTY_LIST.filter(s => s.category === 'maison'),
  voiture: SPECIALTY_LIST.filter(s => s.category === 'voiture'),
  animaux: SPECIALTY_LIST.filter(s => s.category === 'animaux'),
  'bien-etre': SPECIALTY_LIST.filter(s => s.category === 'bien-etre')
};

// Labels de catégories (Français)
export const CATEGORY_LABELS = {
  beaute: 'Beauté',
  maison: 'Maison',
  voiture: 'Voiture',
  animaux: 'Animaux',
  'bien-etre': 'Bien-être'
};

// Labels de catégories (Arabe)
export const CATEGORY_LABELS_AR = {
  beaute: 'الجمال',
  maison: 'المنزل',
  voiture: 'السيارة',
  animaux: 'الحيوانات',
  'bien-etre': 'الرفاهية'
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
  maison: 'categories.home',
  voiture: 'categories.car',
  animaux: 'categories.pets',
  'bien-etre': 'categories.wellness'
};

// Spécialités nécessitant un diplôme/certificat
export const SPECIALTIES_REQUIRING_DIPLOMA = [
  'coiffure_homme',
  'coiffure_femme',
  'barbier',
  'massage',
  'hammam_soins',
  'yoga',
  'coach_sportif',
  'danse'
];

// Fonction pour obtenir une spécialité par sa valeur
export const getSpecialtyByValue = (value) => {
  return PROVIDER_SPECIALTIES[value] || null;
};

// Fonction pour vérifier si une spécialité nécessite un diplôme
export const requiresDiploma = (value) => {
  return SPECIALTIES_REQUIRING_DIPLOMA.includes(value);
};

// Mapping spécialité -> services correspondants (28 services)
// ⚠️ SYNCHRONISÉ avec la base de données
export const SPECIALTY_TO_SERVICES = {
  // Beauté (7 services)
  coiffure_homme: ['Coiffure Homme Simple', 'Coiffure Homme Premium'],
  coiffure_femme: ['Coiffure Express', 'Coiffure Classique', 'Coiffure Mariage & Événement'],
  barbier: ['Taille de Barbe', 'Pack Coiffure + Barbe'],
  epilation_femme: ['Smooth Femme', 'Full Smooth Femme'],
  epilation_homme: ['Smooth Homme', 'Full Smooth Homme'],

  // Maison (6 services)
  menage: ['Ménage'],
  bricolage: ['Petits Bricolages'],
  jardinage: ['Jardinage'],
  chef_domicile: ['Chef à Domicile - 2 Personnes', 'Chef à Domicile - 4 Personnes', 'Chef à Domicile - 8 Personnes'],

  // Voiture (3 services)
  nettoyage_auto: ['Nettoyage Auto Interne', 'Nettoyage Auto Externe', 'Nettoyage Auto Complet'],

  // Animaux (2 services)
  garde_animaux: ['Promenade d\'Animaux', 'Gardiennage d\'Animaux'],

  // Bien-être (6 services)
  massage: ['Massage Relaxant'],
  hammam_soins: ['Hammam & Gommage', 'Soin Premium Argan'],
  yoga: ['Yoga'],
  coach_sportif: ['Coach Sportif'],
  danse: ['Danse Orientale']
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
