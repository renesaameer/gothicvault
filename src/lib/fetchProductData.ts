import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/database";
import type { VariantRow } from "@/lib/variants";
import { fetchProductImages, attachImagesToProducts } from "@/lib/productMedia";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchProductData(slug: string) {
  let { data: prod } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (!prod) {
    const res = await supabase.from("products").select("*").eq("id", slug).maybeSingle();
    prod = res.data;
  }

  if (!prod) return null;

  const isRealUUID = UUID_RE.test(prod.id);

  const [tabsRes, faqsRes, offersRes, reviewsRes, catRes, brandRes, relRes, variantsRes, zonesRes, shopRes, whyRes] = await Promise.all([
    isRealUUID ? supabase.from("product_tabs").select("*").eq("product_id", prod.id).order("sort_order") : { data: [] },
    isRealUUID ? supabase.from("product_faqs").select("*").eq("product_id", prod.id).order("sort_order") : { data: [] },
    isRealUUID ? supabase.from("product_offers").select("*").eq("product_id", prod.id).eq("enabled", true).order("sort_order") : { data: [] },
    isRealUUID ? supabase.from("reviews").select("*").eq("product_id", prod.id).order("created_at", { ascending: false }) : { data: [] },
    prod.category_id ? supabase.from("categories").select("name").eq("id", prod.category_id).maybeSingle() : { data: null },
    prod.brand_id ? supabase.from("brands").select("name").eq("id", prod.brand_id).maybeSingle() : { data: null },
    prod.category_id && isRealUUID ? supabase.from("products").select("*").eq("category_id", prod.category_id).neq("id", prod.id).limit(4) : { data: [] },
    isRealUUID ? supabase.from("product_variants").select("*").eq("product_id", prod.id).eq("active", true).order("sort_order") : { data: [] },
    supabase.from("delivery_zones").select("*").eq("enabled", true).order("sort_order"),
    supabase.from("shop_settings").select("pdp_show_shipment_details, pdp_show_why_choose_us").eq("id", "default").maybeSingle(),
    supabase.from("why_choose_us_cards").select("*").order("sort_order"),
  ]);

  const relatedRaw = (relRes.data as any[]) ?? [];
  const imageMap = await fetchProductImages([prod.id, ...relatedRaw.map((r) => r.id)]);
  const productWithImages: Product = { ...(prod as any), images: imageMap[prod.id] ?? [] };
  const relatedWithImages = relatedRaw.map((r) => ({ ...r, images: imageMap[r.id] ?? [] })) as Product[];

  return {
    product: productWithImages,
    categoryName: (catRes.data as any)?.name ?? "",
    brandName: (brandRes.data as any)?.name ?? "",
    tabs: tabsRes.data ?? [],
    faqs: faqsRes.data ?? [],
    productOffers: offersRes.data ?? [],
    reviews: reviewsRes.data ?? [],
    related: relatedWithImages,
    deliveryZones: (zonesRes.data as any[]) ?? [],
    showShipmentDetails: ((shopRes.data as any)?.pdp_show_shipment_details !== false),
    showWhyChooseUs: ((shopRes.data as any)?.pdp_show_why_choose_us !== false),
    whyCards: (whyRes.data as any[]) ?? [],

    variantRows: ((variantsRes.data ?? []) as any[]).map((r) => ({
      id: r.id,
      product_id: r.product_id,
      option_values: (r.option_values || {}) as Record<string, string>,
      price: Number(r.price ?? 0),
      sale_price: r.sale_price != null ? Number(r.sale_price) : null,
      stock: Number(r.stock ?? 0),
      sku: r.sku ?? "",
      active: r.active !== false,
      sort_order: Number(r.sort_order ?? 0),
    })) as VariantRow[],
  };
}

export type ProductPageData = NonNullable<Awaited<ReturnType<typeof fetchProductData>>>;
