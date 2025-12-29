// Services des prestataires GlamGo
// ⚠️ SYNCHRONISÉ avec la base de données - 28 services individuels

export const PROVIDER_SERVICES = {
  // ==================== BEAUTÉ (11 services) ====================
  coiffure_homme_simple: {
    value: 'coiffure_homme_simple',
    label: 'Coiffure Homme Simple',
    labelAr: 'حلاقة رجال بسيطة',
    icon: '💇‍♂️',
    category: 'beaute',
    requiresDiploma: true
  },
  coiffure_homme_premium: {
    value: 'coiffure_homme_premium',
    label: 'Coiffure Homme Premium',
    labelAr: 'حلاقة رجال فاخرة',
    icon: '💇‍♂️',
    category: 'beaute',
    requiresDiploma: true
  },
  coiffure_express: {
    value: 'coiffure_express',
    label: 'Coiffure Express',
    labelAr: 'تصفيف سريع',
    icon: '💇‍♀️',
    category: 'beaute',
    requiresDiploma: true
  },
  coiffure_classique: {
    value: 'coiffure_classique',
    label: 'Coiffure Classique',
    labelAr: 'تصفيف كلاسيكي',
    icon: '💇‍♀️',
    category: 'beaute',
    requiresDiploma: true
  },
  coiffure_mariage: {
    value: 'coiffure_mariage',
    label: 'Coiffure Mariage & Événement',
    labelAr: 'تصفيف زفاف ومناسبات',
    icon: '👰',
    category: 'beaute',
    requiresDiploma: true
  },
  taille_barbe: {
    value: 'taille_barbe',
    label: 'Taille de Barbe',
    labelAr: 'تشذيب اللحية',
    icon: '🧔',
    category: 'beaute',
    requiresDiploma: true
  },
  pack_coiffure_barbe: {
    value: 'pack_coiffure_barbe',
    label: 'Pack Coiffure + Barbe',
    labelAr: 'باقة حلاقة + لحية',
    icon: '✂️',
    category: 'beaute',
    requiresDiploma: true
  },
  smooth_femme: {
    value: 'smooth_femme',
    label: 'Smooth Femme',
    labelAr: 'إزالة شعر نساء',
    icon: '✨',
    category: 'beaute',
    requiresDiploma: false
  },
  full_smooth_femme: {
    value: 'full_smooth_femme',
    label: 'Full Smooth Femme',
    labelAr: 'إزالة شعر كاملة نساء',
    icon: '✨',
    category: 'beaute',
    requiresDiploma: false
  },
  smooth_homme: {
    value: 'smooth_homme',
    label: 'Smooth Homme',
    labelAr: 'إزالة شعر رجال',
    icon: '✨',
    category: 'beaute',
    requiresDiploma: false
  },
  full_smooth_homme: {
    value: 'full_smooth_homme',
    label: 'Full Smooth Homme',
    labelAr: 'إزالة شعر كاملة رجال',
    icon: '✨',
    category: 'beaute',
    requiresDiploma: false
  },

  // ==================== MAISON (6 services) ====================
  menage: {
    value: 'menage',
    label: 'Ménage',
    labelAr: 'تنظيف منزلي',
    icon: '🧹',
    category: 'maison',
    requiresDiploma: false
  },
  petits_bricolages: {
    value: 'petits_bricolages',
    label: 'Petits Bricolages',
    labelAr: 'أعمال يدوية صغيرة',
    icon: '🔧',
    category: 'maison',
    requiresDiploma: false
  },
  jardinage: {
    value: 'jardinage',
    label: 'Jardinage',
    labelAr: 'بستنة',
    icon: '🌱',
    category: 'maison',
    requiresDiploma: false
  },
  chef_2_personnes: {
    value: 'chef_2_personnes',
    label: 'Chef à Domicile - 2 Personnes',
    labelAr: 'طباخ منزلي - شخصين',
    icon: '👨‍🍳',
    category: 'maison',
    requiresDiploma: true
  },
  chef_4_personnes: {
    value: 'chef_4_personnes',
    label: 'Chef à Domicile - 4 Personnes',
    labelAr: 'طباخ منزلي - 4 أشخاص',
    icon: '👨‍🍳',
    category: 'maison',
    requiresDiploma: true
  },
  chef_8_personnes: {
    value: 'chef_8_personnes',
    label: 'Chef à Domicile - 8 Personnes',
    labelAr: 'طباخ منزلي - 8 أشخاص',
    icon: '👨‍🍳',
    category: 'maison',
    requiresDiploma: true
  },

  // ==================== VOITURE (3 services) ====================
  nettoyage_auto_interne: {
    value: 'nettoyage_auto_interne',
    label: 'Nettoyage Auto Interne',
    labelAr: 'تنظيف داخلي للسيارة',
    icon: '🚗',
    category: 'voiture',
    requiresDiploma: false
  },
  nettoyage_auto_externe: {
    value: 'nettoyage_auto_externe',
    label: 'Nettoyage Auto Externe',
    labelAr: 'تنظيف خارجي للسيارة',
    icon: '🚗',
    category: 'voiture',
    requiresDiploma: false
  },
  nettoyage_auto_complet: {
    value: 'nettoyage_auto_complet',
    label: 'Nettoyage Auto Complet',
    labelAr: 'تنظيف كامل للسيارة',
    icon: '🚗',
    category: 'voiture',
    requiresDiploma: false
  },

  // ==================== ANIMAUX (2 services) ====================
  promenade_animaux: {
    value: 'promenade_animaux',
    label: "Promenade d'Animaux",
    labelAr: 'تمشية الحيوانات',
    icon: '🐕',
    category: 'animaux',
    requiresDiploma: false
  },
  gardiennage_animaux: {
    value: 'gardiennage_animaux',
    label: "Gardiennage d'Animaux",
    labelAr: 'رعاية الحيوانات',
    icon: '🏠',
    category: 'animaux',
    requiresDiploma: false
  },

  // ==================== BIEN-ÊTRE (6 services) ====================
  massage_relaxant: {
    value: 'massage_relaxant',
    label: 'Massage Relaxant',
    labelAr: 'تدليك استرخائي',
    icon: '💆',
    category: 'bien-etre',
    requiresDiploma: true
  },
  hammam_gommage: {
    value: 'hammam_gommage',
    label: 'Hammam & Gommage',
    labelAr: 'حمام وتقشير',
    icon: '🛁',
    category: 'bien-etre',
    requiresDiploma: true
  },
  soin_argan: {
    value: 'soin_argan',
    label: 'Soin Premium Argan',
    labelAr: 'عناية فاخرة بالأركان',
    icon: '🌿',
    category: 'bien-etre',
    requiresDiploma: true
  },
  yoga: {
    value: 'yoga',
    label: 'Yoga',
    labelAr: 'يوغا',
    icon: '🧘',
    category: 'bien-etre',
    requiresDiploma: true
  },
  coach_sportif: {
    value: 'coach_sportif',
    label: 'Coach Sportif',
    labelAr: 'مدرب رياضي',
    icon: '🏋️',
    category: 'bien-etre',
    requiresDiploma: true
  },
  danse_orientale: {
    value: 'danse_orientale',
    label: 'Danse Orientale',
    labelAr: 'رقص شرقي',
    icon: '💃',
    category: 'bien-etre',
    requiresDiploma: true
  }
};

// Liste ordonnée des services pour l'affichage
export const SERVICE_LIST = Object.values(PROVIDER_SERVICES);

// Services groupés par catégorie
export const SERVICES_BY_CATEGORY = {
  beaute: SERVICE_LIST.filter(s => s.category === 'beaute'),
  maison: SERVICE_LIST.filter(s => s.category === 'maison'),
  voiture: SERVICE_LIST.filter(s => s.category === 'voiture'),
  animaux: SERVICE_LIST.filter(s => s.category === 'animaux'),
  'bien-etre': SERVICE_LIST.filter(s => s.category === 'bien-etre')
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

// Fonction pour obtenir le label de service traduit
export const getServiceLabel = (service, language = 'fr') => {
  if (language === 'ar' && service.labelAr) {
    return service.labelAr;
  }
  return service.label;
};

// Fonction pour obtenir un service par sa valeur
export const getServiceByValue = (value) => {
  return PROVIDER_SERVICES[value] || null;
};

// Fonction pour vérifier si un service nécessite un diplôme
export const serviceRequiresDiploma = (value) => {
  const service = PROVIDER_SERVICES[value];
  return service ? service.requiresDiploma : false;
};

// Fonction pour vérifier si au moins un service sélectionné nécessite un diplôme
export const anyServiceRequiresDiploma = (selectedServices) => {
  return selectedServices.some(serviceValue => serviceRequiresDiploma(serviceValue));
};

// Liste des services nécessitant un diplôme (pour référence)
export const SERVICES_REQUIRING_DIPLOMA = SERVICE_LIST
  .filter(s => s.requiresDiploma)
  .map(s => s.value);

// ============================================================
// EXPORTS LEGACY (pour compatibilité avec l'ancien code)
// ============================================================
export const PROVIDER_SPECIALTIES = PROVIDER_SERVICES;
export const SPECIALTY_LIST = SERVICE_LIST;
export const SPECIALTIES_BY_CATEGORY = SERVICES_BY_CATEGORY;
export const getSpecialtyByValue = getServiceByValue;
export const getSpecialtyLabel = getServiceLabel;
export const SPECIALTIES_REQUIRING_DIPLOMA = SERVICES_REQUIRING_DIPLOMA;
export const requiresDiploma = serviceRequiresDiploma;

// Clés de traduction pour les catégories (legacy)
export const CATEGORY_LABEL_KEYS = {
  beaute: 'categories.beauty',
  maison: 'categories.home',
  voiture: 'categories.car',
  animaux: 'categories.pets',
  'bien-etre': 'categories.wellness'
};

// Fonction pour obtenir la clé de traduction d'un service (legacy)
export const getSpecialtyLabelKey = (value) => {
  const service = getServiceByValue(value);
  return service ? service.label : value;
};

// Mapping service -> nom dans la BDD (pour enregistrement)
export const SERVICE_TO_DB_NAME = {
  coiffure_homme_simple: 'Coiffure Homme Simple',
  coiffure_homme_premium: 'Coiffure Homme Premium',
  coiffure_express: 'Coiffure Express',
  coiffure_classique: 'Coiffure Classique',
  coiffure_mariage: 'Coiffure Mariage & Événement',
  taille_barbe: 'Taille de Barbe',
  pack_coiffure_barbe: 'Pack Coiffure + Barbe',
  smooth_femme: 'Smooth Femme',
  full_smooth_femme: 'Full Smooth Femme',
  smooth_homme: 'Smooth Homme',
  full_smooth_homme: 'Full Smooth Homme',
  menage: 'Ménage',
  petits_bricolages: 'Petits Bricolages',
  jardinage: 'Jardinage',
  chef_2_personnes: 'Chef à Domicile - 2 Personnes',
  chef_4_personnes: 'Chef à Domicile - 4 Personnes',
  chef_8_personnes: 'Chef à Domicile - 8 Personnes',
  nettoyage_auto_interne: 'Nettoyage Auto Interne',
  nettoyage_auto_externe: 'Nettoyage Auto Externe',
  nettoyage_auto_complet: 'Nettoyage Auto Complet',
  promenade_animaux: "Promenade d'Animaux",
  gardiennage_animaux: "Gardiennage d'Animaux",
  massage_relaxant: 'Massage Relaxant',
  hammam_gommage: 'Hammam & Gommage',
  soin_argan: 'Soin Premium Argan',
  yoga: 'Yoga',
  coach_sportif: 'Coach Sportif',
  danse_orientale: 'Danse Orientale'
};

// Fonction pour obtenir le nom BDD d'un service
export const getServiceDBName = (serviceValue) => {
  return SERVICE_TO_DB_NAME[serviceValue] || serviceValue;
};

// Mapping inverse: nom BDD -> clé service
export const DB_NAME_TO_SERVICE_KEY = Object.fromEntries(
  Object.entries(SERVICE_TO_DB_NAME).map(([key, value]) => [value, key])
);

// Fonction pour vérifier si un service requiert un diplôme par son nom BDD
export const serviceRequiresDiplomaByDBName = (dbName) => {
  const serviceKey = DB_NAME_TO_SERVICE_KEY[dbName];
  if (!serviceKey) return false;
  return serviceRequiresDiploma(serviceKey);
};
