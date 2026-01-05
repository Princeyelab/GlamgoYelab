/**
 * API Provider GlamGo
 * Gestion inscription, profil, services et commandes prestataire
 */

import apiClient, { setTokens, clearTokens } from './client';
import { ENDPOINTS } from './endpoints';

// === TYPES ===

export interface ProviderRegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation?: string;
  phone: string;
  business_name?: string;
  bio?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  categories?: number[];
  services?: number[];
  intervention_radius?: number;
  documents?: string[];
  terms_accepted_at?: string | null;
  experience?: string;
  date_of_birth?: string;
  profile_photo?: string; // URI de la photo de profil
}

export interface Provider {
  id: number;
  user_id: number;
  business_name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  profile_image?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;           // Note moyenne (champ backend)
  average_rating?: number;   // Alias pour compatibilite
  total_reviews?: number;
  is_verified: boolean;
  is_active: boolean;
  is_available?: boolean;
  intervention_radius?: number;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface ProviderAuthResponse {
  success: boolean;
  message: string;
  data: {
    provider: Provider;
    user?: {
      id: number;
      email: string;
      first_name?: string;
      last_name?: string;
    };
    token: string;
    refresh_token?: string;
  };
}

export interface ProviderService {
  id: number;
  service_id: number;
  provider_id: number;
  custom_price?: number;
  custom_duration?: number;
  is_active: boolean;
  service?: {
    id: number;
    title: string;
    description?: string;
    base_price: number;
    duration_minutes: number;
    category_id: number;
  };
}

export interface ProviderOrder {
  id: number;
  client_id: number;
  provider_id: number;
  service_id: number;
  status: 'pending' | 'accepted' | 'on_way' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_at: string;
  address: string;
  total_amount: number;
  client?: {
    id: number;
    first_name: string;
    last_name: string;
    phone?: string;
  };
  service?: {
    id: number;
    title: string;
  };
  created_at: string;
}

export interface DocumentUpload {
  type: 'cin_front' | 'cin_back' | 'diploma' | 'certificate' | 'other';
  file: string; // URI du fichier
}

// === API FUNCTIONS ===

/**
 * Inscription prestataire
 * Supporte l'upload de photo de profil via FormData
 */
export const registerProvider = async (data: ProviderRegisterData): Promise<ProviderAuthResponse> => {
  const { profile_photo, ...restData } = data;

  // Si une photo est fournie, utiliser FormData
  if (profile_photo) {
    const formData = new FormData();

    // Ajouter tous les champs texte
    Object.entries(restData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`${key}[${index}]`, String(item));
          });
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Ajouter password_confirmation
    formData.append('password_confirmation', data.password_confirmation || data.password);

    // Ajouter la photo de profil
    const filename = profile_photo.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('profile_photo', {
      uri: profile_photo,
      name: filename,
      type,
    } as any);

    console.log('[ProviderAPI] Registering with profile photo:', filename);

    const response = await apiClient.post<ProviderAuthResponse>(
      ENDPOINTS.PROVIDER.REGISTER,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes pour upload de fichiers
      }
    );

    if (response.data.success && response.data.data.token) {
      await setTokens(
        response.data.data.token,
        response.data.data.refresh_token
      );
    }

    return response.data;
  }

  // Sans photo, utiliser JSON standard
  const payload = {
    ...restData,
    password_confirmation: data.password_confirmation || data.password,
  };

  const response = await apiClient.post<ProviderAuthResponse>(
    ENDPOINTS.PROVIDER.REGISTER,
    payload
  );

  // Sauvegarder les tokens si fournis
  if (response.data.success && response.data.data.token) {
    await setTokens(
      response.data.data.token,
      response.data.data.refresh_token
    );
  }

  return response.data;
};

/**
 * Connexion prestataire
 */
export const loginProvider = async (credentials: { email: string; password: string }): Promise<ProviderAuthResponse> => {
  const response = await apiClient.post<ProviderAuthResponse>(
    ENDPOINTS.PROVIDER.LOGIN,
    credentials
  );

  if (response.data.success && response.data.data.token) {
    await setTokens(
      response.data.data.token,
      response.data.data.refresh_token
    );
  }

  return response.data;
};

/**
 * Déconnexion prestataire
 * Met le prestataire hors ligne (is_available = false)
 */
export const logoutProvider = async (): Promise<void> => {
  console.log('[ProviderAPI] logoutProvider called - will call', ENDPOINTS.PROVIDER.LOGOUT);
  try {
    const response = await apiClient.post(ENDPOINTS.PROVIDER.LOGOUT);
    console.log('[ProviderAPI] Logout API success:', response.status, response.data);
  } catch (error: any) {
    console.error('[ProviderAPI] Logout API call failed:', error?.response?.status, error?.response?.data || error?.message);
  } finally {
    console.log('[ProviderAPI] Clearing tokens...');
    await clearTokens();
    console.log('[ProviderAPI] Tokens cleared');
  }
};

/**
 * Recuperer le profil prestataire
 */
export const getProviderProfile = async (): Promise<Provider> => {
  const response = await apiClient.get<{ success: boolean; data: Provider }>(
    ENDPOINTS.PROVIDER.PROFILE
  );
  return response.data.data;
};

/**
 * Mettre a jour le profil prestataire
 */
export const updateProviderProfile = async (data: Partial<Provider>): Promise<Provider> => {
  const response = await apiClient.put<{ success: boolean; data: Provider }>(
    ENDPOINTS.PROVIDER.UPDATE_PROFILE,
    data
  );
  return response.data.data;
};

/**
 * Upload photo de profil
 */
export const uploadProviderImage = async (imageUri: string): Promise<{ image_url: string }> => {
  const formData = new FormData();

  const filename = imageUri.split('/').pop() || 'profile.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  // Le backend attend 'profile_image' comme nom de champ
  formData.append('profile_image', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  const response = await apiClient.post<{ success: boolean; data: { avatar: string } }>(
    ENDPOINTS.PROVIDER.UPLOAD_IMAGE,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes pour upload de fichiers
    }
  );

  // Le backend retourne 'avatar', on le convertit en 'image_url' pour compatibilité
  return { image_url: response.data.data.avatar };
};

/**
 * Upload documents (CIN, diplomes, etc.)
 */
export const uploadProviderDocuments = async (documents: DocumentUpload[]): Promise<{ uploaded: string[] }> => {
  const formData = new FormData();

  documents.forEach((doc, index) => {
    const filename = doc.file.split('/').pop() || `document_${index}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append(`documents[${index}][type]`, doc.type);
    formData.append(`documents[${index}][file]`, {
      uri: doc.file,
      name: filename,
      type,
    } as any);
  });

  const response = await apiClient.post<{ success: boolean; data: { uploaded: string[] } }>(
    ENDPOINTS.PROVIDER.UPLOAD_DOCUMENTS,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes pour upload de fichiers
    }
  );

  return response.data.data;
};

/**
 * Upload du diplôme/certificat par catégorie
 */
export const uploadProviderDiploma = async (fileUri: string, category: string = 'general'): Promise<{ diploma_path: string; category: string }> => {
  const formData = new FormData();

  // S'assurer que l'URI commence par file://
  const normalizedUri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`;

  const filename = fileUri.split('/').pop() || 'diploma.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  console.log('[ProviderAPI] Diploma upload - category:', category, 'URI:', normalizedUri);

  formData.append('diploma', {
    uri: normalizedUri,
    name: filename,
    type,
  } as any);

  formData.append('category', category);

  const response = await apiClient.post<{ success: boolean; data: { diploma_path: string; category: string }; message: string }>(
    '/api/provider/diploma',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes pour upload de fichiers volumineux
    }
  );

  console.log('[ProviderAPI] Diploma upload response:', JSON.stringify(response.data));

  const diplomaPath = response.data?.data?.diploma_path || response.data?.diploma_path || '';
  const responseCategory = response.data?.data?.category || category;
  return { diploma_path: diplomaPath, category: responseCategory };
};

/**
 * Récupérer les diplômes du prestataire par catégorie
 */
export const getProviderDiplomas = async (): Promise<Record<string, { file_path: string; file_name: string; is_verified: boolean }>> => {
  const response = await apiClient.get<{ success: boolean; data: Record<string, any> }>(
    '/api/provider/diplomas'
  );
  return response.data.data || {};
};

// === SERVICES ===

/**
 * Recuperer les services du prestataire
 */
export const getProviderServices = async (): Promise<ProviderService[]> => {
  const response = await apiClient.get<{ success: boolean; data: ProviderService[] }>(
    ENDPOINTS.PROVIDER.SERVICES,
    { params: { _t: Date.now() } }  // Prevent caching
  );
  return response.data.data;
};

/**
 * Ajouter un service au profil prestataire
 */
export const addProviderService = async (serviceId: number, customPrice?: number, customDuration?: number): Promise<ProviderService> => {
  console.log('[ProviderAPI] addProviderService - serviceId:', serviceId);
  console.log('[ProviderAPI] Endpoint:', ENDPOINTS.PROVIDER.ADD_SERVICE);

  try {
    const response = await apiClient.post<{ success: boolean; data: ProviderService }>(
      ENDPOINTS.PROVIDER.ADD_SERVICE,
      {
        service_id: serviceId,
        custom_price: customPrice,
        custom_duration: customDuration,
      }
    );
    console.log('[ProviderAPI] addProviderService - success for serviceId:', serviceId);
    return response.data.data;
  } catch (error: any) {
    console.error('[ProviderAPI] addProviderService - FAILED for serviceId:', serviceId);
    console.error('[ProviderAPI] Error status:', error?.response?.status);
    console.error('[ProviderAPI] Error data:', JSON.stringify(error?.response?.data));
    throw error;
  }
};

/**
 * Ajouter plusieurs services
 */
export const addProviderServices = async (serviceIds: number[]): Promise<ProviderService[]> => {
  const results: ProviderService[] = [];

  for (const serviceId of serviceIds) {
    try {
      const service = await addProviderService(serviceId);
      results.push(service);
    } catch (error) {
      console.warn(`Failed to add service ${serviceId}:`, error);
    }
  }

  return results;
};

/**
 * Supprimer un service
 * Note: Le backend attend le service_id (pas provider_service_id)
 */
export const removeProviderService = async (serviceId: number): Promise<void> => {
  const endpoint = ENDPOINTS.PROVIDER.REMOVE_SERVICE(serviceId);
  console.log('[ProviderAPI] removeProviderService - serviceId:', serviceId, 'endpoint:', endpoint);
  try {
    await apiClient.delete(endpoint);
    console.log('[ProviderAPI] removeProviderService - success for serviceId:', serviceId);
  } catch (error: any) {
    console.error('[ProviderAPI] removeProviderService - FAILED for serviceId:', serviceId);
    console.error('[ProviderAPI] Error status:', error?.response?.status);
    console.error('[ProviderAPI] Error data:', JSON.stringify(error?.response?.data));
    throw error;
  }
};

// === COMMANDES ===

/**
 * Recuperer les commandes du prestataire
 */
export const getProviderOrders = async (status?: string): Promise<ProviderOrder[]> => {
  const params = status ? { status } : {};
  const response = await apiClient.get<{ success: boolean; data: ProviderOrder[] }>(
    ENDPOINTS.PROVIDER.ORDERS,
    { params }
  );
  return response.data.data;
};

/**
 * Recuperer le detail d'une commande
 */
export const getProviderOrderDetail = async (orderId: number): Promise<ProviderOrder> => {
  const response = await apiClient.get<{ success: boolean; data: ProviderOrder }>(
    ENDPOINTS.PROVIDER.ORDER_DETAIL(orderId)
  );
  return response.data.data;
};

/**
 * Accepter une commande
 */
export const acceptOrder = async (orderId: number): Promise<ProviderOrder> => {
  const response = await apiClient.patch<{ success: boolean; data: ProviderOrder }>(
    ENDPOINTS.PROVIDER.ACCEPT_ORDER(orderId)
  );
  return response.data.data;
};

/**
 * Demarrer une commande (en route)
 */
export const startOrder = async (orderId: number): Promise<ProviderOrder> => {
  const response = await apiClient.patch<{ success: boolean; data: ProviderOrder }>(
    ENDPOINTS.PROVIDER.START_ORDER(orderId)
  );
  return response.data.data;
};

/**
 * Signaler l'arrivee chez le client
 * Change le statut en 'arrived' et notifie le client pour confirmation
 */
export const arriveAtClient = async (orderId: number): Promise<ProviderOrder> => {
  const endpoint = ENDPOINTS.PROVIDER.ARRIVE_ORDER(orderId);
  console.log('[API] arriveAtClient - orderId:', orderId, 'endpoint:', endpoint);
  try {
    const response = await apiClient.patch<{ success: boolean; data: ProviderOrder }>(endpoint);
    console.log('[API] arriveAtClient - response:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('[API] arriveAtClient - error:', error);
    console.error('[API] arriveAtClient - response data:', error?.response?.data);
    throw error;
  }
};

/**
 * Terminer une commande - appelle /complete-service pour passer en completed_pending_review
 */
export const completeOrder = async (orderId: number): Promise<ProviderOrder> => {
  const endpoint = ENDPOINTS.PROVIDER.COMPLETE_ORDER(orderId);
  console.log('[API] completeOrder - orderId:', orderId, 'endpoint:', endpoint);
  try {
    const response = await apiClient.post<{ success: boolean; data: ProviderOrder }>(endpoint);
    console.log('[API] completeOrder - response:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('[API] completeOrder - error:', error);
    console.error('[API] completeOrder - response data:', error?.response?.data);
    throw error;
  }
};

/**
 * Annuler une commande (prestataire)
 * Note: Utilise POST car le backend attend POST pour les annulations prestataire
 * (contrairement au client qui utilise PATCH sur /api/orders/:id/cancel)
 */
export const cancelOrder = async (orderId: number, reason?: string): Promise<ProviderOrder> => {
  const endpoint = `/api/provider/orders/${orderId}/cancel`;
  try {
    const response = await apiClient.post<{ success: boolean; data: ProviderOrder }>(
      endpoint,
      { reason }
    );
    return response.data.data;
  } catch (error: any) {
    throw error;
  }
};

// === LOCALISATION ===

/**
 * Mettre a jour la position du prestataire
 */
export const updateProviderLocation = async (latitude: number, longitude: number): Promise<void> => {
  await apiClient.post(ENDPOINTS.PROVIDER.UPDATE_LOCATION, {
    latitude,
    longitude,
  });
};

/**
 * Recuperer la position du client pour une commande
 */
export const getClientLocation = async (orderId: number): Promise<{ latitude: number; longitude: number }> => {
  const response = await apiClient.get<{ success: boolean; data: { latitude: number; longitude: number } }>(
    ENDPOINTS.PROVIDER.CLIENT_LOCATION(orderId)
  );
  return response.data.data;
};

// === NOTIFICATIONS ===

/**
 * Recuperer les notifications du prestataire
 */
export const getProviderNotifications = async (): Promise<any[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: { notifications: any[]; unread_count: number } }>(
      ENDPOINTS.PROVIDER.NOTIFICATIONS
    );
    // L'API retourne { data: { notifications: [...], unread_count: N } }
    const notifications = response.data?.data?.notifications;
    if (Array.isArray(notifications)) {
      return notifications;
    }
    // Fallback: peut-être que data est directement le tableau
    if (Array.isArray(response.data?.data)) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    // Silently ignore errors
    return [];
  }
};

/**
 * Marquer une notification comme lue
 */
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await apiClient.patch(ENDPOINTS.PROVIDER.MARK_NOTIFICATION_READ(notificationId));
};

/**
 * Marquer toutes les notifications comme lues
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiClient.patch(ENDPOINTS.PROVIDER.MARK_ALL_NOTIFICATIONS_READ);
};

/**
 * Compter les notifications non lues
 */
export const getUnreadNotificationsCount = async (): Promise<number> => {
  const response = await apiClient.get<{ success: boolean; data: { count: number } }>(
    ENDPOINTS.PROVIDER.UNREAD_COUNT
  );
  return response.data.data.count;
};

// === ENCHERES ===

/**
 * Recuperer les commandes disponibles pour encheres
 */
export const getAvailableOrders = async (): Promise<any[]> => {
  const response = await apiClient.get<{ success: boolean; data: any[] }>(
    ENDPOINTS.PROVIDER.AVAILABLE_ORDERS
  );
  return response.data.data;
};

/**
 * Recuperer mes encheres
 */
export const getMyBids = async (): Promise<any[]> => {
  const response = await apiClient.get<{ success: boolean; data: any[] }>(
    ENDPOINTS.PROVIDER.MY_BIDS
  );
  return response.data.data;
};

// === GAINS ET TRANSACTIONS ===

export interface EarningsStats {
  total: number;
  commission: number;
  net: number;
  bookings: number;
  pending_payout: number;
}

export interface Transaction {
  id: number;
  order_id: number;
  client_name: string;
  client_first_name?: string;
  client_last_name?: string;
  service_name: string;
  service_title?: string;
  date: string;
  created_at?: string;
  amount: number;
  total_amount?: number;
  commission: number;
  net_amount: number;
  tip_amount?: number;
  status: 'completed' | 'pending_payout' | 'paid';
}

/**
 * Recuperer les statistiques de gains
 * Note: L'endpoint /api/provider/earnings n'existe pas dans le backend
 * On calcule directement depuis les commandes completees
 */
export const getProviderEarnings = async (period?: 'week' | 'month' | 'year'): Promise<EarningsStats> => {
  try {
    // Calculer depuis les commandes completees
    const orders = await getProviderOrders('completed');

    // Filtrer par periode si necessaire
    const now = new Date();
    let filteredOrders = orders;

    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(o => new Date(o.created_at) >= weekAgo);
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(o => new Date(o.created_at) >= monthAgo);
    }
    // 'year' ou undefined = toutes les commandes

    // Utiliser 'price' (champ DB) en priorite, puis total_amount
    const total = filteredOrders.reduce((sum, o) => {
      const orderAny = o as any;
      const priceValue = orderAny.price || o.total_amount || orderAny.amount || 0;
      // Parser en nombre (peut etre string depuis l'API)
      const price = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    const commission = Math.round(total * 0.2); // 20% commission GlamGo
    const net = total - commission;
    return {
      total: Math.round(total),
      commission,
      net: Math.round(net),
      bookings: filteredOrders.length,
      pending_payout: 0,
    };
  } catch (error) {
    // Retourner des valeurs par defaut en cas d'erreur
    return {
      total: 0,
      commission: 0,
      net: 0,
      bookings: 0,
      pending_payout: 0,
    };
  }
};

/**
 * Recuperer l'historique des transactions
 * Note: L'endpoint /api/provider/transactions n'existe pas dans le backend
 * On convertit les commandes completees en transactions
 */
export const getProviderTransactions = async (): Promise<Transaction[]> => {
  try {
    const orders = await getProviderOrders('completed');
    return orders.map(order => {
      const orderAny = order as any;
      // Utiliser 'price' (champ DB) en priorite
      const amountValue = orderAny.price || order.total_amount || orderAny.amount || 0;
      // Parser en nombre (peut etre string depuis l'API)
      const amount = typeof amountValue === 'string' ? parseFloat(amountValue) : amountValue;
      const safeAmount = isNaN(amount) ? 0 : amount;

      // Nom du client: user_name ou user_first_name/user_last_name
      const clientName = orderAny.user_name
        || (orderAny.user_first_name ? `${orderAny.user_first_name} ${orderAny.user_last_name || ''}`.trim() : null)
        || (order.client ? `${order.client.first_name || ''} ${order.client.last_name || ''}`.trim() : null)
        || 'Client';

      return {
        id: order.id,
        order_id: order.id,
        client_name: clientName,
        service_name: order.service?.title || orderAny.service_name || 'Service',
        date: order.created_at,
        amount: Math.round(safeAmount),
        commission: Math.round(safeAmount * 0.2), // 20% commission GlamGo
        net_amount: Math.round(safeAmount * 0.8),
        status: 'pending_payout' as const,
      };
    });
  } catch (error) {
    return [];
  }
};

/**
 * Demander un retrait
 * Note: L'endpoint /api/provider/withdraw n'existe pas encore dans le backend
 * Pour l'instant, on simule le succes
 */
export const requestWithdrawal = async (amount: number): Promise<{ success: boolean; message: string }> => {
  // TODO: Implementer l'endpoint backend /api/provider/withdraw
  // Pour l'instant, simuler le succes
  console.log('[Provider] Demande de retrait:', amount, 'DH');

  // Simuler un delai reseau
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    success: true,
    message: `Demande de retrait de ${amount} DH envoyée avec succès`,
  };
};

// === ABONNEMENTS / FORMULES ===

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  duration_days: number;
  features: string[];
  visibility_boost: number;
  priority_level: number;
  commission_rate: number;
  max_services: number | null;
  max_photos: number;
  can_access_stats: boolean;
  can_access_chat: boolean;
  can_urgent_bookings: boolean;
  badge_type: string | null;
  is_recommended: boolean;
}

export interface ProviderSubscription {
  id: number;
  provider_id: number;
  plan_id: number;
  status: 'pending_payment' | 'active' | 'expired' | 'cancelled' | 'suspended';
  started_at: string | null;
  expires_at: string | null;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'card' | 'cash' | 'transfer' | 'free';
  auto_renew: boolean;
  plan_name: string;
  plan_slug: string;
  plan_description?: string;
  plan_price: number;
  features: string[];
  visibility_boost: number;
  priority_level: number;
  commission_rate: number;
  max_services: number | null;
  badge_type: string | null;
  days_remaining: number;
}

export interface SubscriptionBenefits {
  plan_name: string;
  visibility_boost: number;
  priority_level: number;
  commission_rate: number;
  max_services: number | null;
  max_photos: number;
  can_access_stats: boolean;
  can_urgent_bookings: boolean;
  badge_type: string | null;
  features: string[];
  expires_at?: string;
  days_remaining?: number;
  is_free_plan: boolean;
}

/**
 * Recuperer les plans d'abonnement disponibles
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await apiClient.get<{
    success: boolean;
    data: { plans: SubscriptionPlan[]; currency: string };
  }>('/api/subscription-plans');
  return response.data.data.plans;
};

/**
 * Recuperer l'abonnement actuel du prestataire
 */
export const getCurrentSubscription = async (): Promise<{
  current: ProviderSubscription | null;
  history: any[];
  has_active_subscription: boolean;
}> => {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      current: ProviderSubscription | null;
      history: any[];
      has_active_subscription: boolean;
    };
  }>('/api/provider/subscription');
  return response.data.data;
};

/**
 * Souscrire a un plan
 */
export const subscribeToplan = async (
  planId: number,
  paymentMethod: 'card' | 'cash' | 'transfer' | 'free' = 'card'
): Promise<{
  subscription_id: number;
  plan: { id: number; name: string; price: number };
  status: string;
  payment_status: string;
  started_at: string;
  expires_at: string;
  requires_payment: boolean;
}> => {
  const response = await apiClient.post<{
    success: boolean;
    data: any;
    message: string;
  }>('/api/provider/subscription', {
    plan_id: planId,
    payment_method: paymentMethod,
  });
  return response.data.data;
};

/**
 * Confirmer le paiement d'un abonnement
 */
export const confirmSubscriptionPayment = async (
  subscriptionId: number,
  cardToken?: string
): Promise<{
  subscription_id: number;
  status: string;
  payment_status: string;
  expires_at: string;
}> => {
  const response = await apiClient.post<{
    success: boolean;
    data: any;
    message: string;
  }>('/api/provider/subscription/confirm-payment', {
    subscription_id: subscriptionId,
    card_token: cardToken,
  });
  return response.data.data;
};

/**
 * Annuler l'abonnement actuel
 */
export const cancelSubscription = async (): Promise<void> => {
  await apiClient.put('/api/provider/subscription/cancel');
};

/**
 * Recuperer les avantages de l'abonnement actuel
 */
export const getSubscriptionBenefits = async (): Promise<SubscriptionBenefits> => {
  const response = await apiClient.get<{
    success: boolean;
    data: SubscriptionBenefits;
  }>('/api/provider/subscription/benefits');
  return response.data.data;
};

// === FORMULES DE RESERVATION ===

export interface BookingFormula {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  price_modifier: number;
  badge_text: string | null;
  badge_color: string | null;
  provider_active?: boolean;
  added_at?: string;
}

/**
 * Recuperer toutes les formules disponibles
 */
export const getAllBookingFormulas = async (): Promise<BookingFormula[]> => {
  const response = await apiClient.get<{
    success: boolean;
    data: BookingFormula[];
  }>('/api/booking-formulas');
  return response.data.data;
};

/**
 * Recuperer les formules du prestataire connecte
 */
export const getProviderFormulas = async (): Promise<BookingFormula[]> => {
  const response = await apiClient.get<{
    success: boolean;
    data: BookingFormula[];
  }>('/api/provider/formulas');
  return response.data.data;
};

/**
 * Ajouter une ou plusieurs formules au prestataire
 */
export const addProviderFormulas = async (formulaIds: number[]): Promise<{
  message: string;
  added: number;
  errors: string[];
}> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { message: string; added: number; errors: string[] };
  }>('/api/provider/formulas', { formula_ids: formulaIds });
  return response.data.data;
};

/**
 * Mettre a jour toutes les formules du prestataire (remplace toutes)
 */
export const updateProviderFormulas = async (formulaIds: number[]): Promise<{
  message: string;
  count: number;
}> => {
  const response = await apiClient.put<{
    success: boolean;
    data: { message: string; count: number };
  }>('/api/provider/formulas', { formula_ids: formulaIds });
  return response.data.data;
};

/**
 * Retirer une formule du prestataire
 */
export const removeProviderFormula = async (formulaId: number): Promise<void> => {
  await apiClient.delete(`/api/provider/formulas/${formulaId}`);
};

/**
 * Rechercher les prestataires par formule
 */
export const getProvidersByFormula = async (formulaSlug: string): Promise<any[]> => {
  const response = await apiClient.get<{
    success: boolean;
    data: any[];
  }>(`/api/providers/by-formula/${formulaSlug}`);
  return response.data.data;
};

// === SERVICES PERSONNALISES ===

export interface CustomService {
  id: number;
  provider_id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  images: string[];
  is_active: boolean;
  category_name?: string;
  category_slug?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomServiceInput {
  name: string;
  description?: string;
  category_id: number;
  price: number;
  duration_minutes: number;
}

/**
 * Récupérer les services personnalisés du prestataire
 */
export const getCustomServices = async (): Promise<{
  services: CustomService[];
  count: number;
  max_allowed: number;
}> => {
  const response = await apiClient.get<{
    success: boolean;
    data: { services: CustomService[]; count: number; max_allowed: number };
  }>('/api/provider/custom-services');
  return response.data.data;
};

/**
 * Créer un nouveau service personnalisé
 */
export const createCustomService = async (data: CustomServiceInput): Promise<CustomService> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { service: CustomService };
  }>('/api/provider/custom-services', data);
  return response.data.data.service;
};

/**
 * Récupérer un service personnalisé
 */
export const getCustomService = async (id: number): Promise<CustomService> => {
  const response = await apiClient.get<{
    success: boolean;
    data: { service: CustomService };
  }>(`/api/provider/custom-services/${id}`);
  return response.data.data.service;
};

/**
 * Mettre à jour un service personnalisé
 */
export const updateCustomService = async (id: number, data: Partial<CustomServiceInput & { is_active: boolean }>): Promise<CustomService> => {
  const response = await apiClient.put<{
    success: boolean;
    data: { service: CustomService };
  }>(`/api/provider/custom-services/${id}`, data);
  return response.data.data.service;
};

/**
 * Supprimer un service personnalisé
 */
export const deleteCustomService = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/provider/custom-services/${id}`);
};

/**
 * Upload des images pour un service personnalisé
 */
export const uploadCustomServiceImages = async (serviceId: number, imageUris: string[]): Promise<{
  images: string[];
  uploaded_count: number;
}> => {
  const formData = new FormData();

  for (let i = 0; i < imageUris.length; i++) {
    const uri = imageUris[i];
    const normalizedUri = uri.startsWith('file://') ? uri : `file://${uri}`;
    const filename = uri.split('/').pop() || `image_${i}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // PHP attend images[] pour fichiers multiples
    formData.append('images[]', {
      uri: normalizedUri,
      name: filename,
      type,
    } as any);
  }

  console.log('[ProviderAPI] Uploading', imageUris.length, 'images for service', serviceId);

  const response = await apiClient.post<{
    success: boolean;
    data: { images: string[]; uploaded_count: number };
  }>(`/api/provider/custom-services/${serviceId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2 minutes pour upload de fichiers
  });

  console.log('[ProviderAPI] Upload response:', response.data);
  return response.data.data;
};

/**
 * Supprimer une image d'un service personnalisé
 */
export const deleteCustomServiceImage = async (serviceId: number, imageIndex: number): Promise<{ images: string[] }> => {
  const response = await apiClient.delete<{
    success: boolean;
    data: { images: string[] };
  }>(`/api/provider/custom-services/${serviceId}/images/${imageIndex}`);
  return response.data.data;
};

/**
 * Récupérer les services personnalisés d'un prestataire (route publique)
 */
export const getProviderCustomServices = async (providerId: number): Promise<CustomService[]> => {
  const response = await apiClient.get<{
    success: boolean;
    data: { services: CustomService[]; count: number };
  }>(`/api/providers/${providerId}/custom-services`);
  return response.data.data.services;
};

// Export par defaut
export default {
  // Auth
  registerProvider,
  loginProvider,
  logoutProvider,
  // Profil
  getProviderProfile,
  updateProviderProfile,
  uploadProviderImage,
  uploadProviderDocuments,
  // Services
  getProviderServices,
  addProviderService,
  addProviderServices,
  removeProviderService,
  // Commandes
  getProviderOrders,
  getProviderOrderDetail,
  acceptOrder,
  startOrder,
  arriveAtClient,
  completeOrder,
  cancelOrder,
  // Localisation
  updateProviderLocation,
  getClientLocation,
  // Notifications
  getProviderNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
  // Encheres
  getAvailableOrders,
  getMyBids,
  // Gains
  getProviderEarnings,
  getProviderTransactions,
  requestWithdrawal,
  // Abonnements
  getSubscriptionPlans,
  getCurrentSubscription,
  subscribeToplan,
  confirmSubscriptionPayment,
  cancelSubscription,
  getSubscriptionBenefits,
  // Formules de reservation
  getAllBookingFormulas,
  getProviderFormulas,
  addProviderFormulas,
  updateProviderFormulas,
  removeProviderFormula,
  getProvidersByFormula,
  // Services personnalisés
  getCustomServices,
  createCustomService,
  getCustomService,
  updateCustomService,
  deleteCustomService,
  uploadCustomServiceImages,
  deleteCustomServiceImage,
  getProviderCustomServices,
};
