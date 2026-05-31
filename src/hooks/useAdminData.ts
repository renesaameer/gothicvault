import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { attachImagesToProducts } from "@/lib/productMedia";

// ── Query Keys ──
export const adminKeys = {
  products: ["admin", "products"] as const,
  categories: ["admin", "categories"] as const,
  brands: ["admin", "brands"] as const,
  tags: ["admin", "tags"] as const,
  orders: ["admin", "orders"] as const,
  customers: ["admin", "customers"] as const,
  coupons: ["admin", "coupons"] as const,
  enabledCoupons: ["admin", "coupons", "enabled"] as const,
  deliveryPartners: ["admin", "delivery-partners", "enabled"] as const,
  steadfastBalance: ["admin", "steadfast-balance"] as const,
  dashboard: (filter: string) => ["admin", "dashboard", filter] as const,
};

const PRODUCT_LIST_COLS = "id,name,slug,price,sale_price,base_price,compare_price,status,is_new_arrival,stock,featured,best_seller,sort_order,category_id,brand_id,rating,review_count,show_offers,show_shipping_info,show_stock_status,sku,short_description,created_at";
const ORDER_LIST_COLS = "*";


// ── Products ──
export function useAdminProducts() {
  return useQuery({
    queryKey: adminKeys.products,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_LIST_COLS)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return await attachImagesToProducts((data ?? []) as any[]);
    },
    staleTime: 180_000,
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("product_tabs").delete().eq("product_id", id);
      await supabase.from("product_faqs").delete().eq("product_id", id);
      await supabase.from("products").delete().eq("id", id);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: adminKeys.products });
      const prev = qc.getQueryData(adminKeys.products);
      qc.setQueryData(adminKeys.products, (old: any[]) => old?.filter((p) => p.id !== id));
      return { prev };
    },
    onError: (_, __, ctx) => ctx?.prev && qc.setQueryData(adminKeys.products, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.products }),
  });
}

export function useToggleProductField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      await supabase.from("products").update({ [field]: value } as any).eq("id", id);
    },
    onMutate: async ({ id, field, value }) => {
      await qc.cancelQueries({ queryKey: adminKeys.products });
      const prev = qc.getQueryData(adminKeys.products);
      qc.setQueryData(adminKeys.products, (old: any[]) =>
        old?.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      );
      return { prev };
    },
    onError: (_, __, ctx) => ctx?.prev && qc.setQueryData(adminKeys.products, ctx.prev),
  });
}

// ── Categories ──
export function useAdminCategories() {
  return useQuery({
    queryKey: adminKeys.categories,
    queryFn: async () => {
      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("products").select("category_id"),
      ]);
      const counts: Record<string, number> = {};
      (prodRes.data ?? []).forEach((p: any) => {
        if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      });
      return { categories: catRes.data ?? [], productCounts: counts };
    },
    staleTime: 180_000,
  });
}

// ── Brands ──
export function useAdminBrands() {
  return useQuery({
    queryKey: adminKeys.brands,
    queryFn: async () => {
      const [brandRes, prodRes] = await Promise.all([
        supabase.from("brands").select("*").order("sort_order"),
        supabase.from("products").select("brand_id"),
      ]);
      const counts: Record<string, number> = {};
      (prodRes.data ?? []).forEach((p: any) => {
        if (p.brand_id) counts[p.brand_id] = (counts[p.brand_id] || 0) + 1;
      });
      return { brands: brandRes.data ?? [], productCounts: counts };
    },
    staleTime: 180_000,
  });
}

// ── Orders ──
export function useAdminOrders() {
  return useQuery({
    queryKey: adminKeys.orders,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(ORDER_LIST_COLS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];

    },
    staleTime: 60_000,
  });
}

// ── Customers ──
export function useAdminCustomers() {
  return useQuery({
    queryKey: adminKeys.customers,
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    staleTime: 180_000,
  });
}

// ── Coupons ──
export function useAdminCoupons() {
  return useQuery({
    queryKey: adminKeys.coupons,
    queryFn: async () => {
      const { data } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    staleTime: 180_000,
  });
}

// ── Dashboard Stats ──
export function useDashboardData() {
  return useQuery({
    queryKey: ["admin", "dashboard-raw"],
    queryFn: async () => {
      const [productsRes, ordersRes, customersRes] = await Promise.all([
        supabase.from("products").select("id, stock, name", { count: "exact" }),
        supabase.from("orders").select("id, total, created_at, order_number, customer_name, order_status, items"),
        supabase.from("customers").select("id", { count: "exact" }),
      ]);
      const productsWithImages = await attachImagesToProducts((productsRes.data ?? []) as any[]);
      return {
        products: productsWithImages,
        productCount: productsRes.count ?? 0,
        orders: ordersRes.data ?? [],
        customerCount: customersRes.count ?? 0,
      };
    },
    staleTime: 120_000,
  });
}

// ── Shared lookups (cached, no refetch on every detail open) ──
export function useEnabledCoupons() {
  return useQuery({
    queryKey: adminKeys.enabledCoupons,
    queryFn: async () => {
      const { data } = await supabase.from("coupons").select("*").eq("enabled", true);
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useEnabledDeliveryPartners() {
  return useQuery({
    queryKey: adminKeys.deliveryPartners,
    queryFn: async () => {
      const { data } = await supabase.from("delivery_partners").select("*").eq("enabled", true);
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useSteadfastBalance() {
  return useQuery({
    queryKey: adminKeys.steadfastBalance,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("steadfast-proxy", { body: { action: "get_balance" } });
      if (error) return { balance: null, error: error.message };
      const d = data as any;
      if (d?.error) return { balance: null, error: d.error as string };
      const bal = d?.current_balance ?? d?.balance ?? null;
      return { balance: bal != null ? Number(bal) : null, error: null as string | null };
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

