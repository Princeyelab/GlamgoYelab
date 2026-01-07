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
import { isOrderCancelled, getCancelledOrderIds } from '../../utils/cancelledOrdersCache';
import { isOrderSatisfied, getSatisfiedOrderIds } from '../../utils/satisfiedOrdersCache';

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
  // IDs des commandes annulées localement (pour éviter qu'elles réapparaissent après refresh)
  locallyCancelledIds: number[];
  // Statuts mis à jour localement (pour éviter l'écrasement par l'API)
  localStatusOverrides: Record<number, BookingStatus>;
}

// === INITIAL STATE ===

const initialState: BookingsState = {
  items: [],
  currentBooking: null,
  isLoading: false,
  error: null,
  filter: 'all',
  locallyCancelledIds: [],
  localStatusOverrides: {},
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
      console.log('[BookingsSlice] Fetching bookings from API...');
      const response = await getBookings();
      console.log('[BookingsSlice] API returned', response.data.length, 'bookings');
      // Debug: verifier les prix et adresses
      if (response.data.length > 0) {
        const sample = response.data[0];
        console.log('[BookingsSlice] Sample booking:', {
          id: sample.id,
          price: sample.price,
          total: sample.total,
          address: sample.address,
          status: sample.status
        });
      }
      return response.data;
    } catch (error: any) {
      console.error('[BookingsSlice] API Error:', error.message || error);
      logError('fetchBookings', error);
      // Retourner tableau vide au lieu de demo data
      return [];
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
export const createBooking = createAsyncThunk<Booking, CreateBookingData, { rejectValue: string }>(
  'bookings/create',
  async (data, { rejectWithValue }) => {
    console.log('[bookingsSlice] createBooking thunk called with:', JSON.stringify(data));
    console.log('[bookingsSlice] DEMO_MODE:', DEMO_MODE);

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
      console.log('[bookingsSlice] Calling apiCreateBooking...');
      const booking = await apiCreateBooking(data);
      console.log('[bookingsSlice] apiCreateBooking returned:', booking?.id);
      return booking;
    } catch (error: any) {
      console.error('[bookingsSlice] API error:', error.message);
      console.error('[bookingsSlice] Error details:', JSON.stringify({
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      }));
      logError('createBooking', error);

      // NE PAS créer de fallback - propager l'erreur
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Erreur lors de la création de la réservation';
      return rejectWithValue(errorMessage);
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
      // Safety check
      if (!state.locallyCancelledIds) state.locallyCancelledIds = [];
      // Filtrer les bookings annulés localement
      state.items = action.payload.filter(booking => {
        if (state.locallyCancelledIds.includes(booking.id)) {
          console.log('[BookingsSlice] setBookings: Filtering cancelled booking:', booking.id);
          return false;
        }
        return true;
      });
    },
    addBooking: (state, action: PayloadAction<Booking>) => {
      // Safety check
      if (!state.locallyCancelledIds) state.locallyCancelledIds = [];
      // Ne JAMAIS réajouter un booking annulé localement
      if (state.locallyCancelledIds.includes(action.payload.id)) {
        console.log('[BookingsSlice] addBooking: Ignoring cancelled booking:', action.payload.id);
        return;
      }
      state.items.unshift(action.payload);
    },
    updateBooking: (state, action: PayloadAction<Booking>) => {
      // Safety check
      if (!state.locallyCancelledIds) state.locallyCancelledIds = [];
      // Ne JAMAIS mettre à jour un booking annulé localement
      if (state.locallyCancelledIds.includes(action.payload.id)) {
        console.log('[BookingsSlice] updateBooking: Ignoring cancelled booking:', action.payload.id);
        return;
      }
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
      const { id, status } = action.payload;

      // Safety checks pour état persisté avant migration
      if (!state.localStatusOverrides) state.localStatusOverrides = {};
      if (!state.locallyCancelledIds) state.locallyCancelledIds = [];

      // IMPORTANT: Ne JAMAIS écraser un statut 'cancelled' avec un autre statut
      // (évite que le polling réactive une commande annulée)
      if (state.locallyCancelledIds.includes(id) && status !== 'cancelled') {
        console.log('[BookingsSlice] Ignoring status update for cancelled booking:', id, status);
        return;
      }

      // Si annulé, SUPPRIMER le booking de la liste ET l'ajouter aux annulations locales
      if (status === 'cancelled') {
        console.log('[BookingsSlice] Removing cancelled booking from items:', id);
        state.items = state.items.filter(b => b.id !== id);
        if (!state.locallyCancelledIds.includes(id)) {
          state.locallyCancelledIds.push(id);
        }
        state.localStatusOverrides[id] = status;
        return;
      }

      // Pour les autres statuts, mettre à jour normalement
      const booking = state.items.find(b => b.id === id);
      if (booking) {
        booking.status = status;
      }
      // Sauvegarder le statut local pour éviter l'écrasement par l'API
      state.localStatusOverrides[id] = status;
    },
    // Nettoyer les overrides quand l'API confirme le statut
    clearLocalOverride: (state, action: PayloadAction<number>) => {
      if (state.localStatusOverrides) {
        delete state.localStatusOverrides[action.payload];
      }
      if (state.locallyCancelledIds) {
        state.locallyCancelledIds = state.locallyCancelledIds.filter(id => id !== action.payload);
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
        // Appliquer les données de l'API
        let items = action.payload;

        // Safety checks pour état persisté avant migration
        if (!state.localStatusOverrides) state.localStatusOverrides = {};
        if (!state.locallyCancelledIds) state.locallyCancelledIds = [];

        // Récupérer les IDs annulés du cache AsyncStorage (plus fiable)
        const asyncCancelledIds = getCancelledOrderIds();

        // IMPORTANT: Supprimer COMPLÈTEMENT les bookings annulés (Redux OU AsyncStorage)
        items = items.filter(booking => {
          // Vérifier Redux state
          if (state.locallyCancelledIds.includes(booking.id)) {
            console.log('[BookingsSlice] Filtering out cancelled booking (Redux):', booking.id);
            return false;
          }
          // Vérifier AsyncStorage cache
          if (asyncCancelledIds.includes(booking.id)) {
            console.log('[BookingsSlice] Filtering out cancelled booking (AsyncStorage):', booking.id);
            return false;
          }
          return true;
        });

        // Appliquer les statuts locaux (pour éviter que l'API écrase les changements récents)
        items = items.map(booking => {
          const localStatus = state.localStatusOverrides[booking.id];
          if (localStatus) {
            // Si l'API confirme le même statut, nettoyer l'override
            if (booking.status === localStatus) {
              delete state.localStatusOverrides[booking.id];
            }
            return { ...booking, status: localStatus };
          }
          return booking;
        });

        state.items = items;
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
        // Safety check
        if (!state.locallyCancelledIds) state.locallyCancelledIds = [];
        // Ne JAMAIS réajouter un booking annulé localement
        if (state.locallyCancelledIds.includes(action.payload.id)) {
          console.log('[BookingsSlice] fetchBookingById: Ignoring cancelled booking:', action.payload.id);
          return;
        }
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
        // Safety check
        if (!state.locallyCancelledIds) state.locallyCancelledIds = [];
        action.payload.forEach(booking => {
          // Ne JAMAIS réajouter un booking annulé localement
          if (state.locallyCancelledIds.includes(booking.id)) {
            console.log('[BookingsSlice] fetchUpcomingBookings: Ignoring cancelled booking:', booking.id);
            return;
          }
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
        // Safety check
        if (!state.locallyCancelledIds) state.locallyCancelledIds = [];
        action.payload.forEach(booking => {
          // Ne JAMAIS réajouter un booking annulé localement
          if (state.locallyCancelledIds.includes(booking.id)) {
            console.log('[BookingsSlice] fetchBookingHistory: Ignoring cancelled booking:', booking.id);
            return;
          }
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
        // Safety checks pour état persisté avant migration
        if (!state.localStatusOverrides) state.localStatusOverrides = {};
        if (!state.locallyCancelledIds) state.locallyCancelledIds = [];
        // Ajouter aux annulations locales pour éviter réapparition
        if (!state.locallyCancelledIds.includes(action.payload.id)) {
          state.locallyCancelledIds.push(action.payload.id);
        }
        state.localStatusOverrides[action.payload.id] = 'cancelled';
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
  clearLocalOverride,
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
// Filtrer les reservations des 7 derniers jours seulement
const DAYS_TO_SHOW = 7;
const getDateThreshold = () => {
  const date = new Date();
  date.setDate(date.getDate() - DAYS_TO_SHOW);
  return date;
};

export const selectUpcomingBookings = (state: { bookings: BookingsState }) => {
  // Pour "A venir": commandes actives recentes (derniers 7 jours ou futures)
  // Inclut completed_pending_review pour que le client puisse evaluer
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Safety check pour locallyCancelledIds (peut être undefined si state persisté avant migration)
  const cancelledIds = state.bookings.locallyCancelledIds || [];
  // AUSSI vérifier le cache AsyncStorage (plus fiable, survit au reload)
  const asyncCancelledIds = getCancelledOrderIds();
  // Récupérer les IDs des commandes déjà évaluées (pour les masquer de "À venir")
  const satisfiedIds = getSatisfiedOrderIds();

  return state.bookings.items.filter(b => {
    // IMPORTANT: Exclure les commandes annulées localement (Redux OU AsyncStorage)
    if (cancelledIds.includes(b.id)) {
      return false;
    }
    // Vérifier aussi le cache AsyncStorage
    if (asyncCancelledIds.includes(b.id)) {
      console.log('[selectUpcomingBookings] Filtering order from AsyncStorage cache:', b.id);
      return false;
    }
    // Exclure les commandes déjà évaluées (satisfaction soumise)
    if (satisfiedIds.includes(b.id)) {
      console.log('[selectUpcomingBookings] Filtering satisfied order:', b.id);
      return false;
    }
    if (!['pending', 'confirmed', 'accepted', 'on_way', 'arrived', 'in_progress', 'completed_pending_review'].includes(b.status)) {
      return false;
    }
    // Garder si date >= 7 jours avant (inclut futures et recentes)
    const bookingDate = new Date(b.date);
    return bookingDate >= sevenDaysAgo;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const selectPastBookings = (state: { bookings: BookingsState }) => {
  const threshold = getDateThreshold();
  return state.bookings.items.filter(b =>
    ['completed_pending_review', 'completed', 'cancelled', 'rejected', 'no_show'].includes(b.status) &&
    new Date(b.date) >= threshold
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

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

export const selectBookingsCount = (state: { bookings: BookingsState }) => {
  const pastThreshold = getDateThreshold();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return {
    total: state.bookings.items.length,
    upcoming: state.bookings.items.filter(b =>
      ['pending', 'confirmed', 'accepted', 'on_way', 'arrived', 'in_progress'].includes(b.status) &&
      new Date(b.date) >= sevenDaysAgo
    ).length,
    past: state.bookings.items.filter(b =>
      ['completed_pending_review', 'completed', 'cancelled', 'rejected', 'no_show'].includes(b.status) &&
      new Date(b.date) >= pastThreshold
    ).length,
    pending: state.bookings.items.filter(b => b.status === 'pending').length,
  };
};

export default bookingsSlice.reducer;
