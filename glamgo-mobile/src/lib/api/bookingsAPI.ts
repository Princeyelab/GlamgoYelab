/**
 * API Reservations GlamGo
 * Gestion des reservations, annulations, historique
 */

import apiClient from './client';
import { ENDPOINTS } from './endpoints';

// === TYPES ===

export type BookingStatus =
  | 'pending'                   // En attente de confirmation
  | 'accepted'                  // Acceptee par le prestataire
  | 'confirmed'                 // Confirmee (alias de accepted)
  | 'on_way'                    // Prestataire en route
  | 'arrived'                   // Prestataire arrive, en attente de confirmation client
  | 'in_progress'               // En cours
  | 'completed_pending_review'  // Terminee, en attente d'avis client
  | 'completed'                 // Terminee avec avis
  | 'cancelled'                 // Annulee
  | 'rejected'                  // Refusee par le prestataire
  | 'no_show';                  // Client absent

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

// === HELPER: Extraire date et heure en heure locale ===
// Le backend stocke les dates sans timezone (ex: "2026-01-04 08:00:00")
// On doit les parser en local sans conversion UTC
function getLocalDateTime(dateStr: string): { date: string; time: string } {
  // Normaliser le format: remplacer espace par T pour un parsing cohérent
  // Ne PAS ajouter de 'Z' car la date est stockée en local, pas UTC
  const normalized = dateStr.replace(' ', 'T');
  const d = new Date(normalized);

  // Vérifier que la date est valide
  if (isNaN(d.getTime())) {
    console.warn('[getLocalDateTime] Invalid date:', dateStr);
    const now = new Date();
    return {
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    };
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

// === MAPPER: Backend Order -> Frontend Booking ===
function mapOrderToBooking(order: BackendOrder): Booking {
  // Parser scheduled_at pour extraire date et heure
  let date = '';
  let startTime = '';
  if (order.scheduled_at) {
    const local = getLocalDateTime(order.scheduled_at);
    date = local.date;
    startTime = local.time;
  } else {
    // Utiliser created_at comme fallback
    const local2 = getLocalDateTime(order.created_at);
    date = local2.date;
    startTime = local2.time;
  }

  // Construire l'adresse complete
  const addressParts = [order.address_line, order.city].filter(Boolean);
  const address = addressParts.join(', ') || 'Adresse non disponible';

  // Construire le nom du prestataire
  const providerName = order.provider_name ||
    [order.provider_first_name, order.provider_last_name].filter(Boolean).join(' ') ||
    'Prestataire';

  // Convertir les prix en nombres (API retourne des strings)
  const priceNum = typeof order.price === 'string' ? parseFloat(order.price) : (order.price || 0);
  const totalNum = typeof order.total === 'string' ? parseFloat(order.total) : (order.total || 0);
  // Utiliser price en priorite (total peut etre incorrect en base)
  const finalPrice = priceNum > 0 ? priceNum : totalNum;

  return {
    id: order.id,
    user_id: order.user_id,
    provider_id: order.provider_id || 0,
    service_id: order.service_id,
    status: order.status as BookingStatus,
    date,
    start_time: startTime,
    duration_minutes: 60, // Default, a ajuster si disponible
    price: finalPrice,
    total: finalPrice,
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
  service_id?: number;
  custom_service_id?: number;  // Pour les services personnalisés
  provider_id: number;
  date: string;           // Format: YYYY-MM-DD
  start_time: string;     // Format: HH:MM
  scheduled_at?: string;  // ISO datetime string pour le backend
  address: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  formula?: 'standard' | 'premium' | 'urgent' | 'recurring' | 'night';
  payment_method?: 'cash' | 'card' | 'bank_transfer';
  payment_method_id?: number;
  total_price?: number;
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
  try {
    console.log('[createBooking] Sending data:', JSON.stringify(data));
    const response = await apiClient.post<{ success: boolean; data: BackendOrder; message?: string }>(
      ENDPOINTS.BOOKINGS.CREATE,
      data
    );
    console.log('[createBooking] Response:', JSON.stringify(response.data));
    if (!response.data.data) {
      console.error('[createBooking] No data in response:', response.data);
      throw new Error(response.data.message || 'Erreur lors de la création');
    }
    return mapOrderToBooking(response.data.data);
  } catch (error: any) {
    console.error('[createBooking] Error:', error.message);
    console.error('[createBooking] Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Recuperer toutes les reservations de l'utilisateur
 */
export const getBookings = async (params?: BookingListParams): Promise<PaginatedResponse<Booking>> => {
  const response = await apiClient.get<{ success: boolean; data: BackendOrder[] }>(
    ENDPOINTS.BOOKINGS.LIST,
    { params }
  );

  // Debug: voir les donnees brutes
  if (response.data.data.length > 0) {
    const raw = response.data.data[0];
    console.log('[BookingsAPI] Raw order from backend:', {
      id: raw.id,
      price: raw.price,
      total: raw.total,
      address_line: raw.address_line,
      city: raw.city
    });
  }

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
  const upcomingStatuses = ['pending', 'accepted', 'confirmed', 'on_way', 'arrived', 'in_progress'];
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
  const response = await apiClient.patch<{ success: boolean; data?: any; message?: string }>(
    ENDPOINTS.BOOKINGS.CANCEL(id),
    data
  );

  // Le backend retourne un message de succes, pas les donnees de la commande
  // Verifier si c'est un objet order (a un id) ou juste un message
  if (response.data.data && response.data.data.id) {
    return mapOrderToBooking(response.data.data as BackendOrder);
  }

  // Si l'annulation a reussi, retourner une reservation avec status cancelled
  // sans refaire d'appel API (evite l'erreur "Date value out of bounds")
  if (response.data.success) {
    return {
      id: typeof id === 'string' ? parseInt(id, 10) : id,
      status: 'cancelled',
      serviceName: '',
      serviceImage: undefined,
      providerName: '',
      providerAvatar: undefined,
      date: new Date().toISOString(),
      time: '',
      address: '',
      price: 0,
      createdAt: new Date().toISOString(),
    };
  }

  throw new Error(response.data.message || 'Erreur lors de l\'annulation');
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

/**
 * Confirmer l'arrivee du prestataire (cote client)
 * Appele quand le prestataire signale qu'il est arrive et que le client confirme
 */
export const confirmProviderArrival = async (id: number | string): Promise<Booking> => {
  const response = await apiClient.patch<{ success: boolean; data?: BackendOrder }>(
    ENDPOINTS.BOOKINGS.CONFIRM_ARRIVAL(id)
  );

  if (response.data.data) {
    return mapOrderToBooking(response.data.data);
  }
  return getBookingById(id);
};

// === SATISFACTION ===

export interface SatisfactionData {
  quality_rating: number;                  // 1-5 (obligatoire)
  punctuality: boolean | null;             // Prestataire ponctuel?
  price_respected: boolean | null;         // Prix respecte?
  professionalism_rating?: number | null;  // 1-5 ou null (optionnel)
  comment?: string | null;                 // Commentaire libre
  tip?: number | null;                     // Pourboire en DH
}

export interface SatisfactionResponse {
  success: boolean;
  message: string;
  data: {
    order_id: number;
    status: string;
    review_id?: number;
    tip_amount?: number;
    payment_triggered?: boolean;
  };
}

/**
 * Soumettre le questionnaire de satisfaction
 * Endpoint: POST /api/orders/{id}/satisfaction
 * Body: { quality_rating, punctuality, price_respected, professionalism_rating?, comment?, tip? }
 */
export const submitSatisfaction = async (
  orderId: number | string,
  data: SatisfactionData
): Promise<SatisfactionResponse> => {
  const endpoint = ENDPOINTS.BOOKINGS.SATISFACTION(orderId);
  console.log('🔴 [API] submitSatisfaction - CALLING:', endpoint);
  console.log('🔴 [API] submitSatisfaction - orderId:', orderId, 'type:', typeof orderId);
  console.log('🔴 [API] submitSatisfaction - data:', JSON.stringify(data));

  // Format attendu par le backend SatisfactionController
  const satisfactionData = {
    quality_rating: data.quality_rating,
    punctuality: data.punctuality ?? true,        // Requis par le backend
    price_respected: data.price_respected ?? true, // Requis par le backend
    professionalism_rating: data.professionalism_rating || null,
    comment: data.comment || null,
    tip: data.tip || 0,
  };

  console.log('🔴 [API] submitSatisfaction - sending:', JSON.stringify(satisfactionData));

  try {
    const response = await apiClient.post<SatisfactionResponse>(
      endpoint,
      satisfactionData
    );
    console.log('🟢 [API] submitSatisfaction - SUCCESS:', JSON.stringify(response.data));
    return response.data;
  } catch (error: any) {
    console.log('🔴 [API] submitSatisfaction - ERROR STATUS:', error?.response?.status);
    console.log('🔴 [API] submitSatisfaction - ERROR DATA:', JSON.stringify(error?.response?.data));
    console.log('🔴 [API] submitSatisfaction - ERROR MESSAGE:', error?.message);
    console.log('🔴 [API] submitSatisfaction - FULL URL:', apiClient.defaults.baseURL + endpoint);
    throw error;
  }
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
    arrived: 'Arrive',
    in_progress: 'En cours',
    completed_pending_review: 'Avis en attente',
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
    pending: '#F59E0B',                // Orange
    accepted: '#3B82F6',               // Bleu
    confirmed: '#3B82F6',              // Bleu
    on_way: '#8B5CF6',                 // Violet
    arrived: '#10B981',                // Vert - prestataire arrive
    in_progress: '#8B5CF6',            // Violet
    completed_pending_review: '#F59E0B', // Orange - action requise
    completed: '#10B981',              // Vert
    cancelled: '#EF4444',              // Rouge
    rejected: '#EF4444',               // Rouge
    no_show: '#6B7280',                // Gris
  };
  return statusColors[status] || '#6B7280';
};

/**
 * Verifier si une reservation peut etre annulee
 */
export const canCancelBooking = (booking: Booking): boolean => {
  // Statuts annulables: pending, confirmed, accepted, on_way
  // Bloque pour: arrived, in_progress, completed, cancelled
  const cancellableStatuses: BookingStatus[] = ['pending', 'confirmed', 'accepted', 'on_way'];
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
  confirmProviderArrival,
  submitSatisfaction,
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
