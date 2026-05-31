// Local type definitions for database tables
// Used because the auto-generated Supabase types may not reflect the actual schema

export type ProductStatus = "draft" | "active" | "archived";
export type CategoryType = "category" | "subcategory" | "child";
export type TagType = "feature" | "material" | "color" | "style" | "audience";
export type MediaType = "image" | "video" | "360";

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  base_price?: number;
  compare_price?: number | null;
  /** Aggregated from product_media table — populated by attachImagesToProducts() */
  images?: string[];
  category_id: string | null;
  brand_id: string | null;
  stock: number;
  rating: number;
  review_count: number;
  featured: boolean;
  best_seller: boolean;
  is_new_arrival?: boolean;
  status?: ProductStatus;
  short_description: string | null;
  description: string | null;
  sku: string | null;
  /** @deprecated legacy jsonb column was dropped; use product_variants rows */
  variants?: any[] | null;
  created_at: string;
  show_shipping_text?: boolean;
  show_stock_status?: boolean;
  shipping_text?: string | null;
  stock_status_text?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  level?: number;
  category_type?: CategoryType;
  path?: string;
  full_slug?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  featured_image_url?: string | null;
  enabled?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  type: TagType;
  icon: string | null;
  color: string | null;
  sort_order: number;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  variant_id: string | null;
  image_url: string;
  alt_text: string | null;
  type: MediaType;
  sort_order: number;
}

export interface HomepageSection {
  id: string;
  enabled: boolean;
  sort_order: number;
  content: Record<string, any>;
}

export interface Testimonial {
  id: string;
  name: string;
  review: string;
  rating: number;
  image_url: string | null;
  main_image_url?: string | null;
  sort_order: number;
}

export interface HomeFaq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface WhyChooseUsCard {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  sort_order: number;
}

export interface ContactSettings {
  id: string;
  page_title: string | null;
  page_intro: string | null;
  phone_number: string | null;
  email_address: string | null;
  receiving_email: string | null;
  show_address: boolean;
  business_address: string | null;
  phone_field_enabled: boolean;
  submit_button_text: string | null;
  social_section_enabled: boolean;
  social_links: any;
  faq_shortcut_enabled: boolean;
  faq_shortcut_items: any;
  map_enabled: boolean;
  map_embed: string | null;
  [key: string]: any;
}

export interface ProductTab {
  id: string;
  product_id: string;
  title: string;
  content: string;
  display_style: 'text' | 'list' | 'highlight';
  sort_order: number;
}

export interface ProductFaq {
  id: string;
  product_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}
