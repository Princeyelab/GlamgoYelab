/**
 * Provider Dashboard - GlamGo Mobile
 * Tableau de bord complet du prestataire
 * Connecte aux vraies donnees API avec fallback aux donnees demo
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Linking,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import { selectUser, switchRole } from '../../src/lib/store/slices/authSlice';
import { hapticFeedback } from '../../src/lib/utils/haptics';
import {
  getProviderServices,
  getProviderProfile,
  updateProviderProfile,
  getProviderOrders,
  acceptOrder,
  startOrder,
  arriveAtClient,
  cancelOrder,
  completeOrder,
  getProviderEarnings,
  getUnreadNotificationsCount,
  updateProviderLocation,
  ProviderOrder,
} from '../../src/lib/api/providerAPI';
import * as Location from 'expo-location';
import apiClient from '../../src/lib/api/client';
import { isOrderInRange } from '../../src/lib/utils/geoUtils';

// Rayon par défaut si non défini (50 km)
const DEFAULT_RADIUS_KM = 50;

// Types
type PeriodType = 'today' | 'week' | 'month';
type BookingStatus = 'pending' | 'accepted' | 'on_way' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

interface BookingService {
  title: string;
  duration_minutes: number;
  price: number;
}

interface BookingUser {
  name: string;
  id: number;
}

interface TodayBooking {
  id: number;
  order_number: string;
  status: BookingStatus;
  service: BookingService;
  user: BookingUser;
  booking_date: string;
  booking_time: string;
  address: string;
}

// Stats initiales pour nouveau prestataire (donnees vides)
const INITIAL_STATS = {
  today: {
    bookings: 0,
    earnings: 0,
    completed: 0,
  },
  week: {
    bookings: 0,
    earnings: 0,
    completed: 0,
  },
  month: {
    bookings: 0,
    earnings: 0,
    completed: 0,
  },
  rating: 0,
  reviews_count: 0,
  completion_rate: 0,
};

// Pas de reservations pour un nouveau prestataire
const INITIAL_BOOKINGS: TodayBooking[] = [];

export default function ProviderDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('today');
  const [bookings, setBookings] = useState<TodayBooking[]>(INITIAL_BOOKINGS);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Disponibilite style Uber
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');

  // Messages non lus
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeOrderWithMessages, setActiveOrderWithMessages] = useState<number | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  // Position du prestataire pour filtrage des commandes
  const [providerCoords, setProviderCoords] = useState<{ lat: number; lon: number; radius: number } | null>(null);

  // Mettre a jour la position du prestataire
  const handleUpdateLocation = async () => {
    hapticFeedback.medium();
    setIsUpdatingLocation(true);

    try {
      // Demander la permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusee', 'Activez la localisation pour mettre a jour votre position');
        setIsUpdatingLocation(false);
        return;
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      console.log('[Dashboard] Updating provider location:', latitude, longitude);

      // Mettre a jour via l'API
      await updateProviderLocation(latitude, longitude);

      // Reverse geocoding pour afficher la ville
      const reverseGeo = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverseGeo.length > 0) {
        const place = reverseGeo[0];
        const locationName = place.city || place.district || place.region || 'Position mise a jour';
        setCurrentLocation(locationName);
        Alert.alert('Position mise a jour', `Vous etes maintenant localise a ${locationName}`);
      } else {
        setCurrentLocation('Position mise a jour');
        Alert.alert('Position mise a jour', 'Votre position a ete mise a jour');
      }

      hapticFeedback.success();
    } catch (error) {
      console.error('[Dashboard] Error updating location:', error);
      Alert.alert('Erreur', 'Impossible de mettre a jour la position');
      hapticFeedback.warning();
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // Charger les donnees depuis l'API
  const loadDashboardData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      // Charger les commandes, stats, profil et notifications en parallele
      const [ordersData, todayEarnings, weekEarnings, monthEarnings, notifCount, providerProfile] = await Promise.all([
        getProviderOrders().catch(() => []),
        getProviderEarnings('week').catch(() => ({ total: 0, bookings: 0, net: 0 })),
        getProviderEarnings('week').catch(() => ({ total: 0, bookings: 0, net: 0 })),
        getProviderEarnings('month').catch(() => ({ total: 0, bookings: 0, net: 0 })),
        getUnreadNotificationsCount().catch(() => 0),
        getProviderProfile().catch((err) => {
          console.log('[Dashboard] Erreur profil:', err?.message || err);
          return null;
        }),
      ]);

      // Mettre a jour le compteur de notifications
      setUnreadNotifications(notifCount);

      // Debug: afficher les stats du profil
      console.log('[Dashboard] Provider profile:', {
        rating: providerProfile?.rating,
        average_rating: providerProfile?.average_rating,
        total_reviews: providerProfile?.total_reviews,
      });

      // Filtrer les commandes valides (avec filtre de distance pour les pending)
      const validOrders = (ordersData || []).filter((order: any) => {
        // Exclure les commandes annulees
        if (order.cancelled_at || order.status === 'cancelled') return false;

        // Pour les commandes pending, filtrer par distance
        if (order.status === 'pending') {
          // Si on a la position du prestataire, vérifier la distance
          if (providerCoords) {
            const orderLat = order.client_latitude || order.latitude;
            const orderLon = order.client_longitude || order.longitude;

            // Si la commande a des coordonnées, vérifier la distance
            if (orderLat && orderLon) {
              return isOrderInRange(
                providerCoords.lat,
                providerCoords.lon,
                orderLat,
                orderLon,
                providerCoords.radius
              );
            }
          }
          return true; // Pas de coords = on inclut
        }

        // Pour les autres statuts, n'inclure que si provider_id est defini
        // (commandes vraiment assignees a ce prestataire)
        if (!order.provider_id) {
          return false;
        }
        return true;
      });

      // Convertir les commandes API vers le format TodayBooking
      if (validOrders && validOrders.length > 0) {
        const formattedBookings: TodayBooking[] = validOrders.map((order: ProviderOrder) => {
          const orderAny = order as any;
          // Prix: priorite a 'price' (champ DB), puis total_amount
          const price = orderAny.price || order.total_amount || orderAny.service?.price || 0;

          return {
            id: order.id,
            order_number: `BK-${order.id}`,
            status: order.status as BookingStatus,
            service: {
              title: order.service?.title || orderAny.service_name || 'Service',
              duration_minutes: 60,
              price: price,
            },
            user: {
              name: orderAny.user_name
                || (orderAny.user_first_name ? `${orderAny.user_first_name} ${orderAny.user_last_name || ''}`.trim() : null)
                || (order.client ? `${order.client.first_name || ''} ${order.client.last_name || ''}`.trim() : null)
                || 'Client',
              id: orderAny.user_id || order.client?.id || 0,
            },
            booking_date: order.scheduled_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            booking_time: order.scheduled_at?.split('T')[1]?.substring(0, 8) || '00:00:00',
            address: order.address || orderAny.address_line || '',
          };
        });
        setBookings(formattedBookings);
      } else {
        // Nouveau prestataire - pas de commandes
        setBookings([]);
      }

      // Compter les commandes pending (nouvelles demandes en attente)
      const pendingOrders = validOrders.filter((o: ProviderOrder) => o.status === 'pending');
      const completedOrders = validOrders.filter((o: ProviderOrder) => o.status === 'completed');

      // Mettre a jour les stats (utiliser validOrders)
      // Pour "today": inclure les commandes pending + celles programmees aujourd'hui + completees aujourd'hui
      const today = new Date().toDateString();
      const todayOrders = validOrders.filter((o: ProviderOrder) => {
        // Toujours inclure les commandes pending (nouvelles demandes)
        if (o.status === 'pending') return true;
        // Inclure les commandes completees aujourd'hui (par completed_at ou updated_at)
        const orderAny = o as any;
        if (o.status === 'completed') {
          const completedDate = new Date(orderAny.completed_at || orderAny.updated_at || o.scheduled_at).toDateString();
          return completedDate === today;
        }
        // Sinon filtrer par date de reservation
        const orderDate = new Date(o.scheduled_at).toDateString();
        return orderDate === today;
      });

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekOrders = validOrders.filter((o: ProviderOrder) => {
        // Toujours inclure les commandes pending
        if (o.status === 'pending') return true;
        // Pour les completees, utiliser completed_at
        const orderAny = o as any;
        if (o.status === 'completed') {
          const completedDate = new Date(orderAny.completed_at || orderAny.updated_at || o.scheduled_at);
          return completedDate >= weekAgo;
        }
        const orderDate = new Date(o.scheduled_at);
        return orderDate >= weekAgo;
      });

      setStats({
        today: {
          bookings: todayOrders.length,
          earnings: todayEarnings.net || 0,
          completed: todayOrders.filter((o: ProviderOrder) => o.status === 'completed').length,
        },
        week: {
          bookings: weekOrders.length,
          earnings: weekEarnings.net || 0,
          completed: weekOrders.filter((o: ProviderOrder) => o.status === 'completed').length,
        },
        month: {
          bookings: validOrders.length,
          earnings: monthEarnings.net || 0,
          completed: validOrders.filter((o: ProviderOrder) => o.status === 'completed').length,
        },
        // Le backend retourne 'rating' (pas 'average_rating')
        rating: parseFloat(String(providerProfile?.rating || providerProfile?.average_rating || 0)) || 0,
        reviews_count: parseInt(String(providerProfile?.total_reviews || 0), 10) || 0,
        // Taux de completion = completed / (commandes acceptees, pas pending)
        // Exclure pending car ce sont des nouvelles demandes pas encore traitees
        completion_rate: (() => {
          const acceptedOrders = validOrders.filter((o: ProviderOrder) =>
            o.status !== 'pending' && o.status !== 'cancelled'
          );
          const completedOrders = validOrders.filter((o: ProviderOrder) => o.status === 'completed');
          return acceptedOrders.length > 0
            ? Math.round((completedOrders.length / acceptedOrders.length) * 100)
            : 0;
        })(),
      });
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      // Garder les donnees demo en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  }, [providerCoords]);

  // Compter les messages non lus des clients
  const fetchUnreadMessages = useCallback(async () => {
    // Ignorer pendant 10 secondes apres avoir clique sur le bouton
    const timeSinceClick = Date.now() - lastClickTimeRef.current;
    if (timeSinceClick < 10000) {
      return;
    }

    try {
      // Recuperer TOUTES les commandes (y compris completees pour les messages non lus)
      const ordersData = await getProviderOrders().catch(() => []);

      // Commandes assignees au provider (pas pending car pas encore de provider_id)
      const ordersWithChat = (ordersData || []).filter((o: any) =>
        ['accepted', 'on_way', 'arrived', 'in_progress', 'completed'].includes(o.status)
      );

      // Trouver l'ordre qui a vraiment des messages non lus
      let orderWithUnread: number | null = null;
      for (const order of ordersWithChat) {
        try {
          const chatStatus = await apiClient.get(`/api/orders/${order.id}/chat-status`);
          const unreadCount = chatStatus.data?.data?.unread_count ?? 0;
          if (unreadCount > 0) {
            orderWithUnread = order.id;
            break; // Prendre le premier ordre avec messages non lus
          }
        } catch (e) {
          // Ignorer les erreurs pour cet ordre (403, etc.)
        }
      }

      // Fallback: premier ordre assigne (pas pending)
      setActiveOrderWithMessages(orderWithUnread || (ordersWithChat.length > 0 ? ordersWithChat[0].id : null));

      // Utiliser l'endpoint unread-count global
      const response = await apiClient.get('/api/chat/unread-count');
      const count = response.data?.data?.unread_count ?? 0;
      setUnreadMessages(count);
    } catch (error) {
      // Silently ignore errors
    }
  }, []);

  // Ouvrir le chat
  const handleMessagesPress = () => {
    if (activeOrderWithMessages) {
      // Bloquer les fetches pendant 10 secondes pour laisser le temps de marquer comme lu
      lastClickTimeRef.current = Date.now();
      const orderId = activeOrderWithMessages;
      router.push(`/chat/${orderId}` as any);
    } else {
      // Aller vers les reservations si pas de commande active avec messages
      router.push('/(provider)/bookings');
    }
  };

  // Charger les donnees au montage et quand l'ecran devient actif
  useFocusEffect(
    useCallback(() => {
      // Reinitialiser le blocage quand on revient sur l'ecran (retour du chat)
      lastClickTimeRef.current = 0;

      loadDashboardData();
      fetchUnreadMessages();

      // Polling des commandes toutes les 15 secondes (le layout poll deja toutes les 5s pour le modal)
      const ordersInterval = setInterval(() => {
        loadDashboardData(false); // false = pas de loader
      }, 15000);

      // Polling des messages toutes les 15 secondes
      const messagesInterval = setInterval(fetchUnreadMessages, 15000);

      return () => {
        clearInterval(ordersInterval);
        clearInterval(messagesInterval);
      };
    }, [loadDashboardData, fetchUnreadMessages])
  );

  const currentStats = stats[selectedPeriod];

  // Verifier si le prestataire a deja une commande active
  const activeOrder = bookings.find(b =>
    b.status === 'accepted' || b.status === 'on_way' || b.status === 'arrived' || b.status === 'in_progress'
  );
  const hasActiveOrder = !!activeOrder;

  // Animation du bouton quand disponible
  useEffect(() => {
    if (isAvailable) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isAvailable]);

  // Charger le statut de disponibilite et la position au demarrage
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const profile = await getProviderProfile();
        setIsAvailable(profile?.is_available ?? false);

        // Charger la position pour le filtrage des commandes
        if (profile?.latitude && profile?.longitude) {
          setProviderCoords({
            lat: profile.latitude,
            lon: profile.longitude,
            radius: profile.intervention_radius || DEFAULT_RADIUS_KM,
          });
        } else {
          // Utiliser la position du device si pas de position dans le profil
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            setProviderCoords({
              lat: location.coords.latitude,
              lon: location.coords.longitude,
              radius: profile?.intervention_radius || DEFAULT_RADIUS_KM,
            });
          }
        }
      } catch (error) {
        // Silently ignore - on affichera toutes les commandes
      }
    };
    loadProfileData();
  }, []);

  // Toggle disponibilite
  const handleToggleAvailability = async () => {
    const newStatus = !isAvailable;

    hapticFeedback.medium();
    setIsTogglingAvailability(true);

    try {
      await updateProviderProfile({ is_available: newStatus });
      setIsAvailable(newStatus);
      hapticFeedback.success();

      // Message de confirmation
      if (newStatus) {
        Alert.alert(
          '🟢 Vous etes en ligne !',
          'Vous recevrez maintenant des demandes de clients.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[ProviderDashboard] Error toggling availability:', error);
      hapticFeedback.error();
      Alert.alert('Erreur', 'Impossible de modifier votre disponibilite. Reessayez.');
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  // Verifier si le prestataire a configure ses services (onboarding)
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // Debug: verifier le token d'abord
        const { getToken } = await import('../../src/lib/api/client');
        const token = await getToken();
        console.log('[ProviderDashboard] checkOnboarding - Token:', token ? token.substring(0, 30) + '...' : 'AUCUN');

        if (!token) {
          console.log('[ProviderDashboard] No token, waiting...');
          // Attendre un peu et réessayer
          await new Promise(resolve => setTimeout(resolve, 500));
          const retryToken = await getToken();
          if (!retryToken) {
            console.error('[ProviderDashboard] Still no token after retry');
            Alert.alert(
              'Session non valide',
              'Veuillez vous reconnecter.',
              [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
            );
            return;
          }
        }

        const services = await getProviderServices();
        console.log('[ProviderDashboard] Services charges:', services?.length || 0);

        if (!services || services.length === 0) {
          // Pas de services configures - rediriger vers onboarding
          Alert.alert(
            'Configuration requise',
            'Veuillez configurer vos services pour commencer a recevoir des reservations.',
            [
              {
                text: 'Configurer',
                onPress: () => router.push('/(provider)/onboarding' as any),
              },
            ]
          );
        }
      } catch (error: any) {
        console.error('[ProviderDashboard] checkOnboarding error:', error?.response?.status, error?.message);

        // Si 401, verifier si on a vraiment un token
        if (error?.response?.status === 401) {
          const { getToken } = await import('../../src/lib/api/client');
          const token = await getToken();
          console.error('[ProviderDashboard] 401 error - Token exists?', !!token);

          Alert.alert(
            'Erreur d\'authentification',
            'Votre session semble invalide. Essayez de vous reconnecter.',
            [
              { text: 'Reessayer', onPress: () => setHasCheckedOnboarding(false) },
              { text: 'Reconnecter', onPress: () => router.replace('/auth/login') },
            ]
          );
          return;
        }
        // En cas d'autre erreur, ignorer
      } finally {
        setHasCheckedOnboarding(true);
      }
    };

    if (!hasCheckedOnboarding) {
      checkOnboarding();
    }
  }, [hasCheckedOnboarding]);

  // Switch to client mode
  const handleSwitchToClient = () => {
    hapticFeedback.medium();
    Alert.alert(
      'Mode Client',
      'Basculer vers l\'espace client ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            dispatch(switchRole('user'));
            router.replace('/(client)');
          },
        },
      ]
    );
  };

  // Pull to refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    hapticFeedback.light();
    await loadDashboardData(false);
    setIsRefreshing(false);
  };

  // Status helpers
  const getStatusColor = (status: BookingStatus): 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'on_way': return 'accent';
      case 'arrived': return 'primary';
      case 'in_progress': return 'primary';
      case 'completed_pending_review': return 'warning';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: BookingStatus): string => {
    switch (status) {
      case 'pending': return '⏳ En attente';
      case 'accepted': return '✅ Accepté';
      case 'on_way': return '🚗 En route';
      case 'arrived': return '📍 Arrivé';
      case 'in_progress': return '🔨 En cours';
      case 'completed_pending_review': return '⭐ Avis en attente';
      case 'completed': return '✓ Terminé';
      case 'cancelled': return '✕ Annulé';
      default: return status;
    }
  };

  // Booking actions - connectes aux vraies APIs
  const handleAcceptBooking = async (id: number) => {
    // Bloquer si une commande est deja active
    if (hasActiveOrder && activeOrder) {
      hapticFeedback.warning();
      Alert.alert(
        '⚠️ Commande en cours',
        `Vous avez déjà une commande active (#${activeOrder.order_number} - ${activeOrder.service.title}).\n\nTerminez-la avant d'en accepter une nouvelle.`,
        [{ text: 'Compris' }]
      );
      return;
    }

    hapticFeedback.medium();
    try {
      await acceptOrder(id);
      setBookings(prev =>
        prev.map(b => b.id === id ? { ...b, status: 'accepted' as BookingStatus } : b)
      );
      hapticFeedback.success();
      Alert.alert('✅ Commande acceptée', 'Vous pouvez maintenant démarrer le trajet.');
    } catch (error: any) {
      console.error('Erreur acceptation:', error);
      hapticFeedback.error();

      // Afficher le message d'erreur du backend
      const errorMessage = error?.response?.data?.message
        || error?.response?.data?.error
        || 'Impossible d\'accepter cette commande. Elle a peut-être déjà été prise.';

      Alert.alert('Erreur', errorMessage);
    }
  };

  const handleRejectBooking = (id: number) => {
    hapticFeedback.warning();
    Alert.alert(
      'Refuser la reservation',
      'Etes-vous sur de vouloir refuser cette reservation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(id, 'Refuse par le prestataire');
              // Retirer la commande de la liste (refusee)
              setBookings(prev => prev.filter(b => b.id !== id));
              hapticFeedback.success();
            } catch (error) {
              console.error('Erreur refus:', error);
              Alert.alert('Erreur', 'Impossible de refuser cette commande');
            }
          },
        },
      ]
    );
  };

  const handleStartRoute = async (id: number) => {
    hapticFeedback.medium();
    try {
      await startOrder(id);
      setBookings(prev =>
        prev.map(b => b.id === id ? { ...b, status: 'on_way' as BookingStatus } : b)
      );
      // Navigate to journey mode with booking ID
      router.push(`/(provider)/booking/journey/${id}` as any);
    } catch (error) {
      console.error('Erreur demarrage:', error);
      // Fallback: naviguer quand meme
      setBookings(prev =>
        prev.map(b => b.id === id ? { ...b, status: 'on_way' as BookingStatus } : b)
      );
      router.push(`/(provider)/booking/journey/${id}` as any);
    }
  };

  const handleArrived = async (id: number) => {
    console.log('[DASHBOARD] handleArrived called for booking:', id);
    hapticFeedback.medium();
    try {
      console.log('[DASHBOARD] Calling arriveAtClient...');
      const result = await arriveAtClient(id);
      console.log('[DASHBOARD] arriveAtClient success:', result);
      setBookings(prev =>
        prev.map(b => b.id === id ? { ...b, status: 'arrived' as BookingStatus } : b)
      );
      hapticFeedback.success();
      Alert.alert(
        '📍 Arrivée signalée',
        'Le client a été notifié. Attendez sa confirmation pour démarrer la prestation.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('[DASHBOARD] arriveAtClient error:', error);
      console.error('[DASHBOARD] Error details:', error?.response?.data || error?.message);
      hapticFeedback.error();
      Alert.alert('Erreur', error?.response?.data?.message || 'Impossible de signaler votre arrivée');
    }
  };

  const handleCompleteService = async (id: number) => {
    hapticFeedback.medium();
    try {
      await completeOrder(id);
      setBookings(prev =>
        prev.map(b => b.id === id ? { ...b, status: 'completed' as BookingStatus } : b)
      );
      hapticFeedback.success();
    } catch (error) {
      console.error('Erreur completion:', error);
      // Fallback: mettre a jour localement
      setBookings(prev =>
        prev.map(b => b.id === id ? { ...b, status: 'completed' as BookingStatus } : b)
      );
      hapticFeedback.success();
    }
  };

  const getCardStyle = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return styles.cardPending;
      case 'accepted':
        return styles.cardAccepted;
      case 'on_way':
        return styles.cardOnWay;
      case 'arrived':
        return styles.cardArrived;
      case 'in_progress':
        return styles.cardInProgress;
      default:
        return {};
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* Header Sticky */}
      <View style={styles.stickyHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={handleSwitchToClient}
          >
            <Text style={styles.switchModeIcon}>👤</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.name}>{user?.first_name || user?.name || 'Prestataire'} 👋</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {/* Bouton Messages */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleMessagesPress}
          >
            <Text style={styles.headerButtonIcon}>💬</Text>
            {unreadMessages > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Bouton Notifications */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/notifications')}
          >
            <Text style={styles.headerButtonIcon}>🔔</Text>
            {unreadNotifications > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >

      {/* Availability Toggle - Style Uber */}
      <Animated.View style={[styles.availabilityContainer, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={[
            styles.availabilityButton,
            isAvailable ? styles.availabilityButtonOnline : styles.availabilityButtonOffline,
          ]}
          onPress={handleToggleAvailability}
          disabled={isTogglingAvailability}
          activeOpacity={0.8}
        >
          {isTogglingAvailability ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <View style={[
                styles.availabilityIndicator,
                isAvailable ? styles.indicatorOnline : styles.indicatorOffline,
              ]} />
              <View style={styles.availabilityTextContainer}>
                <Text style={styles.availabilityStatus}>
                  {isAvailable ? 'EN LIGNE' : 'HORS LIGNE'}
                </Text>
                <Text style={styles.availabilityHint}>
                  {isAvailable ? 'Vous recevez des demandes' : 'Appuyez pour passer en ligne'}
                </Text>
              </View>
              <Text style={styles.availabilityIcon}>
                {isAvailable ? '🟢' : '🔴'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Location Update Button */}
      <TouchableOpacity
        style={styles.locationUpdateButton}
        onPress={handleUpdateLocation}
        disabled={isUpdatingLocation}
        activeOpacity={0.7}
      >
        {isUpdatingLocation ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Text style={styles.locationUpdateIcon}>📍</Text>
            <Text style={styles.locationUpdateText}>
              {currentLocation || 'Mettre a jour ma position'}
            </Text>
            <Text style={styles.locationUpdateArrow}>→</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as PeriodType[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => {
              hapticFeedback.selection();
              setSelectedPeriod(period);
            }}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period === 'today' ? "Aujourd'hui" : period === 'week' ? 'Semaine' : 'Mois'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <Card style={[styles.statCard, styles.statCardBlue]}>
          <Text style={styles.statIcon}>📋</Text>
          <Text style={styles.statValue}>
            {bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length}
          </Text>
          <Text style={styles.statLabel}>Actives</Text>
        </Card>

        <Card style={[styles.statCard, styles.statCardGreen]}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={[styles.statValue, styles.statValueGreen]}>{currentStats.earnings} DH</Text>
          <Text style={styles.statLabel}>Revenus</Text>
        </Card>

        <Card style={[styles.statCard, styles.statCardPurple]}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statValue}>{currentStats.completed}</Text>
          <Text style={styles.statLabel}>Completes</Text>
        </Card>

        <Card style={[styles.statCard, styles.statCardYellow]}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={[styles.statValue, styles.statValueYellow]}>
            {stats.reviews_count > 0 ? Number(stats.rating).toFixed(1) : '0.0'}
          </Text>
          <Text style={styles.statLabel}>Note moyenne</Text>
        </Card>
      </View>

      {/* Performance */}
      <Card style={styles.performanceCard}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.performanceRow}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Taux de completion</Text>
            <Text style={styles.performanceValue}>{stats.completion_rate}%</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Total avis</Text>
            <Text style={styles.performanceValue}>{stats.reviews_count}</Text>
          </View>
        </View>
      </Card>

      {/* Active Bookings */}
      <View style={styles.todaySection}>
        <View style={styles.todaySectionHeader}>
          <Text style={styles.sectionTitle}>Réservations actives</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/bookings')}>
            <Text style={styles.viewAll}>Voir tout →</Text>
          </TouchableOpacity>
        </View>

        {bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length === 0 ? (
          <Card>
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>Aucune réservation active</Text>
            </View>
          </Card>
        ) : (
          bookings
            .filter(b => b.status !== 'completed' && b.status !== 'cancelled')
            .map((booking) => (
              <Card key={booking.id} style={[styles.bookingCard, getCardStyle(booking.status)]}>
                {/* Header */}
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingHeaderLeft}>
                    <Text style={styles.bookingService}>{booking.service.title}</Text>
                    <Text style={styles.bookingOrder}>#{booking.order_number}</Text>
                  </View>
                  <Badge color={getStatusColor(booking.status)} size="sm" variant="soft">
                    {getStatusLabel(booking.status)}
                  </Badge>
                </View>

                {/* Client Info */}
                <View style={styles.bookingClient}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>
                      {booking.user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{booking.user.name}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() => router.push(`/chat/${booking.id}` as any)}
                  >
                    <Text style={styles.chatButtonText}>💬 Chat</Text>
                  </TouchableOpacity>
                </View>

                {/* Details */}
                <View style={styles.bookingDetails}>
                  <Text style={styles.bookingDetail}>
                    🕐 {booking.booking_time.substring(0, 5)} • {booking.service.duration_minutes} min
                  </Text>
                  <Text style={styles.bookingDetail}>
                    📍 {booking.address}
                  </Text>
                  <Text style={styles.bookingPrice}>
                    💰 {booking.service.price} DH
                  </Text>
                </View>

                {/* Actions based on status */}
                <View style={styles.bookingActions}>
                  {booking.status === 'pending' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => handleRejectBooking(booking.id)}
                        style={styles.rejectButton}
                        textStyle={styles.rejectButtonText}
                      >
                        Refuser
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onPress={() => handleAcceptBooking(booking.id)}
                        style={[styles.acceptButton, hasActiveOrder && styles.buttonDisabled]}
                      >
                        {hasActiveOrder ? '🔒 Terminez d\'abord' : 'Accepter'}
                      </Button>
                    </>
                  )}

                  {booking.status === 'accepted' && (
                    <View style={styles.acceptedActions}>
                      <View style={styles.contactActions}>
                        <TouchableOpacity
                          style={styles.contactButton}
                          onPress={() => router.push(`/chat/${booking.id}` as any)}
                        >
                          <Text style={styles.contactButtonText}>💬 Message</Text>
                        </TouchableOpacity>
                        {booking.user.phone && String(booking.user.phone).length > 0 ? (
                          <TouchableOpacity
                            style={styles.contactButton}
                            onPress={() => {
                              hapticFeedback.light();
                              Linking.openURL(`tel:${String(booking.user.phone).replace(/\s/g, '')}`);
                            }}
                          >
                            <Text style={styles.contactButtonText}>📞 Appeler</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      <Button
                        variant="primary"
                        size="sm"
                        onPress={() => handleStartRoute(booking.id)}
                        fullWidth
                        style={{ marginTop: spacing.sm }}
                      >
                        🚗 Démarrer (En route)
                      </Button>
                    </View>
                  )}

                  {booking.status === 'on_way' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={() => handleArrived(booking.id)}
                      fullWidth
                    >
                      📍 Je suis arrivé
                    </Button>
                  )}

                  {booking.status === 'arrived' && (
                    <View style={styles.waitingConfirmation}>
                      <Text style={styles.waitingConfirmationIcon}>⏳</Text>
                      <Text style={styles.waitingConfirmationText}>
                        En attente de confirmation du client
                      </Text>
                    </View>
                  )}

                  {booking.status === 'in_progress' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={() => handleCompleteService(booking.id)}
                      fullWidth
                    >
                      ✅ Terminer le service
                    </Button>
                  )}
                </View>
              </Card>
            ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              hapticFeedback.light();
              router.push('/(provider)/bookings');
            }}
          >
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionLabel}>Commandes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              hapticFeedback.light();
              router.push('/(provider)/earnings');
            }}
          >
            <Text style={styles.quickActionIcon}>💰</Text>
            <Text style={styles.quickActionLabel}>Revenus</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              hapticFeedback.light();
              router.push('/settings');
            }}
          >
            <Text style={styles.quickActionIcon}>⚙️</Text>
            <Text style={styles.quickActionLabel}>Paramètres</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              hapticFeedback.light();
              Alert.alert('Aide', 'Support: support@glamgo.ma');
            }}
          >
            <Text style={styles.quickActionIcon}>❓</Text>
            <Text style={styles.quickActionLabel}>Aide</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Spacer for tab bar */}
      <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },

  // Header Sticky
  stickyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingTop: Platform.OS === 'android' ? spacing.md : spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.md,
    zIndex: 100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchModeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  switchModeIcon: {
    fontSize: 20,
  },
  greeting: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  name: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerButtonIcon: {
    fontSize: 20,
  },
  headerBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.gray[50],
  },
  headerBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Availability Toggle - Uber Style
  availabilityContainer: {
    marginBottom: spacing.lg,
  },
  availabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  availabilityButtonOnline: {
    backgroundColor: colors.success,
  },
  availabilityButtonOffline: {
    backgroundColor: colors.gray[600],
  },
  availabilityIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  indicatorOnline: {
    backgroundColor: colors.white,
    shadowColor: colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  indicatorOffline: {
    backgroundColor: colors.gray[400],
  },
  availabilityTextContainer: {
    flex: 1,
  },
  availabilityStatus: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 1,
  },
  availabilityHint: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  availabilityIcon: {
    fontSize: 24,
  },

  // Location Update Button
  locationUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    ...shadows.sm,
  },
  locationUpdateIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  locationUpdateText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontWeight: '500',
  },
  locationUpdateArrow: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[600],
  },
  periodButtonTextActive: {
    color: colors.white,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    padding: spacing.lg,
  },
  statCardBlue: {
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 3,
    borderBottomColor: '#3B82F6',
  },
  statCardGreen: {
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 3,
    borderBottomColor: colors.success,
  },
  statCardPurple: {
    backgroundColor: '#FAF5FF',
    borderBottomWidth: 3,
    borderBottomColor: '#A855F7',
  },
  statCardYellow: {
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 3,
    borderBottomColor: '#F59E0B',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  statValueGreen: {
    color: colors.success,
  },
  statValueYellow: {
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    textAlign: 'center',
  },

  // Performance
  performanceCard: {
    marginBottom: spacing.lg,
  },
  performanceRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  performanceItem: {
    flex: 1,
  },
  performanceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Section Title
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },

  // Today Section
  todaySection: {
    marginBottom: spacing.lg,
  },
  todaySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAll: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },

  // Booking Card
  bookingCard: {
    marginBottom: spacing.md,
  },
  cardPending: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  cardAccepted: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  cardOnWay: {
    backgroundColor: '#F0FDFA',
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  cardArrived: {
    backgroundColor: '#EDE9FE',
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  cardInProgress: {
    backgroundColor: '#FFF1F2',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  bookingHeaderLeft: {
    flex: 1,
  },
  bookingService: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  bookingOrder: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  bookingClient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray[100],
    marginBottom: spacing.md,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  chatButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  chatButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: '600',
  },
  bookingDetails: {
    gap: 6,
    marginBottom: spacing.md,
  },
  bookingDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
  bookingPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  rejectButtonText: {
    color: colors.gray[700],
  },
  acceptButton: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: colors.gray[400],
  },

  // Accepted order actions
  acceptedActions: {
    width: '100%',
  },
  contactActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  contactButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  contactButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },

  // Quick Actions
  quickActions: {
    marginBottom: spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  quickActionButton: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
    fontWeight: '500',
  },

  // Waiting confirmation
  waitingConfirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  waitingConfirmationIcon: {
    fontSize: 20,
  },
  waitingConfirmationText: {
    fontSize: typography.fontSize.sm,
    color: '#6B21A8',
    fontWeight: '600',
    textAlign: 'center',
  },
});
