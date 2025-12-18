import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Service, Category } from '../../../types/service';

interface ServicesState {
  items: Service[];
  categories: Category[];
  favorites: number[];
  recentlyViewed: number[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: number | null;
}

const initialState: ServicesState = {
  items: [],
  categories: [],
  favorites: [],
  recentlyViewed: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedCategory: null,
};

// Async thunks
export const fetchServices = createAsyncThunk(
  'services/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Remplacer par vrai API call
      // const response = await api.get('/services');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      return [] as Service[];
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement services');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'services/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Remplacer par vrai API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return [] as Category[];
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Erreur chargement categories');
    }
  }
);

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setServices: (state, action: PayloadAction<Service[]>) => {
      state.items = action.payload;
    },
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
    toggleFavorite: (state, action: PayloadAction<number>) => {
      const serviceId = action.payload;
      const index = state.favorites.indexOf(serviceId);
      if (index > -1) {
        state.favorites.splice(index, 1);
      } else {
        state.favorites.push(serviceId);
      }
    },
    addToRecentlyViewed: (state, action: PayloadAction<number>) => {
      const serviceId = action.payload;
      // Retirer si deja present
      state.recentlyViewed = state.recentlyViewed.filter(id => id !== serviceId);
      // Ajouter en premier
      state.recentlyViewed.unshift(serviceId);
      // Limiter a 10
      if (state.recentlyViewed.length > 10) {
        state.recentlyViewed.pop();
      }
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<number | null>) => {
      state.selectedCategory = action.payload;
    },
    clearFavorites: (state) => {
      state.favorites = [];
    },
    clearRecentlyViewed: (state) => {
      state.recentlyViewed = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch services
    builder
      .addCase(fetchServices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setServices,
  setCategories,
  toggleFavorite,
  addToRecentlyViewed,
  setSearchQuery,
  setSelectedCategory,
  clearFavorites,
  clearRecentlyViewed,
} = servicesSlice.actions;

// Selectors
export const selectServices = (state: { services: ServicesState }) => state.services.items;
export const selectCategories = (state: { services: ServicesState }) => state.services.categories;
export const selectFavorites = (state: { services: ServicesState }) => state.services.favorites;
export const selectRecentlyViewed = (state: { services: ServicesState }) => state.services.recentlyViewed;
export const selectServicesLoading = (state: { services: ServicesState }) => state.services.isLoading;
export const selectSearchQuery = (state: { services: ServicesState }) => state.services.searchQuery;
export const selectSelectedCategory = (state: { services: ServicesState }) => state.services.selectedCategory;

export const selectIsFavorite = (serviceId: number) => (state: { services: ServicesState }) =>
  state.services.favorites.includes(serviceId);

export const selectFavoriteServices = (state: { services: ServicesState }) =>
  state.services.items.filter(s => state.services.favorites.includes(Number(s.id)));

export const selectFilteredServices = (state: { services: ServicesState }) => {
  let filtered = state.services.items;

  // Filtre par categorie
  if (state.services.selectedCategory) {
    filtered = filtered.filter(s => s.category?.id === state.services.selectedCategory);
  }

  // Filtre par recherche
  if (state.services.searchQuery) {
    const query = state.services.searchQuery.toLowerCase();
    filtered = filtered.filter(s =>
      s.title?.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query)
    );
  }

  return filtered;
};

export default servicesSlice.reducer;
