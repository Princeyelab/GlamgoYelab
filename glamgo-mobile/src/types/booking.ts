import { Service } from './service';
import { Provider } from './provider';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'confirmed'
  | 'on_way'
  | 'arrived'
  | 'in_progress'
  | 'completed_pending_review'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'no_show';

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, {
  labelKey: string;
  color: 'warning' | 'success' | 'accent' | 'primary' | 'default' | 'error';
  descriptionKey: string;
}> = {
  pending: { labelKey: 'bookingStatus.pending', color: 'warning', descriptionKey: 'bookingStatus.pendingDesc' },
  accepted: { labelKey: 'bookingStatus.accepted', color: 'success', descriptionKey: 'bookingStatus.acceptedDesc' },
  confirmed: { labelKey: 'bookingStatus.confirmed', color: 'success', descriptionKey: 'bookingStatus.confirmedDesc' },
  on_way: { labelKey: 'bookingStatus.onWay', color: 'accent', descriptionKey: 'bookingStatus.onWayDesc' },
  arrived: { labelKey: 'bookingStatus.arrived', color: 'accent', descriptionKey: 'bookingStatus.arrivedDesc' },
  in_progress: { labelKey: 'bookingStatus.inProgress', color: 'primary', descriptionKey: 'bookingStatus.inProgressDesc' },
  completed_pending_review: { labelKey: 'bookingStatus.pendingReview', color: 'warning', descriptionKey: 'bookingStatus.pendingReviewDesc' },
  completed: { labelKey: 'bookingStatus.completed', color: 'default', descriptionKey: 'bookingStatus.completedDesc' },
  cancelled: { labelKey: 'bookingStatus.cancelled', color: 'error', descriptionKey: 'bookingStatus.cancelledDesc' },
  rejected: { labelKey: 'bookingStatus.rejected', color: 'error', descriptionKey: 'bookingStatus.rejectedDesc' },
  no_show: { labelKey: 'bookingStatus.noShow', color: 'error', descriptionKey: 'bookingStatus.noShowDesc' },
};

export interface Booking {
  id: number;
  order_number?: string;
  user_id: number;
  service_id: number;
  service?: Service;
  provider_id: number;
  provider?: Provider;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  subtotal: number;
  total: number;
  currency?: string;
  address: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingCardProps {
  id: number | string;
  service?: {
    id: number | string;
    title?: string;
    name?: string;
    thumbnail?: string;
    image?: string;
  };
  provider?: {
    id: number | string;
    name: string;
    avatar?: string;
    profile_photo?: string;
  };
  booking_date?: string;
  booking_time?: string;
  total?: number;
  date?: string;
  time?: string;
  price?: number;
  status: BookingStatus | 'confirmed';
  currency?: string;
  address?: string;
  notes?: string;
  variant?: 'upcoming' | 'past';
  // Cancellation info
  cancellation_reason?: string;
  cancelled_by?: 'client' | 'provider';
  cancelled_at?: string;
  cancellation_fee?: number;
  onCancel?: (id: number | string) => void;
  onContact?: (id: number | string) => void;
  onViewDetails?: (id: number | string) => void;
  onTrackProvider?: (id: number | string) => void;
  onReview?: (id: number | string) => void;
}

export type OrderStatus = BookingStatus;
export type Order = Booking;
