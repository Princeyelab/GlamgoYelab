// ==========================================
// TYPES INDEX - Export centralisé
// ==========================================

// Service & Category
export type {
  Service,
  ServiceCardProps,
  Category,
  CategoryCardProps,
  ServiceCategory,
  ServiceProvider,
} from './service';

// Booking/Order
export type {
  BookingStatus,
  Booking,
  BookingCardProps,
  OrderStatus,
  Order,
} from './booking';
export { BOOKING_STATUS_CONFIG } from './booking';

// Provider
export type {
  Provider,
  ProviderCardProps,
  PriceBreakdown,
  DistanceCalculation,
  LegacyProviderCardProps,
} from './provider';

// Review
export type {
  Review,
  ReviewCardProps,
  LegacyReview,
} from './review';
