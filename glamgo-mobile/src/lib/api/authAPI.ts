/**
 * API Authentification GlamGo
 * Gestion login, register, logout, tokens
 */

import apiClient, { setTokens, clearTokens, getToken } from './client';
import { ENDPOINTS } from './endpoints';

// === TYPES ===

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    refresh_token?: string;
    expires_in?: number;
  };
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

export interface ChangePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
}

// === API FUNCTIONS ===

/**
 * Connexion utilisateur
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, credentials);

  // Sauvegarder les tokens automatiquement
  if (response.data.success && response.data.data.token) {
    await setTokens(
      response.data.data.token,
      response.data.data.refresh_token
    );
  }

  return response.data;
};

/**
 * Inscription utilisateur
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, data);

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
 * Deconnexion
 */
export const logout = async (): Promise<void> => {
  try {
    // Appeler l'API pour invalider le token cote serveur
    await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
  } catch (error) {
    // Continuer meme si l'appel echoue (token peut deja etre invalide)
    console.warn('[AuthAPI] Logout API call failed:', error);
  } finally {
    // Toujours supprimer les tokens locaux
    await clearTokens();
  }
};

/**
 * Recuperer le profil utilisateur connecte
 */
export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<{ success: boolean; data: User }>(ENDPOINTS.AUTH.ME);
  return response.data.data;
};

/**
 * Verifier si l'utilisateur est authentifie (token valide)
 */
export const checkAuth = async (): Promise<{ isAuthenticated: boolean; user?: User }> => {
  try {
    const token = await getToken();

    if (!token) {
      return { isAuthenticated: false };
    }

    const user = await getMe();
    return { isAuthenticated: true, user };
  } catch (error) {
    // Token invalide ou expire
    await clearTokens();
    return { isAuthenticated: false };
  }
};

/**
 * Mot de passe oublie - envoyer email de reset
 */
export const forgotPassword = async (data: ForgotPasswordData): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    ENDPOINTS.AUTH.FORGOT_PASSWORD,
    data
  );
  return response.data;
};

/**
 * Reset du mot de passe avec token
 */
export const resetPassword = async (data: ResetPasswordData): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    ENDPOINTS.AUTH.RESET_PASSWORD,
    data
  );
  return response.data;
};

/**
 * Changer le mot de passe (utilisateur connecte)
 */
export const changePassword = async (data: ChangePasswordData): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    ENDPOINTS.USERS.CHANGE_PASSWORD,
    data
  );
  return response.data;
};

/**
 * Mettre a jour le profil
 */
export const updateProfile = async (data: UpdateProfileData): Promise<User> => {
  const response = await apiClient.put<{ success: boolean; data: User }>(
    ENDPOINTS.USERS.UPDATE_PROFILE,
    data
  );
  return response.data.data;
};

/**
 * Uploader un avatar
 */
export const uploadAvatar = async (imageUri: string): Promise<{ avatar_url: string }> => {
  const formData = new FormData();

  // Extraire le nom du fichier
  const filename = imageUri.split('/').pop() || 'avatar.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('avatar', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  const response = await apiClient.post<{ success: boolean; data: { avatar_url: string } }>(
    ENDPOINTS.USERS.UPLOAD_AVATAR,
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
 * Verifier l'email avec token
 */
export const verifyEmail = async (token: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    ENDPOINTS.AUTH.VERIFY_EMAIL,
    { token }
  );
  return response.data;
};

/**
 * Renvoyer l'email de verification
 */
export const resendVerificationEmail = async (): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    ENDPOINTS.AUTH.RESEND_VERIFICATION
  );
  return response.data;
};

/**
 * Supprimer le compte
 */
export const deleteAccount = async (password: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    ENDPOINTS.USERS.DELETE_ACCOUNT,
    { data: { password } }
  );

  // Supprimer les tokens apres suppression
  await clearTokens();

  return response.data;
};

// Export par defaut de toutes les fonctions
export default {
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
};
