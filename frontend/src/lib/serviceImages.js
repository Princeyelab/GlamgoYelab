/**
 * Mapping des images par service (images locales)
 * Chaque service a sa propre image unique
 */
export const SERVICE_IMAGES = {
  // Chef à domicile
  'chef-domicile-2-personnes': '/images/services/chef-domicile-2-personnes.jpg',
  'chef-domicile-4-personnes': '/images/services/chef-domicile-4-personnes.jpg',
  'chef-domicile-8-personnes': '/images/services/chef-domicile-8-personnes.jpg',

  // Coach & Sport
  'coach-sportif': '/images/services/coach-sportif.jpg',

  // Coiffure
  'coiffure-classique': '/images/services/coiffure-classique.jpg',
  'coiffure-express': '/images/services/coiffure-express.jpg',
  'coiffure-homme-premium': '/images/services/coiffure-homme-premium.jpg',
  'coiffure-mariage-evenement': '/images/services/coiffure-mariage-evenement.jpg',
  'coiffure-homme-simple': '/images/services/coiffure-homme-simple.jpg',

  // Danse
  'danse-orientale': '/images/services/danse-orientale.jpg',

  // Animaux
  'gardiennage-animaux': '/images/services/gardiennage-animaux.jpg',
  'promenade-animaux': '/images/services/promenade-animaux.jpg',

  // Bien-être
  'hammam-gommage': '/images/services/hammam-gommage.jpg',
  'massage-relaxant': '/images/services/massage-relaxant.jpg',
  'soin-premium-argan': '/images/services/soin-premium-argan.jpg',
  'yoga': '/images/services/yoga.jpg',

  // Maison
  'jardinage': '/images/services/jardinage.jpg',
  'menage': '/images/services/menage.jpg',
  'bricolage': '/images/services/bricolage.jpg',

  // Auto
  'lavage-complet': '/images/services/lavage-complet.jpg',
  'lavage-exterieur': '/images/services/lavage-exterieur.jpg',
  'lavage-interieur': '/images/services/lavage-interieur.jpg',

  // Barbe
  'pack-coiffure-barbe': '/images/services/pack-coiffure-barbe.jpg',
  'taille-barbe': '/images/services/taille-barbe.jpg',
};

/**
 * Génère un slug à partir du nom du service
 */
export function generateSlug(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';

/**
 * Obtient l'URL de l'image pour un service
 */
export function getServiceImageUrl(service, size = '400x300') {
  if (service.image) {
    // Si c'est une URL complète, la retourner directement
    if (service.image.startsWith('http')) {
      return service.image;
    }
    // Si c'est une image locale (/images/services/...), la retourner directement
    if (service.image.startsWith('/images/')) {
      return service.image;
    }
    // Sinon, préfixer avec l'URL du backend
    return `${BACKEND_URL}${service.image}`;
  }

  const { name, slug } = service;

  if (slug && SERVICE_IMAGES[slug]) {
    return SERVICE_IMAGES[slug];
  }

  const generatedSlug = generateSlug(name);
  if (SERVICE_IMAGES[generatedSlug]) {
    return SERVICE_IMAGES[generatedSlug];
  }

  // Image par défaut
  return '/images/services/menage.jpg';
}
