import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

/**
 * Hook pour gérer l'onboarding client/prestataire
 *
 * Fonctionnalités :
 * - Vérifier statut onboarding
 * - Soumettre formulaire onboarding
 * - Récupérer données existantes
 *
 * @returns {Object} - Statut, méthodes et données d'onboarding
 */
export function useOnboarding() {
  const [status, setStatus] = useState({
    loading: true,
    completed: false,
    userType: null,
    accountStatus: null,
    data: null
  });

  /**
   * Vérifier le statut d'onboarding
   */
  const checkStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));

      const response = await api.get('/onboarding/status');

      setStatus({
        loading: false,
        completed: response.onboarding_completed || false,
        userType: response.user_type || null,
        accountStatus: response.account_status || null,
        data: response.data || null
      });

      return response;
    } catch (error) {
      console.error('Erreur vérification onboarding:', error);
      setStatus(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  /**
   * Soumettre le formulaire client
   */
  const submitClientOnboarding = async (formData) => {
    try {
      const response = await api.post('/onboarding/client/submit', formData);

      // Mettre à jour le statut après soumission
      await checkStatus();

      return response;
    } catch (error) {
      console.error('Erreur soumission onboarding client:', error);
      throw error;
    }
  };

  /**
   * Soumettre le formulaire prestataire
   */
  const submitProviderOnboarding = async (formData) => {
    try {
      const response = await api.post('/onboarding/provider/submit', formData);

      // Mettre à jour le statut après soumission
      await checkStatus();

      return response;
    } catch (error) {
      console.error('Erreur soumission onboarding prestataire:', error);
      throw error;
    }
  };

  /**
   * Récupérer les données client existantes
   */
  const getClientData = async () => {
    try {
      const response = await api.get('/onboarding/client/data');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération données client:', error);
      return null;
    }
  };

  /**
   * Récupérer les données prestataire existantes
   */
  const getProviderData = async () => {
    try {
      const response = await api.get('/onboarding/provider/data');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération données prestataire:', error);
      return null;
    }
  };

  /**
   * Vérifier au montage du composant
   */
  useEffect(() => {
    checkStatus();
  }, []);

  return {
    status,
    checkStatus,
    submitClientOnboarding,
    submitProviderOnboarding,
    getClientData,
    getProviderData,
    isLoading: status.loading,
    isCompleted: status.completed,
    userType: status.userType,
    accountStatus: status.accountStatus
  };
}

export default useOnboarding;
