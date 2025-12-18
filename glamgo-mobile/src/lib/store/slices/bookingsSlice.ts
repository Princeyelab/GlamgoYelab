import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Booking, BookingStatus } from '../../../types/booking';

interface BookingsState {
  items: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BookingsState = {
  items: [],
  currentBooking: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchBookings = createAsyncThunk(
  'bookings/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Remplacer par vrai API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [] as Booking[];
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement reservations');
    }
  }
);

export const createBooking = createAsyncThunk(
  'bookings/create',
  async (bookingData: Partial<Booking>, { rejectWithValue }) => {
    try {
      // TODO: Remplacer par vrai API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock response
      return {
        id: Date.now(),
        ...bookingData,
        status: 'pending' as BookingStatus,
        created_at: new Date().toISOString(),
      } as Booking;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Erreur creation reservation');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async (bookingId: number, { rejectWithValue }) => {
    try {
      // TODO: Remplacer par vrai API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return bookingId;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Erreur annulation');
    }
  }
);

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
    updateBookingStatus: (state, action: PayloadAction<{ id: number; status: BookingStatus }>) => {
      const booking = state.items.find(b => b.id === action.payload.id);
      if (booking) {
        booking.status = action.payload.status;
      }
    },
    removeBooking: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(b => b.id !== action.payload);
    },
    setCurrentBooking: (state, action: PayloadAction<Booking | null>) => {
      state.currentBooking = action.payload;
    },
    clearBookings: (state) => {
      state.items = [];
      state.currentBooking = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch bookings
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

    // Create booking
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

    // Cancel booking
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        const booking = state.items.find(b => b.id === action.payload);
        if (booking) {
          booking.status = 'cancelled';
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setBookings,
  addBooking,
  updateBooking,
  updateBookingStatus,
  removeBooking,
  setCurrentBooking,
  clearBookings,
} = bookingsSlice.actions;

// Selectors
export const selectBookings = (state: { bookings: BookingsState }) => state.bookings.items;
export const selectCurrentBooking = (state: { bookings: BookingsState }) => state.bookings.currentBooking;
export const selectBookingsLoading = (state: { bookings: BookingsState }) => state.bookings.isLoading;
export const selectBookingsError = (state: { bookings: BookingsState }) => state.bookings.error;

export const selectUpcomingBookings = (state: { bookings: BookingsState }) =>
  state.bookings.items.filter(b =>
    b.status === 'pending' ||
    b.status === 'accepted' ||
    b.status === 'on_way' ||
    b.status === 'in_progress'
  );

export const selectPastBookings = (state: { bookings: BookingsState }) =>
  state.bookings.items.filter(b =>
    b.status === 'completed' ||
    b.status === 'cancelled'
  );

export const selectBookingById = (id: number) => (state: { bookings: BookingsState }) =>
  state.bookings.items.find(b => b.id === id);

export const selectBookingsByStatus = (status: BookingStatus) => (state: { bookings: BookingsState }) =>
  state.bookings.items.filter(b => b.status === status);

export default bookingsSlice.reducer;
