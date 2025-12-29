'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import styles from './ProviderUnreadBadge.module.scss';

/**
 * Badge affichant le nombre de messages non lus pour les prestataires
 * Se met a jour automatiquement toutes les 10 secondes
 */
export default function ProviderUnreadBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Ne charger que si un provider_token existe
    const token = localStorage.getItem('provider_token') || sessionStorage.getItem('provider_token');
    if (!token) return;

    loadUnreadCount();

    // Rafraichir toutes les 10 secondes
    const interval = setInterval(loadUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    // Vérifier le token avant l'appel
    const token = localStorage.getItem('provider_token') || sessionStorage.getItem('provider_token');
    if (!token) return;

    try {
      // S'assurer que l'apiClient utilise le contexte prestataire
      apiClient.loadTokenForContext(true);

      // Utiliser le endpoint chat pour les messages non lus
      const response = await apiClient.get('/chat/unread-count');
      if (response.success && response.data?.unread_count !== undefined) {
        setCount(response.data.unread_count);
      }
    } catch (error) {
      // Ignorer les erreurs silencieusement
    }
  };

  if (count === 0) return null;

  return (
    <span className={styles.unreadBadge}>
      {count > 99 ? '99+' : count}
    </span>
  );
}
