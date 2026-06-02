// Centralized API client for Fastify backend
import { z } from 'zod';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request options
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: HeadersInit;
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  skipAuth?: boolean;
}

// Response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  details?: any;
}

// Pagination response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Main API client
class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Token management
  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  getAccessToken(): string | null {
    if (this.accessToken) return this.accessToken;
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
    }
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    if (this.refreshToken) return this.refreshToken;
    if (typeof window !== 'undefined') {
      this.refreshToken = localStorage.getItem('refresh_token');
    }
    return this.refreshToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  // Build URL with query params
  private buildUrl(endpoint: string, params?: Record<string, string>, query?: Record<string, string | number | boolean>): string {
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`:${key}`, value);
      });
    }

    if (query) {
      const searchParams = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  // Build headers
  private buildHeaders(options: RequestOptions): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...options.headers,
    });

    const token = this.getAccessToken();
    if (token && !options.skipAuth) {
      headers.append('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // Handle errors
  private async handleResponse(response: Response, originalOptions?: RequestOptions): Promise<any> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorData;
      if (isJson) {
        errorData = await response.json();
      } else {
        errorData = await response.text();
      }

      // Handle 401 - token expired
      if (response.status === 401 && !originalOptions?.skipAuth) {
        try {
          await this.refreshAccessToken();
          // Retry the request with new token
          return this.request(response.url, originalOptions);
        } catch (refreshError) {
          // Refresh failed, clear tokens and throw original error
          this.clearTokens();
          throw new ApiError(
            errorData?.error || errorData || 'Session expired',
            response.status,
            errorData
          );
        }
      }

      throw new ApiError(
        errorData?.error || errorData || 'An error occurred',
        response.status,
        errorData
      );
    }

    if (isJson) {
      return await response.json();
    }

    return await response.text();
  }

  // Refresh access token with deduplication
  private async refreshAccessToken(): Promise<void> {
    // If already refreshing, wait for the existing refresh to complete
    if (this.isRefreshing && this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    // Refresh token is in HttpOnly cookie, no need to check localStorage
    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}), // Empty body since refresh token is in cookie
          credentials: 'include', // Include cookies
        });

        if (!response.ok) {
          this.clearTokens();
          throw new ApiError('Failed to refresh token', 401);
        }

        const data = await response.json();
        this.setTokens(data.accessToken, ''); // Refresh token is in cookie
      } catch (error) {
        this.clearTokens();
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    await this.refreshPromise;
  }

  // Main request method
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(endpoint, options.params, options.query);
    const headers = this.buildHeaders(options);

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body && options.method !== 'GET') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response, options);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0, error);
    }
  }

  // Convenience methods
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Singleton instance
export const apiClient = new ApiClient();
