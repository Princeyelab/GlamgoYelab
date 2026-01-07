/**
 * Notifications Screen - GlamGo Mobile
 * Affiche toutes les notifications de l'utilisateur
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../src/components/ui/Card';
import Loading from '../src/components/ui/Loading';
import { colors, spacing, typography, borderRadius, shadows } from '../src/lib/constants/theme';
import { useAppSelector } from '../src/lib/store/hooks';
import { selectUser, selectUserRole } from '../src/lib/store/slices/authSlice';
import apiClient from '../src/lib/api/client';
import { ENDPOINTS } from '../src/lib/api/endpoints';
import { useLanguage } from '../src/contexts/LanguageContext';

// Types
type NotificationType = 'booking' | 'promo' | 'system' | 'review' | 'reminder' | 'new_order' | 'order_accepted' | 'order_completed' | 'provider_cancelled' | 'satisfaction_received' | 'order_expired';

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: {
    booking_id?: number;
    order_id?: number;
    service_id?: number;
    provider_id?: number;
    promo_code?: string;
  };
}

// Mapper les types de notification DB vers les types d'icones
const getNotificationType = (dbType: string): NotificationType => {
  // Types specifiques d'abord
  if (dbType === 'satisfaction_received') return 'satisfaction_received';
  if (dbType === 'order_expired') return 'order_expired';
  if (dbType.includes('order') || dbType.includes('booking')) return 'booking';
  if (dbType.includes('promo')) return 'promo';
  if (dbType.includes('review')) return 'review';
  if (dbType.includes('reminder')) return 'reminder';
  return 'system';
};

// Mapping des titres de notifications FR -> clé de traduction
const NOTIFICATION_TITLE_MAP: Record<string, string> = {
  // Commandes
  'nouvelle commande disponible': 'notificationTitles.newOrderAvailable',
  'nouvelle commande': 'notificationTitles.newOrder',
  'commande acceptée': 'notificationTitles.orderAccepted',
  'commande acceptee': 'notificationTitles.orderAccepted',
  'commande accepté': 'notificationTitles.orderAccepted',
  'commande confirmée': 'notificationTitles.orderConfirmed',
  'commande confirmee': 'notificationTitles.orderConfirmed',
  'commande confirmé': 'notificationTitles.orderConfirmed',
  'commande annulée': 'notificationTitles.orderCancelled',
  'commande annulee': 'notificationTitles.orderCancelled',
  'commande annulé': 'notificationTitles.orderCancelled',
  'commande annulée - indemnisation': 'notificationTitles.orderCancelledCompensation',
  'commande annulée par le client': 'notificationTitles.orderCancelledByClient',
  'commande annulee par le client': 'notificationTitles.orderCancelledByClient',
  'commande expirée': 'notificationTitles.orderExpired',
  'commande expiree': 'notificationTitles.orderExpired',
  'commande expiré': 'notificationTitles.orderExpired',
  // Prestations
  'prestation confirmée': 'notificationTitles.orderConfirmed',
  'prestation confirmee': 'notificationTitles.orderConfirmed',
  'prestation confirmé': 'notificationTitles.orderConfirmed',
  'prestation acceptée': 'notificationTitles.orderAccepted',
  'prestation acceptee': 'notificationTitles.orderAccepted',
  'prestation accepté': 'notificationTitles.orderAccepted',
  'prestation annulée': 'notificationTitles.orderCancelled',
  'prestation annulee': 'notificationTitles.orderCancelled',
  'prestation annulé': 'notificationTitles.orderCancelled',
  'prestation terminée': 'notificationTitles.serviceCompleted',
  'prestation terminee': 'notificationTitles.serviceCompleted',
  'prestation terminé': 'notificationTitles.serviceCompleted',
  'prestation terminee - evaluez le service': 'notificationTitles.serviceCompletedRate',
  'prestation terminée - évaluez le service': 'notificationTitles.serviceCompletedRate',
  // Prestataire
  'prestataire en route': 'notificationTitles.providerOnWay',
  'prestataire arrivé': 'notificationTitles.providerArrived',
  'prestataire arrive': 'notificationTitles.providerArrived',
  'prestataire indisponible': 'notificationTitles.providerUnavailable',
  'votre prestataire est arrivé !': 'notificationTitles.yourProviderArrived',
  'votre prestataire est arrivé': 'notificationTitles.yourProviderArrived',
  'votre prestataire est arrive !': 'notificationTitles.yourProviderArrived',
  'votre prestataire est arrive': 'notificationTitles.yourProviderArrived',
  // Refus et expiration
  'commande refusée': 'notificationTitles.orderRejected',
  'commande refusee': 'notificationTitles.orderRejected',
  'demande expiree': 'notificationTitles.requestExpired',
  'demande expirée': 'notificationTitles.requestExpired',
  // Service
  'service terminé': 'notificationTitles.serviceCompleted',
  'service termine': 'notificationTitles.serviceCompleted',
  'service confirmé': 'notificationTitles.orderConfirmed',
  'service confirme': 'notificationTitles.orderConfirmed',
  // Évaluations
  'évaluation reçue': 'notificationTitles.reviewReceived',
  'evaluation recue': 'notificationTitles.reviewReceived',
  'evaluation reçue': 'notificationTitles.reviewReceived',
  'nouvelle évaluation': 'notificationTitles.reviewReceived',
  'nouvelle evaluation': 'notificationTitles.reviewReceived',
  // Réservations
  'rappel de réservation': 'notificationTitles.bookingReminder',
  'rappel de reservation': 'notificationTitles.bookingReminder',
  'nouvelle réservation': 'notificationTitles.newBooking',
  'nouvelle reservation': 'notificationTitles.newBooking',
  'réservation confirmée': 'notificationTitles.bookingConfirmed',
  'reservation confirmee': 'notificationTitles.bookingConfirmed',
  'reservation confirmé': 'notificationTitles.bookingConfirmed',
  'réservation acceptée': 'notificationTitles.orderAccepted',
  'reservation acceptee': 'notificationTitles.orderAccepted',
};


export default function NotificationsScreen() {
  const router = useRouter();
  const { t, isRTL, language } = useLanguage();
  const user = useAppSelector(selectUser);
  const userRole = useAppSelector(selectUserRole);
  const isProvider = userRole === 'provider';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fonction pour traduire le titre de notification
  const translateNotificationTitle = (title: string): string => {
    const normalizedTitle = title.toLowerCase().trim();
    const translationKey = NOTIFICATION_TITLE_MAP[normalizedTitle];
    if (translationKey) {
      return t(translationKey);
    }
    return title;
  };

  // Fonction pour traduire le message de notification (patterns communs)
  const translateNotificationMessage = (message: string, type: NotificationType): string => {
    // Français = langue originale, pas de traduction
    if (language === 'fr') return message;

    // Traductions anglaises
    if (language === 'en') {
      const enReplacements: [RegExp, string][] = [
        // === CLIENT NOTIFICATIONS ===
        // Order accepted
        [/Votre commande #(\d+) a [ée]t[ée]? accept[ée]e? par un prestataire\.?/gi, 'Your order #$1 has been accepted by a provider.'],
        [/Votre commande #(\d+) a ete acceptee par un prestataire\.?/gi, 'Your order #$1 has been accepted by a provider.'],
        // Provider on the way
        [/Le prestataire est en route pour votre commande #(\d+)\.?/gi, 'The provider is on the way for your order #$1.'],
        [/Votre prestataire est en route\.?/gi, 'Your provider is on the way.'],
        // Provider arrived
        [/Votre prestataire est arriv[ée]?\.?/gi, 'Your provider has arrived.'],
        [/Votre prestataire est arrive\.?/gi, 'Your provider has arrived.'],
        [/Votre prestataire est arriv[ée]? !\.?/gi, 'Your provider has arrived!'],
        [/Veuillez confirmer son arriv[ée]e? pour d[ée]marrer la prestation\.?/gi, 'Please confirm their arrival to start the service.'],
        [/Veuillez confirmer son arrivee pour demarrer la prestation\.?/gi, 'Please confirm their arrival to start the service.'],
        // Provider unavailable
        [/Le prestataire ne peut pas assurer votre commande #(\d+)\. Nous recherchons un rempla[çc]ant\.?/gi, 'The provider cannot complete your order #$1. We are searching for a replacement.'],
        // Order rejected
        [/Votre commande #(\d+) a [ée]t[ée]? refus[ée]e?\. Raison: Refus[ée]e? par le prestataire/gi, 'Your order #$1 was rejected. Reason: Rejected by the provider'],
        [/Votre commande #(\d+) a ete refusee\. Raison: Refuse par le prestataire/gi, 'Your order #$1 was rejected. Reason: Rejected by the provider'],
        [/Votre commande #(\d+) a [ée]t[ée]? refus[ée]e?\. Raison: (.+)/gi, 'Your order #$1 was rejected. Reason: $2'],
        // Order cancelled
        [/Votre commande #(\d+) a [ée]t[ée]? annul[ée]e?\.?/gi, 'Your order #$1 has been cancelled.'],
        [/La commande #(\d+) a [ée]t[ée]? annul[ée]e?\.?/gi, 'Order #$1 has been cancelled.'],
        // Request expired
        [/Le prestataire n'a pas r[ée]pondu [àa] temps\. Votre demande pour "(.+)" a [ée]t[ée]? annul[ée]e?\. Veuillez choisir un autre prestataire\.?/gi, 'The provider did not respond in time. Your request for "$1" has been cancelled. Please choose another provider.'],
        [/Le prestataire n'a pas repondu a temps\. Votre demande pour "(.+)" a ete annulee\. Veuillez choisir un autre prestataire\.?/gi, 'The provider did not respond in time. Your request for "$1" has been cancelled. Please choose another provider.'],
        // Service completed - rate
        [/Votre prestation est termin[ée]e?\. Merci d'[ée]valuer le service re[çc]u pour lib[ée]rer le paiement\.?/gi, 'Your service is complete. Please rate the service to release payment.'],
        [/Votre prestation est terminee\. Merci d'evaluer le service recu pour liberer le paiement\.?/gi, 'Your service is complete. Please rate the service to release payment.'],
        // Service completed
        [/Votre prestation est termin[ée]e?\.?/gi, 'Your service is complete.'],
        [/La prestation #(\d+) est termin[ée]e?\.?/gi, 'Service #$1 is complete.'],
        // New booking
        [/Vous avez une nouvelle r[ée]servation pour (.+)\.?/gi, 'You have a new booking for $1.'],
        [/Nouvelle r[ée]servation pour (.+)\.?/gi, 'New booking for $1.'],
        // Booking reminder
        [/Rappel: Vous avez une prestation dans (\d+) minutes?\.?/gi, 'Reminder: You have a service in $1 minutes.'],
        [/Rappel de r[ée]servation\.?/gi, 'Booking reminder.'],
        // Payment
        [/Le paiement de ([\d.,]+) ?(?:MAD|DH)? a [ée]t[ée]? effectu[ée]?\.?/gi, 'Payment of $1 MAD has been processed.'],
        [/Le paiement a [ée]t[ée]? effectu[ée]?\.?/gi, 'Payment has been processed.'],

        // === PROVIDER NOTIFICATIONS ===
        // New order
        [/Une nouvelle commande (.+) est disponible/gi, 'A new order $1 is available'],
        [/Vous avez une nouvelle commande\.?/gi, 'You have a new order.'],
        [/Vous avez re[çc]u une nouvelle commande\.?/gi, 'You have received a new order.'],
        [/Une nouvelle commande vous attend\.?/gi, 'A new order is waiting for you.'],
        [/Nouvelle commande #(\d+) de (.+)\.?/gi, 'New order #$1 from $2.'],
        [/Nouvelle demande de (.+) pour le service (.+)\.?/gi, 'New request from $1 for service $2.'],
        [/Nouvelle demande pour le service (.+)\.?/gi, 'New request for service $1.'],
        [/Vous avez une nouvelle demande pour (.+)\.?/gi, 'You have a new request for $1.'],
        [/Vous avez une nouvelle demande\.?/gi, 'You have a new request.'],
        // Client confirmed arrival
        [/Le client a confirm[ée]? votre arriv[ée]e?\.?/gi, 'The client confirmed your arrival.'],
        [/Le client a confirme votre arrivee\.?/gi, 'The client confirmed your arrival.'],
        [/Arriv[ée]e? confirm[ée]e? par le client\.?/gi, 'Arrival confirmed by the client.'],
        // Client cancellation
        [/Le client a annul[ée]? la commande #(\d+)\.?/gi, 'The client cancelled order #$1.'],
        [/Le client a annule la commande #(\d+)\.?/gi, 'The client cancelled order #$1.'],
        [/Le client a annul[ée]? la commande\.?/gi, 'The client cancelled the order.'],
        [/La commande #(\d+) a [ée]t[ée]? annul[ée]e? par le client\.?/gi, 'Order #$1 was cancelled by the client.'],
        [/Le client (.+) a annul[ée]? sa commande\.?/gi, 'Client $1 cancelled their order.'],
        // Review received
        [/Vous avez re[çc]u (\d+)\/5 [ée]toiles? pour votre prestation\.?/gi, 'You received $1/5 stars for your service.'],
        [/Vous avez recu (\d+)\/5 etoiles pour votre prestation\.?/gi, 'You received $1/5 stars for your service.'],
        [/Vous avez re[çc]u une [ée]valuation de (\d+) [ée]toiles?\.?/gi, 'You received a $1-star rating.'],
        [/Vous avez re[çc]u une nouvelle [ée]valuation\.?/gi, 'You received a new review.'],
        [/Le client vous a attribu[ée]? (\d+) [ée]toiles?\.?/gi, 'The client gave you $1 stars.'],
        [/Nouvelle [ée]valuation: (\d+)\/5 [ée]toiles?\.?/gi, 'New review: $1/5 stars.'],
        [/(.+) vous a laiss[ée]? un avis\.?/gi, '$1 left you a review.'],
        [/Bravo! Vous avez re[çc]u 5 [ée]toiles?\.?/gi, 'Congratulations! You received 5 stars.'],
        // Payment received
        [/Paiement re[çc]u pour la commande #(\d+)\.?/gi, 'Payment received for order #$1.'],
        [/Votre paiement de ([\d.,]+) ?(?:MAD|DH)? a [ée]t[ée]? transf[ée]r[ée]?\.?/gi, 'Your payment of $1 MAD has been transferred.'],
        [/Paiement de ([\d.,]+) ?(?:MAD|DH)? cr[ée]dit[ée]? sur votre compte\.?/gi, 'Payment of $1 MAD credited to your account.'],
        [/Votre solde a [ée]t[ée]? cr[ée]dit[ée]? de ([\d.,]+) ?(?:MAD|DH)?\.?/gi, 'Your balance has been credited with $1 MAD.'],
        [/Gains de la journ[ée]e?: ([\d.,]+) ?(?:MAD|DH)?\.?/gi, 'Today\'s earnings: $1 MAD.'],
        // Compensation
        [/Vous recevrez une indemnisation de ([\d.,]+) ?(?:MAD|DH)?\.?/gi, 'You will receive compensation of $1 MAD.'],
        [/Une indemnisation de ([\d.,]+) ?(?:MAD|DH)? vous sera vers[ée]e?\.?/gi, 'Compensation of $1 MAD will be transferred to you.'],
        [/Indemnisation de ([\d.,]+) ?(?:MAD|DH)? suite [àa] l'annulation\.?/gi, 'Compensation of $1 MAD due to cancellation.'],
        // Service completed (provider side)
        [/Prestation termin[ée]e? avec succ[èe]s\.?/gi, 'Service completed successfully.'],
        [/Vous avez termin[ée]? la prestation #(\d+)\.?/gi, 'You completed service #$1.'],
        [/F[ée]licitations! Prestation r[ée]ussie\.?/gi, 'Congratulations! Successful service.'],
        // Order expired
        [/La demande a expir[ée]?\.?/gi, 'The request has expired.'],
        [/Vous n'avez pas r[ée]pondu [àa] temps\.?/gi, 'You did not respond in time.'],
        [/D[ée]lai de r[ée]ponse expir[ée]?\.?/gi, 'Response time expired.'],
        [/La commande #(\d+) a expir[ée]?\.?/gi, 'Order #$1 has expired.'],
        // Start service
        [/Vous pouvez commencer la prestation\.?/gi, 'You can start the service.'],
        [/Vous pouvez d[ée]marrer la prestation\.?/gi, 'You can start the service.'],
        [/La prestation peut commencer\.?/gi, 'The service can begin.'],
        [/Le client vous attend, d[ée]marrez la prestation\.?/gi, 'The client is waiting, start the service.'],
        // En route / Direction
        [/Dirigez-vous vers le client\.?/gi, 'Head to the client.'],
        [/Le client vous attend [àa] (.+)\.?/gi, 'The client is waiting for you at $1.'],
        [/Adresse: (.+)\.?/gi, 'Address: $1.'],
        [/Rendez-vous chez (.+)\.?/gi, 'Appointment at $1.'],
        // Availability
        [/Vous [êe]tes maintenant disponible\.?/gi, 'You are now available.'],
        [/Vous [êe]tes maintenant indisponible\.?/gi, 'You are now unavailable.'],
        [/Votre statut a [ée]t[ée]? mis [àa] jour\.?/gi, 'Your status has been updated.'],
        // Account
        [/Votre compte a [ée]t[ée]? v[ée]rifi[ée]?\.?/gi, 'Your account has been verified.'],
        [/Bienvenue sur GlamGo!\.?/gi, 'Welcome to GlamGo!'],
        [/Votre profil est complet\.?/gi, 'Your profile is complete.'],
        [/Documents valid[ée]s\.?/gi, 'Documents verified.'],
        [/Veuillez compl[ée]ter votre profil\.?/gi, 'Please complete your profile.'],
        // Statistics
        [/Vous avez r[ée]alis[ée]? (\d+) prestations? cette semaine\.?/gi, 'You completed $1 services this week.'],
        [/Votre note moyenne est de ([\d.,]+)\/5\.?/gi, 'Your average rating is $1/5.'],
      ];

      let translatedMessage = message;
      for (const [pattern, replacement] of enReplacements) {
        translatedMessage = translatedMessage.replace(pattern, replacement);
      }
      return translatedMessage;
    }

    // Traductions arabes
    // Patterns de remplacement - PHRASES COMPLÈTES d'abord
    const replacements: [RegExp, string][] = [
      // === NOTIFICATIONS PRESTATAIRE ===
      // Client a confirmé l'arrivée
      [/Le client a confirm[ée]? votre arriv[ée]e?\.?/gi, 'أكد العميل وصولك.'],
      [/Le client a confirme votre arrivee\.?/gi, 'أكد العميل وصولك.'],
      [/Arriv[ée]e? confirm[ée]e? par le client\.?/gi, 'تم تأكيد الوصول من طرف العميل.'],
      // Nouvelle demande / commande / réservation
      [/Vous avez une nouvelle r[ée]servation pour (.+)\.?/gi, 'لديك حجز جديد لـ $1.'],
      [/Vous avez une nouvelle reservation pour (.+)\.?/gi, 'لديك حجز جديد لـ $1.'],
      [/Vous avez une nouvelle demande de (.+) pour (.+)\.?/gi, 'لديك طلب جديد من $1 لـ $2.'],
      [/Vous avez une nouvelle demande pour (.+)\.?/gi, 'لديك طلب جديد لـ $1.'],
      [/Vous avez une nouvelle demande\.?/gi, 'لديك طلب جديد.'],
      [/Nouvelle demande de (.+) pour le service (.+)\.?/gi, 'طلب جديد من $1 لخدمة $2.'],
      [/Nouvelle demande pour le service (.+)\.?/gi, 'طلب جديد لخدمة $1.'],
      [/Vous avez re[çc]u une nouvelle commande\.?/gi, 'لديك طلب جديد.'],
      [/Une nouvelle commande vous attend\.?/gi, 'طلب جديد في انتظارك.'],
      [/Nouvelle commande #(\d+) de (.+)\.?/gi, 'طلب جديد #$1 من $2.'],
      [/Commande #(\d+) - (.+) vous a demand[ée]? (.+)\.?/gi, 'طلب #$1 - $2 طلب منك $3.'],
      // Client annulation
      [/Le client a annul[ée]? la commande #(\d+)\.?/gi, 'ألغى العميل الطلب #$1.'],
      [/Le client a annule la commande #(\d+)\.?/gi, 'ألغى العميل الطلب #$1.'],
      [/Le client a annul[ée]? la commande\.?/gi, 'ألغى العميل الطلب.'],
      [/La commande #(\d+) a [ée]t[ée]? annul[ée]e? par le client\.?/gi, 'تم إلغاء الطلب #$1 من طرف العميل.'],
      [/Annulation par le client pour la commande #(\d+)\.?/gi, 'إلغاء من العميل للطلب #$1.'],
      [/Le client (.+) a annul[ée]? sa commande\.?/gi, 'ألغى العميل $1 طلبه.'],
      // Évaluation reçue
      [/Vous avez re[çc]u (\d+)\/5 [ée]toiles? pour votre prestation\.?/gi, 'حصلت على $1/5 نجوم لخدمتك.'],
      [/Vous avez recu (\d+)\/5 etoiles pour votre prestation\.?/gi, 'حصلت على $1/5 نجوم لخدمتك.'],
      [/Vous avez re[çc]u une [ée]valuation de (\d+) [ée]toiles?\.?/gi, 'حصلت على تقييم $1 نجوم.'],
      [/Vous avez recu une evaluation de (\d+) etoiles?\.?/gi, 'حصلت على تقييم $1 نجوم.'],
      [/Vous avez re[çc]u une nouvelle [ée]valuation\.?/gi, 'حصلت على تقييم جديد.'],
      [/Vous avez recu une nouvelle evaluation\.?/gi, 'حصلت على تقييم جديد.'],
      [/Le client vous a attribu[ée]? (\d+) [ée]toiles?\.?/gi, 'منحك العميل $1 نجوم.'],
      [/Le client (.+) vous a donn[ée]? (\d+) [ée]toiles?\.?/gi, 'منحك العميل $1 تقييم $2 نجوم.'],
      [/Nouvelle [ée]valuation: (\d+)\/5 [ée]toiles?\.?/gi, 'تقييم جديد: $1/5 نجوم.'],
      [/(.+) vous a laiss[ée]? un avis\.?/gi, '$1 ترك لك تقييماً.'],
      [/Bravo! Vous avez re[çc]u 5 [ée]toiles?\.?/gi, 'مبروك! حصلت على 5 نجوم.'],
      // Paiement
      [/Le paiement de ([\d.,]+) ?(?:MAD|DH)? a [ée]t[ée]? effectu[ée]?\.?/gi, 'تم الدفع بمبلغ $1 درهم.'],
      [/Le paiement a [ée]t[ée]? effectu[ée]?\.?/gi, 'تم الدفع.'],
      [/Paiement re[çc]u pour la commande #(\d+)\.?/gi, 'تم استلام الدفع للطلب #$1.'],
      [/Paiement recu pour la commande #(\d+)\.?/gi, 'تم استلام الدفع للطلب #$1.'],
      [/Votre paiement de ([\d.,]+) ?(?:MAD|DH)? a [ée]t[ée]? transf[ée]r[ée]?\.?/gi, 'تم تحويل مبلغ $1 درهم إلى حسابك.'],
      [/Paiement de ([\d.,]+) ?(?:MAD|DH)? cr[ée]dit[ée]? sur votre compte\.?/gi, 'تم إضافة $1 درهم إلى حسابك.'],
      [/Virement de ([\d.,]+) ?(?:MAD|DH)? effectu[ée]?\.?/gi, 'تم تحويل $1 درهم.'],
      [/Votre solde a [ée]t[ée]? cr[ée]dit[ée]? de ([\d.,]+) ?(?:MAD|DH)?\.?/gi, 'تم إضافة $1 درهم إلى رصيدك.'],
      [/Gains de la journ[ée]e?: ([\d.,]+) ?(?:MAD|DH)?\.?/gi, 'أرباح اليوم: $1 درهم.'],
      // Prestation terminée (côté prestataire)
      [/La prestation #(\d+) est termin[ée]e?\.?/gi, 'تم إنهاء الخدمة #$1.'],
      [/Prestation termin[ée]e? avec succ[èe]s\.?/gi, 'تم إنهاء الخدمة بنجاح.'],
      [/Vous avez termin[ée]? la prestation #(\d+)\.?/gi, 'أنهيت الخدمة #$1.'],
      [/Prestation #(\d+) marqu[ée]e? comme termin[ée]e?\.?/gi, 'تم تسجيل الخدمة #$1 كمنتهية.'],
      [/F[ée]licitations! Prestation r[ée]ussie\.?/gi, 'مبروك! خدمة ناجحة.'],
      // Indemnisation
      [/Vous recevrez une indemnisation de ([\d.,]+) ?(?:MAD|DH)?\.?/gi, 'ستحصل على تعويض بمبلغ $1 درهم.'],
      [/Une indemnisation de ([\d.,]+) ?(?:MAD|DH)? vous sera vers[ée]e?\.?/gi, 'سيتم تحويل تعويض بمبلغ $1 درهم.'],
      [/Indemnisation de ([\d.,]+) ?(?:MAD|DH)? suite [àa] l'annulation\.?/gi, 'تعويض $1 درهم بسبب الإلغاء.'],
      [/Compensation re[çc]ue: ([\d.,]+) ?(?:MAD|DH)?\.?/gi, 'تم استلام تعويض: $1 درهم.'],
      // Rappel
      [/Rappel: Vous avez une prestation dans (\d+) minutes?\.?/gi, 'تذكير: لديك خدمة بعد $1 دقيقة.'],
      [/Rappel: Prestation pr[ée]vue [àa] (\d+[h:]\d+)\.?/gi, 'تذكير: خدمة مقررة في الساعة $1.'],
      [/N'oubliez pas votre prestation\.?/gi, 'لا تنسى خدمتك.'],
      [/Votre prochaine prestation commence bient[ôo]t\.?/gi, 'خدمتك القادمة ستبدأ قريباً.'],
      [/Rappel: RDV avec (.+) dans (\d+) minutes?\.?/gi, 'تذكير: موعد مع $1 بعد $2 دقيقة.'],
      [/Pr[ée]parez-vous! Prestation dans (\d+) minutes?\.?/gi, 'استعد! خدمة بعد $1 دقيقة.'],
      // Commande expirée (côté prestataire)
      [/La demande a expir[ée]?\.?/gi, 'انتهت صلاحية الطلب.'],
      [/Vous n'avez pas r[ée]pondu [àa] temps\.?/gi, 'لم ترد في الوقت المحدد.'],
      [/D[ée]lai de r[ée]ponse expir[ée]?\.?/gi, 'انتهى وقت الرد.'],
      [/La commande #(\d+) a expir[ée]?\.?/gi, 'انتهت صلاحية الطلب #$1.'],
      [/Commande #(\d+) expir[ée]e? - d[ée]lai d[ée]pass[ée]?\.?/gi, 'الطلب #$1 منتهي - تم تجاوز المهلة.'],
      [/Temps de r[ée]ponse d[ée]pass[ée]? pour la commande #(\d+)\.?/gi, 'انتهى وقت الرد للطلب #$1.'],
      // Confirmation arrivée demandée
      [/Confirmez votre arriv[ée]e? chez le client\.?/gi, 'أكد وصولك عند العميل.'],
      [/Veuillez confirmer votre arriv[ée]e?\.?/gi, 'يرجى تأكيد وصولك.'],
      [/[ÊE]tes-vous arriv[ée]? chez le client\??/gi, 'هل وصلت عند العميل؟'],
      [/Signalez votre arriv[ée]e? au client\.?/gi, 'أبلغ العميل بوصولك.'],
      // Démarrer prestation
      [/Vous pouvez commencer la prestation\.?/gi, 'يمكنك بدء الخدمة.'],
      [/Vous pouvez d[ée]marrer la prestation\.?/gi, 'يمكنك بدء الخدمة.'],
      [/Vous pouvez demarrer la prestation\.?/gi, 'يمكنك بدء الخدمة.'],
      [/La prestation peut commencer\.?/gi, 'يمكن بدء الخدمة.'],
      [/Le client vous attend, d[ée]marrez la prestation\.?/gi, 'العميل في انتظارك، ابدأ الخدمة.'],
      [/Cliquez pour d[ée]marrer la prestation\.?/gi, 'انقر لبدء الخدمة.'],
      // En route
      [/Dirigez-vous vers le client\.?/gi, 'توجه نحو العميل.'],
      [/Le client vous attend [àa] (.+)\.?/gi, 'العميل في انتظارك في $1.'],
      [/Adresse: (.+)\.?/gi, 'العنوان: $1.'],
      [/Rendez-vous chez (.+)\.?/gi, 'موعد عند $1.'],
      // Disponibilité
      [/Vous [êe]tes maintenant disponible\.?/gi, 'أنت الآن متاح.'],
      [/Vous [êe]tes maintenant indisponible\.?/gi, 'أنت الآن غير متاح.'],
      [/Votre statut a [ée]t[ée]? mis [àa] jour\.?/gi, 'تم تحديث حالتك.'],
      [/Mode disponible activ[ée]?\.?/gi, 'تم تفعيل وضع المتاح.'],
      // Compte et vérification
      [/Votre compte a [ée]t[ée]? v[ée]rifi[ée]?\.?/gi, 'تم التحقق من حسابك.'],
      [/Bienvenue sur GlamGo!\.?/gi, 'مرحباً بك في GlamGo!'],
      [/Votre profil est complet\.?/gi, 'ملفك الشخصي مكتمل.'],
      [/Documents valid[ée]s\.?/gi, 'تم التحقق من الوثائق.'],
      [/Veuillez compl[ée]ter votre profil\.?/gi, 'يرجى إكمال ملفك الشخصي.'],
      // Statistiques
      [/Vous avez r[ée]alis[ée]? (\d+) prestations? cette semaine\.?/gi, 'أنجزت $1 خدمة هذا الأسبوع.'],
      [/Votre note moyenne est de ([\d.,]+)\/5\.?/gi, 'متوسط تقييمك $1/5.'],
      [/Nouveau record! (\d+) prestations? ce mois\.?/gi, 'رقم قياسي جديد! $1 خدمة هذا الشهر.'],

      // === NOTIFICATIONS CLIENT ===
      // Commande acceptée par prestataire
      [/Votre commande #(\d+) a été acceptée par un prestataire\.?/gi, 'تم قبول طلبك #$1 من طرف مقدم خدمة.'],
      [/Votre commande #(\d+) a ete acceptee par un prestataire\.?/gi, 'تم قبول طلبك #$1 من طرف مقدم خدمة.'],
      // Prestataire en route
      [/Le prestataire est en route pour votre commande #(\d+)\.?/gi, 'مقدم الخدمة في الطريق لطلبك #$1.'],
      // Prestataire indisponible
      [/Le prestataire ne peut pas assurer votre commande #(\d+)\. Nous recherchons un remplaçant\.?/gi, 'مقدم الخدمة لا يستطيع تنفيذ طلبك #$1. نبحث عن بديل.'],
      // Commande refusée
      [/Votre commande #(\d+) a été refusée\. Raison: Refusée par le prestataire/gi, 'تم رفض طلبك #$1. السبب: رفض من طرف مقدم الخدمة'],
      [/Votre commande #(\d+) a ete refusee\. Raison: Refuse par le prestataire/gi, 'تم رفض طلبك #$1. السبب: رفض من طرف مقدم الخدمة'],
      [/Votre commande #(\d+) a été refusée\. Raison: (.+)/gi, 'تم رفض طلبك #$1. السبب: $2'],
      // Demande expirée
      [/Le prestataire n'a pas repondu a temps\. Votre demande pour "(.+)" a ete annulee\. Veuillez choisir un autre prestataire\.?/gi, 'لم يرد مقدم الخدمة في الوقت المحدد. تم الغاء طلبك "$1". يرجى اختيار مقدم خدمة اخر.'],
      [/Le prestataire n'a pas répondu à temps\. Votre demande pour "(.+)" a été annulée\. Veuillez choisir un autre prestataire\.?/gi, 'لم يرد مقدم الخدمة في الوقت المحدد. تم الغاء طلبك "$1". يرجى اختيار مقدم خدمة اخر.'],
      // Prestation terminée - évaluation
      [/Votre prestation est terminee\. Merci d'evaluer le service recu pour liberer le paiement\.?/gi, 'تم انهاء خدمتك. يرجى تقييم الخدمة لتحرير الدفع.'],
      [/Votre prestation est terminée\. Merci d'évaluer le service reçu pour libérer le paiement\.?/gi, 'تم انهاء خدمتك. يرجى تقييم الخدمة لتحرير الدفع.'],
      // Confirmer arrivée
      [/Veuillez confirmer son arrivée pour démarrer la prestation\.?/gi, 'يرجى تأكيد وصوله لبدء الخدمة.'],
      [/Veuillez confirmer son arrivee pour demarrer la prestation\.?/gi, 'يرجى تأكيد وصوله لبدء الخدمة.'],
      // Nouvelle commande disponible
      [/[Uu]ne nouvelle commande (.+) est disponible/gi, 'طلب جديد $1 متاح'],

      // === Services (noms) ===
      [/Coiffure Classique/gi, 'قص شعر كلاسيكي'],
      [/coiffure classique/gi, 'قص شعر كلاسيكي'],
      [/Coiffure Express/gi, 'قص شعر سريع'],
      [/coiffure express/gi, 'قص شعر سريع'],
      [/Coiffure Mariage/gi, 'تصفيف شعر زفاف'],
      [/coiffure mariage/gi, 'تصفيف شعر زفاف'],
      [/Coach Sportif/gi, 'مدرب رياضي'],
      [/coach sportif/gi, 'مدرب رياضي'],
      [/Massage Relaxant/gi, 'تدليك استرخائي'],
      [/massage relaxant/gi, 'تدليك استرخائي'],
      [/Taille de Barbe/gi, 'تشذيب اللحية'],
      [/taille de barbe/gi, 'تشذيب اللحية'],
      [/Manucure/gi, 'مناكير'],
      [/Pédicure/gi, 'باديكير'],
      [/Maquillage/gi, 'مكياج'],
      [/Ménage/gi, 'تنظيف المنزل'],
      [/Yoga/gi, 'يوغا'],
    ];

    let translatedMessage = message;
    for (const [pattern, replacement] of replacements) {
      translatedMessage = translatedMessage.replace(pattern, replacement);
    }
    return translatedMessage;
  };

  useEffect(() => {
    loadNotifications();
  }, [isProvider]);

  const loadNotifications = async () => {
    try {
      // Utiliser le bon endpoint selon le role (provider ou client)
      const endpoint = isProvider
        ? ENDPOINTS.PROVIDER.NOTIFICATIONS
        : ENDPOINTS.NOTIFICATIONS.LIST;

      console.log('[Notifications] Loading from:', endpoint, 'isProvider:', isProvider);

      const response = await apiClient.get(endpoint);
      console.log('[Notifications] Raw response:', JSON.stringify(response.data, null, 2));

      // L'API retourne { success: true, data: { notifications: [...], unread_count: X } }
      const rawData = response.data?.data?.notifications
        || response.data?.notifications
        || response.data?.data
        || response.data
        || [];

      // S'assurer que c'est un tableau
      const data = Array.isArray(rawData) ? rawData : [];

      console.log('[Notifications] Parsed:', data.length, 'notifications');

      // Transformer les données API au format attendu
      // La DB utilise notification_type, pas type
      // Le champ data peut etre une string JSON ou deja parse
      const notifications = data.map((n: any) => {
        let parsedData = {};
        if (n.data) {
          try {
            parsedData = typeof n.data === 'string' ? JSON.parse(n.data) : n.data;
          } catch (e) {
            parsedData = {};
          }
        }

        const rawType = n.notification_type || n.type || 'system';
        return {
          id: n.id,
          type: getNotificationType(rawType),
          title: n.title || 'Notification',
          message: n.message || n.body || n.content || '',
          is_read: n.is_read === true || n.is_read === 1 || !!n.read_at,
          created_at: n.created_at,
          data: parsedData,
        };
      });

      console.log('[Notifications] Mapped notifications:', notifications);
      setNotifications(notifications);
    } catch (error) {
      console.log('[Notifications] Error loading:', error);
      // Pas de notifications ou erreur API
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Marquer comme lu via l'API
    if (!notification.is_read) {
      try {
        const endpoint = isProvider
          ? ENDPOINTS.PROVIDER.MARK_NOTIFICATION_READ(notification.id)
          : ENDPOINTS.NOTIFICATIONS.MARK_READ(notification.id);

        await apiClient.patch(endpoint);
      } catch (error) {
        console.log('[Notifications] Error marking as read:', error);
      }
    }

    // Mettre a jour l'etat local
    setNotifications(prev =>
      prev.map(n =>
        n.id === notification.id ? { ...n, is_read: true } : n
      )
    );

    // Navigation selon le type
    // order_id ou booking_id peuvent etre utilises
    const orderId = notification.data?.order_id || notification.data?.booking_id;

    switch (notification.type) {
      case 'booking':
      case 'reminder':
        if (orderId) {
          // Naviguer vers la bonne route selon le role
          if (isProvider) {
            router.push(`/(provider)/booking/journey/${orderId}` as any);
          } else {
            // Client: aller vers le suivi de commande
            router.push(`/booking/track/${orderId}` as any);
          }
        }
        break;
      case 'review':
        // Client: aller vers la page d'avis
        // Prestataire: aller vers ses commandes
        if (isProvider) {
          router.push('/(provider)/bookings' as any);
        } else if (orderId) {
          router.push(`/booking/review/${orderId}` as any);
        }
        break;
      case 'satisfaction_received':
        // Prestataire a recu une evaluation - aller vers ses gains
        if (isProvider) {
          router.push('/(provider)/earnings' as any);
        } else if (orderId) {
          router.push(`/booking/track/${orderId}` as any);
        }
        break;
      case 'order_expired':
        // Commande expiree - aller vers les reservations
        if (isProvider) {
          router.push('/(provider)/bookings' as any);
        } else {
          router.push('/(client)/bookings' as any);
        }
        break;
      case 'promo':
        // Promo - uniquement pour client, prestataire va vers son dashboard
        if (isProvider) {
          router.push('/(provider)' as any);
        } else {
          router.push('/(client)/services' as any);
        }
        break;
      default:
        // Pour les autres types, navigation selon le role
        if (orderId) {
          if (isProvider) {
            router.push(`/(provider)/booking/journey/${orderId}` as any);
          } else {
            router.push(`/booking/track/${orderId}` as any);
          }
        } else {
          // Sans orderId, aller vers la page principale
          if (isProvider) {
            router.push('/(provider)/bookings' as any);
          } else {
            router.push('/(client)/bookings' as any);
          }
        }
        break;
    }
  };

  const markAllAsRead = async () => {
    try {
      // Appeler le bon endpoint selon le role
      const endpoint = isProvider
        ? ENDPOINTS.PROVIDER.MARK_ALL_NOTIFICATIONS_READ
        : ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ;

      await apiClient.patch(endpoint);
    } catch (error) {
      console.log('[Notifications] Error marking all as read:', error);
    }

    // Mettre a jour l'etat local
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true }))
    );
  };

  const getNotificationIcon = (type: Notification['type']): string => {
    switch (type) {
      case 'booking':
        return '📅';
      case 'promo':
        return '🎁';
      case 'system':
        return '⚙️';
      case 'review':
        return '⭐';
      case 'reminder':
        return '⏰';
      case 'satisfaction_received':
        return '🎉';
      case 'order_expired':
        return '⏱️';
      default:
        return '📬';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return t('notificationsPage.minutesAgo', { count: diffMins });
    } else if (diffHours < 24) {
      return t('notificationsPage.hoursAgo', { count: diffHours });
    } else if (diffDays === 1) {
      return t('time.yesterday');
    } else if (diffDays < 7) {
      return t('notificationsPage.daysAgo', { count: diffDays });
    } else {
      return date.toLocaleDateString(language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderNotification = ({ item }: { item: Notification }) => {
    const translatedTitle = translateNotificationTitle(item.title);
    const translatedMessage = translateNotificationMessage(item.message, item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.is_read && styles.notificationCardUnread,
          isRTL && styles.notificationCardRTL,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.notificationIcon, isRTL && styles.notificationIconRTL]}>
          <Text style={styles.notificationIconText}>
            {getNotificationIcon(item.type)}
          </Text>
        </View>

        <View style={styles.notificationContent}>
          <View style={[styles.notificationHeader, isRTL && styles.notificationHeaderRTL]}>
            <Text style={[
              styles.notificationTitle,
              !item.is_read && styles.notificationTitleUnread,
              isRTL && styles.textRTL,
            ]}>
              {translatedTitle}
            </Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
          <Text style={[styles.notificationMessage, isRTL && styles.textRTL]} numberOfLines={2}>
            {translatedMessage}
          </Text>
          <Text style={[styles.notificationTime, isRTL && styles.textRTL]}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>

        <Text style={styles.chevron}>{isRTL ? '‹' : '›'}</Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={[styles.headerStats, isRTL && styles.headerStatsRTL]}>
        <Text style={[styles.headerStatsText, isRTL && styles.textRTL]}>
          {unreadCount > 0
            ? t('notificationsPage.newNotifications', { count: unreadCount })
            : t('notificationsPage.allRead')}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>{t('notifications.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={[styles.emptyTitle, isRTL && styles.textRTL]}>{t('notifications.noNotifications')}</Text>
      <Text style={[styles.emptyText, isRTL && styles.textRTL]}>
        {t('notificationsPage.emptyText')}
      </Text>
    </View>
  );

  if (isLoading) {
    return <Loading fullScreen message={t('common.loading')} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={notifications.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: colors.gray[900],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  headerSpacer: {
    width: 40,
  },

  // List Header
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerStatsText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  markAllRead: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },

  // Notification Card
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  notificationCardUnread: {
    backgroundColor: colors.primary + '08',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationIconText: {
    fontSize: 22,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    color: colors.gray[900],
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
  },
  chevron: {
    fontSize: 24,
    color: colors.gray[400],
    marginLeft: spacing.sm,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  // RTL styles
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerStatsRTL: {
    flexDirection: 'row-reverse',
  },
  textRTL: {
    textAlign: 'right',
  },
  notificationCardRTL: {
    flexDirection: 'row-reverse',
  },
  notificationIconRTL: {
    marginRight: 0,
    marginLeft: spacing.md,
  },
  notificationHeaderRTL: {
    flexDirection: 'row-reverse',
  },
});
