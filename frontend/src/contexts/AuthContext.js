'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { mergeClientData } from '@/lib/clientDataHelper';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Tracker le type de page precedent pour detecter les changements client <-> provider
  const prevIsProviderPage = useRef(null);

  // Determiner si on est sur une page provider base sur l'URL
  const isProviderPage = pathname?.startsWith('/provider');

  const checkAuth = useCallback(async () => {
    setLoading(true);

    // IMPORTANT: Charger le token FRAIS depuis localStorage/sessionStorage
    // selon le contexte de la page actuelle (client vs provider)
    apiClient.loadTokenForContext(isProviderPage);

    const token = apiClient.getToken();
    if (token) {
      try {
        console.log('[Auth] checkAuth - isProviderPage:', isProviderPage, '- token exists:', !!token);

        const response = isProviderPage
          ? await apiClient.getProviderProfile()
          : await apiClient.getProfile();

        console.log('[Auth] checkAuth - Response:', response?.success);

        if (response.success) {
          // Pour les clients, fusionner avec les donnees locales si certains champs manquent
          const userData = isProviderPage ? response.data : mergeClientData(response.data);
          setUser(userData);
          console.log('[Auth] User loaded:', userData?.first_name || userData?.email);
        } else {
          // Token invalide pour ce type d'utilisateur
          console.log('[Auth] Token invalid for this page type');
          // Nettoyer le token invalide
          if (isProviderPage) {
            localStorage.removeItem('provider_token');
            sessionStorage.removeItem('provider_token');
          } else {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
          }
          apiClient.token = null;
          setUser(null);
        }
      } catch (error) {
        console.error('[Auth] Auth check failed:', error);
        // Si erreur 401, nettoyer le token
        if (error.isAuthError || error.status === 401) {
          console.log('[Auth] Token expired, cleaning up...');
          if (isProviderPage) {
            localStorage.removeItem('provider_token');
            sessionStorage.removeItem('provider_token');
          } else {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
          }
          apiClient.token = null;
        }
        setUser(null);
      }
    } else {
      console.log('[Auth] No token found for context:', isProviderPage ? 'provider' : 'client');
      setUser(null);
    }
    setLoading(false);
  }, [isProviderPage]);

  // Effet pour recharger l'auth quand on change de contexte (client <-> provider)
  useEffect(() => {
    const wasProviderPage = prevIsProviderPage.current;
    const contextChanged = wasProviderPage !== null && wasProviderPage !== isProviderPage;

    if (contextChanged) {
      console.log('[Auth] Context changed:', wasProviderPage ? 'provider' : 'client', '->', isProviderPage ? 'provider' : 'client');
      // Reset user et recharger
      setUser(null);
    }

    // Toujours verifier l'auth au montage ou changement de contexte
    checkAuth();

    // Mettre a jour le tracker
    prevIsProviderPage.current = isProviderPage;
  }, [isProviderPage, checkAuth]);

  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setUser(null);
    apiClient.clearToken();
  }, []);

  // Fonction pour rafraichir les donnees utilisateur
  const refreshUser = useCallback(async () => {
    // Recharger le token frais
    apiClient.loadTokenForContext(isProviderPage);

    const token = apiClient.getToken();
    if (token) {
      try {
        console.log('[Auth] refreshUser - isProviderPage:', isProviderPage);

        const response = isProviderPage
          ? await apiClient.getProviderProfile()
          : await apiClient.getProfile();

        console.log('[Auth] refreshUser - Response:', response?.success);

        if (response.success) {
          // Pour les clients, fusionner avec les donnees locales si certains champs manquent
          const userData = isProviderPage ? response.data : mergeClientData(response.data);
          setUser(userData);
          console.log('[Auth] User refreshed:', userData?.first_name || userData?.email);
          return userData;
        }
      } catch (error) {
        console.error('[Auth] Refresh user failed:', error);
      }
    }
    return null;
  }, [isProviderPage]);

  // Verifier si l'onboarding est complete
  const isOnboardingCompleted = useCallback(() => {
    if (!user) {
      return false;
    }

    // Verifier directement le statut onboarding_completed
    // Peut etre true, 1, "1", ou toute valeur truthy
    const completed = user.onboarding_completed === true ||
                     user.onboarding_completed === 1 ||
                     user.onboarding_completed === '1';

    return completed;
  }, [user]);

  // Obtenir le chemin d'onboarding approprie selon le type d'utilisateur
  // Note: Les clients n'ont plus besoin d'onboarding separe (tout est fait a l'inscription)
  const getOnboardingPath = useCallback(() => {
    if (!user) return null;

    // Utiliser la page actuelle pour determiner le type d'utilisateur
    // Seuls les prestataires ont un onboarding separe
    if (isProviderPage) {
      return '/provider/onboarding';
    }

    // Pour les clients, pas d'onboarding separe (inscription complete)
    return null;
  }, [user, isProviderPage]);

  // Memoiser le contexte pour eviter les re-renders inutiles
  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    refreshUser,
    checkAuth,
    isOnboardingCompleted,
    getOnboardingPath,
    isProviderPage,
  }), [user, loading, login, logout, refreshUser, checkAuth, isOnboardingCompleted, getOnboardingPath, isProviderPage]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
