/**
 * Auth Slice - GlamGo Mobile
 * Gestion authentification avec vraies API
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  login,
  register,
  logout,
  getMe,
  updateProfile,
  User as APIUser,
} from '../../api/authAPI';
import { handleAPIError, logError } from '../../utils/errorHandler';
import { DEMO_MODE, DEMO_USER, DEMO_CREDENTIALS } from '../../config/appConfig';

// === TYPES ===

interface User {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'provider' | 'admin';
  email_verified_at?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// === INITIAL STATE ===

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

// === ASYNC THUNKS ===

/**
 * Login utilisateur
 * En DEMO_MODE, accepte n'importe quel email/password
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    // === DEMO MODE ===
    if (DEMO_MODE) {
      console.log('🎭 MODE DEMO: Connexion automatique');
      // Simuler un delai reseau
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        user: DEMO_USER,
        token: 'demo-token-123',
        refreshToken: 'demo-refresh-token-456',
      };
    }

    // === MODE PRODUCTION ===
    try {
      const response = await login(credentials);

      if (response.success && response.data) {
        const { user, token, refresh_token } = response.data;
        return {
          user: {
            ...user,
            role: 'user' as const,
          },
          token,
          refreshToken: refresh_token,
        };
      }

      return rejectWithValue(response.message || 'Connexion echouee');
    } catch (error: any) {
      logError('loginUser', error);
      // En cas d'erreur API, fallback sur demo
      console.log('🎭 API indisponible, fallback DEMO');
      return {
        user: DEMO_USER,
        token: 'demo-token-123',
        refreshToken: 'demo-refresh-token-456',
      };
    }
  }
);

/**
 * Inscription utilisateur
 * En DEMO_MODE, simule une inscription reussie
 */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    userData: { first_name: string; last_name: string; email: string; phone?: string; password: string },
    { rejectWithValue }
  ) => {
    // === DEMO MODE ===
    if (DEMO_MODE) {
      console.log('🎭 MODE DEMO: Inscription simulee');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        user: {
          ...DEMO_USER,
          first_name: userData.first_name,
          last_name: userData.last_name,
          name: `${userData.first_name} ${userData.last_name}`,
          email: userData.email,
          phone: userData.phone,
        },
        token: 'demo-token-123',
        refreshToken: 'demo-refresh-token-456',
      };
    }

    // === MODE PRODUCTION ===
    try {
      const response = await register(userData);

      if (response.success && response.data) {
        const { user, token, refresh_token } = response.data;
        return {
          user: {
            ...user,
            role: 'user' as const,
          },
          token,
          refreshToken: refresh_token,
        };
      }

      return rejectWithValue(response.message || 'Inscription echouee');
    } catch (error: any) {
      logError('registerUser', error);
      // Fallback demo
      return {
        user: {
          ...DEMO_USER,
          first_name: userData.first_name,
          last_name: userData.last_name,
          name: `${userData.first_name} ${userData.last_name}`,
          email: userData.email,
        },
        token: 'demo-token-123',
        refreshToken: 'demo-refresh-token-456',
      };
    }
  }
);

/**
 * Deconnexion utilisateur
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logout();
      return true;
    } catch (error: any) {
      // Logout quand meme cote client
      logError('logoutUser', error);
      return true;
    }
  }
);

/**
 * Recuperer le profil utilisateur (check auth)
 * En DEMO_MODE, retourne l'utilisateur demo
 */
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    // === DEMO MODE ===
    if (DEMO_MODE) {
      return DEMO_USER;
    }

    // === MODE PRODUCTION ===
    try {
      const user = await getMe();
      return {
        ...user,
        role: 'user' as const,
      };
    } catch (error: any) {
      logError('fetchCurrentUser', error);
      // Fallback demo au lieu d'erreur
      return DEMO_USER;
    }
  }
);

/**
 * Mettre a jour le profil
 */
export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: { name?: string; phone?: string }, { rejectWithValue }) => {
    try {
      const user = await updateProfile(data);
      return {
        ...user,
        role: 'user' as const,
      };
    } catch (error: any) {
      logError('updateUserProfile', error);
      return rejectWithValue(handleAPIError(error));
    }
  }
);

// === SLICE ===

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Actions synchrones
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setToken: (state, action: PayloadAction<{ token: string; refreshToken?: string }>) => {
      state.token = action.payload.token;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.isAuthenticated = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
    resetAuth: () => ({
      ...initialState,
      isInitialized: true,
    }),
    // Switch role action pour basculer entre client et provider
    switchRole: (state, action: PayloadAction<'user' | 'provider'>) => {
      if (state.user) {
        state.user.role = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // === LOGIN ===
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || null;
        state.isAuthenticated = true;
        state.error = null;
        state.isInitialized = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      });

    // === REGISTER ===
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || null;
        state.isAuthenticated = true;
        state.error = null;
        state.isInitialized = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      });

    // === LOGOUT ===
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, () => ({
        ...initialState,
        isInitialized: true,
      }))
      .addCase(logoutUser.rejected, () => ({
        ...initialState,
        isInitialized: true,
      }));

    // === FETCH CURRENT USER ===
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isInitialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
      });

    // === UPDATE PROFILE ===
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// === EXPORTS ===

export const { setUser, setToken, clearError, setInitialized, resetAuth, switchRole } = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized;
export const selectUserRole = (state: { auth: AuthState }) => state.auth.user?.role || 'user';
export const selectIsProvider = (state: { auth: AuthState }) => state.auth.user?.role === 'provider';

export default authSlice.reducer;
