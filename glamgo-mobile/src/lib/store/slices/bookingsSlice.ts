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
    try {
      const response = await getBookings();
      return response.data;
    } catch (error: any) {
      logError('fetchBookings', error);
      return rejectWithValue(handleAPIError(error));
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

/**
 * Creer une reservation
 */
export const createBooking = createAsyncThunk(
  'bookings/create',
  async (data: CreateBookingData, { rejectWithValue }) => {
    try {
      const booking = await apiCreateBooking(data);
      return booking;
    } catch (error: any) {
      logError('createBooking', error);
      return rejectWithValue(handleAPIError(error));
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
    ['pending', 'confirmed', 'in_progress'].includes(b.status)
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
