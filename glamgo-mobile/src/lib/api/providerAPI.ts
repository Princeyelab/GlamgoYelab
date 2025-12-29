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
 */
export const registerProvider = async (data: ProviderRegisterData): Promise<ProviderAuthResponse> => {
  const payload = {
    ...data,
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

  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  const response = await apiClient.post<{ success: boolean; data: { image_url: string } }>(
    ENDPOINTS.PROVIDER.UPLOAD_IMAGE,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data;
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
    }
  );

  return response.data.data;
};

// === SERVICES ===

/**
 * Recuperer les services du prestataire
 */
export const getProviderServices = async (): Promise<ProviderService[]> => {
  const response = await apiClient.get<{ success: boolean; data: ProviderService[] }>(
    ENDPOINTS.PROVIDER.SERVICES
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
 */
export const removeProviderService = async (providerServiceId: number): Promise<void> => {
  await apiClient.delete(ENDPOINTS.PROVIDER.REMOVE_SERVICE(providerServiceId));
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
 * Annuler une commande
 */
export const cancelOrder = async (orderId: number, reason?: string): Promise<ProviderOrder> => {
  const response = await apiClient.post<{ success: boolean; data: ProviderOrder }>(
    ENDPOINTS.PROVIDER.CANCEL_ORDER(orderId),
    { reason }
  );
  return response.data.data;
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
  const response = await apiClient.get<{ success: boolean; data: any[] }>(
    ENDPOINTS.PROVIDER.NOTIFICATIONS
  );
  return response.data.data;
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

// Export par defaut
export default {
  // Auth
  registerProvider,
  loginProvider,
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
};
