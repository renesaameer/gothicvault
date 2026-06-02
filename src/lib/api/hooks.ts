// React hooks for API client
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authClient, type LoginRequest, type RegisterRequest } from './auth-client.js';
import { apiClient } from './client.js';
import { API_ENDPOINTS } from './endpoints.js';
import type { User, Product, Category, Cart, Order, Coupon } from './types.js';

// Auth hooks
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authClient.login(credentials),
    onSuccess: (data) => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authClient.register(data),
    onSuccess: (data) => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authClient.logout(),
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => authClient.getCurrentUser(),
    retry: false,
  });
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: () => authClient.refreshToken(),
  });
}

// Product hooks
export function useProducts(query?: {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  search?: string;
  featured?: boolean;
}) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => apiClient.get(API_ENDPOINTS.PRODUCTS.LIST, { query }),
  });
}

export function useFeaturedProducts(query?: {
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['products', 'featured', query],
    queryFn: () => apiClient.get(API_ENDPOINTS.PRODUCTS.FEATURED, { query }),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.get(API_ENDPOINTS.PRODUCTS.BY_ID(id)),
    enabled: !!id,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ['product', 'slug', slug],
    queryFn: () => apiClient.get(API_ENDPOINTS.PRODUCTS.BY_SLUG(slug)),
    enabled: !!slug,
  });
}

export function useRelatedProducts(id: string) {
  return useQuery({
    queryKey: ['products', 'related', id],
    queryFn: () => apiClient.get(API_ENDPOINTS.PRODUCTS.RELATED(id)),
    enabled: !!id,
  });
}

// Category hooks
export function useCategories(query?: {
  page?: number;
  limit?: number;
  categoryType?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['categories', query],
    queryFn: () => apiClient.get(API_ENDPOINTS.CATEGORIES.LIST, { query }),
  });
}

export function useCategoryTree(categoryType?: string) {
  return useQuery({
    queryKey: ['categories', 'tree', categoryType],
    queryFn: () => apiClient.get(API_ENDPOINTS.CATEGORIES.TREE, { query: { categoryType } }),
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => apiClient.get(API_ENDPOINTS.CATEGORIES.BY_ID(id)),
    enabled: !!id,
  });
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ['category', 'slug', slug],
    queryFn: () => apiClient.get(API_ENDPOINTS.CATEGORIES.BY_SLUG(slug)),
    enabled: !!slug,
  });
}

// Cart hooks
export function useCart(cartToken?: string) {
  return useQuery({
    queryKey: ['cart', cartToken],
    queryFn: () => apiClient.get(API_ENDPOINTS.CART.GET, {
      headers: cartToken ? { 'x-cart-token': cartToken } : undefined,
    }),
    enabled: !!cartToken,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartToken, ...data }: { cartToken?: string; productId: string; variantId?: string; quantity: number }) =>
      apiClient.post(API_ENDPOINTS.CART.ADD_ITEM, data, {
        headers: cartToken ? { 'x-cart-token': cartToken } : undefined,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.cartToken] });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartToken, itemId, quantity }: { cartToken?: string; itemId: string; quantity: number }) =>
      apiClient.patch(API_ENDPOINTS.CART.UPDATE_ITEM(itemId), { quantity }, {
        headers: cartToken ? { 'x-cart-token': cartToken } : undefined,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.cartToken] });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartToken, itemId }: { cartToken?: string; itemId: string }) =>
      apiClient.delete(API_ENDPOINTS.CART.REMOVE_ITEM(itemId), {
        headers: cartToken ? { 'x-cart-token': cartToken } : undefined,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.cartToken] });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartToken?: string) =>
      apiClient.delete(API_ENDPOINTS.CART.CLEAR, {
        headers: cartToken ? { 'x-cart-token': cartToken } : undefined,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables] });
    },
  });
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartToken, code }: { cartToken?: string; code: string }) =>
      apiClient.post(API_ENDPOINTS.CART.APPLY_COUPON, { code }, {
        headers: cartToken ? { 'x-cart-token': cartToken } : undefined,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.cartToken] });
    },
  });
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartToken?: string) =>
      apiClient.delete(API_ENDPOINTS.CART.REMOVE_COUPON, {
        headers: cartToken ? { 'x-cart-token': cartToken } : undefined,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables] });
    },
  });
}

// Order hooks
export function useMyOrders(query?: {
  page?: number;
  limit?: number;
  orderStatus?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
}) {
  return useQuery({
    queryKey: ['orders', 'me', query],
    queryFn: () => apiClient.get(API_ENDPOINTS.ORDERS.ME, { query }),
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => apiClient.get(API_ENDPOINTS.ORDERS.BY_ID(orderId)),
    enabled: !!orderId,
  });
}

export function useOrderByNumber(orderNumber: string) {
  return useQuery({
    queryKey: ['order', 'number', orderNumber],
    queryFn: () => apiClient.get(API_ENDPOINTS.ORDERS.BY_NUMBER(orderNumber)),
    enabled: !!orderNumber,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      apiClient.post(API_ENDPOINTS.ORDERS.CANCEL(orderId)),
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });
}

// Coupon hooks
export function useCoupons(query?: {
  page?: number;
  limit?: number;
  enabled?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ['coupons', query],
    queryFn: () => apiClient.get(API_ENDPOINTS.COUPONS.LIST, { query }),
  });
}

export function useCoupon(code: string) {
  return useQuery({
    queryKey: ['coupon', code],
    queryFn: () => apiClient.get(API_ENDPOINTS.COUPONS.BY_CODE(code)),
    enabled: !!code,
  });
}
