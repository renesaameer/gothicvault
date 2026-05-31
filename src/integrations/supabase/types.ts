export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      about_sections: {
        Row: {
          content: Json
          enabled: boolean
          id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          content?: Json
          enabled?: boolean
          id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          content?: Json
          enabled?: boolean
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          admin_seen: boolean
          amount: number
          created_at: string
          customer_name: string | null
          id: string
          message: string | null
          reference_id: string | null
          seen_at: string | null
          title: string
          type: string
          url: string | null
        }
        Insert: {
          admin_seen?: boolean
          amount?: number
          created_at?: string
          customer_name?: string | null
          id?: string
          message?: string | null
          reference_id?: string | null
          seen_at?: string | null
          title: string
          type: string
          url?: string | null
        }
        Update: {
          admin_seen?: boolean
          amount?: number
          created_at?: string
          customer_name?: string | null
          id?: string
          message?: string | null
          reference_id?: string | null
          seen_at?: string | null
          title?: string
          type?: string
          url?: string | null
        }
        Relationships: []
      }
      announcement_bar: {
        Row: {
          bg_color: string
          dismissible: boolean
          enabled: boolean
          id: string
          link: string
          text: string
          text_color: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          dismissible?: boolean
          enabled?: boolean
          id: string
          link?: string
          text?: string
          text_color?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          dismissible?: boolean
          enabled?: boolean
          id?: string
          link?: string
          text?: string
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          logo_url: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          category_type: Database["public"]["Enums"]["category_type"]
          created_at: string
          enabled: boolean
          featured_image_url: string | null
          full_slug: string | null
          id: string
          image_url: string | null
          level: number
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_id: string | null
          path: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_type?: Database["public"]["Enums"]["category_type"]
          created_at?: string
          enabled?: boolean
          featured_image_url?: string | null
          full_slug?: string | null
          id?: string
          image_url?: string | null
          level?: number
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_id?: string | null
          path?: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_type?: Database["public"]["Enums"]["category_type"]
          created_at?: string
          enabled?: boolean
          featured_image_url?: string | null
          full_slug?: string | null
          id?: string
          image_url?: string | null
          level?: number
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: string | null
          path?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contact_settings: {
        Row: {
          business_address: string | null
          email_address: string | null
          faq_shortcut_enabled: boolean
          faq_shortcut_items: Json
          id: string
          map_embed: string | null
          map_enabled: boolean
          page_intro: string | null
          page_title: string | null
          phone_field_enabled: boolean
          phone_number: string | null
          receiving_email: string | null
          show_address: boolean
          social_links: Json
          social_section_enabled: boolean
          submit_button_text: string | null
          updated_at: string
        }
        Insert: {
          business_address?: string | null
          email_address?: string | null
          faq_shortcut_enabled?: boolean
          faq_shortcut_items?: Json
          id: string
          map_embed?: string | null
          map_enabled?: boolean
          page_intro?: string | null
          page_title?: string | null
          phone_field_enabled?: boolean
          phone_number?: string | null
          receiving_email?: string | null
          show_address?: boolean
          social_links?: Json
          social_section_enabled?: boolean
          submit_button_text?: string | null
          updated_at?: string
        }
        Update: {
          business_address?: string | null
          email_address?: string | null
          faq_shortcut_enabled?: boolean
          faq_shortcut_items?: Json
          id?: string
          map_embed?: string | null
          map_enabled?: boolean
          page_intro?: string | null
          page_title?: string | null
          phone_field_enabled?: boolean
          phone_number?: string | null
          receiving_email?: string | null
          show_address?: boolean
          social_links?: Json
          social_section_enabled?: boolean
          submit_button_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          name: string
          phone: string | null
          read: boolean
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          read?: boolean
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          read?: boolean
          status?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          enabled: boolean
          end_date: string | null
          expires_at: string | null
          id: string
          max_uses: number | null
          min_cart_total: number | null
          min_order_amount: number | null
          start_date: string | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          enabled?: boolean
          end_date?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_cart_total?: number | null
          min_order_amount?: number | null
          start_date?: string | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          enabled?: boolean
          end_date?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_cart_total?: number | null
          min_order_amount?: number | null
          start_date?: string | null
          used_count?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          total_orders: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      delivery_partners: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          name: string
          slug: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          slug: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          areas: Json
          created_at: string
          delivery_charge: number
          enabled: boolean
          estimated_days: string | null
          free_delivery_minimum: number | null
          free_shipping_threshold: number | null
          id: string
          name: string
          shipping_cost: number
          sort_order: number
          zone_name: string | null
        }
        Insert: {
          areas?: Json
          created_at?: string
          delivery_charge?: number
          enabled?: boolean
          estimated_days?: string | null
          free_delivery_minimum?: number | null
          free_shipping_threshold?: number | null
          id?: string
          name?: string
          shipping_cost?: number
          sort_order?: number
          zone_name?: string | null
        }
        Update: {
          areas?: Json
          created_at?: string
          delivery_charge?: number
          enabled?: boolean
          estimated_days?: string | null
          free_delivery_minimum?: number | null
          free_shipping_threshold?: number | null
          id?: string
          name?: string
          shipping_cost?: number
          sort_order?: number
          zone_name?: string | null
        }
        Relationships: []
      }
      design_settings: {
        Row: {
          favicon_url: string | null
          id: string
          logo_desktop_url: string | null
          logo_footer_url: string | null
          logo_mobile_url: string | null
          updated_at: string
        }
        Insert: {
          favicon_url?: string | null
          id: string
          logo_desktop_url?: string | null
          logo_footer_url?: string | null
          logo_mobile_url?: string | null
          updated_at?: string
        }
        Update: {
          favicon_url?: string | null
          id?: string
          logo_desktop_url?: string | null
          logo_footer_url?: string | null
          logo_mobile_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      direct_order_channels: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          identifier: string
          label: string
          message_template: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          identifier?: string
          label?: string
          message_template?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          identifier?: string
          label?: string
          message_template?: string
          sort_order?: number
        }
        Relationships: []
      }
      featured_categories: {
        Row: {
          category_id: string | null
          created_at: string
          enabled: boolean
          id: string
          image_url: string | null
          sort_order: number
          title: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          image_url?: string | null
          sort_order?: number
          title?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          image_url?: string | null
          sort_order?: number
          title?: string | null
        }
        Relationships: []
      }
      floating_icons: {
        Row: {
          bg_color: string
          created_at: string
          enabled: boolean
          icon_color: string | null
          icon_url: string | null
          id: string
          label: string
          preset_key: string | null
          sort_order: number
          url: string
        }
        Insert: {
          bg_color?: string
          created_at?: string
          enabled?: boolean
          icon_color?: string | null
          icon_url?: string | null
          id?: string
          label?: string
          preset_key?: string | null
          sort_order?: number
          url?: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          enabled?: boolean
          icon_color?: string | null
          icon_url?: string | null
          id?: string
          label?: string
          preset_key?: string | null
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      floating_icons_settings: {
        Row: {
          animation_intensity: string | null
          animation_style: string | null
          enabled: boolean
          expand_icon_url: string | null
          id: string
          radar_animation: boolean
          updated_at: string
        }
        Insert: {
          animation_intensity?: string | null
          animation_style?: string | null
          enabled?: boolean
          expand_icon_url?: string | null
          id: string
          radar_animation?: boolean
          updated_at?: string
        }
        Update: {
          animation_intensity?: string | null
          animation_style?: string | null
          enabled?: boolean
          expand_icon_url?: string | null
          id?: string
          radar_animation?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      footer_settings: {
        Row: {
          address: string
          copyright_text: string
          customer_care_links: Json
          description: string
          email: string
          id: string
          newsletter_enabled: boolean
          phone: string
          quick_links: Json
          social_links: Json
          store_name: string
          updated_at: string
        }
        Insert: {
          address?: string
          copyright_text?: string
          customer_care_links?: Json
          description?: string
          email?: string
          id: string
          newsletter_enabled?: boolean
          phone?: string
          quick_links?: Json
          social_links?: Json
          store_name?: string
          updated_at?: string
        }
        Update: {
          address?: string
          copyright_text?: string
          customer_care_links?: Json
          description?: string
          email?: string
          id?: string
          newsletter_enabled?: boolean
          phone?: string
          quick_links?: Json
          social_links?: Json
          store_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          button_link: string | null
          button_text: string | null
          created_at: string
          enabled: boolean
          id: string
          image_url: string
          sort_order: number
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          image_url?: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          image_url?: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      home_faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          content: Json | null
          created_at: string | null
          enabled: boolean
          id: string
          sort_order: number
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          enabled?: boolean
          id: string
          sort_order?: number
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          enabled?: boolean
          id?: string
          sort_order?: number
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      incomplete_orders: {
        Row: {
          address: Json
          cart_items: Json
          checkout_step: string
          converted_order_id: string | null
          coupon: string | null
          created_at: string
          customer_name: string | null
          delivery_charge: number
          email: string | null
          id: string
          last_activity: string
          payment_method: string | null
          phone: string
          recovered: boolean
          recovery_status: string
          session_id: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          address?: Json
          cart_items?: Json
          checkout_step?: string
          converted_order_id?: string | null
          coupon?: string | null
          created_at?: string
          customer_name?: string | null
          delivery_charge?: number
          email?: string | null
          id?: string
          last_activity?: string
          payment_method?: string | null
          phone: string
          recovered?: boolean
          recovery_status?: string
          session_id: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          address?: Json
          cart_items?: Json
          checkout_step?: string
          converted_order_id?: string | null
          coupon?: string | null
          created_at?: string
          customer_name?: string | null
          delivery_charge?: number
          email?: string | null
          id?: string
          last_activity?: string
          payment_method?: string | null
          phone?: string
          recovered?: boolean
          recovery_status?: string
          session_id?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoice_settings: {
        Row: {
          footer_note: string | null
          footer_text: string | null
          id: string
          logo_url: string | null
          signature_label: string | null
          store_address: string | null
          store_email: string | null
          store_name: string | null
          store_phone: string | null
          terms_text: string | null
          updated_at: string
        }
        Insert: {
          footer_note?: string | null
          footer_text?: string | null
          id: string
          logo_url?: string | null
          signature_label?: string | null
          store_address?: string | null
          store_email?: string | null
          store_name?: string | null
          store_phone?: string | null
          terms_text?: string | null
          updated_at?: string
        }
        Update: {
          footer_note?: string | null
          footer_text?: string | null
          id?: string
          logo_url?: string | null
          signature_label?: string | null
          store_address?: string | null
          store_email?: string | null
          store_name?: string | null
          store_phone?: string | null
          terms_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          subscribed_at?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          apply_to: string
          banner_image: string | null
          created_at: string
          discount_type: string
          discount_value: number
          enabled: boolean
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          target_ids: string[] | null
        }
        Insert: {
          apply_to?: string
          banner_image?: string | null
          created_at?: string
          discount_type?: string
          discount_value?: number
          enabled?: boolean
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          target_ids?: string[] | null
        }
        Update: {
          apply_to?: string
          banner_image?: string | null
          created_at?: string
          discount_type?: string
          discount_value?: number
          enabled?: boolean
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          target_ids?: string[] | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          customer_address: string
          customer_city: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_partner: string | null
          discount_amount: number
          id: string
          items: Json
          notes: string | null
          order_number: string
          order_status: string
          payment_method: string | null
          payment_status: string
          shipping_address: Json
          shipping_cost: number
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          customer_address?: string
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_partner?: string | null
          discount_amount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          order_status?: string
          payment_method?: string | null
          payment_status?: string
          shipping_address?: Json
          shipping_cost?: number
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          customer_address?: string
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_partner?: string | null
          discount_amount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          order_status?: string
          payment_method?: string | null
          payment_status?: string
          shipping_address?: Json
          shipping_cost?: number
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          content: string
          enabled: boolean
          id: string
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          enabled?: boolean
          id?: string
          slug: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string
          enabled?: boolean
          id?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_faqs: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          product_id: string
          question: string
          sort_order: number
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          product_id: string
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          product_id?: string
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      product_media: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
          type: Database["public"]["Enums"]["media_type"]
          variant_id: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
          type?: Database["public"]["Enums"]["media_type"]
          variant_id?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["media_type"]
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_media_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_offers: {
        Row: {
          buy_quantity: number | null
          created_at: string
          discount_value: number | null
          display_text: string
          enabled: boolean
          free_product_id: string | null
          get_quantity: number | null
          id: string
          min_cart_total: number | null
          offer_type: string
          product_id: string
          sort_order: number
        }
        Insert: {
          buy_quantity?: number | null
          created_at?: string
          discount_value?: number | null
          display_text?: string
          enabled?: boolean
          free_product_id?: string | null
          get_quantity?: number | null
          id?: string
          min_cart_total?: number | null
          offer_type: string
          product_id: string
          sort_order?: number
        }
        Update: {
          buy_quantity?: number | null
          created_at?: string
          discount_value?: number | null
          display_text?: string
          enabled?: boolean
          free_product_id?: string | null
          get_quantity?: number | null
          id?: string
          min_cart_total?: number | null
          offer_type?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: []
      }
      product_tabs: {
        Row: {
          content: string | null
          created_at: string
          display_style: string
          id: string
          product_id: string
          sort_order: number
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          display_style?: string
          id?: string
          product_id: string
          sort_order?: number
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          display_style?: string
          id?: string
          product_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      product_tags: {
        Row: {
          product_id: string
          tag_id: string
        }
        Insert: {
          product_id: string
          tag_id: string
        }
        Update: {
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          active: boolean
          created_at: string
          gallery: string[]
          id: string
          image_url: string | null
          option_values: Json
          price: number
          product_id: string
          sale_price: number | null
          sku: string | null
          sort_order: number
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          gallery?: string[]
          id?: string
          image_url?: string | null
          option_values?: Json
          price?: number
          product_id: string
          sale_price?: number | null
          sku?: string | null
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          gallery?: string[]
          id?: string
          image_url?: string | null
          option_values?: Json
          price?: number
          product_id?: string
          sale_price?: number | null
          sku?: string | null
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          base_price: number
          best_seller: boolean
          brand_id: string | null
          category_id: string | null
          compare_price: number | null
          created_at: string
          description: string | null
          featured: boolean
          id: string
          is_new_arrival: boolean
          name: string
          price: number
          rating: number
          review_count: number
          sale_price: number | null
          shipping_text: string | null
          short_description: string | null
          show_offers: boolean
          show_shipping_info: boolean
          show_shipping_text: boolean
          show_stock_status: boolean
          sku: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          stock_status_text: string | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          best_seller?: boolean
          brand_id?: string | null
          category_id?: string | null
          compare_price?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          is_new_arrival?: boolean
          name: string
          price?: number
          rating?: number
          review_count?: number
          sale_price?: number | null
          shipping_text?: string | null
          short_description?: string | null
          show_offers?: boolean
          show_shipping_info?: boolean
          show_shipping_text?: boolean
          show_stock_status?: boolean
          sku?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          stock_status_text?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          best_seller?: boolean
          brand_id?: string | null
          category_id?: string | null
          compare_price?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          is_new_arrival?: boolean
          name?: string
          price?: number
          rating?: number
          review_count?: number
          sale_price?: number | null
          shipping_text?: string | null
          short_description?: string | null
          show_offers?: boolean
          show_shipping_info?: boolean
          show_shipping_text?: boolean
          show_stock_status?: boolean
          sku?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          stock_status_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_name: string
          id: string
          product_id: string
          rating: number
          review: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_name: string
          id?: string
          product_id: string
          rating?: number
          review?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          product_id?: string
          rating?: number
          review?: string | null
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          card_cta_mode: string
          card_show_add_to_cart: boolean
          card_show_buy_now: boolean
          card_show_view_details: boolean
          default_sorting: string
          id: string
          pdp_show_shipment_details: boolean
          pdp_show_why_choose_us: boolean
          search_enabled: boolean
          sorting_enabled: boolean
          updated_at: string
        }
        Insert: {
          card_cta_mode?: string
          card_show_add_to_cart?: boolean
          card_show_buy_now?: boolean
          card_show_view_details?: boolean
          default_sorting?: string
          id: string
          pdp_show_shipment_details?: boolean
          pdp_show_why_choose_us?: boolean
          search_enabled?: boolean
          sorting_enabled?: boolean
          updated_at?: string
        }
        Update: {
          card_cta_mode?: string
          card_show_add_to_cart?: boolean
          card_show_buy_now?: boolean
          card_show_view_details?: boolean
          default_sorting?: string
          id?: string
          pdp_show_shipment_details?: boolean
          pdp_show_why_choose_us?: boolean
          search_enabled?: boolean
          sorting_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          type: Database["public"]["Enums"]["tag_type"]
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          type: Database["public"]["Enums"]["tag_type"]
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["tag_type"]
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          id: string
          image_url: string
          name: string
          rating: number
          review: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string
          name: string
          rating?: number
          review?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          name?: string
          rating?: number
          review?: string
          sort_order?: number
        }
        Relationships: []
      }
      tracking_pixels: {
        Row: {
          access_token: string | null
          advanced_matching: boolean
          created_at: string
          enabled: boolean
          id: string
          pixel_id: string
          platform: string
          test_event_code: string | null
        }
        Insert: {
          access_token?: string | null
          advanced_matching?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          pixel_id?: string
          platform: string
          test_event_code?: string | null
        }
        Update: {
          access_token?: string | null
          advanced_matching?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          pixel_id?: string
          platform?: string
          test_event_code?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_testimonials: {
        Row: {
          autoplay: boolean
          created_at: string
          cta_enabled: boolean
          cta_text: string | null
          enabled: boolean
          featured: boolean
          id: string
          loop: boolean
          muted: boolean
          product_id: string | null
          sort_order: number
          subtitle: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          video_url: string
        }
        Insert: {
          autoplay?: boolean
          created_at?: string
          cta_enabled?: boolean
          cta_text?: string | null
          enabled?: boolean
          featured?: boolean
          id?: string
          loop?: boolean
          muted?: boolean
          product_id?: string | null
          sort_order?: number
          subtitle?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          video_url: string
        }
        Update: {
          autoplay?: boolean
          created_at?: string
          cta_enabled?: boolean
          cta_text?: string | null
          enabled?: boolean
          featured?: boolean
          id?: string
          loop?: boolean
          muted?: boolean
          product_id?: string | null
          sort_order?: number
          subtitle?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_testimonials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_testimonials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_hierarchy"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          enabled: boolean
          id: string
          phone_number: string
          radar_animation: boolean
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id: string
          phone_number?: string
          radar_animation?: boolean
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: string
          phone_number?: string
          radar_animation?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      why_choose_us_cards: {
        Row: {
          created_at: string
          description: string
          icon_name: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon_name?: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          icon_name?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      products_with_hierarchy: {
        Row: {
          base_price: number | null
          best_seller: boolean | null
          brand_id: string | null
          category_id: string | null
          category_level: number | null
          category_path: string | null
          child_category_id: string | null
          compare_price: number | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string | null
          is_new_arrival: boolean | null
          leaf_category_id: string | null
          main_category_id: string | null
          name: string | null
          price: number | null
          rating: number | null
          review_count: number | null
          sale_price: number | null
          shipping_text: string | null
          short_description: string | null
          show_offers: boolean | null
          show_shipping_info: boolean | null
          show_shipping_text: boolean | null
          show_stock_status: boolean | null
          sku: string | null
          slug: string | null
          sort_order: number | null
          status: Database["public"]["Enums"]["product_status"] | null
          stock: number | null
          stock_status_text: string | null
          sub_category_id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      decrement_product_stock: {
        Args: { _product_id: string; _quantity: number }
        Returns: undefined
      }
      get_public_tracking_pixels: {
        Args: never
        Returns: {
          pixel_id: string
          platform: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_usage: { Args: { _code: string }; Returns: undefined }
      is_admin_or_staff: { Args: { _user_id: string }; Returns: boolean }
      mark_admin_notifications_seen: {
        Args: { _type?: string }
        Returns: undefined
      }
      mark_incomplete_order_recovered: {
        Args: { _order_id: string; _phone: string; _session_id: string }
        Returns: undefined
      }
      prune_admin_notifications: { Args: never; Returns: number }
      subscribe_newsletter: { Args: { _email: string }; Returns: undefined }
      track_order: {
        Args: { _order_number: string }
        Returns: {
          created_at: string
          customer_city: string
          customer_name: string
          delivery_partner: string
          discount_amount: number
          items: Json
          order_number: string
          order_status: string
          payment_method: string
          payment_status: string
          shipping_cost: number
          subtotal: number
          total: number
          tracking_number: string
          updated_at: string
        }[]
      }
      track_orders_by_phone: {
        Args: { _phone: string }
        Returns: {
          created_at: string
          customer_city: string
          customer_name: string
          delivery_partner: string
          discount_amount: number
          items: Json
          order_number: string
          order_status: string
          payment_method: string
          payment_status: string
          shipping_cost: number
          subtotal: number
          total: number
          tracking_number: string
          updated_at: string
        }[]
      }
      upsert_checkout_customer: {
        Args: {
          _address?: string
          _city?: string
          _email?: string
          _name: string
          _order_total?: number
          _phone?: string
        }
        Returns: undefined
      }
      upsert_incomplete_order: {
        Args: {
          _address?: Json
          _cart_items?: Json
          _checkout_step?: string
          _coupon?: string
          _customer_name?: string
          _delivery_charge?: number
          _email?: string
          _payment_method?: string
          _phone: string
          _session_id: string
          _subtotal?: number
          _total?: number
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "user"
      category_type: "category" | "subcategory" | "child"
      media_type: "image" | "video" | "360"
      product_status: "draft" | "active" | "archived"
      tag_type: "feature" | "material" | "color" | "style" | "audience"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "user"],
      category_type: ["category", "subcategory", "child"],
      media_type: ["image", "video", "360"],
      product_status: ["draft", "active", "archived"],
      tag_type: ["feature", "material", "color", "style", "audience"],
    },
  },
} as const
