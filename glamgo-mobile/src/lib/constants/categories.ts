/**
 * Categories GlamGo - Synchronise avec la web app
 * 5 categories principales
 * FORMAT CONFORME A CategoryCard.tsx
 */

import { Category } from '../../types/service';

// Images Unsplash pour les categories (identique a web app CategoryCard.js)
export const CATEGORY_IMAGES: Record<string, string> = {
  maison: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=250&fit=crop',
  beaute: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=250&fit=crop',
  voiture: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=250&fit=crop',
  'bien-etre': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop',
  animaux: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=250&fit=crop',
};

// Couleurs des categories
export const CATEGORY_COLORS: Record<string, string> = {
  maison: '#3B82F6',     // Bleu
  beaute: '#E63946',     // Rouge GlamGo
  voiture: '#6B7280',    // Gris
  'bien-etre': '#2A9D8F', // Teal
  animaux: '#F59E0B',    // Orange
};

// Icones des categories (emoji)
export const CATEGORY_ICONS: Record<string, string> = {
  maison: '🏠',
  beaute: '💄',
  voiture: '🚗',
  'bien-etre': '🧘',
  animaux: '🐕',
};

/**
 * 5 categories principales (synchronisees avec web app)
 * IDs numeriques pour compatibilite avec servicesSlice
 */
export const CATEGORIES: Category[] = [
  {
    id: 1,
    name: 'Maison',
    slug: 'maison',
    icon: CATEGORY_ICONS.maison,
    color: CATEGORY_COLORS.maison,
    services_count: 6,
    image: CATEGORY_IMAGES.maison,
    display_order: 1,
    is_active: true,
  },
  {
    id: 2,
    name: 'Beaute',
    slug: 'beaute',
    icon: CATEGORY_ICONS.beaute,
    color: CATEGORY_COLORS.beaute,
    services_count: 11,
    image: CATEGORY_IMAGES.beaute,
    display_order: 2,
    is_active: true,
  },
  {
    id: 3,
    name: 'Voiture',
    slug: 'voiture',
    icon: CATEGORY_ICONS.voiture,
    color: CATEGORY_COLORS.voiture,
    services_count: 3,
    image: CATEGORY_IMAGES.voiture,
    display_order: 3,
    is_active: true,
  },
  {
    id: 4,
    name: 'Bien-etre',
    slug: 'bien-etre',
    icon: CATEGORY_ICONS['bien-etre'],
    color: CATEGORY_COLORS['bien-etre'],
    services_count: 6,
    image: CATEGORY_IMAGES['bien-etre'],
    display_order: 4,
    is_active: true,
  },
  {
    id: 5,
    name: 'Animaux',
    slug: 'animaux',
    icon: CATEGORY_ICONS.animaux,
    color: CATEGORY_COLORS.animaux,
    services_count: 2,
    image: CATEGORY_IMAGES.animaux,
    display_order: 5,
    is_active: true,
  },
];

// Ordre d'affichage des categories
export const CATEGORY_ORDER = ['maison', 'beaute', 'voiture', 'bien-etre', 'animaux'];

// Obtenir une categorie par ID
export function getCategoryById(id: number): Category | undefined {
  return CATEGORIES.find(cat => cat.id === id);
}

// Obtenir une categorie par slug
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find(cat => cat.slug === slug);
}
