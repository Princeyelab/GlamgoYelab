'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';

/**
 * usePushNotifications - Hook pour gérer les notifications Web Push
 *
 * Gère l'abonnement aux notifications push, la permission utilisateur,
 * et la synchronisation avec le backend.
 *
 * @returns {Object} - État et méthodes pour les notifications push
 */
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Vérifier le support des notifications push au montage
  useEffect(() => {
    const checkSupport = () => {
      const supported = typeof window !== 'undefined'
        && 'serviceWorker' in navigator
        && 'PushManager' in window
        && 'Notification' in window;

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Vérifier si déjà abonné
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();

        if (existingSubscription) {
          setSubscription(existingSubscription);
          setIsSubscribed(true);
        }
      } catch (err) {
        console.error('Error checking push subscription:', err);
      }
    };

    checkSubscription();
  }, [isSupported]);

  // Enregistrer le Service Worker
  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      return registration;
    } catch (err) {
      console.error('Service Worker registration failed:', err);
      throw err;
    }
  }, [isSupported]);

  // Demander la permission et s'abonner
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications are not supported on this device');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Demander la permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        setError('Permission denied for notifications');
        setLoading(false);
        return false;
      }

      // Enregistrer le Service Worker
      const registration = await registerServiceWorker();

      // Récupérer la clé VAPID publique du backend
      let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        // Essayer de récupérer depuis le backend
        try {
          const response = await apiClient.get('/notifications/push/vapid-key');
          if (response.success && response.data?.public_key) {
            vapidPublicKey = response.data.public_key;
          }
        } catch {
          console.warn('Could not fetch VAPID key from backend');
        }
      }

      if (!vapidPublicKey) {
        setError('VAPID public key not configured');
        setLoading(false);
        return false;
      }

      // Convertir la clé VAPID en Uint8Array
      const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/-/g, '+')
          .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      // S'abonner aux notifications push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Envoyer l'abonnement au backend
      const subscriptionData = pushSubscription.toJSON();
      await apiClient.post('/notifications/push/register', {
        endpoint: subscriptionData.endpoint,
        keys: subscriptionData.keys
      });

      setSubscription(pushSubscription);
      setIsSubscribed(true);
      setLoading(false);
      return true;

    } catch (err) {
      console.error('Error subscribing to push notifications:', err);
      setError(err.message || 'Failed to subscribe to notifications');
      setLoading(false);
      return false;
    }
  }, [isSupported, registerServiceWorker]);

  // Se désabonner
  const unsubscribe = useCallback(async () => {
    if (!subscription) return true;

    setLoading(true);
    setError(null);

    try {
      // Désabonner du PushManager
      await subscription.unsubscribe();

      // Notifier le backend
      try {
        await apiClient.post('/notifications/push/unregister', {
          endpoint: subscription.endpoint
        });
      } catch {
        // Ignorer les erreurs backend lors de la désinscription
      }

      setSubscription(null);
      setIsSubscribed(false);
      setLoading(false);
      return true;

    } catch (err) {
      console.error('Error unsubscribing from push notifications:', err);
      setError(err.message || 'Failed to unsubscribe');
      setLoading(false);
      return false;
    }
  }, [subscription]);

  // Afficher une notification locale (pour les tests)
  const showLocalNotification = useCallback(async (title, options = {}) => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Cannot show notification: not supported or permission denied');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        ...options
      });
      return true;
    } catch (err) {
      console.error('Error showing notification:', err);
      return false;
    }
  }, [isSupported, permission]);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    error,
    subscribe,
    unsubscribe,
    showLocalNotification
  };
}

export default usePushNotifications;
