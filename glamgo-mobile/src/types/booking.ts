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
  label: string;
  color: 'warning' | 'success' | 'accent' | 'primary' | 'default' | 'error';
  description: string;
}> = {
  pending: { label: 'En attente', color: 'warning', description: 'En attente de confirmation' },
  accepted: { label: 'Accepte', color: 'success', description: 'Prestataire a confirme' },
  confirmed: { label: 'Confirme', color: 'success', description: 'Reservation confirmee' },
  on_way: { label: 'En route', color: 'accent', description: 'Prestataire en route' },
  arrived: { label: 'Arrive', color: 'accent', description: 'Prestataire est arrive' },
  in_progress: { label: 'En cours', color: 'primary', description: 'Service en cours' },
  completed_pending_review: { label: 'Avis en attente', color: 'warning', description: 'En attente de l\'avis client' },
  completed: { label: 'Termine', color: 'default', description: 'Service termine' },
  cancelled: { label: 'Annule', color: 'error', description: 'Reservation annulee' },
  rejected: { label: 'Refuse', color: 'error', description: 'Reservation refusee' },
  no_show: { label: 'Absent', color: 'error', description: 'Client absent' },
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
