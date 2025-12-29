import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  purgeStoredState,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearTokens } from '../api/client';

// Slices
import authReducer from './slices/authSlice';
import servicesReducer from './slices/servicesSlice';
import bookingsReducer from './slices/bookingsSlice';
import uiReducer from './slices/uiSlice';

// Configuration Redux Persist
const persistConfig = {
  key: 'glamgo-root',
  version: 1,
  storage: AsyncStorage,
  // On persiste tout sauf UI (loading states temporaires)
  whitelist: ['auth', 'services', 'bookings'],
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  services: servicesReducer,
  bookings: bookingsReducer,
  ui: uiReducer,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorer actions Redux Persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Persistor
export const persistor = persistStore(store);

// Types pour TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * Reset complet de l'application
 * Efface toutes les donnees stockees (Redux, tokens, AsyncStorage)
 */
export const resetApp = async (): Promise<void> => {
  try {
    // 1. Purger Redux Persist
    await persistor.purge();

    // 2. Supprimer les tokens API
    await clearTokens();

    // 3. Effacer tout AsyncStorage
    await AsyncStorage.clear();

    console.log('✅ App reset complete - toutes les donnees effacees');
  } catch (error) {
    console.error('❌ Erreur reset app:', error);
    throw error;
  }
};
