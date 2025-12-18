/**
 * Hook pour surveiller l'etat du reseau
 * Utilise le store Redux pour gerer l'etat offline
 */

import { useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setNetworkStatus, selectIsOnline } from '../store/slices/uiSlice';

/**
 * Hook pour surveiller l'etat de connexion
 * Utilise NetInfo pour detecter les changements reseau
 * Retourne true si connecte, false sinon
 */
export function useNetworkStatus(): boolean {
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector(selectIsOnline);

  // Fonction pour mettre a jour le status
  const updateNetworkStatus = useCallback((connected: boolean) => {
    dispatch(setNetworkStatus(connected ? 'online' : 'offline'));
  }, [dispatch]);

  useEffect(() => {
    // Check initial
    NetInfo.fetch().then(state => {
      updateNetworkStatus(state.isConnected ?? true);
    });

    // Ecouter les changements reseau
    const unsubscribe = NetInfo.addEventListener(state => {
      updateNetworkStatus(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, [updateNetworkStatus]);

  return isOnline;
}

/**
 * Re-export du selector pour usage externe
 */
export { selectIsOnline };

/**
 * Composant pour afficher une banniere offline
 */
export { default as OfflineBanner } from '../../components/ui/OfflineBanner';
