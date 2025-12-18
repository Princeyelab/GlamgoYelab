import { BookingStatus, BOOKING_STATUS_CONFIG } from '../../types/booking';

/**
 * Helper pour gérer les status de bookings
 */

// Obtenir config d'un status
export const getBookingStatusConfig = (status: BookingStatus) => {
  return BOOKING_STATUS_CONFIG[status];
};

// Vérifier si un booking est modifiable
export const canCancelBooking = (status: BookingStatus): boolean => {
  return status === 'pending' || status === 'accepted';
};

// Vérifier si peut contacter provider
export const canContactProvider = (status: BookingStatus): boolean => {
  return status !== 'cancelled' && status !== 'completed';
};

// Vérifier si peut tracker provider
export const canTrackProvider = (status: BookingStatus): boolean => {
  return status === 'on_way' || status === 'in_progress';
};

// Vérifier si peut laisser un avis
export const canLeaveReview = (status: BookingStatus): boolean => {
  return status === 'completed';
};

// Mapper status → actions disponibles
export const getAvailableActions = (status: BookingStatus) => {
  return {
    canCancel: canCancelBooking(status),
    canContact: canContactProvider(status),
    canTrack: canTrackProvider(status),
    canReview: canLeaveReview(status),
  };
};

// Vérifier si booking est actif (pas terminé/annulé)
export const isActiveBooking = (status: BookingStatus): boolean => {
  return status !== 'completed' && status !== 'cancelled';
};

// Obtenir le prochain status possible
export const getNextStatus = (status: BookingStatus): BookingStatus | null => {
  const flow: Record<BookingStatus, BookingStatus | null> = {
    pending: 'accepted',
    accepted: 'on_way',
    on_way: 'in_progress',
    in_progress: 'completed',
    completed: null,
    cancelled: null,
  };
  return flow[status];
};
