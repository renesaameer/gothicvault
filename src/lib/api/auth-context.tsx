// Auth context for managing authentication state
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authClient } from './auth-client.js';
import { apiClient } from './client.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from './types.js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current user query
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['user'],
    queryFn: () => authClient.getCurrentUser(),
    retry: false,
    enabled: isInitialized && !!apiClient.getAccessToken(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Initialize auth state on mount
  useEffect(() => {
    const token = apiClient.getAccessToken();
    setIsInitialized(true);
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authClient.login({ email, password }),
    onSuccess: async () => {
      // Invalidate and refetch user query to get updated user data
      await queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: ({ email, password, fullName }: { email: string; password: string; fullName: string }) =>
      authClient.register({ email, password, fullName }),
    onSuccess: async () => {
      // Invalidate and refetch user query to get updated user data
      await queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Register error:', error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authClient.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Still clear queries even if logout fails
      queryClient.clear();
    },
  });

  // Refresh mutation
  const refreshMutation = useMutation({
    mutationFn: () => authClient.refreshToken(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Refresh error:', error);
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (email: string, password: string, fullName: string) => {
    await registerMutation.mutateAsync({ email, password, fullName });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const refresh = async () => {
    await refreshMutation.mutateAsync();
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading: isLoading || !isInitialized,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
