// API response types
export interface User {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isAdmin: boolean | null;
  roles: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  category: Category | null;
  brand: Brand | null;
  tags: string[];
  images: string[];
  stock: number;
  bestSeller: boolean;
  featured: boolean;
  sortOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryType: string;
  parentId: string | null;
  imageUrl: string | null;
  sortOrder: number;
  featured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    images: string[];
    stock: number;
  };
  variant?: {
    id: string;
    name: string;
    price: number;
    stock: number;
  };
}

export interface Cart {
  id: string;
  cartToken: string;
  items: CartItem[];
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
  };
  coupon?: {
    code: string;
    discountType: string;
    discountValue: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  customerAddress: string;
  customerCity: string | null;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  couponCode: string | null;
  paymentMethod: string;
  paymentStatus: string;
  paymentProvider: string | null;
  orderStatus: string;
  fulfillmentStatus: string;
  shippingAddress: any;
  billingAddress: any | null;
  deliveryPartner: string | null;
  trackingNumber: string | null;
  notes: string | null;
  refundStatus: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  customer?: Customer;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productSnapshot: any;
  pricingSnapshot: any;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  city: string | null;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  enabled: boolean;
  maxUses: number | null;
  minCartTotal: number | null;
  minOrderAmount: number | null;
  startDate: string | null;
  endDate: string | null;
  expiresAt: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HomepageSettings {
  id: string;
  content: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroImageUrl?: string;
    heroCtaText?: string;
    heroCtaLink?: string;
    featuredProductIds?: string[];
    bannerImageUrl?: string;
    bannerTitle?: string;
    bannerLink?: string;
    showNewsletter?: boolean;
    newsletterTitle?: string;
    newsletterDescription?: string;
  };
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  sales: {
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    avgOrderValue: number;
  };
  orders: {
    ordersByStatus: Array<{ status: string; count: number }>;
    ordersByPaymentStatus: Array<{ status: string; count: number }>;
  };
  topProducts: Array<Product & { totalSales: number }>;
  recentOrders: Order[];
}
