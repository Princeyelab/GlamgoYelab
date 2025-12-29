/**
 * Services Slice - GlamGo Mobile
 * Gestion services et categories avec vraies API
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Service, Category } from '../../../types/service';
import {
  getServices,
  getServiceById,
  searchServices as apiSearchServices,
  getCategories,
  ServicesListParams,
} from '../../api/servicesAPI';
import { handleAPIError, logError } from '../../utils/errorHandler';

const FAVORITES_STORAGE_KEY = '@glamgo_favorites';

// === TYPES ===

interface ServicesState {
  items: Service[];
  categories: Category[];
  favorites: number[];
  recentlyViewed: number[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: number | null;
  currentService: Service | null;
  useLocalData: boolean;
}

// === INITIAL STATE ===

const initialState: ServicesState = {
  items: [],
  categories: [],
  favorites: [],
  recentlyViewed: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedCategory: null,
  currentService: null,
  useLocalData: false,
};

// === ASYNC THUNKS ===

/**
 * Charger tous les services
 */
export const fetchServices = createAsyncThunk(
  'services/fetchAll',
  async (params: ServicesListParams | undefined, { rejectWithValue }) => {
    try {
      console.log('[fetchServices] Fetching from API...');
      const response = await getServices(params);
      console.log('[fetchServices] Got', response.data.length, 'services from API');
      return {
        services: response.data,
        useLocalData: false,
      };
    } catch (error: any) {
      logError('fetchServices', error);
      console.error('[fetchServices] API Error:', error.message);
      // Retourner erreur au lieu de fallback (IDs locaux incorrects)
      return rejectWithValue('Erreur de chargement des services');
    }
  }
);

/**
 * Charger un service par ID
 * Utilise uniquement l'API (les IDs locaux ne correspondent pas)
 */
export const fetchServiceById = createAsyncThunk(
  'services/fetchById',
  async (id: number | string, { rejectWithValue }) => {
    try {
      console.log('[fetchServiceById] Loading service', id, 'from API...');
      const service = await getServiceById(id);
      return service;
    } catch (error: any) {
      logError('fetchServiceById', error);
      return rejectWithValue(handleAPIError(error));
    }
  }
);

/**
 * Rechercher des services
 * Utilise uniquement l'API (les IDs locaux ne correspondent pas)
 */
export const searchServicesAsync = createAsyncThunk(
  'services/search',
  async (query: string, { rejectWithValue, getState }) => {
    try {
      console.log('[searchServices] Searching for:', query);
      const response = await apiSearchServices(query);
      return response.data;
    } catch (error: any) {
      logError('searchServices', error);
      return rejectWithValue('Erreur lors de la recherche');
    }
  }
);

/**
 * Charger les categories
 * Utilise uniquement l'API
 */
export const fetchCategories = createAsyncThunk(
  'services/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      console.log('[fetchCategories] Loading from API...');
      const categories = await getCategories();
      return categories;
    } catch (error: any) {
      logError('fetchCategories', error);
      return rejectWithValue('Erreur de chargement des categories');
    }
  }
);

/**
 * Charger les favoris depuis AsyncStorage
 */
export const loadFavorites = createAsyncThunk(
  'services/loadFavorites',
  async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as number[];
      }
      return [];
    } catch (error) {
      console.error('[loadFavorites] Error:', error);
      return [];
    }
  }
);

/**
 * Sauvegarder les favoris dans AsyncStorage
 */
export const saveFavorites = createAsyncThunk(
  'services/saveFavorites',
  async (favorites: number[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      return favorites;
    } catch (error) {
      console.error('[saveFavorites] Error:', error);
      throw error;
    }
  }
);

// === SLICE ===

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    // Actions synchrones
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
      state.recentlyViewed = state.recentlyViewed.filter(id => id !== serviceId);
      state.recentlyViewed.unshift(serviceId);
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
    setCurrentService: (state, action: PayloadAction<Service | null>) => {
      state.currentService = action.payload;
    },
    clearFavorites: (state) => {
      state.favorites = [];
    },
    clearRecentlyViewed: (state) => {
      state.recentlyViewed = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // === FETCH ALL SERVICES ===
    builder
      .addCase(fetchServices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.services;
        state.useLocalData = action.payload.useLocalData;
        state.error = null;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // NE PAS utiliser donnees locales (IDs differents de la DB)
      });

    // === FETCH SERVICE BY ID ===
    builder
      .addCase(fetchServiceById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServiceById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentService = action.payload;
        // Mettre a jour dans items si existe
        const index = state.items.findIndex(s => s.id === action.payload.id);
        if (index > -1) {
          state.items[index] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      })
      .addCase(fetchServiceById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // === SEARCH SERVICES ===
    builder
      .addCase(searchServicesAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchServicesAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(searchServicesAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // === FETCH CATEGORIES ===
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

    // === LOAD FAVORITES ===
    builder
      .addCase(loadFavorites.fulfilled, (state, action) => {
        state.favorites = action.payload;
      });
  },
});

// === EXPORTS ===

export const {
  setServices,
  setCategories,
  toggleFavorite,
  addToRecentlyViewed,
  setSearchQuery,
  setSelectedCategory,
  setCurrentService,
  clearFavorites,
  clearRecentlyViewed,
  clearError,
} = servicesSlice.actions;

// Selectors
export const selectServices = (state: { services: ServicesState }) => state.services.items;
export const selectCategories = (state: { services: ServicesState }) => state.services.categories;
export const selectFavorites = (state: { services: ServicesState }) => state.services.favorites;
export const selectRecentlyViewed = (state: { services: ServicesState }) => state.services.recentlyViewed;
export const selectServicesLoading = (state: { services: ServicesState }) => state.services.isLoading;
export const selectServicesError = (state: { services: ServicesState }) => state.services.error;
export const selectSearchQuery = (state: { services: ServicesState }) => state.services.searchQuery;
export const selectSelectedCategory = (state: { services: ServicesState }) => state.services.selectedCategory;
export const selectCurrentService = (state: { services: ServicesState }) => state.services.currentService;
export const selectUseLocalData = (state: { services: ServicesState }) => state.services.useLocalData;

export const selectIsFavorite = (serviceId: number) => (state: { services: ServicesState }) =>
  state.services.favorites.includes(serviceId);

export const selectFavoriteServices = (state: { services: ServicesState }) =>
  state.services.items.filter(s => state.services.favorites.includes(Number(s.id)));

export const selectFilteredServices = (state: { services: ServicesState }) => {
  let filtered = state.services.items;

  // Filtre par categorie
  if (state.services.selectedCategory) {
    filtered = filtered.filter(s =>
      s.category?.id === state.services.selectedCategory ||
      s.category_id === state.services.selectedCategory
    );
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

export const selectServicesByCategory = (categoryId: number) => (state: { services: ServicesState }) =>
  state.services.items.filter(s =>
    s.category?.id === categoryId || s.category_id === categoryId
  );

export default servicesSlice.reducer;
