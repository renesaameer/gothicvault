// Auth-specific API client
import { apiClient } from './client.js';
import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export const verifyEmailSchema = z.object({
  token: z.string(),
});

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Auth client
export class AuthClient {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials, {
      skipAuth: true,
    });
    
    // Store access token (refresh token is in HttpOnly cookie)
    if (response.accessToken) {
      apiClient.setTokens(response.accessToken, '');
    }
    
    return response;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data, {
      skipAuth: true,
    });
    
    // Store access token (refresh token is in HttpOnly cookie)
    if (response.accessToken) {
      apiClient.setTokens(response.accessToken, '');
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    } finally {
      // Always clear tokens
      apiClient.clearTokens();
    }
  }

  async refreshToken(): Promise<RefreshTokenResponse> {
    // Refresh token is in HttpOnly cookie, no need to send it in body
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {}, {
      skipAuth: true,
    });
    
    // Update access token (refresh token is in HttpOnly cookie)
    if (response.accessToken) {
      apiClient.setTokens(response.accessToken, '');
    }
    
    return response;
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email }, {
      skipAuth: true,
    });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password }, {
      skipAuth: true,
    });
  }

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token }, {
      skipAuth: true,
    });
  }

  async getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await apiClient.get<{ user: AuthResponse['user'] }>('/auth/me');
    return response.user;
  }

  isAuthenticated(): boolean {
    return !!apiClient.getAccessToken();
  }
}

// Singleton instance
export const authClient = new AuthClient();
