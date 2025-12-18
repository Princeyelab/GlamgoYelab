// ==========================================
// SERVICE TYPES - Conforme à DB GlamGo
// ==========================================

import { Provider } from './provider';

export interface Service {
  // IDs - Accept both string and number for flexibility
  id: number | string;

  // Info de base - Support both 'title' and 'name' for backward compatibility
  title?: string;
  name?: string; // @deprecated - use title
  slug?: string;
  description: string;

  // Pricing
  price: number;
  currency?: string; // default 'MAD'

  // Timing
  duration_minutes?: number;

  // Media - Support both array and single string
  images?: string[];
  image?: string; // @deprecated - use images
  thumbnail?: string;

  // Relations
  category_id?: number;
  category?: Category | { id: number | string; name: string; color?: string };
  provider_id?: number;
  provider?: Provider | { id: number | string; name: string; avatar?: string };

  // Metrics
  rating: number;
  reviews_count?: number;
  reviewsCount?: number; // @deprecated - use reviews_count
  bookings_count?: number;

  // Status
  status?: 'active' | 'inactive' | 'draft';
  is_featured?: boolean;

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // Computed (frontend)
  isNew?: boolean;
  isFavorite?: boolean;
}

export interface ServiceCardProps extends Omit<Service, 'category' | 'provider'> {
  category: Category | { id: number | string; name: string; color?: string };
  provider: Provider | { id: number | string; name: string; avatar?: string };
  variant?: 'default' | 'compact';
  onPress?: () => void;
  onFavoritePress?: (id: number | string, isFavorite: boolean) => void;
}

// ==========================================
// CATEGORY TYPES - Conforme à DB
// ==========================================

export interface Category {
  id: number | string;
  name: string;
  slug?: string;
  icon?: string;
  color?: string;
  image?: string;
  description?: string;

  // Hierarchy
  parent_id?: number | null;
  parent?: Category;

  // Display
  display_order?: number;
  is_active?: boolean;

  // Metrics - Support both naming conventions
  services_count?: number;
  servicesCount?: number; // @deprecated - use services_count

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface CategoryCardProps {
  // Required display fields
  name: string;
  icon?: string;
  color?: string;
  image?: string;

  // Optional ID (for navigation)
  id?: number | string;

  // Service count - support both naming conventions
  services_count?: number;
  servicesCount?: number; // @deprecated - use services_count

  // Card options
  variant?: 'default' | 'list';
  onPress?: () => void;
}

// ==========================================
// LEGACY TYPES - Pour compatibilité
// ==========================================

/** @deprecated Use Category instead */
export interface ServiceCategory {
  id: number | string;
  name: string;
  color?: string;
}

/** @deprecated Use Provider from provider.ts instead */
export interface ServiceProvider {
  id: number | string;
  name: string;
  avatar?: string;
}
