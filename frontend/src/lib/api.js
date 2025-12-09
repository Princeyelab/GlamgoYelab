const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const API_URL = baseUrl.endsWith('/api') ? baseUrl : baseUrl + '/api'

/**
 * Helper pour faire des requêtes API
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Ajouter le token si disponible
  const token = getToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erreur API:', {
        url,
        status: response.status,
        statusText: response.statusText,
        data
      })
      const errorMessage = data.message || 'Une erreur est survenue'
      const errorDetails = data.errors ? '\n' + JSON.stringify(data.errors, null, 2) : ''
      throw new Error(errorMessage + errorDetails)
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

/**
 * Récupère le token JWT du localStorage
 */
export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

/**
 * Sauvegarde le token JWT dans le localStorage
 */
export function setToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token)
  }
}

/**
 * Supprime le token JWT du localStorage
 */
export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
  }
}

/**
 * Récupère l'utilisateur du localStorage
 */
export function getUser() {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }
  return null
}

/**
 * Sauvegarde l'utilisateur dans le localStorage
 */
export function setUser(user) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user))
  }
}

/**
 * Supprime l'utilisateur du localStorage
 */
export function removeUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
  }
}

/**
 * Déconnexion
 */
export function logout() {
  removeToken()
  removeUser()
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

// API Methods
export const api = {
  // Generic methods
  get: (endpoint) => apiRequest(endpoint),

  post: (endpoint, data) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  put: (endpoint, data) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (endpoint) => apiRequest(endpoint, {
    method: 'DELETE',
  }),

  // Auth
  register: (data) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  login: (data) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Categories
  getCategories: () => apiRequest('/categories'),

  getCategory: (id) => apiRequest(`/categories/${id}`),

  // Services
  getServices: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/services${query ? `?${query}` : ''}`)
  },

  getService: (id) => apiRequest(`/services/${id}`),

  // User
  getProfile: () => apiRequest('/user/profile'),

  updateProfile: (data) => apiRequest('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Addresses
  getAddresses: () => apiRequest('/user/addresses'),

  createAddress: (data) => apiRequest('/user/addresses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateAddress: (id, data) => apiRequest(`/user/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteAddress: (id) => apiRequest(`/user/addresses/${id}`, {
    method: 'DELETE',
  }),

  // Orders
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/orders${query ? `?${query}` : ''}`)
  },

  getOrder: (id) => apiRequest(`/orders/${id}`),

  createOrder: (data) => apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  cancelOrder: (id, reason) => apiRequest(`/orders/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  }),

  // Reviews
  createReview: (orderId, data) => apiRequest(`/orders/${orderId}/review`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Chat
  getMessages: (orderId) => apiRequest(`/orders/${orderId}/messages`),

  sendMessage: (orderId, content) => apiRequest(`/orders/${orderId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),

  // Location
  getProviderLocation: (orderId) => apiRequest(`/orders/${orderId}/location`),

  // Payment - Client
  validateCard: (data) => apiRequest('/payment/validate-card', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  validateCardDemo: (data) => apiRequest('/payment/demo/validate-card', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  processPayment: (data) => apiRequest('/payment/process', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getPaymentMethods: () => apiRequest('/payment/methods'),

  deletePaymentMethod: (id) => apiRequest(`/payment/methods/${id}`, {
    method: 'DELETE',
  }),

  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/payment/transactions${query ? `?${query}` : ''}`)
  },

  getTransaction: (id) => apiRequest(`/payment/transaction/${id}`),

  // Payment - Provider
  registerBankAccount: (data) => apiRequest('/provider/payment/bank-account', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getProviderEarnings: () => apiRequest('/provider/payment/earnings'),

  // Onboarding - Status
  getOnboardingStatus: () => apiRequest('/onboarding/status'),

  // Onboarding - Client
  getClientOnboardingData: () => apiRequest('/onboarding/client/data'),

  submitClientOnboarding: (data) => apiRequest('/onboarding/client/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Onboarding - Provider
  getProviderOnboardingData: () => apiRequest('/onboarding/provider/data'),

  submitProviderOnboarding: (data) => apiRequest('/onboarding/provider/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}
