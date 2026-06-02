import { apiClient } from "@/lib/api/client.js";
import type { Product } from "@/types/database";
import type { VariantRow } from "@/lib/variants";
import { fetchProductImages, attachImagesToProducts } from "@/lib/productMedia";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchProductData(slug: string) {
  // Try to fetch product by slug first, then by id
  let prod: any = null;
  try {
    const slugRes = await apiClient.get(`/products/slug/${slug}`);
    prod = slugRes;
  } catch (error) {
    // If slug fetch fails, try by id
    try {
      const idRes = await apiClient.get(`/products/${slug}`);
      prod = idRes;
    } catch (idError) {
      // If both fail, return null
      return null;
    }
  }

  if (!prod) return null;

  const isRealUUID = UUID_RE.test(prod.id);

  // Fetch category and related products from API
  const [catRes, relRes] = await Promise.all([
    prod.categoryId ? apiClient.get(`/categories/${prod.categoryId}`) : Promise.resolve(null),
    prod.categoryId && isRealUUID ? apiClient.get('/products', { query: { categoryId: prod.categoryId, limit: 4, excludeId: prod.id } }) : Promise.resolve({ data: [] }),
  ]);

  // Fetch product variants, delivery zones, shop settings, and why choose us cards from API
  const [variantsRes, zonesRes, shopRes, whyRes] = await Promise.all([
    isRealUUID ? apiClient.get(`/products/${prod.id}/variants`).catch(() => []) : Promise.resolve([]),
    apiClient.get('/delivery-zones').catch(() => []),
    apiClient.get('/shop-settings').catch(() => null),
    apiClient.get('/homepage/why-choose-us').catch(() => []),
  ]);

  // Keep product-specific data (tabs, FAQs, offers, reviews) as Supabase for now - backend doesn't have these endpoints yet
  const { supabase } = await import("@/integrations/supabase/client");
  const [tabsRes, faqsRes, offersRes, reviewsRes, brandRes] = await Promise.all([
    isRealUUID ? supabase.from("product_tabs").select("*").eq("product_id", prod.id).order("sort_order") : { data: [] },
    isRealUUID ? supabase.from("product_faqs").select("*").eq("product_id", prod.id).order("sort_order") : { data: [] },
    isRealUUID ? supabase.from("product_offers").select("*").eq("product_id", prod.id).eq("enabled", true).order("sort_order") : { data: [] },
    isRealUUID ? supabase.from("reviews").select("*").eq("product_id", prod.id).order("created_at", { ascending: false }) : { data: [] },
    prod.brandId ? supabase.from("brands").select("name").eq("id", prod.brandId).maybeSingle() : { data: null },
  ]);

  const relatedRaw = (relRes as any).data ?? [];
  const imageMap = await fetchProductImages([prod.id, ...relatedRaw.map((r: any) => r.id)]);
  const productWithImages: Product = { ...prod, images: imageMap[prod.id] ?? [] };
  const relatedWithImages = relatedRaw.map((r: any) => ({ ...r, images: imageMap[r.id] ?? [] })) as Product[];

  return {
    product: productWithImages,
    categoryName: (catRes as any)?.name ?? "",
    brandName: (brandRes.data as any)?.name ?? "",
    tabs: tabsRes.data ?? [],
    faqs: faqsRes.data ?? [],
    productOffers: offersRes.data ?? [],
    reviews: reviewsRes.data ?? [],
    related: relatedWithImages,
    deliveryZones: (zonesRes as any[]) ?? [],
    showShipmentDetails: ((shopRes as any)?.pdpShowShipmentDetails !== false),
    showWhyChooseUs: ((shopRes as any)?.pdpShowWhyChooseUs !== false),
    whyCards: (whyRes as any[]) ?? [],

    variantRows: ((variantsRes ?? []) as any[]).map((r) => ({
      id: r.id,
      product_id: r.productId,
      option_values: (r.optionValues || {}) as Record<string, string>,
      price: Number(r.price ?? 0),
      sale_price: r.salePrice != null ? Number(r.salePrice) : null,
      stock: Number(r.stock ?? 0),
      sku: r.sku ?? "",
      active: r.active !== false,
      sort_order: Number(r.sortOrder ?? 0),
    })) as VariantRow[],
  };
}

export type ProductPageData = NonNullable<Awaited<ReturnType<typeof fetchProductData>>>;
