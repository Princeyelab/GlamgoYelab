// Spécialités des prestataires basées sur les services GlamGo
// Ce fichier centralise les spécialités disponibles pour l'inscription et le profil des prestataires
// ⚠️ SYNCHRONISÉ avec categoryServices.js

export const PROVIDER_SPECIALTIES = {
  // ==================== BEAUTÉ ====================
  coiffure_homme: {
    value: 'coiffure_homme',
    label: 'Coiffure homme',
    category: 'beaute',
    description: 'Coupes classiques et tendances pour hommes'
  },
  coiffure_femme: {
    value: 'coiffure_femme',
    label: 'Coiffure femme',
    category: 'beaute',
    description: 'Coupes, colorations, brushing pour femmes'
  },
  barbier: {
    value: 'barbier',
    label: 'Barbier',
    category: 'beaute',
    description: 'Taille de barbe, rasage à l\'ancienne, soins barbe'
  },
  maquillage: {
    value: 'maquillage',
    label: 'Maquillage',
    category: 'beaute',
    description: 'Maquillage jour, soirée, mariage'
  },
  manucure_pedicure: {
    value: 'manucure_pedicure',
    label: 'Manucure & Pédicure',
    category: 'beaute',
    description: 'Soins des ongles, pose de vernis, pédicure spa'
  },
  epilation: {
    value: 'epilation',
    label: 'Épilation',
    category: 'beaute',
    description: 'Épilation jambes, sourcils, visage, corps'
  },

  // ==================== BIEN-ÊTRE ====================
  massage: {
    value: 'massage',
    label: 'Massage',
    category: 'bien-etre',
    description: 'Massage tonique, sportif, thaïlandais, marocain traditionnel'
  },
  yoga: {
    value: 'yoga',
    label: 'Yoga',
    category: 'bien-etre',
    description: 'Cours de yoga à domicile'
  },
  pilates: {
    value: 'pilates',
    label: 'Pilates',
    category: 'bien-etre',
    description: 'Cours de pilates à domicile'
  },
  coaching_sport: {
    value: 'coaching_sport',
    label: 'Coach sportif',
    category: 'bien-etre',
    description: 'Musculation personnalisée, étirements guidés'
  },
  meditation: {
    value: 'meditation',
    label: 'Méditation & Respiration',
    category: 'bien-etre',
    description: 'Méditation guidée, exercices de respiration'
  },
  coaching_nutrition: {
    value: 'coaching_nutrition',
    label: 'Coaching nutrition',
    category: 'bien-etre',
    description: 'Conseils nutritionnels personnalisés'
  },

  // ==================== MAISON ====================
  menage: {
    value: 'menage',
    label: 'Ménage',
    category: 'maison',
    description: 'Ménage classique, approfondi, nettoyage après événement, repassage'
  },
  bricolage: {
    value: 'bricolage',
    label: 'Bricolage',
    category: 'maison',
    description: 'Montage meuble, plomberie, perçage, fixation'
  },
  jardinage: {
    value: 'jardinage',
    label: 'Jardinage',
    category: 'maison',
    description: 'Entretien pelouse, taille haies, plantation'
  },
  cuisine: {
    value: 'cuisine',
    label: 'Chef à domicile',
    category: 'maison',
    description: 'Préparation repas, chef événementiel, coaching cuisine'
  },
  demenagement: {
    value: 'demenagement',
    label: 'Petit déménagement',
    category: 'maison',
    description: 'Aide au déménagement, transport de meubles'
  },

  // ==================== VOITURE ====================
  mecanique_auto: {
    value: 'mecanique_auto',
    label: 'Mécanique auto',
    category: 'voiture',
    description: 'Vidange, changement pneu, ampoules, essuie-glaces'
  },
  nettoyage_auto: {
    value: 'nettoyage_auto',
    label: 'Nettoyage auto',
    category: 'voiture',
    description: 'Nettoyage intérieur et extérieur de véhicules'
  },

  // ==================== ANIMAUX ====================
  toilettage_animaux: {
    value: 'toilettage_animaux',
    label: 'Toilettage animaux',
    category: 'animaux',
    description: 'Toilettage chiens et autres animaux de compagnie'
  },
  garde_animaux: {
    value: 'garde_animaux',
    label: 'Garde d\'animaux',
    category: 'animaux',
    description: 'Promenade, gardiennage à domicile, nourrissage'
  },
  transport_animaux: {
    value: 'transport_animaux',
    label: 'Transport animaux',
    category: 'animaux',
    description: 'Transport sécurisé d\'animaux de compagnie'
  },
  nettoyage_animaux: {
    value: 'nettoyage_animaux',
    label: 'Nettoyage espace animal',
    category: 'animaux',
    description: 'Nettoyage et entretien des espaces pour animaux'
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

// Labels de catégories
export const CATEGORY_LABELS = {
  beaute: 'Beauté',
  'bien-etre': 'Bien-être',
  maison: 'Maison',
  voiture: 'Voiture',
  animaux: 'Animaux'
};

// Spécialités nécessitant un diplôme/certificat
export const SPECIALTIES_REQUIRING_DIPLOMA = [
  'coiffure_homme',
  'coiffure_femme',
  'barbier',
  'maquillage',
  'massage',
  'yoga',
  'pilates',
  'coaching_sport',
  'coaching_nutrition',
  'mecanique_auto'
];

// Fonction pour obtenir une spécialité par sa valeur
export const getSpecialtyByValue = (value) => {
  return PROVIDER_SPECIALTIES[value] || null;
};

// Fonction pour obtenir le label d'une spécialité
export const getSpecialtyLabel = (value) => {
  const specialty = getSpecialtyByValue(value);
  return specialty ? specialty.label : value;
};

// Fonction pour vérifier si une spécialité nécessite un diplôme
export const requiresDiploma = (value) => {
  return SPECIALTIES_REQUIRING_DIPLOMA.includes(value);
};

// Mapping spécialité -> services correspondants
export const SPECIALTY_TO_SERVICES = {
  coiffure_homme: ['Coupe classique homme', 'Coupe tendance homme', 'Combo coupe + barbe'],
  coiffure_femme: ['Coupe cheveux courts', 'Coupe cheveux longs', 'Coloration cheveux courts', 'Coloration cheveux longs'],
  barbier: ['Taille de barbe classique', 'Barbe et contours', 'Rasage à l\'ancienne', 'Soin barbe'],
  maquillage: ['Maquillage jour', 'Maquillage soirée', 'Maquillage mariage'],
  manucure_pedicure: ['Manucure femme', 'Manucure homme', 'Pédicure spa'],
  epilation: ['Jambes complètes femme', 'Sourcils et visage', 'Torse ou dos', 'Bras complets'],
  massage: ['Massage tonique', 'Massage sportif', 'Massage thaïlandais', 'Massage marocain traditionnel'],
  yoga: ['Yoga'],
  pilates: ['Pilates'],
  coaching_sport: ['Musculation personnalisée', 'Étirements guidés'],
  meditation: ['Méditation et respiration'],
  coaching_nutrition: ['Coaching nutrition'],
  menage: ['Ménage classique', 'Ménage approfondi', 'Nettoyage après événement', 'Nettoyage de printemps', 'Nettoyage cuisine', 'Nettoyage salle de bain', 'Service repassage'],
  bricolage: ['Montage meuble', 'Changement d\'ampoule', 'Petits travaux plomberie', 'Perçage et fixation'],
  jardinage: ['Entretien pelouse', 'Taille haies', 'Plantation fleurs'],
  cuisine: ['Préparation repas', 'Chef événementiel', 'Coaching cuisine'],
  demenagement: ['Petit déménagement'],
  mecanique_auto: ['Vidange huile', 'Changement ampoule voiture', 'Changement essuie-glace', 'Changement pneu'],
  nettoyage_auto: ['Nettoyage extérieur seul', 'Nettoyage intérieur seul', 'Combo intérieur + extérieur'],
  toilettage_animaux: ['Toilettage chien'],
  garde_animaux: ['Promenade chien', 'Gardiennage à domicile', 'Gardiennage longue durée', 'Nourrissage animaux'],
  transport_animaux: ['Transport animaux'],
  nettoyage_animaux: ['Nettoyage espace animal']
};

// Fonction pour obtenir les services d'une spécialité
export const getServicesForSpecialty = (specialtyValue) => {
  return SPECIALTY_TO_SERVICES[specialtyValue] || [];
};
