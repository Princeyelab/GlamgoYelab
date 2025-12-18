/**
 * Error Handler Utility - GlamGo Mobile
 * Gestion centralisee des erreurs API
 */

import { AxiosError } from 'axios';

// === TYPES ===

export interface APIError {
  message: string;
  code?: string;
  status?: number;
  field?: string;
  details?: Record<string, string[]>;
}

// === MAIN ERROR HANDLER ===

/**
 * Transformer une erreur Axios en message utilisateur
 */
export const handleAPIError = (error: any): string => {
  // Erreur Axios avec reponse serveur
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Messages personnalises selon status HTTP
    switch (status) {
      case 400:
        return data?.message || 'Requete invalide';
      case 401:
        return 'Session expiree. Veuillez vous reconnecter.';
      case 403:
        return 'Acces refuse';
      case 404:
        return data?.message || 'Ressource non trouvee';
      case 422:
        // Erreurs de validation
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0];
          return Array.isArray(firstError) ? firstError[0] : String(firstError);
        }
        return data?.message || 'Donnees invalides';
      case 429:
        return 'Trop de requetes. Veuillez patienter.';
      case 500:
        return 'Erreur serveur. Reessayez plus tard.';
      case 502:
        return 'Service temporairement indisponible (502)';
      case 503:
        return 'Service en maintenance. Reessayez plus tard.';
      case 504:
        return 'Temps de reponse depasse. Reessayez.';
      default:
        return data?.message || `Erreur ${status}`;
    }
  }

  // Erreur reseau (pas de reponse)
  if (error.request) {
    if (error.code === 'ECONNABORTED') {
      return 'Temps de connexion depasse. Verifiez votre connexion.';
    }
    return 'Pas de connexion au serveur. Verifiez votre connexion Internet.';
  }

  // Erreur de configuration ou autre
  return error.message || 'Une erreur est survenue';
};

// === ERROR TYPE CHECKERS ===

/**
 * Verifier si c'est une erreur reseau
 */
export const isNetworkError = (error: any): boolean => {
  return !error.response && !!error.request;
};

/**
 * Verifier si c'est une erreur d'authentification
 */
export const isAuthError = (error: any): boolean => {
  return error.response?.status === 401;
};

/**
 * Verifier si c'est une erreur de validation
 */
export const isValidationError = (error: any): boolean => {
  return error.response?.status === 422;
};

/**
 * Verifier si c'est une erreur serveur
 */
export const isServerError = (error: any): boolean => {
  const status = error.response?.status;
  return status >= 500 && status < 600;
};

/**
 * Verifier si c'est une erreur de timeout
 */
export const isTimeoutError = (error: any): boolean => {
  return error.code === 'ECONNABORTED' || error.message?.includes('timeout');
};

// === VALIDATION ERRORS ===

/**
 * Extraire les erreurs de validation
 */
export const getValidationErrors = (error: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (error.response?.status === 422 && error.response?.data?.errors) {
    const validationErrors = error.response.data.errors;

    for (const [field, messages] of Object.entries(validationErrors)) {
      errors[field] = Array.isArray(messages) ? messages[0] : String(messages);
    }
  }

  return errors;
};

/**
 * Verifier si un champ specifique a une erreur
 */
export const hasFieldError = (error: any, field: string): boolean => {
  const errors = getValidationErrors(error);
  return field in errors;
};

/**
 * Obtenir l'erreur d'un champ specifique
 */
export const getFieldError = (error: any, field: string): string | null => {
  const errors = getValidationErrors(error);
  return errors[field] || null;
};

// === ERROR FORMATTING ===

/**
 * Formater une erreur pour affichage Toast
 */
export const formatErrorForToast = (error: any): { message: string; type: 'error' | 'warning' } => {
  const message = handleAPIError(error);

  // Warning pour erreurs recoverable
  if (isNetworkError(error) || isTimeoutError(error)) {
    return { message, type: 'warning' };
  }

  return { message, type: 'error' };
};

/**
 * Logger une erreur (dev only)
 */
export const logError = (context: string, error: any): void => {
  if (__DEV__) {
    console.error(`[${context}]`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
    });
  }
};

// === RETRY LOGIC ===

/**
 * Verifier si l'erreur est retriable
 */
export const isRetriableError = (error: any): boolean => {
  // Erreurs reseau et certaines erreurs serveur sont retriables
  if (isNetworkError(error) || isTimeoutError(error)) {
    return true;
  }

  const status = error.response?.status;
  // 502, 503, 504 sont retriables
  return status === 502 || status === 503 || status === 504;
};

/**
 * Calculer le delai de retry (exponential backoff)
 */
export const getRetryDelay = (attempt: number, baseDelay: number = 1000): number => {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30s
};

export default {
  handleAPIError,
  isNetworkError,
  isAuthError,
  isValidationError,
  isServerError,
  isTimeoutError,
  getValidationErrors,
  hasFieldError,
  getFieldError,
  formatErrorForToast,
  logError,
  isRetriableError,
  getRetryDelay,
};
