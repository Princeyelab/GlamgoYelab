// Mapping des catégories populaires et leurs services correspondants
// Ce fichier définit les services suggérés pour chaque catégorie principale
// ⚠️ SYNCHRONISÉ avec la base de données - 003_populate_complete_services.sql

export const POPULAR_CATEGORIES = {
  maison: {
    name: 'Maison',
    slug: 'maison',
    description: 'Services pour votre maison et habitat',
    services: [
      // Ménage
      'Ménage classique',
      'Ménage approfondi',
      'Nettoyage après événement',
      'Nettoyage de printemps',
      'Nettoyage cuisine',
      'Nettoyage salle de bain',
      'Service repassage',
      // Bricolage
      'Montage meuble',
      'Changement d\'ampoule',
      'Petits travaux plomberie',
      'Perçage et fixation',
      'Petit déménagement',
      // Jardinage
      'Entretien pelouse',
      'Taille haies',
      'Plantation fleurs',
      // Cuisine
      'Préparation repas',
      'Chef événementiel',
      'Coaching cuisine',
    ]
  },

  beaute: {
    name: 'Beauté',
    slug: 'beaute',
    description: 'Services de beauté et soins personnels',
    services: [
      // Coiffure Homme
      'Coiffure Homme Simple',
      'Coiffure Homme Premium',
      'Coupe classique homme',
      'Coupe tendance homme',
      // Barbe Homme
      'Taille de Barbe',
      'Pack Coiffure + Barbe',
      'Taille de barbe classique',
      'Barbe et contours',
      'Rasage à l\'ancienne',
      'Soin barbe',
      // Coiffure Femme
      'Coupe cheveux courts',
      'Coupe cheveux longs',
      'Coloration cheveux courts',
      'Coloration cheveux longs',
      // Maquillage
      'Maquillage jour',
      'Maquillage soirée',
      'Maquillage mariage',
      // Manucure & Pédicure
      'Manucure femme',
      'Manucure homme',
      'Pédicure spa',
      // Épilation
      'Jambes complètes femme',
      'Sourcils et visage',
      'Torse ou dos',
      'Bras complets',
    ]
  },

  voiture: {
    name: 'Voiture',
    slug: 'voiture',
    description: 'Services automobiles et entretien véhicule',
    services: [
      // Mécanique
      'Vidange huile',
      'Changement ampoule voiture',
      'Changement essuie-glace',
      'Changement pneu',
      // Nettoyage Auto
      'Nettoyage extérieur seul',
      'Nettoyage intérieur seul',
      'Combo intérieur + extérieur',
    ]
  },

  animaux: {
    name: 'Animaux',
    slug: 'animaux',
    description: 'Services pour vos animaux de compagnie',
    services: [
      'Toilettage chien',
      'Promenade chien',
      'Gardiennage à domicile',
      'Gardiennage longue durée',
      'Nourrissage animaux',
      'Transport animaux',
      'Nettoyage espace animal',
    ]
  },

  'bien-etre': {
    name: 'Bien-être',
    slug: 'bien-etre',
    description: 'Services de bien-être et relaxation',
    services: [
      // Massages
      'Massage tonique',
      'Massage sportif',
      'Massage thaïlandais',
      'Massage marocain traditionnel',
      // Coaching
      'Yoga',
      'Pilates',
      'Étirements guidés',
      'Musculation personnalisée',
      'Méditation et respiration',
      'Coaching nutrition',
    ]
  }
};

// Fonction pour obtenir les services d'une catégorie
export const getServicesByCategory = (categorySlug) => {
  const category = POPULAR_CATEGORIES[categorySlug];
  return category ? category.services : [];
};

// Fonction pour trouver la catégorie d'un service
export const getCategoryForService = (serviceName) => {
  const normalizedService = serviceName.toLowerCase();

  for (const [slug, category] of Object.entries(POPULAR_CATEGORIES)) {
    const found = category.services.some(service =>
      service.toLowerCase().includes(normalizedService) ||
      normalizedService.includes(service.toLowerCase())
    );
    if (found) return slug;
  }
  return null;
};

// Liste des noms de catégories populaires pour le filtrage
export const POPULAR_CATEGORY_SLUGS = ['maison', 'beaute', 'voiture', 'bien-etre', 'animaux'];

// Ordre d'affichage des catégories populaires
export const POPULAR_CATEGORY_ORDER = {
  'maison': 1,
  'beaute': 2,
  'voiture': 3,
  'bien-etre': 4,
  'animaux': 5,
};
