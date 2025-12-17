export interface Review {
  id: string;
  // User info
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  // Service info (optionnel si review est dans contexte service)
  service?: {
    id: string;
    name: string;
  };
  // Rating
  rating: number; // 1-5
  // Texte
  comment: string;
  // Meta
  date: string; // ISO format
  isVerified?: boolean; // Achat vérifié
  helpfulCount?: number; // Nombre de "helpful"
  // Response du provider (optionnel)
  providerResponse?: {
    text: string;
    date: string;
  };
}

export interface ReviewCardProps extends Review {
  variant?: 'default' | 'compact';
  showService?: boolean; // Afficher info service
  onHelpful?: (reviewId: string) => void;
}
