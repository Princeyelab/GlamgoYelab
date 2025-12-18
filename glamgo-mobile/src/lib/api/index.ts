/**
 * API Layer GlamGo Mobile
 * Export centralise de tous les modules API
 */

// Client Axios avec intercepteurs JWT
export { default as apiClient } from './client';
export {
  setTokens,
  getToken,
  clearTokens,
  isAuthenticated,
  API_BASE_URL,
} from './client';

// Endpoints
export { ENDPOINTS, getImageUrl, IMAGE_BASE_URL } from './endpoints';

// Auth API
export { default as authAPI } from './authAPI';
export {
  login,
  register,
  logout,
  getMe,
  checkAuth,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  uploadAvatar,
  verifyEmail,
  resendVerificationEmail,
  deleteAccount,
} from './authAPI';
export type {
  LoginCredentials,
  RegisterData,
  User,
  AuthResponse,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData,
  UpdateProfileData,
} from './authAPI';

// Services API
export { default as servicesAPI } from './servicesAPI';
export {
  getServices,
  getServiceById,
  getServicesByCategory,
  searchServices,
  getFeaturedServices,
  getPopularServices,
  getCategories,
  getCategoryById,
  getCategoriesWithServices,
  getNearbyProviders,
  getProviderById,
  getProvidersByService,
  getProviderAvailability,
  getProviderReviews,
  getServiceReviews,
} from './servicesAPI';
export type {
  ServicesListParams,
  PaginatedResponse,
  ServiceDetailResponse,
  ProviderDetails,
  Provider,
  AvailabilitySlot,
  NearbyProvidersParams,
} from './servicesAPI';

// Bookings API
export { default as bookingsAPI } from './bookingsAPI';
export {
  createBooking,
  getBookings,
  getBookingById,
  getUpcomingBookings,
  getBookingHistory,
  cancelBooking,
  confirmBooking,
  completeBooking,
  createReview,
  getMyReviews,
  getFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  formatBookingStatus,
  getBookingStatusColor,
  canCancelBooking,
  canReviewBooking,
} from './bookingsAPI';
export type {
  Booking,
  BookingStatus,
  CreateBookingData,
  BookingListParams,
  CancelBookingData,
  CreateReviewData,
  Review,
  Favorite,
} from './bookingsAPI';
