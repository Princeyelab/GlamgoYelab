/**
 * Services GlamGo - Synchronisé avec la web app
 * 24 services avec images locales
 */

import { Service } from '../../types/service';

// URL de base pour les images (backend GlamGo)
const BACKEND_URL = 'https://glamgo-api.fly.dev';
const IMAGE_BASE_URL = `${BACKEND_URL}/images/services`;

// Mapping des images par service (identique à web app serviceImages.js)
export const SERVICE_IMAGES: Record<string, string> = {
  // Chef à domicile
  'chef-domicile-2-personnes': `${IMAGE_BASE_URL}/chef-domicile-2-personnes.jpg`,
  'chef-domicile-4-personnes': `${IMAGE_BASE_URL}/chef-domicile-4-personnes.jpg`,
  'chef-domicile-8-personnes': `${IMAGE_BASE_URL}/chef-domicile-8-personnes.jpg`,

  // Coach & Sport
  'coach-sportif': `${IMAGE_BASE_URL}/coach-sportif.jpg`,

  // Coiffure
  'coiffure-classique': `${IMAGE_BASE_URL}/coiffure-classique.jpg`,
  'coiffure-express': `${IMAGE_BASE_URL}/coiffure-express.jpg`,
  'coiffure-homme-premium': `${IMAGE_BASE_URL}/coiffure-homme-premium.jpg`,
  'coiffure-mariage-evenement': `${IMAGE_BASE_URL}/coiffure-mariage-evenement.jpg`,
  'coiffure-homme-simple': `${IMAGE_BASE_URL}/coiffure-homme-simple.jpg`,

  // Danse
  'danse-orientale': `${IMAGE_BASE_URL}/danse-orientale.jpg`,

  // Animaux
  'gardiennage-animaux': `${IMAGE_BASE_URL}/gardiennage-animaux.jpg`,
  'promenade-animaux': `${IMAGE_BASE_URL}/promenade-animaux.jpg`,

  // Bien-être
  'hammam-gommage': `${IMAGE_BASE_URL}/hammam-gommage.jpg`,
  'massage-relaxant': `${IMAGE_BASE_URL}/massage-relaxant.jpg`,
  'soin-premium-argan': `${IMAGE_BASE_URL}/soin-premium-argan.jpg`,
  'yoga': `${IMAGE_BASE_URL}/yoga.jpg`,

  // Maison
  'jardinage': `${IMAGE_BASE_URL}/jardinage.jpg`,
  'menage': `${IMAGE_BASE_URL}/menage.jpg`,
  'bricolage': `${IMAGE_BASE_URL}/bricolage.jpg`,

  // Auto
  'lavage-complet': `${IMAGE_BASE_URL}/nettoyage-auto-complet.jpg`,
  'lavage-exterieur': `${IMAGE_BASE_URL}/nettoyage-auto-externe.jpg`,
  'lavage-interieur': `${IMAGE_BASE_URL}/nettoyage-auto-interne.jpg`,

  // Barbe
  'pack-coiffure-barbe': `${IMAGE_BASE_URL}/pack-coiffure-barbe.jpg`,
  'taille-barbe': `${IMAGE_BASE_URL}/taille-barbe.jpg`,
};

// 24 services avec leurs données complètes
export const SERVICES: Service[] = [
  // === MAISON ===
  {
    id: '1',
    name: 'Ménage classique',
    description: 'Nettoyage standard de votre logement',
    category: { id: '1', name: 'Maison', color: '#3B82F6' },
    price: 100,
    currency: 'MAD',
    image: SERVICE_IMAGES['menage'],
    rating: 4.8,
    reviewsCount: 156,
    provider: { id: '1', name: 'Fatima B.' },
  },
  {
    id: '2',
    name: 'Jardinage',
    description: 'Entretien de vos espaces verts',
    category: { id: '1', name: 'Maison', color: '#3B82F6' },
    price: 250,
    currency: 'MAD',
    image: SERVICE_IMAGES['jardinage'],
    rating: 4.7,
    reviewsCount: 89,
    provider: { id: '2', name: 'Ahmed M.' },
  },
  {
    id: '3',
    name: 'Bricolage',
    description: 'Petits travaux et réparations',
    category: { id: '1', name: 'Maison', color: '#3B82F6' },
    price: 200,
    currency: 'MAD',
    image: SERVICE_IMAGES['bricolage'],
    rating: 4.6,
    reviewsCount: 112,
    provider: { id: '3', name: 'Youssef K.' },
  },
  {
    id: '4',
    name: 'Chef 2 personnes',
    description: 'Chef prépare vos repas à domicile',
    category: { id: '1', name: 'Maison', color: '#3B82F6' },
    price: 500,
    currency: 'MAD',
    image: SERVICE_IMAGES['chef-domicile-2-personnes'],
    rating: 4.9,
    reviewsCount: 67,
    provider: { id: '4', name: 'Karim L.' },
  },
  {
    id: '5',
    name: 'Chef 4 personnes',
    description: 'Chef événementiel pour groupe',
    category: { id: '1', name: 'Maison', color: '#3B82F6' },
    price: 900,
    currency: 'MAD',
    image: SERVICE_IMAGES['chef-domicile-4-personnes'],
    rating: 4.9,
    reviewsCount: 45,
    provider: { id: '4', name: 'Karim L.' },
  },
  {
    id: '6',
    name: 'Chef 8 personnes',
    description: 'Service traiteur pour événements',
    category: { id: '1', name: 'Maison', color: '#3B82F6' },
    price: 1500,
    currency: 'MAD',
    image: SERVICE_IMAGES['chef-domicile-8-personnes'],
    rating: 4.8,
    reviewsCount: 34,
    provider: { id: '4', name: 'Karim L.' },
  },

  // === BEAUTÉ ===
  {
    id: '7',
    name: 'Coiffure Homme Simple',
    description: 'Coupe de cheveux classique',
    category: { id: '2', name: 'Beauté', color: '#E63946' },
    price: 135,
    currency: 'MAD',
    image: SERVICE_IMAGES['coiffure-homme-simple'],
    rating: 4.7,
    reviewsCount: 234,
    provider: { id: '5', name: 'Hassan R.' },
  },
  {
    id: '8',
    name: 'Coiffure Homme Premium',
    description: 'Coupe moderne et stylée',
    category: { id: '2', name: 'Beauté', color: '#E63946' },
    price: 175,
    currency: 'MAD',
    image: SERVICE_IMAGES['coiffure-homme-premium'],
    rating: 4.9,
    reviewsCount: 189,
    provider: { id: '5', name: 'Hassan R.' },
  },
  {
    id: '9',
    name: 'Taille de Barbe',
    description: 'Entretien de barbe professionnel',
    category: { id: '2', name: 'Beauté', color: '#E63946' },
    price: 100,
    currency: 'MAD',
    image: SERVICE_IMAGES['taille-barbe'],
    rating: 4.8,
    reviewsCount: 156,
    provider: { id: '5', name: 'Hassan R.' },
  },
  {
    id: '10',
    name: 'Pack Coiffure + Barbe',
    description: 'Coupe cheveux et entretien barbe',
    category: { id: '2', name: 'Beauté', color: '#E63946' },
    price: 260,
    currency: 'MAD',
    image: SERVICE_IMAGES['pack-coiffure-barbe'],
    rating: 4.9,
    reviewsCount: 145,
    provider: { id: '5', name: 'Hassan R.' },
  },
  {
    id: '11',
    name: 'Coiffure Classique',
    description: 'Coupe et brushing femme',
    category: { id: '2', name: 'Beauté', color: '#E63946' },
    price: 225,
    currency: 'MAD',
    image: SERVICE_IMAGES['coiffure-classique'],
    rating: 4.8,
    reviewsCount: 198,
    provider: { id: '6', name: 'Samira N.' },
  },
  {
    id: '12',
    name: 'Coiffure Express',
    description: 'Coupe rapide femme',
    category: { id: '2', name: 'Beauté', color: '#E63946' },
    price: 150,
    currency: 'MAD',
    image: SERVICE_IMAGES['coiffure-express'],
    rating: 4.6,
    reviewsCount: 167,
    provider: { id: '6', name: 'Samira N.' },
  },
  {
    id: '13',
    name: 'Coiffure Mariage',
    description: 'Coiffure mariée avec essai',
    category: { id: '2', name: 'Beauté', color: '#E63946' },
    price: 1000,
    currency: 'MAD',
    image: SERVICE_IMAGES['coiffure-mariage-evenement'],
    rating: 4.9,
    reviewsCount: 78,
    provider: { id: '6', name: 'Samira N.' },
    isNew: true,
  },

  // === VOITURE ===
  {
    id: '14',
    name: 'Lavage Extérieur',
    description: 'Lavage extérieur complet',
    category: { id: '3', name: 'Voiture', color: '#6B7280' },
    price: 150,
    currency: 'MAD',
    image: SERVICE_IMAGES['lavage-exterieur'],
    rating: 4.5,
    reviewsCount: 234,
    provider: { id: '7', name: 'Omar A.' },
  },
  {
    id: '15',
    name: 'Lavage Intérieur',
    description: 'Nettoyage intérieur approfondi',
    category: { id: '3', name: 'Voiture', color: '#6B7280' },
    price: 185,
    currency: 'MAD',
    image: SERVICE_IMAGES['lavage-interieur'],
    rating: 4.6,
    reviewsCount: 189,
    provider: { id: '7', name: 'Omar A.' },
  },
  {
    id: '16',
    name: 'Lavage Complet',
    description: 'Nettoyage complet du véhicule',
    category: { id: '3', name: 'Voiture', color: '#6B7280' },
    price: 325,
    currency: 'MAD',
    image: SERVICE_IMAGES['lavage-complet'],
    rating: 4.8,
    reviewsCount: 156,
    provider: { id: '7', name: 'Omar A.' },
  },

  // === BIEN-ÊTRE ===
  {
    id: '17',
    name: 'Massage Relaxant',
    description: 'Massage aux huiles orientales',
    category: { id: '4', name: 'Bien-être', color: '#2A9D8F' },
    price: 400,
    currency: 'MAD',
    image: SERVICE_IMAGES['massage-relaxant'],
    rating: 4.9,
    reviewsCount: 267,
    provider: { id: '8', name: 'Nadia T.' },
  },
  {
    id: '18',
    name: 'Hammam & Gommage',
    description: 'Hammam traditionnel avec gommage',
    category: { id: '4', name: 'Bien-être', color: '#2A9D8F' },
    price: 350,
    currency: 'MAD',
    image: SERVICE_IMAGES['hammam-gommage'],
    rating: 4.8,
    reviewsCount: 189,
    provider: { id: '8', name: 'Nadia T.' },
  },
  {
    id: '19',
    name: 'Soin Premium Argan',
    description: 'Soin complet huile d\'argan',
    category: { id: '4', name: 'Bien-être', color: '#2A9D8F' },
    price: 500,
    currency: 'MAD',
    image: SERVICE_IMAGES['soin-premium-argan'],
    rating: 4.9,
    reviewsCount: 134,
    provider: { id: '8', name: 'Nadia T.' },
    isNew: true,
  },
  {
    id: '20',
    name: 'Yoga',
    description: 'Séance de yoga à domicile',
    category: { id: '4', name: 'Bien-être', color: '#2A9D8F' },
    price: 250,
    currency: 'MAD',
    image: SERVICE_IMAGES['yoga'],
    rating: 4.7,
    reviewsCount: 98,
    provider: { id: '9', name: 'Layla M.' },
  },
  {
    id: '21',
    name: 'Coach Sportif',
    description: 'Entraînement personnalisé',
    category: { id: '4', name: 'Bien-être', color: '#2A9D8F' },
    price: 400,
    currency: 'MAD',
    image: SERVICE_IMAGES['coach-sportif'],
    rating: 4.8,
    reviewsCount: 112,
    provider: { id: '10', name: 'Mehdi S.' },
  },
  {
    id: '22',
    name: 'Danse Orientale',
    description: 'Cours de danse orientale',
    category: { id: '4', name: 'Bien-être', color: '#2A9D8F' },
    price: 300,
    currency: 'MAD',
    image: SERVICE_IMAGES['danse-orientale'],
    rating: 4.6,
    reviewsCount: 67,
    provider: { id: '11', name: 'Amina K.' },
  },

  // === ANIMAUX ===
  {
    id: '23',
    name: 'Gardiennage Animaux',
    description: 'Garde d\'animaux à domicile',
    category: { id: '5', name: 'Animaux', color: '#F59E0B' },
    price: 200,
    currency: 'MAD',
    image: SERVICE_IMAGES['gardiennage-animaux'],
    rating: 4.7,
    reviewsCount: 89,
    provider: { id: '12', name: 'Sara B.' },
  },
  {
    id: '24',
    name: 'Promenade Animaux',
    description: 'Balade quotidienne pour votre chien',
    category: { id: '5', name: 'Animaux', color: '#F59E0B' },
    price: 115,
    currency: 'MAD',
    image: SERVICE_IMAGES['promenade-animaux'],
    rating: 4.8,
    reviewsCount: 156,
    provider: { id: '12', name: 'Sara B.' },
  },
];

// Services populaires (6 premiers pour la page d'accueil)
export const POPULAR_SERVICES = SERVICES.slice(0, 6);

// Obtenir les services par catégorie
export function getServicesByCategory(categoryId: string): Service[] {
  return SERVICES.filter(service => service.category?.id === categoryId);
}

// Obtenir un service par ID
export function getServiceById(id: string): Service | undefined {
  return SERVICES.find(service => service.id === id);
}
