// ==========================================
// REVIEW TYPES - Conforme a DB GlamGo
// ==========================================

export interface Review {
  // IDs - accepts both number and string
  id: number | string;
  // Relations
  user_id?: number;
  user?: {
    id: number | string;
    name?: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
  };
  service_id?: number;
  service?: {
    id: number | string;
    title?: string;
    name?: string;
    thumbnail?: string;
  };
  order_id?: number;
  provider_id?: number;
  // Rating & Content
  rating: number;
  title?: string;
  comment: string;
  // Detailed ratings (optional)
  service_quality?: number;
  punctuality?: number;
  professionalism?: number;
  // Verification - supports both new and legacy
  is_verified_purchase?: boolean;
  isVerified?: boolean;
  // Metrics - supports both new and legacy
  helpful_count?: number;
  helpfulCount?: number;
  // Provider Response - supports both formats
  provider_response?: {
    text: string;
    responded_at?: string;
    date?: string;
  };
  providerResponse?: {
    text: string;
    responded_at?: string;
    date?: string;
  };
  // Moderation
  is_approved?: boolean;
  is_flagged?: boolean;
  // Timestamps - supports both new and legacy
  created_at?: string;
  date?: string;
  updated_at?: string;
}

export interface ReviewCardProps extends Review {
  variant?: 'default' | 'compact';
  showService?: boolean;
  onHelpful?: (reviewId: number | string) => void;
}

/** @deprecated Use Review instead */
export type LegacyReview = Review;
