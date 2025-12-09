/**
 * API Client - GlamGo
 * Client HTTP pour communiquer avec le backend
 */

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE_URL = baseUrl.endsWith('/api') ? baseUrl : baseUrl + '/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    this.rememberMe = false;
    this.isProvider = false;

    // Charger le token depuis localStorage ou sessionStorage (côté client uniquement)
    if (typeof window !== 'undefined') {
      // Vérifier le type de connexion le plus récent
      const lastLoginType = localStorage.getItem('last_login_type');

      // Charger UNIQUEMENT le token correspondant au dernier type de connexion
      // Ne PAS faire de fallback vers l'autre type pour éviter les confusions de profil
      if (lastLoginType === 'client') {
        this._loadClientToken();
      } else if (lastLoginType === 'provider') {
        this._loadProviderToken();
      } else {
        // Pas de last_login_type défini - vérifier les deux (ancien comportement pour migration)
        this._loadProviderToken();
        if (!this.token) {
          this._loadClientToken();
        }
      }
    }
  }

  _loadProviderToken() {
    this.token = localStorage.getItem('provider_token');
    if (this.token) {
      this.isProvider = true;
      this.rememberMe = true;
    } else {
      this.token = sessionStorage.getItem('provider_token');
      if (this.token) {
        this.isProvider = true;
        this.rememberMe = false;
      }
    }
  }

  _loadClientToken() {
    this.token = localStorage.getItem('auth_token');
    if (this.token) {
      this.isProvider = false;
      this.rememberMe = true;
    } else {
      this.token = sessionStorage.getItem('auth_token');
      if (this.token) {
        this.isProvider = false;
        this.rememberMe = false;
      }
    }
  }

  /**
   * Définir le token d'authentification
   * @param {string} token - Le token d'authentification
   * @param {boolean} remember - Si true, stocke dans localStorage, sinon dans sessionStorage
   * @param {boolean} isProvider - Si true, utilise provider_token, sinon auth_token
   */
  setToken(token, remember = false, isProvider = false) {
    this.token = token;
    this.rememberMe = remember;
    this.isProvider = isProvider;

    const tokenKey = isProvider ? 'provider_token' : 'auth_token';
    const altTokenKey = isProvider ? 'auth_token' : 'provider_token';

    if (typeof window !== 'undefined') {
      if (token) {
        // Sauvegarder le type de connexion pour le rechargement de page
        localStorage.setItem('last_login_type', isProvider ? 'provider' : 'client');

        if (remember) {
          localStorage.setItem(tokenKey, token);
          localStorage.setItem('token', token); // Pour compatibilité backend
          sessionStorage.removeItem(tokenKey);
          // Nettoyer l'autre type de token
          localStorage.removeItem(altTokenKey);
          sessionStorage.removeItem(altTokenKey);
        } else {
          sessionStorage.setItem(tokenKey, token);
          localStorage.setItem('token', token); // Pour compatibilité backend
          localStorage.removeItem(tokenKey);
          // Nettoyer l'autre type de token
          localStorage.removeItem(altTokenKey);
          sessionStorage.removeItem(altTokenKey);
        }
      } else {
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(altTokenKey);
        localStorage.removeItem('token');
        localStorage.removeItem('last_login_type');
        sessionStorage.removeItem(tokenKey);
        sessionStorage.removeItem(altTokenKey);
      }
    }
  }

  /**
   * Obtenir le token d'authentification
   */
  getToken() {
    return this.token;
  }

  /**
   * Vérifier si l'utilisateur est un prestataire
   */
  getIsProvider() {
    return this.isProvider;
  }

  /**
   * Supprimer le token d'authentification
   */
  clearToken() {
    this.token = null;
    this.rememberMe = false;
    this.isProvider = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('provider_token');
      localStorage.removeItem('token');
      localStorage.removeItem('last_login_type');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('provider_token');
    }
  }

  /**
   * Requête HTTP générique
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Ajouter le token d'authentification si disponible
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Récupérer le texte brut d'abord pour gérer les réponses non-JSON
      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        // Le serveur a renvoyé du HTML ou autre chose que du JSON
        console.error('Réponse non-JSON reçue:', text.substring(0, 500));
        throw new Error('Le serveur a renvoyé une réponse invalide. Vérifiez que le backend est démarré et fonctionne correctement.');
      }

      if (!response.ok) {
        // Pour les erreurs de validation (422), retourner la réponse complète
        if (response.status === 422) {
          console.error('Validation error (422):', data);
          return data; // Retourner la réponse avec success: false et les erreurs
        }
        throw new Error(data.message || 'Une erreur est survenue');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Requête GET
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Requête POST
   */
  async post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });
  }

  /**
   * Requête PUT
   */
  async put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    });
  }

  /**
   * Requête DELETE
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  // ============================================
  // Méthodes spécifiques à l'API
  // ============================================

  // Authentification
  async login(email, password, rememberMe = false) {
    const data = await this.post('/auth/login', { email, password });
    if (data.data?.token) {
      this.setToken(data.data.token, rememberMe, false); // isProvider=false (client)
    }
    return data;
  }

  async register(userData) {
    const data = await this.post('/auth/register', userData);
    // Ne pas auto-connecter après inscription
    // L'utilisateur sera redirigé vers la page de connexion
    return data;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  async forgotPassword(email) {
    return this.post('/auth/forgot-password', { email });
  }

  async resetPassword(token, password, password_confirmation) {
    return this.post('/auth/reset-password', { token, password, password_confirmation });
  }

  async providerForgotPassword(email) {
    return this.post('/provider/forgot-password', { email });
  }

  async providerResetPassword(token, password, password_confirmation) {
    return this.post('/provider/reset-password', { token, password, password_confirmation });
  }

  async getProfile() {
    return this.get('/user/profile');
  }

  // Catégories
  async getCategories() {
    return this.get('/categories');
  }

  async getCategoryServices(categoryId) {
    return this.get(`/categories/${categoryId}/services`);
  }

  // Services
  async getAllServices() {
    return this.get('/services');
  }

  async getService(serviceId) {
    return this.get(`/services/${serviceId}`);
  }

  async searchServices(query) {
    return this.get(`/services/search?q=${encodeURIComponent(query)}`);
  }

  // Commandes
  async createOrder(orderData) {
    return this.post('/orders', orderData);
  }

  async getMyOrders() {
    return this.get('/orders');
  }

  async getOrder(orderId) {
    return this.get(`/orders/${orderId}`);
  }

  async getOrderStatus(orderId) {
    return this.get(`/orders/${orderId}/status`);
  }

  async cancelOrder(orderId) {
    return this.patch(`/orders/${orderId}/cancel`);
  }

  async confirmArrival(orderId) {
    return this.patch(`/orders/${orderId}/confirm-arrival`);
  }

  async confirmComplete(orderId) {
    return this.patch(`/orders/${orderId}/confirm-complete`);
  }

  // Notifications utilisateur
  async getNotifications(limit = 50) {
    return this.get(`/notifications?limit=${limit}`);
  }

  async markNotificationAsRead(notificationId) {
    return this.patch(`/notifications/${notificationId}/read`);
  }

  async markAllNotificationsAsRead() {
    return this.patch('/notifications/read-all');
  }

  async getUnreadNotificationsCount() {
    return this.get('/notifications/unread-count');
  }

  // Chat
  async getMessages(orderId) {
    return this.get(`/orders/${orderId}/messages`);
  }

  async sendMessage(orderId, content, messageType = 'text') {
    return this.post(`/orders/${orderId}/messages`, { content, message_type: messageType });
  }

  async getChatStatus(orderId) {
    return this.get(`/orders/${orderId}/chat-status`);
  }

  async getUnreadMessagesCount() {
    return this.get('/chat/unread-count');
  }

  async updatePresence() {
    return this.post('/presence/update');
  }

  // Provider (si l'utilisateur est un prestataire)
  async providerRegister(providerData) {
    return this.post('/provider/register', providerData);
  }

  async providerRegisterWithPhoto(formData) {
    try {
      const response = await fetch(`${this.baseURL}/provider/register`, {
        method: 'POST',
        body: formData, // FormData - pas de Content-Type header (le navigateur le gere)
      });
      return await response.json();
    } catch (error) {
      console.error('Provider registration error:', error);
      return { success: false, message: error.message };
    }
  }

  async providerLogin(email, password, rememberMe = false) {
    const data = await this.post('/provider/login', { email, password });
    if (data.data?.token) {
      this.setToken(data.data.token, rememberMe, true); // isProvider=true
    }
    return data;
  }

  async getProviderProfile() {
    return this.get('/provider/profile');
  }

  async updateProviderProfile(profileData) {
    return this.put('/provider/profile', profileData);
  }

  async uploadProviderProfileImage(formData) {
    try {
      const headers = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      // Ne pas mettre Content-Type - le navigateur le gère avec FormData
      const response = await fetch(`${this.baseURL}/provider/profile/image`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Provider profile image upload error:', error);
      return { success: false, message: error.message };
    }
  }

  async toggleProviderAvailability(isAvailable) {
    // Backend attend un entier (1 ou 0), pas un booléen
    return this.put('/provider/profile', { is_available: isAvailable ? 1 : 0 });
  }

  async getProviderServices() {
    return this.get('/provider/services');
  }

  async addProviderService(serviceId) {
    return this.post('/provider/services', { service_id: serviceId });
  }

  async removeProviderService(serviceId) {
    return this.delete(`/provider/services/${serviceId}`);
  }

  async getProviderOrders() {
    return this.get('/provider/orders');
  }

  async getProviderOrder(orderId) {
    return this.get(`/provider/orders/${orderId}`);
  }

  async acceptProviderOrder(orderId) {
    return this.patch(`/provider/orders/${orderId}/accept`);
  }

  async startProviderOrder(orderId) {
    return this.patch(`/provider/orders/${orderId}/start`);
  }

  async beginProviderOrder(orderId) {
    return this.patch(`/provider/orders/${orderId}/begin`);
  }

  async completeProviderOrder(orderId) {
    return this.patch(`/provider/orders/${orderId}/complete`);
  }

  async updateProviderLocation(latitude, longitude, orderId = null) {
    const data = { latitude, longitude };
    if (orderId) {
      data.order_id = orderId;
    }
    return this.post('/provider/location', data);
  }

  // Géolocalisation client
  async getProviderLocation(orderId) {
    return this.get(`/orders/${orderId}/location`);
  }

  // Récupérer la position du client (pour le prestataire)
  async getClientLocation(orderId) {
    return this.get(`/provider/orders/${orderId}/client-location`);
  }

  // Évaluations et avis
  async createReview(orderId, reviewData) {
    return this.post(`/orders/${orderId}/review`, reviewData);
  }

  async getOrderReview(orderId) {
    return this.get(`/orders/${orderId}/review`);
  }

  async canReviewOrder(orderId) {
    return this.get(`/orders/${orderId}/can-review`);
  }

  async getProviderReviews(providerId, limit = 20, offset = 0) {
    return this.get(`/providers/${providerId}/reviews?limit=${limit}&offset=${offset}`);
  }

  async getProviderStats(providerId) {
    return this.get(`/providers/${providerId}/stats`);
  }

  // Notifications prestataire
  async getProviderNotifications(limit = 50) {
    return this.get(`/provider/notifications?limit=${limit}`);
  }

  async markProviderNotificationAsRead(notificationId) {
    return this.patch(`/provider/notifications/${notificationId}/read`);
  }

  async markAllProviderNotificationsAsRead() {
    return this.patch('/provider/notifications/read-all');
  }

  async getProviderUnreadNotificationsCount() {
    return this.get('/provider/notifications/unread-count');
  }

  // ============================================
  // Système d'Enchères (Bidding) - Mode InDrive
  // ============================================

  // --- Commandes en Mode Enchères (Utilisateur) ---

  /**
   * Créer une commande en mode enchères
   * @param {object} orderData - Données de la commande (service_id, user_proposed_price, address, notes, bid_expiry_hours)
   */
  async createBiddingOrder(orderData) {
    return this.post('/orders/bidding', orderData);
  }

  /**
   * Récupérer les offres (bids) reçues pour une commande
   * @param {number} orderId - ID de la commande
   */
  async getOrderBids(orderId) {
    return this.get(`/orders/${orderId}/bids`);
  }

  /**
   * Accepter une offre (bid) spécifique
   * @param {number} bidId - ID de l'offre à accepter
   */
  async acceptBid(bidId) {
    return this.put(`/bids/${bidId}/accept`);
  }

  /**
   * Rejeter une offre (bid) spécifique
   * @param {number} bidId - ID de l'offre à rejeter
   */
  async rejectBid(bidId) {
    return this.put(`/bids/${bidId}/reject`);
  }

  // --- Offres/Enchères (Prestataire) ---

  /**
   * Créer une offre sur une commande en mode enchères (Prestataire)
   * @param {object} bidData - Données de l'offre (order_id, proposed_price, estimated_arrival_minutes, message)
   */
  async createBid(bidData) {
    return this.post('/bids', bidData);
  }

  /**
   * Retirer/Supprimer une offre (Prestataire)
   * @param {number} bidId - ID de l'offre à retirer
   */
  async withdrawBid(bidId) {
    return this.delete(`/bids/${bidId}`);
  }

  /**
   * Récupérer les commandes disponibles pour enchérir (Prestataire)
   */
  async getAvailableOrdersForProvider() {
    return this.get('/provider/available-orders');
  }

  /**
   * Récupérer toutes les offres créées par le prestataire
   */
  async getProviderBids() {
    return this.get('/provider/my-bids');
  }

  /**
   * Récupérer le nombre d'offres en attente (Prestataire)
   */
  async getProviderPendingBidsCount() {
    return this.get('/provider/pending-bids-count');
  }
}

/**
 * Requête PATCH
 */
ApiClient.prototype.patch = async function(endpoint, body = {}, options = {}) {
  return this.request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
    ...options,
  });
};

// ============================================================
// GÉOLOCALISATION EN TEMPS RÉEL
// ============================================================

/**
 * (Prestataire) Met à jour la position GPS du prestataire
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} orderId - Optionnel, pour lier la position à une commande
 */
ApiClient.prototype.updateProviderLocation = async function(latitude, longitude, orderId = null) {
  const body = { latitude, longitude };
  if (orderId) {
    body.order_id = orderId;
  }
  return this.post('/provider/location', body);
};

/**
 * (Client) Récupère la position actuelle du prestataire pour une commande
 * @param {number} orderId
 */
ApiClient.prototype.getProviderLocation = async function(orderId) {
  return this.get(`/orders/${orderId}/location`);
};

/**
 * (Client) Met à jour la position GPS du client pour une commande
 * @param {number} orderId
 * @param {number} latitude
 * @param {number} longitude
 */
ApiClient.prototype.updateClientLocation = async function(orderId, latitude, longitude) {
  return this.patch(`/orders/${orderId}`, {
    client_live_latitude: latitude,
    client_live_longitude: longitude
  });
};

// ============================================================
// PAYMENTS - Gestion des paiements
// ============================================================

/**
 * Créer un paiement (espèces)
 * @param {Object} paymentData - Données du paiement
 * @returns {Promise}
 */
ApiClient.prototype.createPayment = async function(paymentData) {
  return this.post('/payments', paymentData);
};

/**
 * Obtenir les détails d'un paiement
 * @param {number} paymentId - ID du paiement
 * @returns {Promise}
 */
ApiClient.prototype.getPaymentDetails = async function(paymentId) {
  return this.get(`/payments/${paymentId}`);
};

/**
 * Obtenir le paiement d'une commande
 * @param {number} orderId - ID de la commande
 * @returns {Promise}
 */
ApiClient.prototype.getPaymentByOrder = async function(orderId) {
  return this.get(`/payments/order/${orderId}`);
};

/**
 * Confirmer la réception du paiement (Client)
 * @param {number} paymentId - ID du paiement
 * @returns {Promise}
 */
ApiClient.prototype.confirmPaymentByClient = async function(paymentId) {
  return this.post(`/payments/${paymentId}/confirm-client`);
};

/**
 * Confirmer la réception du paiement (Prestataire)
 * @param {number} paymentId - ID du paiement
 * @returns {Promise}
 */
ApiClient.prototype.confirmPaymentByProvider = async function(paymentId) {
  return this.post(`/payments/${paymentId}/confirm-provider`);
};

/**
 * Obtenir l'historique des paiements (Client)
 * @returns {Promise}
 */
ApiClient.prototype.getClientPayments = async function() {
  return this.get('/payments/client/history');
};

/**
 * Obtenir l'historique des paiements (Prestataire)
 * @returns {Promise}
 */
ApiClient.prototype.getProviderPayments = async function() {
  return this.get('/payments/provider/history');
};

/**
 * Obtenir les statistiques de revenus du prestataire
 * @returns {Promise}
 */
ApiClient.prototype.getProviderEarnings = async function() {
  return this.get('/payments/provider/earnings');
};


// ============================================================
// FORMULES DE SERVICES - Tarification dynamique
// ============================================================

/**
 * Récupérer toutes les formules disponibles avec métadonnées
 * @returns {Promise}
 */
ApiClient.prototype.getFormulas = async function() {
  return this.get('/formulas');
};

/**
 * Récupérer les formules disponibles pour un service
 * @param {number} serviceId - ID du service
 * @returns {Promise}
 */
ApiClient.prototype.getServiceFormulas = async function(serviceId) {
  return this.get(`/services/${serviceId}/formulas`);
};

/**
 * Aperçu des prix pour toutes les formules d un service
 * @param {number} serviceId - ID du service
 * @returns {Promise}
 */
ApiClient.prototype.getServicePricePreview = async function(serviceId) {
  return this.get(`/services/${serviceId}/price-preview`);
};

/**
 * Récupérer les règles spéciales d un service
 * @param {number} serviceId - ID du service
 * @returns {Promise}
 */
ApiClient.prototype.getFormulaRules = async function(serviceId) {
  return this.get(`/formulas/rules/${serviceId}`);
};

/**
 * Calculer le prix avec formule
 * @param {Object} params - Paramètres de calcul
 * @param {number} params.service_id - ID du service
 * @param {string} params.formula_type - Type de formule (standard, recurring, premium, urgent, night)
 * @param {string} params.scheduled_time - Date et heure prévues
 * @param {number} params.duration_hours - Durée en heures
 * @param {number} params.distance_km - Distance en km
 * @param {number} params.quantity - Quantité
 * @returns {Promise}
 */
ApiClient.prototype.calculatePrice = async function(params) {
  return this.post('/pricing/calculate', params);
};

// =====================================================
// GÉOLOCALISATION PRESTATAIRES
// =====================================================

/**
 * Rechercher les prestataires à proximité pour un service
 * @param {number} serviceId - ID du service
 * @param {Object} params - Paramètres de recherche
 * @param {number} params.lat - Latitude du client
 * @param {number} params.lng - Longitude du client
 * @param {number} [params.radius=30] - Rayon de recherche en km
 * @param {string} [params.formula='standard'] - Type de formule
 * @param {string} [params.scheduled_time] - Heure prévue
 * @param {boolean} [params.only_available=true] - Filtrer uniquement disponibles
 * @returns {Promise}
 */
ApiClient.prototype.getNearbyProviders = async function(serviceId, params) {
  const queryString = new URLSearchParams(params).toString();
  return this.get(`/services/${serviceId}/nearby-providers?${queryString}`);
};

/**
 * Obtenir les statistiques de couverture pour un service
 * @param {number} serviceId - ID du service
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise}
 */
ApiClient.prototype.getServiceCoverage = async function(serviceId, lat, lng) {
  return this.get(`/services/${serviceId}/coverage?lat=${lat}&lng=${lng}`);
};

// =====================================================
// SYSTÈME DE SATISFACTION POST-PRESTATION
// =====================================================

/**
 * (Client) Soumettre le questionnaire de satisfaction
 * @param {number} orderId - ID de la commande
 * @param {Object} data - Données du questionnaire
 * @param {number} data.quality_rating - Note qualité (1-5)
 * @param {boolean} data.punctuality - Prestataire ponctuel ?
 * @param {boolean} data.price_respected - Prix respecté ?
 * @param {number} [data.professionalism_rating] - Note professionnalisme (1-5, optionnel)
 * @param {string} [data.comment] - Commentaire (optionnel)
 * @param {array} [data.photos] - Photos (optionnel)
 * @returns {Promise}
 */
ApiClient.prototype.submitSatisfaction = async function(orderId, data) {
  return this.post(`/orders/${orderId}/satisfaction`, data);
};

/**
 * (Client) Vérifier le statut de satisfaction d'une commande
 * @param {number} orderId - ID de la commande
 * @returns {Promise}
 */
ApiClient.prototype.getSatisfactionStatus = async function(orderId) {
  return this.get(`/orders/${orderId}/satisfaction-status`);
};

/**
 * (Client) Récupérer les commandes en attente d'évaluation
 * @returns {Promise}
 */
ApiClient.prototype.getPendingReviews = async function() {
  return this.get('/user/pending-reviews');
};

/**
 * (Prestataire) Marquer une commande comme terminée
 * Passe le statut de 'in_progress' à 'completed_pending_review'
 * @param {number} orderId - ID de la commande
 * @returns {Promise}
 */
ApiClient.prototype.completeServiceAsProvider = async function(orderId) {
  return this.post(`/provider/orders/${orderId}/complete-service`);
};

/**
 * (Prestataire) Annuler une commande acceptée
 * Permet au prestataire de se désister avec calcul des frais
 * @param {number} orderId - ID de la commande
 * @param {Object} data - Données d'annulation
 * @param {string} data.reason - Raison de l'annulation
 * @param {number} data.cancellation_fee - Frais d'annulation calculés
 * @returns {Promise}
 */
ApiClient.prototype.cancelOrderAsProvider = async function(orderId, data) {
  return this.post(`/provider/orders/${orderId}/cancel`, data);
};

/**
 * (Prestataire) Récupérer ses statistiques de satisfaction
 * @returns {Promise}
 */
ApiClient.prototype.getProviderSatisfactionStats = async function() {
  return this.get('/provider/satisfaction-stats');
};

/**
 * (Public) Récupérer les statistiques de satisfaction d'un prestataire
 * @param {number} providerId - ID du prestataire
 * @returns {Promise}
 */
ApiClient.prototype.getPublicProviderSatisfaction = async function(providerId) {
  return this.get(`/providers/${providerId}/satisfaction`);
};

// =====================================================
// SIGNALEMENT D'URGENCE
// =====================================================

/**
 * (Client) Signaler une urgence pendant une prestation
 * @param {number} orderId - ID de la commande
 * @param {Object} data - Données du signalement
 * @param {string} data.reason - Raison de l'urgence (behavior, safety, service_issue, fraud, other)
 * @param {string} [data.additional_info] - Informations supplémentaires (optionnel)
 * @returns {Promise}
 */
ApiClient.prototype.reportEmergency = async function(orderId, data) {
  return this.post(`/orders/${orderId}/emergency`, data);
};

/**
 * (Admin/Support) Récupérer les signalements d'urgence
 * @param {Object} params - Filtres
 * @returns {Promise}
 */
ApiClient.prototype.getEmergencyReports = async function(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return this.get(`/admin/emergencies?${queryString}`);
};

/**
 * (Admin/Support) Mettre à jour le statut d'un signalement d'urgence
 * @param {number} emergencyId - ID du signalement
 * @param {Object} data - Données de mise à jour
 * @returns {Promise}
 */
ApiClient.prototype.updateEmergencyStatus = async function(emergencyId, data) {
  return this.patch(`/admin/emergencies/${emergencyId}`, data);
};

// ==================== PRIORITE ET BLOCAGE PRESTATAIRES ====================

/**
 * (Provider) Recuperer son niveau de priorite et statistiques
 * @returns {Promise}
 */
ApiClient.prototype.getProviderPriorityStatus = async function() {
  return this.get('/provider/priority-status');
};

/**
 * (Provider) Recuperer l'historique de ses notes
 * @param {number} days - Nombre de jours d'historique
 * @returns {Promise}
 */
ApiClient.prototype.getProviderRatingHistory = async function(days = 30) {
  return this.get(`/provider/rating-history?days=${days}`);
};

/**
 * (Admin) Recuperer la liste des prestataires avec leur priorite
 * @param {Object} params - Filtres (sort_by, order, status, min_rating, max_rating)
 * @returns {Promise}
 */
ApiClient.prototype.getProvidersPriority = async function(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return this.get(`/admin/providers/priority?${queryString}`);
};

/**
 * (Admin) Bloquer un prestataire
 * @param {number} providerId - ID du prestataire
 * @param {Object} data - Donnees du blocage
 * @param {string} data.reason - Raison du blocage
 * @param {string} data.block_type - Type (temporary, permanent)
 * @param {number} [data.duration_days] - Duree en jours si temporaire
 * @returns {Promise}
 */
ApiClient.prototype.blockProvider = async function(providerId, data) {
  return this.post(`/admin/providers/${providerId}/block`, data);
};

/**
 * (Admin) Debloquer un prestataire
 * @param {number} providerId - ID du prestataire
 * @param {Object} data - Donnees
 * @param {string} [data.reason] - Raison du deblocage
 * @returns {Promise}
 */
ApiClient.prototype.unblockProvider = async function(providerId, data = {}) {
  return this.post(`/admin/providers/${providerId}/unblock`, data);
};

/**
 * (Admin) Recuperer l'historique de blocage d'un prestataire
 * @param {number} providerId - ID du prestataire
 * @returns {Promise}
 */
ApiClient.prototype.getProviderBlockHistory = async function(providerId) {
  return this.get(`/admin/providers/${providerId}/block-history`);
};

/**
 * (Admin) Verifier automatiquement et bloquer les prestataires sous le seuil
 * @returns {Promise}
 */
ApiClient.prototype.checkAndBlockLowRatedProviders = async function() {
  return this.post('/admin/providers/check-ratings');
};

/**
 * (Admin) Recuperer les prestataires a risque (note en baisse)
 * @returns {Promise}
 */
ApiClient.prototype.getAtRiskProviders = async function() {
  return this.get('/admin/providers/at-risk');
};

/**
 * (Admin) Envoyer un avertissement a un prestataire
 * @param {number} providerId - ID du prestataire
 * @param {Object} data - Donnees de l'avertissement
 * @param {string} data.message - Message d'avertissement
 * @param {string} data.warning_type - Type (rating_drop, bad_reviews, cancellation)
 * @returns {Promise}
 */
ApiClient.prototype.sendProviderWarning = async function(providerId, data) {
  return this.post(`/admin/providers/${providerId}/warning`, data);
};

/**
 * (System) Recuperer les prestataires disponibles tries par priorite pour une commande
 * @param {number} orderId - ID de la commande
 * @returns {Promise}
 */
ApiClient.prototype.getOrderProvidersByPriority = async function(orderId) {
  return this.get(`/orders/${orderId}/providers-by-priority`);
};

// Exporter une instance unique
const apiClient = new ApiClient();
export default apiClient;
