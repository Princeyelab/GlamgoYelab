/**
 * API Reservations GlamGo
 * Gestion des reservations, annulations, historique
 */

import apiClient from './client';
import { ENDPOINTS } from './endpoints';

// === TYPES ===

export type BookingStatus =
  | 'pending'        // En attente de confirmation
  | 'confirmed'      // Confirmee par le prestataire
  | 'in_progress'    // En cours
  | 'completed'      // Terminee
  | 'cancelled'      // Annulee
  | 'rejected'       // Refusee par le prestataire
  | 'no_show';       // Client absent

export interface Booking {
  id: number;
  user_id: number;
  provider_id: number;
  service_id: number;
  status: BookingStatus;
  date: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  price: number;
  final_price?: number;
  currency: string;
  address: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  cancellation_reason?: string;
  cancelled_by?: 'user' | 'provider';
  cancelled_at?: string;
  completed_at?: string;
  rating?: number;
  review_id?: number;
  created_at: string;
  updated_at: string;
  // Relations
  service?: {
    id: number;
    title: string;
    thumbnail?: string;
    category?: {
      id: number;
      name: string;
      color: string;
    };
  };
  provider?: {
    id: number;
    name: string;
    avatar?: string;
    phone?: string;
    rating: number;
  };
  user?: {
    id: number;
    name: string;
    avatar?: string;
    phone?: string;
  };
}

export interface CreateBookingData {
  service_id: number;
  provider_id: number;
  date: string;           // Format: YYYY-MM-DD
  start_time: string;     // Format: HH:MM
  address: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  payment_method_id?: number;
  promo_code?: string;
}

export interface BookingListParams {
  status?: BookingStatus;
  page?: number;
  limit?: number;
  from_date?: string;
  to_date?: string;
}

export interface CancelBookingData {
  reason?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data: Booking;
}

// === API FUNCTIONS ===

/**
 * Creer une nouvelle reservation
 */
export const createBooking = async (data: CreateBookingData): Promise<Booking> => {
  const response = await apiClient.post<BookingResponse>(
    ENDPOINTS.BOOKINGS.CREATE,
    data
  );
  return response.data.data;
};

/**
 * Recuperer toutes les reservations de l'utilisateur
 */
export const getBookings = async (params?: BookingListParams): Promise<PaginatedResponse<Booking>> => {
  const response = await apiClient.get<PaginatedResponse<Booking>>(
    ENDPOINTS.BOOKINGS.LIST,
    { params }
  );
  return response.data;
};

/**
 * Recuperer une reservation par ID
 */
export const getBookingById = async (id: number | string): Promise<Booking> => {
  const response = await apiClient.get<{ success: boolean; data: Booking }>(
    ENDPOINTS.BOOKINGS.DETAIL(id)
  );
  return response.data.data;
};

/**
 * Recuperer les reservations a venir
 */
export const getUpcomingBookings = async (): Promise<Booking[]> => {
  const response = await apiClient.get<{ success: boolean; data: Booking[] }>(
    ENDPOINTS.BOOKINGS.UPCOMING
  );
  return response.data.data;
};

/**
 * Recuperer l'historique des reservations
 */
export const getBookingHistory = async (params?: BookingListParams): Promise<PaginatedResponse<Booking>> => {
  const response = await apiClient.get<PaginatedResponse<Booking>>(
    ENDPOINTS.BOOKINGS.HISTORY,
    { params }
  );
  return response.data;
};

/**
 * Annuler une reservation
 */
export const cancelBooking = async (
  id: number | string,
  data?: CancelBookingData
): Promise<Booking> => {
  const response = await apiClient.post<BookingResponse>(
    ENDPOINTS.BOOKINGS.CANCEL(id),
    data
  );
  return response.data.data;
};

/**
 * Confirmer une reservation (pour prestataire)
 */
export const confirmBooking = async (id: number | string): Promise<Booking> => {
  const response = await apiClient.post<BookingResponse>(
    ENDPOINTS.BOOKINGS.CONFIRM(id)
  );
  return response.data.data;
};

/**
 * Marquer une reservation comme terminee
 */
export const completeBooking = async (id: number | string): Promise<Booking> => {
  const response = await apiClient.post<BookingResponse>(
    ENDPOINTS.BOOKINGS.COMPLETE(id)
  );
  return response.data.data;
};

// === AVIS ===

export interface CreateReviewData {
  booking_id: number;
  rating: number;          // 1-5
  comment?: string;
}

export interface Review {
  id: number;
  booking_id: number;
  user_id: number;
  provider_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    avatar?: string;
  };
}

/**
 * Creer un avis pour une reservation
 */
export const createReview = async (data: CreateReviewData): Promise<Review> => {
  const response = await apiClient.post<{ success: boolean; data: Review }>(
    ENDPOINTS.REVIEWS.CREATE,
    data
  );
  return response.data.data;
};

/**
 * Recuperer mes avis
 */
export const getMyReviews = async (): Promise<Review[]> => {
  const response = await apiClient.get<{ success: boolean; data: Review[] }>(
    ENDPOINTS.REVIEWS.MY_REVIEWS
  );
  return response.data.data;
};

// === FAVORIS ===

export interface Favorite {
  id: number;
  user_id: number;
  service_id: number;
  created_at: string;
  service?: {
    id: number;
    title: string;
    price: number;
    thumbnail?: string;
    rating: number;
  };
}

/**
 * Recuperer les favoris
 */
export const getFavorites = async (): Promise<Favorite[]> => {
  const response = await apiClient.get<{ success: boolean; data: Favorite[] }>(
    ENDPOINTS.FAVORITES.LIST
  );
  return response.data.data;
};

/**
 * Ajouter un service aux favoris
 */
export const addFavorite = async (serviceId: number): Promise<Favorite> => {
  const response = await apiClient.post<{ success: boolean; data: Favorite }>(
    ENDPOINTS.FAVORITES.ADD,
    { service_id: serviceId }
  );
  return response.data.data;
};

/**
 * Retirer un service des favoris
 */
export const removeFavorite = async (favoriteId: number): Promise<void> => {
  await apiClient.delete(ENDPOINTS.FAVORITES.REMOVE(favoriteId));
};

/**
 * Toggle un favori (ajouter/retirer)
 */
export const toggleFavorite = async (serviceId: number): Promise<{ isFavorite: boolean }> => {
  const response = await apiClient.post<{ success: boolean; data: { is_favorite: boolean } }>(
    ENDPOINTS.FAVORITES.TOGGLE,
    { service_id: serviceId }
  );
  return { isFavorite: response.data.data.is_favorite };
};

// === HELPERS ===

/**
 * Formater le statut en francais
 */
export const formatBookingStatus = (status: BookingStatus): string => {
  const statusLabels: Record<BookingStatus, string> = {
    pending: 'En attente',
    confirmed: 'Confirmee',
    in_progress: 'En cours',
    completed: 'Terminee',
    cancelled: 'Annulee',
    rejected: 'Refusee',
    no_show: 'Absent',
  };
  return statusLabels[status] || status;
};

/**
 * Obtenir la couleur du statut
 */
export const getBookingStatusColor = (status: BookingStatus): string => {
  const statusColors: Record<BookingStatus, string> = {
    pending: '#F59E0B',      // Orange
    confirmed: '#3B82F6',    // Bleu
    in_progress: '#8B5CF6',  // Violet
    completed: '#10B981',    // Vert
    cancelled: '#EF4444',    // Rouge
    rejected: '#EF4444',     // Rouge
    no_show: '#6B7280',      // Gris
  };
  return statusColors[status] || '#6B7280';
};

/**
 * Verifier si une reservation peut etre annulee
 */
export const canCancelBooking = (booking: Booking): boolean => {
  const cancellableStatuses: BookingStatus[] = ['pending', 'confirmed'];
  return cancellableStatuses.includes(booking.status);
};

/**
 * Verifier si une reservation peut etre notee
 */
export const canReviewBooking = (booking: Booking): boolean => {
  return booking.status === 'completed' && !booking.review_id;
};

// Export par defaut
export default {
  // Bookings
  createBooking,
  getBookings,
  getBookingById,
  getUpcomingBookings,
  getBookingHistory,
  cancelBooking,
  confirmBooking,
  completeBooking,
  // Reviews
  createReview,
  getMyReviews,
  // Favorites
  getFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  // Helpers
  formatBookingStatus,
  getBookingStatusColor,
  canCancelBooking,
  canReviewBooking,
};
