/**
 * Catégories GlamGo - Synchronisé avec la web app
 * 5 catégories principales
 */

import { Category } from '../../types/service';

// Images Unsplash pour les catégories (identique à web app CategoryCard.js)
export const CATEGORY_IMAGES = {
  maison: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=250&fit=crop',
  beaute: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=250&fit=crop',
  voiture: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=250&fit=crop',
  'bien-etre': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop',
  animaux: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=250&fit=crop',
};

// Couleurs des catégories
export const CATEGORY_COLORS = {
  maison: '#3B82F6',     // Bleu
  beaute: '#E63946',     // Rouge GlamGo
  voiture: '#6B7280',    // Gris
  'bien-etre': '#2A9D8F', // Teal
  animaux: '#F59E0B',    // Orange
};

// Icônes des catégories (emoji)
export const CATEGORY_ICONS = {
  maison: '🏠',
  beaute: '💄',
  voiture: '🚗',
  'bien-etre': '🧘',
  animaux: '🐕',
};

// 5 catégories principales (synchronisées avec web app)
export const CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Maison',
    icon: CATEGORY_ICONS.maison,
    color: CATEGORY_COLORS.maison,
    servicesCount: 18,
    image: CATEGORY_IMAGES.maison,
  },
  {
    id: '2',
    name: 'Beauté',
    icon: CATEGORY_ICONS.beaute,
    color: CATEGORY_COLORS.beaute,
    servicesCount: 21,
    image: CATEGORY_IMAGES.beaute,
  },
  {
    id: '3',
    name: 'Voiture',
    icon: CATEGORY_ICONS.voiture,
    color: CATEGORY_COLORS.voiture,
    servicesCount: 7,
    image: CATEGORY_IMAGES.voiture,
  },
  {
    id: '4',
    name: 'Bien-être',
    icon: CATEGORY_ICONS['bien-etre'],
    color: CATEGORY_COLORS['bien-etre'],
    servicesCount: 10,
    image: CATEGORY_IMAGES['bien-etre'],
  },
  {
    id: '5',
    name: 'Animaux',
    icon: CATEGORY_ICONS.animaux,
    color: CATEGORY_COLORS.animaux,
    servicesCount: 7,
    image: CATEGORY_IMAGES.animaux,
  },
];

// Ordre d'affichage des catégories
export const CATEGORY_ORDER = ['maison', 'beaute', 'voiture', 'bien-etre', 'animaux'];
