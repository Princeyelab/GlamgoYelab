import { BookingStatus, BOOKING_STATUS_CONFIG } from '../../types/booking';

/**
 * Helper pour gerer les status de bookings
 */

// Obtenir config d'un status
export const getBookingStatusConfig = (status: BookingStatus) => {
  return BOOKING_STATUS_CONFIG[status] || BOOKING_STATUS_CONFIG['pending'];
};

// Verifier si un booking est modifiable
export const canCancelBooking = (status: BookingStatus): boolean => {
  return status === 'pending' || status === 'accepted';
};

// Verifier si peut contacter provider
export const canContactProvider = (status: BookingStatus): boolean => {
  return status !== 'cancelled' && status !== 'completed' && status !== 'completed_pending_review';
};

// Verifier si peut tracker provider
export const canTrackProvider = (status: BookingStatus): boolean => {
  return status === 'on_way' || status === 'arrived' || status === 'in_progress';
};

// Verifier si peut laisser un avis
export const canLeaveReview = (status: BookingStatus): boolean => {
  return status === 'completed_pending_review';
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

// Verifier si booking est actif (pas termine/annule)
export const isActiveBooking = (status: BookingStatus): boolean => {
  return status !== 'completed' && status !== 'completed_pending_review' && status !== 'cancelled';
};

// Obtenir le prochain status possible
export const getNextStatus = (status: BookingStatus): BookingStatus | null => {
  const flow: Record<BookingStatus, BookingStatus | null> = {
    pending: 'accepted',
    accepted: 'on_way',
    confirmed: 'on_way',
    on_way: 'arrived',
    arrived: 'in_progress',
    in_progress: 'completed_pending_review',
    completed_pending_review: 'completed',
    completed: null,
    cancelled: null,
    rejected: null,
    no_show: null,
  };
  return flow[status];
};
