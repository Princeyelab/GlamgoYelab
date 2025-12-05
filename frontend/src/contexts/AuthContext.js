'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/lib/apiClient';
import { mergeClientData } from '@/lib/clientDataHelper';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  const checkAuth = useCallback(async () => {
    // Ne vérifier qu'une seule fois au montage initial
    if (checked) return;

    const token = apiClient.getToken();
    if (token) {
      try {
        // Appeler la bonne API selon le type d'utilisateur
        const isProvider = apiClient.getIsProvider();
        console.log('🔐 checkAuth - isProvider:', isProvider);

        const response = isProvider
          ? await apiClient.getProviderProfile()
          : await apiClient.getProfile();

        console.log('🔐 checkAuth - Réponse API:', response);

        if (response.success) {
          // Pour les clients, fusionner avec les données locales si certains champs manquent
          const userData = isProvider ? response.data : mergeClientData(response.data);
          setUser(userData);
          console.log('✅ checkAuth - Utilisateur chargé:', userData);
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        apiClient.clearToken();
        setUser(null);
      }
    }
    setLoading(false);
    setChecked(true);
  }, [checked]);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Exécuter une seule fois au montage

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

  // Fonction pour rafraîchir les données utilisateur
  const refreshUser = useCallback(async () => {
    const token = apiClient.getToken();
    if (token) {
      try {
        // Appeler la bonne API selon le type d'utilisateur
        const isProvider = apiClient.getIsProvider();
        console.log('🔄 refreshUser - isProvider:', isProvider);

        const response = isProvider
          ? await apiClient.getProviderProfile()
          : await apiClient.getProfile();

        console.log('🔄 refreshUser - Réponse API:', response);

        if (response.success) {
          // Pour les clients, fusionner avec les données locales si certains champs manquent
          const userData = isProvider ? response.data : mergeClientData(response.data);
          setUser(userData);
          console.log('✅ refreshUser - Utilisateur mis à jour:', userData);
          return userData;
        }
      } catch (error) {
        console.error('❌ Refresh user failed:', error);
      }
    }
    return null;
  }, []);

  // Vérifier si l'onboarding est complété
  const isOnboardingCompleted = useCallback(() => {
    if (!user) {
      console.log('🔍 isOnboardingCompleted: pas d\'utilisateur');
      return false;
    }

    console.log('🔍 isOnboardingCompleted - Données utilisateur:', {
      role: user.role,
      user_type: user.user_type,
      onboarding_completed: user.onboarding_completed,
      fullUser: user
    });

    // Vérifier directement le statut onboarding_completed
    // Peut être true, 1, "1", ou toute valeur truthy
    const completed = user.onboarding_completed === true ||
                     user.onboarding_completed === 1 ||
                     user.onboarding_completed === '1';

    console.log('🔍 Onboarding complété?', completed);
    return completed;
  }, [user]);

  // Obtenir le chemin d'onboarding approprié selon le type d'utilisateur
  // Note: Les clients n'ont plus besoin d'onboarding séparé (tout est fait à l'inscription)
  const getOnboardingPath = useCallback(() => {
    if (!user) return null;

    // Utiliser apiClient pour déterminer le type d'utilisateur
    const isProvider = apiClient.getIsProvider();

    // Seuls les prestataires ont un onboarding séparé
    if (isProvider) {
      return '/provider/onboarding';
    }

    // Pour les clients, pas d'onboarding séparé (inscription complète)
    return null;
  }, [user]);

  // Mémoiser le contexte pour éviter les re-renders inutiles
  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    refreshUser,
    isOnboardingCompleted,
    getOnboardingPath,
  }), [user, loading, login, logout, refreshUser, isOnboardingCompleted, getOnboardingPath]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
