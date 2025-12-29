'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './ProviderMessagesDropdown.module.scss';

/**
 * Dropdown affichant les conversations avec messages pour les prestataires
 * Cliquer sur une conversation ouvre le chat de la commande
 * v2.0
 */
export default function ProviderMessagesDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const { t: translate, toArabicNumerals } = useLanguage();

  // Protection contre t undefined
  const t = (key) => {
    if (typeof translate === 'function') {
      return translate(key);
    }
    return null;
  };

  // Charger les conversations au premier ouverture
  useEffect(() => {
    if (isOpen && conversations.length === 0) {
      loadConversations();
    }
  }, [isOpen]);

  // Charger le nombre de messages non lus
  useEffect(() => {
    const token = localStorage.getItem('provider_token') || sessionStorage.getItem('provider_token');
    if (!token) return;

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUnreadCount = async () => {
    try {
      // Vérifier si on vient de lire les messages (éviter le flash du badge)
      const justRead = sessionStorage.getItem('messages_just_read');
      if (justRead) {
        const timeSinceRead = Date.now() - parseInt(justRead, 10);
        if (timeSinceRead < 5000) {
          // Ne pas mettre à jour pendant 5 secondes après lecture
          return;
        } else {
          sessionStorage.removeItem('messages_just_read');
        }
      }

      apiClient.loadTokenForContext(true);
      const response = await apiClient.get('/chat/unread-count');
      if (response.success && response.data?.unread_count !== undefined) {
        setTotalUnread(response.data.unread_count);
      }
    } catch (error) {
      // Ignorer silencieusement
    }
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      apiClient.loadTokenForContext(true);
      // Récupérer les commandes du prestataire avec statut actif (qui ont un chat)
      const response = await apiClient.get('/provider/orders');
      if (response.success && response.data) {
        const orders = Array.isArray(response.data) ? response.data : response.data.orders || [];

        // Filtrer les commandes avec chat actif (accepted, on_way, in_progress, completed récent)
        const activeOrders = orders.filter(order =>
          ['accepted', 'on_way', 'in_progress', 'completed'].includes(order.status)
        ).slice(0, 10); // Limiter à 10 conversations

        // Pour chaque commande, on pourrait récupérer le dernier message
        // Pour l'instant, on affiche juste les commandes
        setConversations(activeOrders);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = async (orderId) => {
    setIsOpen(false);
    setTotalUnread(0); // Réinitialiser immédiatement le badge visuellement

    // Marquer les messages comme lus via l'API (le GET marque automatiquement comme lu)
    try {
      apiClient.loadTokenForContext(true);
      const response = await apiClient.get(`/orders/${orderId}/messages`);
      console.log('📨 Messages marked as read:', response.success);
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }

    // Stocker temporairement pour éviter le flash du badge
    sessionStorage.setItem('messages_just_read', Date.now().toString());
    router.push(`/provider/dashboard?chat=${orderId}`);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && conversations.length === 0) {
      loadConversations();
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': t('order.status.pending') || 'En attente',
      'accepted': t('order.status.accepted') || 'Acceptée',
      'on_way': t('order.status.onWay') || 'En route',
      'in_progress': t('order.status.inProgress') || 'En cours',
      'completed': t('order.status.completed') || 'Terminée',
      'cancelled': t('order.status.cancelled') || 'Annulée'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'accepted': '#3b82f6',
      'on_way': '#8b5cf6',
      'in_progress': '#10b981',
      'completed': '#6b7280',
      'cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${toArabicNumerals(diffMins)} min`;
    if (diffHours < 24) return `${toArabicNumerals(diffHours)}h`;
    if (diffDays < 7) return `${toArabicNumerals(diffDays)}j`;
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.messagesDropdown} ref={dropdownRef}>
      <button
        className={styles.messagesBtn}
        onClick={toggleDropdown}
        title={t('providerDashboard.messages') || 'Messages'}
      >
        <svg
          className={styles.messageIcon}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
          <path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/>
        </svg>
        {totalUnread > 0 && (
          <span className={styles.badge}>
            {totalUnread > 99 ? '99+' : toArabicNumerals(totalUnread)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>{t('providerMessages.title') || 'Mes conversations'}</h3>
          </div>

          <div className={styles.dropdownBody}>
            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>💬</span>
                <p>{t('providerMessages.noConversations') || 'Aucune conversation'}</p>
              </div>
            ) : (
              <div className={styles.conversationsList}>
                {conversations.map((order) => (
                  <button
                    key={order.id}
                    className={styles.conversationItem}
                    onClick={() => handleConversationClick(order.id)}
                  >
                    <div className={styles.conversationAvatar}>
                      {order.client_name?.charAt(0) || order.user?.first_name?.charAt(0) || 'C'}
                    </div>
                    <div className={styles.conversationInfo}>
                      <div className={styles.conversationHeader}>
                        <span className={styles.clientName}>
                          {order.client_name || `${order.user?.first_name || ''} ${order.user?.last_name || ''}`.trim() || 'Client'}
                        </span>
                        <span className={styles.conversationTime}>
                          {formatDate(order.updated_at || order.created_at)}
                        </span>
                      </div>
                      <div className={styles.conversationPreview}>
                        <span
                          className={styles.statusBadge}
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                        <span className={styles.serviceName}>
                          {order.service_name || order.service?.name || 'Service'}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.dropdownFooter}>
            <button
              className={styles.viewAllBtn}
              onClick={() => {
                setIsOpen(false);
                router.push('/provider/dashboard');
              }}
            >
              {t('providerMessages.viewAllOrders') || 'Voir toutes les commandes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
