/**
 * Client Axios avec intercepteurs JWT
 * GlamGo Mobile - API Layer
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from './endpoints';

// Configuration de base
const API_BASE_URL = 'https://glamgo-api.fly.dev';
const TOKEN_KEY = 'glamgo_token';
const REFRESH_TOKEN_KEY = 'glamgo_refresh_token';

// Types pour les tokens
interface TokenResponse {
  token: string;
  refresh_token?: string;
  expires_in?: number;
}

interface RefreshTokenResponse {
  token: string;
  refresh_token?: string;
}

// Creer l'instance Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Variable pour eviter les refresh multiples simultanees
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (error: Error) => void;
}> = [];

// Traiter la file d'attente apres refresh
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// === INTERCEPTEUR REQUEST ===
// Ajoute automatiquement le token JWT a chaque requete
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[API Client] Erreur lecture token:', error);
    }

    // Log en dev
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// === INTERCEPTEUR RESPONSE ===
// Gere le refresh automatique du token si 401
apiClient.interceptors.response.use(
  (response) => {
    // Log succes en dev
    if (__DEV__) {
      console.log(`[API] Response ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si erreur 401 et pas deja en retry
    if (error.response?.status === 401 && !originalRequest._retry) {

      // Si deja en train de refresh, mettre en file d'attente
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

        if (!refreshToken) {
          // Pas de refresh token, deconnecter l'utilisateur
          await clearTokens();
          processQueue(new Error('No refresh token'), null);
          return Promise.reject(error);
        }

        // Appel refresh token
        const response = await axios.post<RefreshTokenResponse>(
          `${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { token: newToken, refresh_token: newRefreshToken } = response.data;

        // Sauvegarder les nouveaux tokens
        await setTokens(newToken, newRefreshToken);

        // Mettre a jour le header de la requete originale
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        // Traiter la file d'attente
        processQueue(null, newToken);

        // Relancer la requete originale
        return apiClient(originalRequest);

      } catch (refreshError) {
        // Refresh echoue, deconnecter l'utilisateur
        await clearTokens();
        processQueue(refreshError as Error, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Log erreur en dev
    if (__DEV__) {
      console.error(`[API] Error ${error.response?.status} ${originalRequest?.url}:`, error.message);
    }

    return Promise.reject(error);
  }
);

// === FONCTIONS UTILITAIRES TOKENS ===

/**
 * Sauvegarder les tokens
 */
export const setTokens = async (token: string, refreshToken?: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch (error) {
    console.error('[API Client] Erreur sauvegarde tokens:', error);
    throw error;
  }
};

/**
 * Recuperer le token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('[API Client] Erreur lecture token:', error);
    return null;
  }
};

/**
 * Supprimer les tokens (deconnexion)
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
  } catch (error) {
    console.error('[API Client] Erreur suppression tokens:', error);
    throw error;
  }
};

/**
 * Verifier si l'utilisateur est connecte
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};

// Export par defaut
export default apiClient;

// Export des constantes pour usage externe
export { API_BASE_URL, TOKEN_KEY, REFRESH_TOKEN_KEY };
