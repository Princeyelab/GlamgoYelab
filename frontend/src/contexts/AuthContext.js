'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { mergeClientData } from '@/lib/clientDataHelper';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const pathname = usePathname();

  // Déterminer si on est sur une page provider basé sur l'URL
  const isProviderPage = pathname?.startsWith('/provider');

  const checkAuth = useCallback(async () => {
    // Ne vérifier qu'une seule fois au montage initial
    if (checked) return;

    // Forcer le chargement du bon token selon la page actuelle
    // Cela évite la confusion entre les profils client et prestataire
    if (typeof window !== 'undefined') {
      if (isProviderPage) {
        // Sur une page provider, charger uniquement le token provider
        apiClient._loadProviderToken();
      } else {
        // Sur une page client, charger uniquement le token client
        apiClient._loadClientToken();
      }
    }

    const token = apiClient.getToken();
    if (token) {
      try {
        // Appeler la bonne API selon le type de page (pas le type stocké)
        const isProvider = isProviderPage;
        console.log('🔐 checkAuth - isProviderPage:', isProviderPage, '- token exists:', !!token);

        const response = isProvider
          ? await apiClient.getProviderProfile()
          : await apiClient.getProfile();

        console.log('🔐 checkAuth - Réponse API:', response);

        if (response.success) {
          // Pour les clients, fusionner avec les données locales si certains champs manquent
          const userData = isProvider ? response.data : mergeClientData(response.data);
          setUser(userData);
          console.log('✅ checkAuth - Utilisateur chargé:', userData);
        } else {
          // Token invalide pour ce type d'utilisateur
          console.log('⚠️ checkAuth - Token invalide pour ce type de page');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        // Ne pas effacer tous les tokens, seulement déconnecter de cette session
        setUser(null);
      }
    }
    setLoading(false);
    setChecked(true);
  }, [checked, isProviderPage]);

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
        // Appeler la bonne API selon le type de page (pas le type stocké)
        const isProvider = isProviderPage;
        console.log('🔄 refreshUser - isProviderPage:', isProviderPage);

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
  }, [isProviderPage]);

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

    // Utiliser la page actuelle pour déterminer le type d'utilisateur
    // Seuls les prestataires ont un onboarding séparé
    if (isProviderPage) {
      return '/provider/onboarding';
    }

    // Pour les clients, pas d'onboarding séparé (inscription complète)
    return null;
  }, [user, isProviderPage]);

  // Mémoiser le contexte pour éviter les re-renders inutiles
  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    refreshUser,
    isOnboardingCompleted,
    getOnboardingPath,
    isProviderPage, // Exposer pour permettre aux composants de savoir le contexte
  }), [user, loading, login, logout, refreshUser, isOnboardingCompleted, getOnboardingPath, isProviderPage]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
