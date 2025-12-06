'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import styles from './UnreadBadge.module.scss';

/**
 * Badge affichant le nombre de messages non lus
 * Se met a jour automatiquement toutes les 10 secondes
 */
export default function UnreadBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Ne charger que si un token existe
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    loadUnreadCount();

    // Rafraichir toutes les 10 secondes
    const interval = setInterval(loadUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    // Vérifier le token avant l'appel
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    try {
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
