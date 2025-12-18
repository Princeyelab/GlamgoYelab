/**
 * Services Slice - GlamGo Mobile
 * Gestion services et categories avec vraies API
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Service, Category } from '../../../types/service';
import {
  getServices,
  getServiceById,
  searchServices as apiSearchServices,
  getCategories,
  ServicesListParams,
} from '../../api/servicesAPI';
import { handleAPIError, logError } from '../../utils/errorHandler';

// Donnees locales fallback
import { SERVICES as LOCAL_SERVICES } from '../../constants/services';
import { CATEGORIES as LOCAL_CATEGORIES } from '../../constants/categories';

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
      const response = await getServices(params);
      return {
        services: response.data,
        useLocalData: false,
      };
    } catch (error: any) {
      logError('fetchServices', error);
      // Fallback sur donnees locales
      console.log('📦 Utilisation donnees locales (fallback)');
      return {
        services: LOCAL_SERVICES,
        useLocalData: true,
      };
    }
  }
);

/**
 * Charger un service par ID
 * Utilise l'API si disponible, sinon fallback sur donnees locales
 */
export const fetchServiceById = createAsyncThunk(
  'services/fetchById',
  async (id: number | string, { rejectWithValue }) => {
    // D'abord essayer les donnees locales (plus rapide)
    const localService = LOCAL_SERVICES.find(s => s.id === Number(id));

    try {
      const service = await getServiceById(id);
      return service;
    } catch (error: any) {
      // Fallback sur donnees locales si API echoue
      if (localService) {
        console.log(`📦 Service ${id} charge depuis donnees locales (API indisponible)`);
        return localService;
      }
      // Seulement logger erreur si pas de fallback
      logError('fetchServiceById', error);
      return rejectWithValue(handleAPIError(error));
    }
  }
);

/**
 * Rechercher des services
 */
export const searchServicesAsync = createAsyncThunk(
  'services/search',
  async (query: string, { rejectWithValue, getState }) => {
    try {
      const response = await apiSearchServices(query);
      return response.data;
    } catch (error: any) {
      logError('searchServices', error);
      // Fallback sur recherche locale
      const q = query.toLowerCase();
      const localResults = LOCAL_SERVICES.filter(
        s =>
          s.title?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
      return localResults;
    }
  }
);

/**
 * Charger les categories
 */
export const fetchCategories = createAsyncThunk(
  'services/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const categories = await getCategories();
      return categories;
    } catch (error: any) {
      logError('fetchCategories', error);
      // Fallback sur donnees locales
      return LOCAL_CATEGORIES;
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
    useLocalFallback: (state) => {
      state.items = LOCAL_SERVICES;
      state.categories = LOCAL_CATEGORIES;
      state.useLocalData = true;
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
        // Utiliser donnees locales en cas d'erreur
        if (state.items.length === 0) {
          state.items = LOCAL_SERVICES;
          state.useLocalData = true;
        }
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
        // Utiliser categories locales en cas d'erreur
        if (state.categories.length === 0) {
          state.categories = LOCAL_CATEGORIES;
        }
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
  useLocalFallback,
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
