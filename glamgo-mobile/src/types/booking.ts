import { Service } from './service';
import { Provider } from './provider';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'on_way'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, {
  label: string;
  color: 'warning' | 'success' | 'accent' | 'primary' | 'default' | 'error';
  description: string;
}> = {
  pending: { label: 'En attente', color: 'warning', description: 'En attente de confirmation' },
  accepted: { label: 'Accepte', color: 'success', description: 'Prestataire a confirme' },
  on_way: { label: 'En route', color: 'accent', description: 'Prestataire en route' },
  in_progress: { label: 'En cours', color: 'primary', description: 'Service en cours' },
  completed: { label: 'Termine', color: 'default', description: 'Service termine' },
  cancelled: { label: 'Annule', color: 'error', description: 'Reservation annulee' }
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
  onCancel?: (id: number | string) => void;
  onContact?: (id: number | string) => void;
  onViewDetails?: (id: number | string) => void;
  onTrackProvider?: (id: number | string) => void;
}

export type OrderStatus = BookingStatus;
export type Order = Booking;
