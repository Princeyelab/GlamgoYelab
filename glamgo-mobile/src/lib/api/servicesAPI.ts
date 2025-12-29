/**
 * API Services GlamGo
 * Gestion des services, categories, prestataires
 */

import apiClient from './client';
import { ENDPOINTS, getImageUrl } from './endpoints';
import { Service, Category } from '../../types/service';

// === TYPES ===

export interface ServicesListParams {
  category_id?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'price' | 'rating' | 'created_at' | 'popularity';
  sort_order?: 'asc' | 'desc';
  min_price?: number;
  max_price?: number;
  featured?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ServiceDetailResponse {
  success: boolean;
  data: Service & {
    provider_details?: ProviderDetails;
    reviews?: Review[];
    similar_services?: Service[];
  };
}

export interface ProviderDetails {
  id: number;
  name: string;
  avatar?: string;
  rating: number;
  reviews_count: number;
  completed_orders: number;
  response_time?: string;
  location?: {
    city: string;
    area?: string;
  };
}

export interface Review {
  id: number;
  user: {
    id: number;
    name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  created_at: string;
}

export interface Provider {
  id: number;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  rating: number;
  reviews_count: number;
  completed_orders: number;
  services: Service[];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
  };
  availability?: AvailabilitySlot[];
  is_available: boolean;
  distance?: number;
}

export interface AvailabilitySlot {
  date: string;
  slots: {
    start_time: string;
    end_time: string;
    is_available: boolean;
  }[];
}

export interface NearbyProvidersParams {
  latitude: number;
  longitude: number;
  radius?: number;
  service_id?: number;
  category_id?: number;
}

// === API FUNCTIONS ===

/**
 * Recuperer la liste des services
 */
export const getServices = async (params?: ServicesListParams): Promise<PaginatedResponse<Service>> => {
  const response = await apiClient.get<PaginatedResponse<Service>>(
    ENDPOINTS.SERVICES.LIST,
    { params }
  );

  // Transformer les images avec l'URL complete
  response.data.data = response.data.data.map(transformServiceImages);

  return response.data;
};

/**
 * Recuperer un service par ID
 */
export const getServiceById = async (id: number | string): Promise<Service> => {
  const response = await apiClient.get<ServiceDetailResponse>(ENDPOINTS.SERVICES.DETAIL(id));
  return transformServiceImages(response.data.data);
};

/**
 * Recuperer les services par categorie
 */
export const getServicesByCategory = async (
  categoryId: number | string,
  params?: Omit<ServicesListParams, 'category_id'>
): Promise<PaginatedResponse<Service>> => {
  const response = await apiClient.get<PaginatedResponse<Service>>(
    ENDPOINTS.SERVICES.BY_CATEGORY(categoryId),
    { params }
  );

  response.data.data = response.data.data.map(transformServiceImages);
  return response.data;
};

/**
 * Rechercher des services
 */
export const searchServices = async (
  query: string,
  params?: Omit<ServicesListParams, 'search'>
): Promise<PaginatedResponse<Service>> => {
  const response = await apiClient.get<PaginatedResponse<Service>>(
    ENDPOINTS.SERVICES.SEARCH,
    { params: { search: query, ...params } }
  );

  response.data.data = response.data.data.map(transformServiceImages);
  return response.data;
};

/**
 * Recuperer les services en vedette
 */
export const getFeaturedServices = async (): Promise<Service[]> => {
  const response = await apiClient.get<{ success: boolean; data: Service[] }>(
    ENDPOINTS.SERVICES.FEATURED
  );

  return response.data.data.map(transformServiceImages);
};

/**
 * Recuperer les services populaires
 */
export const getPopularServices = async (limit?: number): Promise<Service[]> => {
  const response = await apiClient.get<{ success: boolean; data: Service[] }>(
    ENDPOINTS.SERVICES.POPULAR,
    { params: { limit } }
  );

  return response.data.data.map(transformServiceImages);
};

// === CATEGORIES ===

/**
 * Recuperer toutes les categories
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<{ success: boolean; data: Category[] }>(
    ENDPOINTS.CATEGORIES.LIST
  );

  return response.data.data.map(transformCategoryImages);
};

/**
 * Recuperer une categorie par ID
 */
export const getCategoryById = async (id: number | string): Promise<Category> => {
  const response = await apiClient.get<{ success: boolean; data: Category }>(
    ENDPOINTS.CATEGORIES.DETAIL(id)
  );

  return transformCategoryImages(response.data.data);
};

/**
 * Recuperer les categories avec leurs services
 * Combine /api/categories et /api/services
 */
export const getCategoriesWithServices = async (): Promise<(Category & { services: Service[] })[]> => {
  // Recuperer categories et services en parallele
  const [categoriesRes, servicesRes] = await Promise.all([
    apiClient.get<{ success: boolean; data: Category[] }>(ENDPOINTS.CATEGORIES.LIST),
    apiClient.get<{ success: boolean; data: Service[] }>(ENDPOINTS.SERVICES.LIST),
  ]);

  const categories = categoriesRes.data.data || [];
  const services = servicesRes.data.data || [];

  console.log('[API] Categories:', categories.length, categories.map(c => ({ id: c.id, name: c.name })));
  console.log('[API] Services:', services.length, services.slice(0, 3).map(s => ({ id: s.id, title: s.title, name: s.name, category_id: s.category_id })));

  // Grouper les services par categorie (comparer en tant que nombres)
  return categories.map(cat => {
    const catId = typeof cat.id === 'string' ? parseInt(cat.id, 10) : cat.id;
    const catServices = services.filter(s => {
      const sCatId = typeof s.category_id === 'string' ? parseInt(s.category_id, 10) : s.category_id;
      return sCatId === catId;
    });
    console.log(`[API] Category ${cat.name} (${catId}): ${catServices.length} services`);
    return {
      ...transformCategoryImages(cat),
      services: catServices.map(transformServiceImages),
    };
  });
};

// === PRESTATAIRES ===

/**
 * Recuperer les prestataires a proximite pour un service
 * Endpoint: GET /api/services/{id}/nearby-providers?lat=...&lng=...&radius=...
 */
export const getNearbyProviders = async (params: NearbyProvidersParams): Promise<Provider[]> => {
  if (!params.service_id) {
    console.warn('[getNearbyProviders] service_id requis');
    return [];
  }

  console.log('[getNearbyProviders] Fetching providers for service', params.service_id, 'at', params.latitude, params.longitude);

  try {
    const response = await apiClient.get<{ success: boolean; data: Provider[]; nearest?: Provider; alternatives?: Provider[] }>(
      ENDPOINTS.SERVICES.NEARBY_PROVIDERS(params.service_id),
      {
        params: {
          lat: params.latitude,
          lng: params.longitude,
          radius: params.radius || 50,
          test_mode: 'true', // Pour le developpement - ignorer is_verified
          // only_available par defaut = true (masque les prestataires hors ligne)
        }
      }
    );

    console.log('[getNearbyProviders] Response:', JSON.stringify(response.data, null, 2));

    // L'API retourne { success, message, data: { nearest, alternatives, ... } }
    const responseData = response.data?.data || response.data;

    // L'API peut retourner { nearest, alternatives }
    if (responseData?.nearest || responseData?.alternatives) {
      const providers: Provider[] = [];
      if (responseData.nearest) {
        // Transformer le format API vers le format Provider attendu
        const nearestProvider = transformApiProviderToProvider(responseData.nearest);
        providers.push(nearestProvider);
      }
      if (responseData.alternatives && Array.isArray(responseData.alternatives)) {
        const altProviders = responseData.alternatives.map(transformApiProviderToProvider);
        providers.push(...altProviders);
      }
      console.log('[getNearbyProviders] Found providers:', providers.length);
      return providers;
    }

    // S'assurer que data est un tableau
    if (Array.isArray(responseData)) {
      return responseData;
    }

    console.log('[getNearbyProviders] No providers found in response');
    return [];
  } catch (error) {
    console.error('[getNearbyProviders] Error:', error);
    return [];
  }
};

/**
 * Recuperer un prestataire par ID
 */
export const getProviderById = async (id: number | string): Promise<Provider> => {
  const response = await apiClient.get<{ success: boolean; data: Provider }>(
    ENDPOINTS.PROVIDERS.DETAIL(id)
  );

  return response.data.data;
};

/**
 * Recuperer les prestataires pour un service
 */
export const getProvidersByService = async (serviceId: number | string): Promise<Provider[]> => {
  const response = await apiClient.get<{ success: boolean; data: Provider[] }>(
    ENDPOINTS.PROVIDERS.BY_SERVICE(serviceId)
  );

  return response.data.data;
};

/**
 * Recuperer la disponibilite d'un prestataire
 */
export const getProviderAvailability = async (
  providerId: number | string,
  date?: string
): Promise<AvailabilitySlot[]> => {
  const response = await apiClient.get<{ success: boolean; data: AvailabilitySlot[] }>(
    ENDPOINTS.PROVIDERS.AVAILABILITY(providerId),
    { params: { date } }
  );

  return response.data.data;
};

/**
 * Recuperer les avis d'un prestataire
 */
export const getProviderReviews = async (
  providerId: number | string,
  page?: number
): Promise<PaginatedResponse<Review>> => {
  const response = await apiClient.get<PaginatedResponse<Review>>(
    ENDPOINTS.PROVIDERS.REVIEWS(providerId),
    { params: { page } }
  );

  return response.data;
};

// === AVIS ===

/**
 * Recuperer les avis d'un service
 */
export const getServiceReviews = async (
  serviceId: number | string,
  page?: number
): Promise<PaginatedResponse<Review>> => {
  const response = await apiClient.get<PaginatedResponse<Review>>(
    ENDPOINTS.REVIEWS.BY_SERVICE(serviceId),
    { params: { page } }
  );

  return response.data;
};

// === HELPERS ===

/**
 * Transformer le format API du prestataire vers le format Provider attendu par l'app
 */
const transformApiProviderToProvider = (apiProvider: any): Provider => {
  return {
    id: apiProvider.id,
    name: `${apiProvider.first_name || ''} ${apiProvider.last_name || ''}`.trim(),
    avatar: apiProvider.avatar ? getImageUrl(apiProvider.avatar) : undefined,
    email: apiProvider.email,
    phone: apiProvider.phone,
    rating: parseFloat(apiProvider.rating) || 0,
    reviews_count: apiProvider.total_reviews || 0,
    completed_orders: apiProvider.completed_orders || 0,
    services: [],
    location: apiProvider.latitude && apiProvider.longitude ? {
      latitude: parseFloat(apiProvider.latitude),
      longitude: parseFloat(apiProvider.longitude),
      address: '',
      city: '',
    } : undefined,
    is_available: apiProvider.is_available ?? true,
    distance: apiProvider.distance,
    // Garder les données brutes pour le booking
    ...apiProvider,
  };
};

/**
 * Transformer les URLs des images d'un service
 * Gere les deux formats: 'image' (API) et 'images' (array)
 */
const transformServiceImages = (service: Service): Service => {
  // L'API retourne 'image' (singulier), le mobile attend 'images' (array)
  const imageFromApi = (service as any).image;

  // Construire le tableau d'images
  let images: string[] = [];

  if (service.images && service.images.length > 0) {
    // Si deja un tableau d'images, l'utiliser
    images = service.images.map(img => getImageUrl(img));
  } else if (imageFromApi) {
    // Sinon, utiliser le champ 'image' de l'API
    images = [getImageUrl(imageFromApi)];
  }

  // Utiliser la premiere image comme thumbnail si pas defini
  const thumbnail = service.thumbnail
    ? getImageUrl(service.thumbnail)
    : (images.length > 0 ? images[0] : undefined);

  return {
    ...service,
    thumbnail,
    images,
  };
};

/**
 * Transformer les URLs des images d'une categorie
 */
const transformCategoryImages = (category: Category): Category => {
  return {
    ...category,
    image: category.image ? getImageUrl(category.image) : undefined,
  };
};

// Export par defaut
export default {
  // Services
  getServices,
  getServiceById,
  getServicesByCategory,
  searchServices,
  getFeaturedServices,
  getPopularServices,
  // Categories
  getCategories,
  getCategoryById,
  getCategoriesWithServices,
  // Providers
  getNearbyProviders,
  getProviderById,
  getProvidersByService,
  getProviderAvailability,
  getProviderReviews,
  // Reviews
  getServiceReviews,
};
