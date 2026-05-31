import { supabase } from "@/integrations/supabase/client";

export interface ActiveOffer {
  id: string;
  name: string;
  discount_type: string;
  discount_value: number;
  apply_to: string;
  target_ids: string[] | null;
  banner_image?: string | null;
}

let cachedOffers: ActiveOffer[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

export async function getActiveOffers(): Promise<ActiveOffer[]> {
  if (cachedOffers && Date.now() - cacheTime < CACHE_TTL) return cachedOffers;
  
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("offers")
    .select("id, name, discount_type, discount_value, apply_to, target_ids, banner_image")
    .eq("enabled", true)
    .or("start_date.is.null,start_date.lte." + now)
    .or("end_date.is.null,end_date.gt." + now);
  
  cachedOffers = (data as ActiveOffer[]) ?? [];
  cacheTime = Date.now();
  return cachedOffers;
}

export function applyOfferDiscount(
  price: number,
  productId: string,
  categoryId: string | null,
  brandId: string | null,
  offers: ActiveOffer[]
): { finalPrice: number; offerName: string | null; discountPercent: number } {
  let bestPrice = price;
  let offerName: string | null = null;

  for (const offer of offers) {
    let applies = false;
    
    if (offer.apply_to === "entire_store") {
      applies = true;
    } else if (offer.apply_to === "specific_products" && offer.target_ids?.includes(productId)) {
      applies = true;
    } else if (offer.apply_to === "specific_category" && categoryId && offer.target_ids?.includes(categoryId)) {
      applies = true;
    } else if (offer.apply_to === "specific_brand" && brandId && offer.target_ids?.includes(brandId)) {
      applies = true;
    }

    if (!applies) continue;

    const discounted = offer.discount_type === "percentage"
      ? price * (1 - offer.discount_value / 100)
      : price - offer.discount_value;

    const rounded = Math.max(0, Math.round(discounted));
    if (rounded < bestPrice) {
      bestPrice = rounded;
      offerName = offer.name;
    }
  }

  const discountPercent = bestPrice < price ? Math.round(((price - bestPrice) / price) * 100) : 0;
  return { finalPrice: bestPrice, offerName, discountPercent };
}
