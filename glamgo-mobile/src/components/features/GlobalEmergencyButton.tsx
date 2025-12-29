/**
 * GlobalEmergencyButton Component - GlamGo Mobile
 * Affiche le bouton d'urgence globalement quand il y a une prestation en cours
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import EmergencyButton from './EmergencyButton';
import apiClient from '../../lib/api/client';

interface ActiveBooking {
  id: number;
  status: string;
  provider_name?: string;
  client_name?: string;
  provider_id?: number;
}

interface GlobalEmergencyButtonProps {
  isProvider?: boolean;
}

export default function GlobalEmergencyButton({ isProvider = false }: GlobalEmergencyButtonProps) {
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);

  const fetchActiveBooking = useCallback(async () => {
    try {
      if (isProvider) {
        // Fetch provider's active orders
        const response = await apiClient.get('/api/provider/orders?status=on_way,arrived,in_progress&limit=1');
        const orders = response.data?.data?.orders || response.data?.data || [];
        if (orders.length > 0) {
          const order = orders[0];
          setActiveBooking({
            id: order.id,
            status: order.status,
            client_name: order.client_name || order.user_name ||
              `${order.user_first_name || ''} ${order.user_last_name || ''}`.trim() || 'Client',
          });
        } else {
          setActiveBooking(null);
        }
      } else {
        // Fetch client's active orders
        const response = await apiClient.get('/api/orders?status=on_way,arrived,in_progress&limit=1');
        const orders = response.data?.data?.orders || response.data?.data || [];
        if (orders.length > 0) {
          const order = orders[0];
          setActiveBooking({
            id: order.id,
            status: order.status,
            provider_name: order.provider_name ||
              `${order.provider_first_name || ''} ${order.provider_last_name || ''}`.trim() || 'Prestataire',
            provider_id: order.provider_id,
          });
        } else {
          setActiveBooking(null);
        }
      }
    } catch (error) {
      // Silently fail - user might not be logged in
      setActiveBooking(null);
    }
  }, [isProvider]);

  // Fetch on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchActiveBooking();
      // Refresh every 30 seconds
      const interval = setInterval(fetchActiveBooking, 30000);
      return () => clearInterval(interval);
    }, [fetchActiveBooking])
  );

  // Don't render if no active booking
  if (!activeBooking) {
    return null;
  }

  // Only show for active statuses
  const activeStatuses = ['on_way', 'arrived', 'in_progress'];
  if (!activeStatuses.includes(activeBooking.status)) {
    return null;
  }

  return (
    <EmergencyButton
      orderId={activeBooking.id}
      providerName={activeBooking.provider_name}
      clientName={activeBooking.client_name}
      isProvider={isProvider}
    />
  );
}
