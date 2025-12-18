/**
 * API Reservations GlamGo
 * Gestion des reservations, annulations, historique
 */

import apiClient from './client';
import { ENDPOINTS } from './endpoints';

// === TYPES ===

export type BookingStatus =
  | 'pending'        // En attente de confirmation
  | 'accepted'       // Acceptee par le prestataire
  | 'confirmed'      // Confirmee (alias de accepted)
  | 'on_way'         // Prestataire en route
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
  total: number;
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

// === BACKEND ORDER TYPE (format retourne par l'API) ===
interface BackendOrder {
  id: number;
  user_id: number;
  provider_id: number | null;
  service_id: number;
  status: string;
  scheduled_at: string | null;
  price: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Flat fields from JOIN
  service_name?: string;
  service_image?: string;
  service_description?: string;
  category_name?: string;
  provider_first_name?: string;
  provider_last_name?: string;
  provider_avatar?: string;
  provider_phone?: string;
  provider_rating?: number;
  provider_name?: string;
  address_line?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  completed_at?: string;
}

// === MAPPER: Backend Order -> Frontend Booking ===
function mapOrderToBooking(order: BackendOrder): Booking {
  // Parser scheduled_at pour extraire date et heure
  let date = '';
  let startTime = '';
  if (order.scheduled_at) {
    const scheduled = new Date(order.scheduled_at);
    date = scheduled.toISOString().split('T')[0]; // YYYY-MM-DD
    startTime = scheduled.toTimeString().substring(0, 5); // HH:MM
  } else {
    // Utiliser created_at comme fallback
    const created = new Date(order.created_at);
    date = created.toISOString().split('T')[0];
    startTime = created.toTimeString().substring(0, 5);
  }

  // Construire l'adresse complete
  const addressParts = [order.address_line, order.city].filter(Boolean);
  const address = addressParts.join(', ') || 'Adresse non disponible';

  // Construire le nom du prestataire
  const providerName = order.provider_name ||
    [order.provider_first_name, order.provider_last_name].filter(Boolean).join(' ') ||
    'Prestataire';

  return {
    id: order.id,
    user_id: order.user_id,
    provider_id: order.provider_id || 0,
    service_id: order.service_id,
    status: order.status as BookingStatus,
    date,
    start_time: startTime,
    duration_minutes: 60, // Default, a ajuster si disponible
    price: order.price,
    total: order.total || order.price,
    currency: 'MAD',
    address,
    latitude: order.latitude,
    longitude: order.longitude,
    notes: order.notes || undefined,
    cancellation_reason: order.cancellation_reason || undefined,
    cancelled_by: order.cancelled_by as 'user' | 'provider' | undefined,
    cancelled_at: order.cancelled_at || undefined,
    completed_at: order.completed_at || undefined,
    created_at: order.created_at,
    updated_at: order.updated_at,
    // Relations imbriquees
    service: {
      id: order.service_id,
      title: order.service_name || 'Service',
      thumbnail: order.service_image,
      category: order.category_name ? {
        id: 0,
        name: order.category_name,
        color: '#E91E63',
      } : undefined,
    },
    provider: order.provider_id ? {
      id: order.provider_id,
      name: providerName,
      avatar: order.provider_avatar,
      phone: order.provider_phone,
      rating: order.provider_rating || 0,
    } : undefined,
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
  const response = await apiClient.post<{ success: boolean; data: BackendOrder }>(
    ENDPOINTS.BOOKINGS.CREATE,
    data
  );
  return mapOrderToBooking(response.data.data);
};

/**
 * Recuperer toutes les reservations de l'utilisateur
 */
export const getBookings = async (params?: BookingListParams): Promise<PaginatedResponse<Booking>> => {
  const response = await apiClient.get<{ success: boolean; data: BackendOrder[] }>(
    ENDPOINTS.BOOKINGS.LIST,
    { params }
  );

  // Mapper les orders en bookings
  const bookings = response.data.data.map(mapOrderToBooking);

  // Retourner format pagine (le backend ne pagine pas actuellement)
  return {
    success: true,
    data: bookings,
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: bookings.length,
      total: bookings.length,
    },
  };
};

/**
 * Recuperer une reservation par ID
 */
export const getBookingById = async (id: number | string): Promise<Booking> => {
  const response = await apiClient.get<{ success: boolean; data: BackendOrder }>(
    ENDPOINTS.BOOKINGS.DETAIL(id)
  );
  return mapOrderToBooking(response.data.data);
};

/**
 * Recuperer les reservations a venir
 */
export const getUpcomingBookings = async (): Promise<Booking[]> => {
  // Le backend utilise le meme endpoint avec filtrage cote client
  const response = await apiClient.get<{ success: boolean; data: BackendOrder[] }>(
    ENDPOINTS.BOOKINGS.UPCOMING
  );

  const bookings = response.data.data.map(mapOrderToBooking);

  // Filtrer pour garder seulement les reservations actives
  const upcomingStatuses = ['pending', 'accepted', 'confirmed', 'on_way', 'in_progress'];
  return bookings.filter(b => upcomingStatuses.includes(b.status));
};

/**
 * Recuperer l'historique des reservations
 */
export const getBookingHistory = async (params?: BookingListParams): Promise<PaginatedResponse<Booking>> => {
  const response = await apiClient.get<{ success: boolean; data: BackendOrder[] }>(
    ENDPOINTS.BOOKINGS.HISTORY,
    { params }
  );

  const bookings = response.data.data.map(mapOrderToBooking);

  // Filtrer pour garder seulement les reservations passees
  const pastStatuses = ['completed', 'cancelled', 'rejected', 'no_show'];
  const filteredBookings = bookings.filter(b => pastStatuses.includes(b.status));

  return {
    success: true,
    data: filteredBookings,
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: filteredBookings.length,
      total: filteredBookings.length,
    },
  };
};

/**
 * Annuler une reservation
 */
export const cancelBooking = async (
  id: number | string,
  data?: CancelBookingData
): Promise<Booking> => {
  const response = await apiClient.patch<{ success: boolean; data?: BackendOrder; message?: string }>(
    ENDPOINTS.BOOKINGS.CANCEL(id),
    data
  );

  // Le backend peut retourner juste un message de succes
  if (response.data.data) {
    return mapOrderToBooking(response.data.data);
  }

  // Recharger la reservation pour avoir les donnees a jour
  return getBookingById(id);
};

/**
 * Confirmer une reservation (pour prestataire)
 */
export const confirmBooking = async (id: number | string): Promise<Booking> => {
  const response = await apiClient.patch<{ success: boolean; data?: BackendOrder }>(
    ENDPOINTS.BOOKINGS.CONFIRM(id)
  );

  if (response.data.data) {
    return mapOrderToBooking(response.data.data);
  }
  return getBookingById(id);
};

/**
 * Marquer une reservation comme terminee
 */
export const completeBooking = async (id: number | string): Promise<Booking> => {
  const response = await apiClient.patch<{ success: boolean; data?: BackendOrder }>(
    ENDPOINTS.BOOKINGS.COMPLETE(id)
  );

  if (response.data.data) {
    return mapOrderToBooking(response.data.data);
  }
  return getBookingById(id);
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
    accepted: 'Acceptee',
    confirmed: 'Confirmee',
    on_way: 'En route',
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
    accepted: '#3B82F6',     // Bleu
    confirmed: '#3B82F6',    // Bleu
    on_way: '#8B5CF6',       // Violet
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
