/**
 * PendingOrdersBanner - Banniere globale pour prestataire
 * Affiche les commandes en attente de reponse avec timer countdown
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
import { getProviderOrders } from '../../lib/api/providerAPI';
import { useLanguage } from '../../contexts/LanguageContext';
import { isOrderCancelled, initCancelledOrdersCache } from '../../lib/utils/cancelledOrdersCache';

interface PendingOrder {
  id: number;
  service_name: string;
  client_name: string;
  created_at: string;
}

export default function PendingOrdersBanner() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const pulseAnim = useState(new Animated.Value(1))[0];
  const alertShownRef = useRef<number | null>(null); // Track which order alert was shown

  // Charger les commandes en attente
  const checkPendingOrders = useCallback(async () => {
    try {
      const orders = await getProviderOrders();

      // Filtrer les commandes pending, éviter les doublons, exclure les expirées et annulées
      const seenIds = new Set<number>();
      const now = Date.now();
      const pending = (orders || [])
        .filter((o: any) => {
          if (o.status !== 'pending') return false;
          if (seenIds.has(o.id)) return false; // Éviter doublons
          seenIds.add(o.id);

          // Vérifier le cache des annulations
          if (isOrderCancelled(o.id)) return false;

          // Filtrer les commandes expirées (> 4 minutes)
          if (o.created_at) {
            let createdAtStr = o.created_at;
            if (!createdAtStr.endsWith('Z') && !createdAtStr.includes('+')) {
              createdAtStr = createdAtStr.replace(' ', 'T') + 'Z';
            }
            const elapsed = Math.floor((now - new Date(createdAtStr).getTime()) / 1000);
            if (elapsed >= 240) return false; // Expirée
          }

          return true;
        })
        .map((o: any) => ({
          id: o.id,
          service_name: o.service?.title || o.service_name || 'Service',
          client_name: o.user_name ||
            `${o.user_first_name || ''} ${o.user_last_name || ''}`.trim() ||
            'Client',
          created_at: o.created_at,
        }));

      setPendingOrders(pending);
    } catch (error) {
      console.log('[PendingOrdersBanner] Error:', error);
    }
  }, []);

  // Verifier au montage et quand l'ecran devient actif
  useFocusEffect(
    useCallback(() => {
      // Recharger le cache AsyncStorage d'abord pour avoir les IDs annulés à jour
      initCancelledOrdersCache().then(() => {
        checkPendingOrders();
      });
      const interval = setInterval(checkPendingOrders, 10000);
      return () => clearInterval(interval);
    }, [checkPendingOrders])
  );

  // Stocker oldestOrder dans un ref pour l'alerte
  const oldestOrderRef = useRef<PendingOrder | null>(null);
  useEffect(() => {
    oldestOrderRef.current = pendingOrders.length > 0 ? pendingOrders[0] : null;
  }, [pendingOrders]);

  // Calculer le temps restant pour la premiere commande
  useEffect(() => {
    if (pendingOrders.length === 0) {
      setTimeRemaining(0);
      return;
    }

    const oldestOrder = pendingOrders[0];

    const calculateRemaining = () => {
      let createdAtStr = oldestOrder.created_at;
      if (!createdAtStr) return 240;
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
  }, [pendingOrders]);

  // Afficher alerte et supprimer automatiquement quand timer expire
  useEffect(() => {
    const order = oldestOrderRef.current;
    if (timeRemaining === 0 && order && alertShownRef.current !== order.id) {
      alertShownRef.current = order.id;

      // Supprimer immédiatement la commande expirée de la liste
      setPendingOrders(prev => prev.filter(o => o.id !== order.id));

      Alert.alert(
        `⏱️ ${t('pendingOrders.orderExpired')}`,
        t('pendingOrders.orderExpiredMessage')
          .replace('{clientName}', order.client_name)
          .replace('{serviceName}', order.service_name),
        [
          {
            text: t('pendingOrders.viewOrders'),
            onPress: () => router.push('/(provider)/bookings' as any),
          },
          { text: t('pendingOrders.ok'), style: 'cancel' },
        ]
      );

      // Forcer le rafraîchissement pour synchroniser avec le serveur
      setTimeout(() => {
        checkPendingOrders();
      }, 1000);
    }
  }, [timeRemaining, router, checkPendingOrders]);

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
  if (pendingOrders.length === 0 || timeRemaining <= 0) {
    return null;
  }

  const isUrgent = timeRemaining < 60;
  const progressPercent = (timeRemaining / 240) * 100;

  // Get the right translation based on count
  const getOrdersWaitingText = () => {
    if (pendingOrders.length > 1) {
      return t('pendingOrders.ordersWaitingPlural').replace('{count}', String(pendingOrders.length));
    }
    return t('pendingOrders.ordersWaiting').replace('{count}', String(pendingOrders.length));
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isUrgent && styles.containerUrgent,
        { transform: [{ scale: pulseAnim }] }
      ]}
    >
      <TouchableOpacity
        style={[styles.content, isRTL && styles.contentRTL]}
        onPress={() => router.push('/(provider)/bookings' as any)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, isRTL && styles.iconContainerRTL]}>
          <Text style={styles.icon}>🔔</Text>
        </View>

        <View style={[styles.info, isRTL && styles.infoRTL]}>
          <Text style={[styles.title, isRTL && styles.textRTL]} numberOfLines={1}>
            {getOrdersWaitingText()}
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.textRTL]}>
            {isUrgent ? t('pendingOrders.respondQuickly') : t('pendingOrders.tapToView')}
          </Text>
        </View>

        <View style={[styles.timerContainer, isRTL && styles.timerContainerRTL]}>
          <Text style={[styles.timer, isUrgent && styles.timerUrgent]}>
            {formatTime(timeRemaining)}
          </Text>
          <Text style={styles.timerLabel}>{t('pendingOrders.remaining')}</Text>
        </View>

        <Text style={styles.arrow}>{isRTL ? '‹' : '›'}</Text>
      </TouchableOpacity>

      {/* Barre de progression */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progress,
            { width: `${progressPercent}%` },
            isUrgent && styles.progressUrgent,
            isRTL && styles.progressRTL
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
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
    zIndex: 1000,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  containerUrgent: {
    backgroundColor: colors.error,
    borderColor: colors.white,
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
    backgroundColor: colors.warning,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progress: {
    height: '100%',
    backgroundColor: colors.warning,
  },
  progressUrgent: {
    backgroundColor: colors.white,
  },
  // RTL Styles
  contentRTL: {
    flexDirection: 'row-reverse',
  },
  iconContainerRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  infoRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
    alignItems: 'flex-end',
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  timerContainerRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  progressRTL: {
    alignSelf: 'flex-end',
  },
});
