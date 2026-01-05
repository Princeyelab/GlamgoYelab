/**
 * PendingBookingBanner - Bannière globale pour commandes en attente
 * Affiche un timer countdown visible sur toutes les pages
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';
import apiClient from '../../lib/api/client';

interface PendingBooking {
  id: number;
  service_name: string;
  provider_name: string;
  created_at: string;
}

export default function PendingBookingBanner() {
  const router = useRouter();
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const pulseAnim = useState(new Animated.Value(1))[0];
  const alertShownRef = useRef<number | null>(null); // Track which booking alert was shown
  const expiredIdsRef = useRef<Set<number>>(new Set()); // Track expired orders to not re-show

  // Calculer si une commande est expirée (> 4 minutes)
  const isOrderExpired = (createdAt: string): boolean => {
    let createdAtStr = createdAt;
    if (!createdAtStr.endsWith('Z') && !createdAtStr.includes('+')) {
      createdAtStr = createdAtStr.replace(' ', 'T') + 'Z';
    }
    const elapsed = Math.floor((Date.now() - new Date(createdAtStr).getTime()) / 1000);
    return elapsed >= 240;
  };

  // Charger les commandes en attente
  const checkPendingBookings = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/orders');
      const orders = response.data?.data || [];

      // Trouver une commande pending NON expirée et NON déjà marquée comme expirée
      const pending = orders.find((o: any) =>
        o.status === 'pending' &&
        !expiredIdsRef.current.has(o.id) &&
        !isOrderExpired(o.created_at)
      );

      if (pending) {
        setPendingBooking({
          id: pending.id,
          service_name: pending.service_name || 'Service',
          provider_name: pending.provider_name ||
            `${pending.provider_first_name || ''} ${pending.provider_last_name || ''}`.trim() ||
            'Prestataire',
          created_at: pending.created_at,
        });
      } else {
        setPendingBooking(null);
      }
    } catch (error) {
      console.log('[PendingBanner] Error checking bookings:', error);
    }
  }, []);

  // Vérifier au montage et quand l'écran devient actif
  useFocusEffect(
    useCallback(() => {
      checkPendingBookings();
      const interval = setInterval(checkPendingBookings, 10000);
      return () => clearInterval(interval);
    }, [checkPendingBookings])
  );

  // Stocker pendingBooking dans un ref pour l'alerte
  const pendingBookingRef = useRef<PendingBooking | null>(null);
  useEffect(() => {
    pendingBookingRef.current = pendingBooking;
  }, [pendingBooking]);

  // Calculer le temps restant
  useEffect(() => {
    if (!pendingBooking?.created_at) {
      setTimeRemaining(0);
      return;
    }

    const calculateRemaining = () => {
      let createdAtStr = pendingBooking.created_at;
      if (!createdAtStr.endsWith('Z') && !createdAtStr.includes('+')) {
        createdAtStr = createdAtStr.replace(' ', 'T') + 'Z';
      }
      const createdTime = new Date(createdAtStr).getTime();
      const elapsed = Math.floor((Date.now() - createdTime) / 1000);
      return Math.max(0, 240 - elapsed);
    };

    setTimeRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingBooking?.created_at]);

  // Afficher alerte et supprimer automatiquement quand timer expire
  useEffect(() => {
    const booking = pendingBookingRef.current;
    if (timeRemaining === 0 && booking && alertShownRef.current !== booking.id) {
      alertShownRef.current = booking.id;

      // Marquer comme expiré pour ne plus le re-afficher
      expiredIdsRef.current.add(booking.id);

      // Supprimer immédiatement la bannière
      setPendingBooking(null);

      Alert.alert(
        'Commande expirée',
        `Le prestataire n'a pas répondu dans le délai de 4 minutes pour "${booking.service_name}". La commande a été automatiquement annulée.`,
        [
          {
            text: 'Voir mes réservations',
            onPress: () => router.push('/(client)/bookings' as any),
          },
          { text: 'OK', style: 'cancel' },
        ]
      );

      // Forcer le rafraîchissement pour synchroniser avec le serveur
      setTimeout(() => {
        checkPendingBookings();
      }, 1000);
    }
  }, [timeRemaining, router, checkPendingBookings]);

  // Animation pulse quand urgent
  useEffect(() => {
    if (timeRemaining > 0 && timeRemaining < 60) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [timeRemaining < 60]);

  // Formater le temps
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Ne pas afficher si pas de commande en attente
  if (!pendingBooking || timeRemaining <= 0) {
    return null;
  }

  const isUrgent = timeRemaining < 60;
  const progressPercent = (timeRemaining / 240) * 100;

  return (
    <Animated.View
      style={[
        styles.container,
        isUrgent && styles.containerUrgent,
        { transform: [{ scale: pulseAnim }] }
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={() => router.push(`/booking/track/${pendingBooking.id}` as any)}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⏱️</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {pendingBooking.service_name}
          </Text>
          <Text style={styles.subtitle}>
            {isUrgent ? 'Réponse imminente!' : 'En attente de confirmation'}
          </Text>
        </View>

        <View style={styles.timerContainer}>
          <Text style={[styles.timer, isUrgent && styles.timerUrgent]}>
            {formatTime(timeRemaining)}
          </Text>
          <Text style={styles.timerLabel}>restant</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      {/* Barre de progression */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progress,
            { width: `${progressPercent}%` },
            isUrgent && styles.progressUrgent
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.warning,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    zIndex: 1000,
  },
  containerUrgent: {
    backgroundColor: colors.error,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  timerContainer: {
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  timer: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
  },
  timerUrgent: {
    color: colors.white,
  },
  timerLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  arrow: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 'bold',
  },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  progress: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  progressUrgent: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
