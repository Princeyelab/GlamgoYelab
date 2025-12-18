// ==========================================
// PROVIDER TYPES - Conforme à DB GlamGo
// ==========================================

export interface PriceBreakdown {
  base_price: number;
  distance_fee: number;
  intervention_radius_km: number;
  extra_distance_km: number;
  price_per_extra_km: number;
  total: number;
}

export interface DistanceCalculation {
  distance_km: number;
  is_in_radius: boolean;
  intervention_radius_km: number;
  extra_distance_km: number;
  price_per_extra_km: number;
  fee: number;
}

export interface Provider {
  // IDs
  id: number | string;
  user_id?: number; // Si provider lié à un user

  // Basic Info
  name: string;
  slug?: string; // pour URLs
  email?: string;
  phone?: string;
  business_name?: string;
  first_name?: string;
  last_name?: string;

  // Profile
  avatar?: string;
  profile_photo?: string;
  photo_url?: string;
  cover_image?: string;
  bio?: string;
  description?: string;

  // Business Info
  company_name?: string;
  business_type?: 'individual' | 'company';
  registration_number?: string;

  // Location
  address?: string;
  city?: string;
  postal_code?: string;
  current_latitude?: number;
  current_longitude?: number;

  // Metrics
  rating: number; // 0-5, calculé
  total_reviews?: number;
  reviews_count?: number;
  services_count?: number;
  completed_bookings_count?: number;

  // Categories
  categories?: string[]; // ["Coiffure", "Beauté"]
  category_ids?: number[];

  // Verification
  is_verified?: boolean;
  isVerified?: boolean; // Alias camelCase
  verified_at?: string;

  // Status
  is_active?: boolean;
  is_available?: boolean; // Disponible maintenant
  is_available_now?: boolean;
  isAvailable?: boolean; // Alias camelCase
  next_availability?: string;

  // Distance fields (computed by API)
  distance?: number; // in km
  distance_formatted?: string;
  within_intervention_radius?: boolean;
  intervention_radius_km?: number;

  // Price fields (computed by API)
  base_price?: number;
  distance_fee?: number;
  extra_km?: number;
  extra_distance_km?: number;
  calculated_price?: number;
  price_breakdown?: PriceBreakdown;
  price_per_extra_km?: number;

  // Service fields (when in service context)
  duration_minutes?: number;
  service_name?: string;

  // Nested objects (from API responses)
  user?: {
    profile_photo?: string;
    avatar?: string;
    photo?: string;
  };
  provider?: {
    profile_photo?: string;
    avatar?: string;
  };

  // Timestamps
  joined_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProviderCardProps {
  provider: Provider;
  isNearest?: boolean;
  onSelect?: (provider: Provider) => void;
  selected?: boolean;
  compact?: boolean;
  showDistanceDetails?: boolean;
  showPrice?: boolean;
  serviceId?: string | number;
  formulaType?: 'standard' | 'premium' | 'express';
  currency?: string;
}

// Legacy props interface for backwards compatibility
export interface LegacyProviderCardProps extends Provider {
  variant?: 'default' | 'compact';
  onPress?: () => void;
}
