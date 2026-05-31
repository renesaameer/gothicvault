import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches images from product_media for the given product IDs and returns
 * a map { productId: string[] } sorted by sort_order.
 * Used to bolt media onto product rows since `products.images` was removed.
 */
export async function fetchProductImages(
  productIds: string[],
): Promise<Record<string, string[]>> {
  if (productIds.length === 0) return {};
  const { data } = await supabase
    .from("product_media")
    .select("product_id, image_url, sort_order, variant_id")
    .in("product_id", productIds)
    .is("variant_id", null)
    .order("sort_order");
  const map: Record<string, string[]> = {};
  ((data as any[]) ?? []).forEach((r) => {
    (map[r.product_id] ||= []).push(r.image_url);
  });
  return map;
}

/** Mutates product rows in place to add `images: string[]`. */
export async function attachImagesToProducts<T extends { id: string }>(
  products: T[],
): Promise<(T & { images: string[] })[]> {
  const map = await fetchProductImages(products.map((p) => p.id));
  return products.map((p) => ({ ...p, images: map[p.id] ?? [] }));
}
