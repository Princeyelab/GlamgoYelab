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
 */
export const getCategoriesWithServices = async (): Promise<(Category & { services: Service[] })[]> => {
  const response = await apiClient.get<{ success: boolean; data: (Category & { services: Service[] })[] }>(
    ENDPOINTS.CATEGORIES.WITH_SERVICES
  );

  return response.data.data.map(cat => ({
    ...transformCategoryImages(cat),
    services: cat.services.map(transformServiceImages),
  }));
};

// === PRESTATAIRES ===

/**
 * Recuperer les prestataires a proximite
 */
export const getNearbyProviders = async (params: NearbyProvidersParams): Promise<Provider[]> => {
  const response = await apiClient.get<{ success: boolean; data: Provider[] }>(
    ENDPOINTS.PROVIDERS.NEARBY,
    { params }
  );

  return response.data.data;
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
 * Transformer les URLs des images d'un service
 */
const transformServiceImages = (service: Service): Service => {
  return {
    ...service,
    thumbnail: service.thumbnail ? getImageUrl(service.thumbnail) : undefined,
    images: service.images?.map(img => getImageUrl(img)) || [],
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
