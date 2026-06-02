// API endpoint definitions
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },

  // Products
  PRODUCTS: {
    LIST: '/products',
    FEATURED: '/products/featured',
    BY_ID: (id: string) => `/products/${id}`,
    BY_SLUG: (slug: string) => `/products/slug/${slug}`,
    RELATED: (id: string) => `/products/${id}/related`,
    CREATE: '/products',
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
  },

  // Categories
  CATEGORIES: {
    LIST: '/categories',
    TREE: '/categories/tree',
    BY_ID: (id: string) => `/categories/${id}`,
    BY_SLUG: (slug: string) => `/categories/slug/${slug}`,
    CREATE: '/categories',
    UPDATE: (id: string) => `/categories/${id}`,
    DELETE: (id: string) => `/categories/${id}`,
  },

  // Cart
  CART: {
    TOKEN: '/cart/token',
    GET: '/cart',
    ADD_ITEM: '/cart/items',
    UPDATE_ITEM: (itemId: string) => `/cart/items/${itemId}`,
    REMOVE_ITEM: (itemId: string) => `/cart/items/${itemId}`,
    CLEAR: '/cart',
    APPLY_COUPON: '/cart/coupon',
    REMOVE_COUPON: '/cart/coupon',
    MERGE: '/cart/merge',
  },

  // Checkout
  CHECKOUT: {
    VALIDATE: '/checkout/validate',
    CHECKOUT: '/checkout',
  },

  // Orders
  ORDERS: {
    ME: '/orders/me',
    BY_NUMBER: (orderNumber: string) => `/orders/number/${orderNumber}`,
    BY_ID: (orderId: string) => `/orders/${orderId}`,
    INVOICE: (orderId: string) => `/orders/${orderId}/invoice`,
    CANCEL: (orderId: string) => `/orders/${orderId}/cancel`,
    ADMIN_LIST: '/admin/orders',
    ADMIN_UPDATE: (orderId: string) => `/admin/orders/${orderId}`,
    ADMIN_REFUND: (orderId: string) => `/admin/orders/${orderId}/refund`,
  },

  // Coupons
  COUPONS: {
    LIST: '/coupons',
    BY_ID: (id: string) => `/coupons/${id}`,
    BY_CODE: (code: string) => `/coupons/code/${code}`,
    CREATE: '/coupons',
    UPDATE: (id: string) => `/coupons/${id}`,
    DELETE: (id: string) => `/coupons/${id}`,
    TOGGLE: (id: string) => `/coupons/${id}/toggle`,
  },

  // Customers
  CUSTOMERS: {
    LIST: '/customers',
    STATS: '/customers/stats',
    BY_ID: (id: string) => `/customers/${id}`,
    BY_PHONE: (phone: string) => `/customers/phone/${phone}`,
    CREATE: '/customers',
    UPDATE: (id: string) => `/customers/${id}`,
    DELETE: (id: string) => `/customers/${id}`,
  },

  // Homepage
  HOMEPAGE: {
    SETTINGS: '/homepage/settings',
    RESET: '/homepage/settings/reset',
  },

  // Analytics
  ANALYTICS: {
    SALES: '/analytics/sales',
    ORDERS: '/analytics/orders',
    TOP_PRODUCTS: '/analytics/top-products',
    RECENT_ORDERS: '/analytics/recent-orders',
    DASHBOARD: '/analytics/dashboard',
  },

  // Uploads
  UPLOADS: {
    SINGLE: '/uploads/single',
    MULTIPLE: '/uploads/multiple',
    UPDATE: (path: string) => `/uploads/file${path}`,
    DELETE: (path: string) => `/uploads/file${path}`,
    PRODUCT_MEDIA: '/uploads/product-media',
  },
} as const;
