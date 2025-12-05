'use client';

/**
 * useSatisfactionModal Hook
 * Gere l'affichage automatique du modal de satisfaction
 * quand une commande est en attente d'evaluation
 *
 * GlamGo - Marrakech
 * @since 2025-11-28
 */

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';

/**
 * Hook pour gerer le modal de satisfaction
 *
 * @param {string|number} orderId - ID de la commande (optionnel)
 * @returns {Object} Etat et fonctions du modal
 */
export function useSatisfactionModal(orderId = null) {
  const [showModal, setShowModal] = useState(false);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [satisfactionStatus, setSatisfactionStatus] = useState(null);

  /**
   * Verifie le statut de satisfaction d'une commande
   */
  const checkSatisfactionStatus = useCallback(async (id) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getSatisfactionStatus(id);

      if (response.success) {
        setSatisfactionStatus(response.data);

        // Si la commande est en attente de review, afficher le modal
        if (response.data.pending_review && !response.data.survey_submitted) {
          setShowModal(true);
          await loadOrderDetails(id);
        }
      }
    } catch (err) {
      console.error('Erreur verification satisfaction:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charge les details d'une commande
   */
  const loadOrderDetails = async (id) => {
    try {
      const response = await apiClient.getOrder(id);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (err) {
      console.error('Erreur chargement commande:', err);
    }
  };

  /**
   * Ouvre le modal manuellement
   */
  const openModal = useCallback((orderData = null) => {
    if (orderData) {
      setOrder(orderData);
    }
    setShowModal(true);
  }, []);

  /**
   * Ferme le modal
   */
  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  /**
   * Callback apres soumission reussie
   */
  const handleSubmitSuccess = useCallback((result) => {
    setShowModal(false);
    setSatisfactionStatus(prev => ({
      ...prev,
      pending_review: false,
      survey_submitted: true
    }));

    // Recharger les details de la commande si necessaire
    if (orderId) {
      loadOrderDetails(orderId);
    }
  }, [orderId]);

  // Verifier le statut au chargement si orderId est fourni
  useEffect(() => {
    if (orderId) {
      checkSatisfactionStatus(orderId);
    }
  }, [orderId, checkSatisfactionStatus]);

  return {
    showModal,
    setShowModal,
    order,
    setOrder,
    loading,
    error,
    satisfactionStatus,
    openModal,
    closeModal,
    handleSubmitSuccess,
    checkSatisfactionStatus
  };
}

/**
 * Hook pour recuperer les commandes en attente d'evaluation
 */
export function usePendingReviews() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  const fetchPendingReviews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getPendingReviews();
      if (response.success) {
        setPendingOrders(response.data.orders || []);
        setCount(response.data.count || 0);
      }
    } catch (err) {
      console.error('Erreur chargement reviews en attente:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingReviews();
  }, [fetchPendingReviews]);

  return {
    pendingOrders,
    count,
    loading,
    hasPending: count > 0,
    refresh: fetchPendingReviews
  };
}

export default useSatisfactionModal;
