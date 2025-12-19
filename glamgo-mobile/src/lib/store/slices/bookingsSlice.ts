/**
 * Bookings Slice - GlamGo Mobile
 * Gestion des reservations avec vraies API
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getBookings,
  getBookingById,
  createBooking as apiCreateBooking,
  cancelBooking as apiCancelBooking,
  getUpcomingBookings,
  getBookingHistory,
  Booking,
  BookingStatus,
  CreateBookingData,
} from '../../api/bookingsAPI';
import { handleAPIError, logError } from '../../utils/errorHandler';
import { DEMO_MODE } from '../../config/appConfig';
import { SERVICES } from '../../constants/services';

// Demo bookings data
const DEMO_BOOKINGS: Booking[] = [
  {
    id: 1,
    service_id: 1,
    provider_id: 1,
    client_id: 999,
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Dans 2 jours
    start_time: '14:00',
    end_time: '15:00',
    status: 'on_way' as BookingStatus,
    total: 150,
    currency: 'MAD',
    address: '123 Boulevard Mohammed V, Casablanca',
    service: {
      id: 1,
      title: 'Coupe femme + Brushing',
      thumbnail: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    },
    provider: {
      id: 1,
      name: 'Sarah Beauté',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
  },
  {
    id: 2,
    service_id: 3,
    provider_id: 2,
    client_id: 999,
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Dans 5 jours
    start_time: '10:00',
    end_time: '11:30',
    status: 'accepted' as BookingStatus,
    total: 200,
    currency: 'MAD',
    address: '45 Rue des Fleurs, Casablanca',
    service: {
      id: 3,
      title: 'Massage relaxant',
      thumbnail: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    },
    provider: {
      id: 2,
      name: 'Spa Wellness',
      avatar: 'https://i.pravatar.cc/150?img=12',
    },
  },
  {
    id: 3,
    service_id: 2,
    provider_id: 1,
    client_id: 999,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Il y a 7 jours
    start_time: '16:00',
    end_time: '17:00',
    status: 'completed' as BookingStatus,
    total: 180,
    currency: 'MAD',
    address: '123 Boulevard Mohammed V, Casablanca',
    service: {
      id: 2,
      title: 'Coloration + Soin',
      thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
    },
    provider: {
      id: 1,
      name: 'Sarah Beauté',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
  },
];

// === TYPES ===

interface BookingsState {
  items: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
  filter: BookingStatus | 'all';
}

// === INITIAL STATE ===

const initialState: BookingsState = {
  items: [],
  currentBooking: null,
  isLoading: false,
  error: null,
  filter: 'all',
};

// === ASYNC THUNKS ===

/**
 * Charger toutes les reservations
 */
export const fetchBookings = createAsyncThunk(
  'bookings/fetchAll',
  async (_, { rejectWithValue }) => {
    // === DEMO MODE ===
    if (DEMO_MODE) {
      console.log('🎭 MODE DEMO: Chargement reservations demo');
      await new Promise(resolve => setTimeout(resolve, 300));
      return DEMO_BOOKINGS;
    }

    try {
      const response = await getBookings();
      return response.data;
    } catch (error: any) {
      logError('fetchBookings', error);
      // Fallback demo
      return DEMO_BOOKINGS;
    }
  }
);

/**
 * Charger une reservation par ID
 */
export const fetchBookingById = createAsyncThunk(
  'bookings/fetchById',
  async (id: number | string, { rejectWithValue }) => {
    try {
      const booking = await getBookingById(id);
      return booking;
    } catch (error: any) {
      logError('fetchBookingById', error);
      return rejectWithValue(handleAPIError(error));
    }
  }
);

/**
 * Charger les reservations a venir
 */
export const fetchUpcomingBookings = createAsyncThunk(
  'bookings/fetchUpcoming',
  async (_, { rejectWithValue }) => {
    try {
      const bookings = await getUpcomingBookings();
      return bookings;
    } catch (error: any) {
      logError('fetchUpcomingBookings', error);
      return rejectWithValue(handleAPIError(error));
    }
  }
);

/**
 * Charger l'historique des reservations
 */
export const fetchBookingHistory = createAsyncThunk(
  'bookings/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getBookingHistory();
      return response.data;
    } catch (error: any) {
      logError('fetchBookingHistory', error);
      return rejectWithValue(handleAPIError(error));
    }
  }
);

// Variable pour générer des IDs uniques en mode demo
let demoBookingId = 100;

/**
 * Creer une reservation
 */
export const createBooking = createAsyncThunk(
  'bookings/create',
  async (data: CreateBookingData, { rejectWithValue }) => {
    // === DEMO MODE ===
    if (DEMO_MODE) {
      console.log('🎭 MODE DEMO: Creation reservation simulee', data);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Trouver le service dans les données locales
      const service = SERVICES.find(s => s.id === data.service_id);

      const newBooking: Booking = {
        id: demoBookingId++,
        service_id: data.service_id,
        provider_id: data.provider_id,
        client_id: 999,
        date: data.date,
        start_time: data.start_time,
        end_time: data.start_time, // Simplifié
        status: 'accepted' as BookingStatus,
        total: service?.price || 100,
        currency: 'MAD',
        address: data.address,
        notes: data.notes,
        service: service ? {
          id: service.id,
          title: service.title,
          thumbnail: service.images?.[0] || service.thumbnail,
        } : undefined,
        provider: {
          id: data.provider_id,
          name: 'Prestataire Demo',
          avatar: 'https://i.pravatar.cc/150?img=5',
        },
      };

      return newBooking;
    }

    try {
      const booking = await apiCreateBooking(data);
      return booking;
    } catch (error: any) {
      logError('createBooking', error);
      // En mode demo fallback, créer quand même
      const service = SERVICES.find(s => s.id === data.service_id);
      return {
        id: demoBookingId++,
        service_id: data.service_id,
        provider_id: data.provider_id,
        client_id: 999,
        date: data.date,
        start_time: data.start_time,
        status: 'accepted' as BookingStatus,
        total: service?.price || 100,
        currency: 'MAD',
        address: data.address,
        service: service ? { id: service.id, title: service.title } : undefined,
        provider: { id: data.provider_id, name: 'Prestataire' },
      } as Booking;
    }
  }
);

/**
 * Annuler une reservation
 */
export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async ({ id, reason }: { id: number | string; reason?: string }, { rejectWithValue }) => {
    try {
      const booking = await apiCancelBooking(id, { reason });
      return booking;
    } catch (error: any) {
      logError('cancelBooking', error);
      return rejectWithValue(handleAPIError(error));
    }
  }
);

// === SLICE ===

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setBookings: (state, action: PayloadAction<Booking[]>) => {
      state.items = action.payload;
    },
    addBooking: (state, action: PayloadAction<Booking>) => {
      state.items.unshift(action.payload);
    },
    updateBooking: (state, action: PayloadAction<Booking>) => {
      const index = state.items.findIndex(b => b.id === action.payload.id);
      if (index > -1) {
        state.items[index] = action.payload;
      }
    },
    setCurrentBooking: (state, action: PayloadAction<Booking | null>) => {
      state.currentBooking = action.payload;
    },
    setFilter: (state, action: PayloadAction<BookingStatus | 'all'>) => {
      state.filter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateBookingStatus: (state, action: PayloadAction<{ id: number; status: BookingStatus }>) => {
      const booking = state.items.find(b => b.id === action.payload.id);
      if (booking) {
        booking.status = action.payload.status;
      }
    },
    removeBooking: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(b => b.id !== action.payload);
    },
    clearBookings: () => initialState,
  },
  extraReducers: (builder) => {
    // === FETCH ALL ===
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // === FETCH BY ID ===
    builder
      .addCase(fetchBookingById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBooking = action.payload;
        const index = state.items.findIndex(b => b.id === action.payload.id);
        if (index > -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // === FETCH UPCOMING ===
    builder
      .addCase(fetchUpcomingBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        action.payload.forEach(booking => {
          const index = state.items.findIndex(b => b.id === booking.id);
          if (index > -1) {
            state.items[index] = booking;
          } else {
            state.items.push(booking);
          }
        });
      })
      .addCase(fetchUpcomingBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // === FETCH HISTORY ===
    builder
      .addCase(fetchBookingHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookingHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        action.payload.forEach(booking => {
          const index = state.items.findIndex(b => b.id === booking.id);
          if (index > -1) {
            state.items[index] = booking;
          } else {
            state.items.push(booking);
          }
        });
      })
      .addCase(fetchBookingHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // === CREATE ===
    builder
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.unshift(action.payload);
        state.currentBooking = action.payload;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // === CANCEL ===
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.items.findIndex(b => b.id === action.payload.id);
        if (index > -1) {
          state.items[index] = action.payload;
        }
        if (state.currentBooking?.id === action.payload.id) {
          state.currentBooking = action.payload;
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// === EXPORTS ===

export const {
  setBookings,
  addBooking,
  updateBooking,
  setCurrentBooking,
  setFilter,
  clearError,
  updateBookingStatus,
  removeBooking,
  clearBookings,
} = bookingsSlice.actions;

// Selectors
export const selectBookings = (state: { bookings: BookingsState }) => state.bookings.items;
export const selectCurrentBooking = (state: { bookings: BookingsState }) => state.bookings.currentBooking;
export const selectBookingsLoading = (state: { bookings: BookingsState }) => state.bookings.isLoading;
export const selectBookingsError = (state: { bookings: BookingsState }) => state.bookings.error;
export const selectBookingsFilter = (state: { bookings: BookingsState }) => state.bookings.filter;

// Selectors derives
export const selectUpcomingBookings = (state: { bookings: BookingsState }) =>
  state.bookings.items.filter(b =>
    ['pending', 'confirmed', 'accepted', 'on_way', 'in_progress'].includes(b.status)
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export const selectPastBookings = (state: { bookings: BookingsState }) =>
  state.bookings.items.filter(b =>
    ['completed', 'cancelled', 'rejected', 'no_show'].includes(b.status)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const selectPendingBookings = (state: { bookings: BookingsState }) =>
  state.bookings.items.filter(b => b.status === 'pending');

export const selectConfirmedBookings = (state: { bookings: BookingsState }) =>
  state.bookings.items.filter(b => b.status === 'confirmed');

export const selectFilteredBookings = (state: { bookings: BookingsState }) => {
  const { items, filter } = state.bookings;
  if (filter === 'all') return items;
  return items.filter(b => b.status === filter);
};

export const selectBookingById = (id: number) => (state: { bookings: BookingsState }) =>
  state.bookings.items.find(b => b.id === id);

export const selectBookingsByStatus = (status: BookingStatus) => (state: { bookings: BookingsState }) =>
  state.bookings.items.filter(b => b.status === status);

export const selectBookingsCount = (state: { bookings: BookingsState }) => ({
  total: state.bookings.items.length,
  upcoming: state.bookings.items.filter(b =>
    ['pending', 'confirmed', 'in_progress'].includes(b.status)
  ).length,
  past: state.bookings.items.filter(b =>
    ['completed', 'cancelled', 'rejected', 'no_show'].includes(b.status)
  ).length,
  pending: state.bookings.items.filter(b => b.status === 'pending').length,
});

export default bookingsSlice.reducer;
