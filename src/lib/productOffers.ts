import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/data/cartStore";

export interface ProductOffer {
  id: string;
  product_id: string;
  offer_type: string; // supports legacy + canonical values
  buy_quantity: number | null;
  get_quantity: number | null;
  discount_value: number | null;
  free_product_id: string | null;
  display_text: string;
  enabled: boolean;
  min_cart_total: number | null;
  sort_order: number;
}

export interface AppliedProductOffer {
  offerId: string;
  offerType: string;
  displayText: string;
  freeItems: { productId: string; productName: string; quantity: number }[];
  discountAmount: number;
}

let cachedProductOffers: ProductOffer[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000;

export async function getAllProductOffers(): Promise<ProductOffer[]> {
  if (cachedProductOffers && Date.now() - cacheTime < CACHE_TTL) return cachedProductOffers;
  const { data } = await supabase
    .from("product_offers")
    .select("*")
    .eq("enabled", true)
    .order("sort_order");
  cachedProductOffers = (data as ProductOffer[]) ?? [];
  cacheTime = Date.now();
  return cachedProductOffers;
}

export function invalidateProductOffersCache() {
  cachedProductOffers = null;
}

const normalizeOfferType = (type: string) => {
  switch (type) {
    case "buy_x_get_y_same":
    case "buy_x_get_y_diff":
      return "buy_x_get_y";
    case "buy_x_get_off":
      return "buy_x_get_discount";
    case "free_delivery":
      return "free_shipping";
    default:
      return type;
  }
};

const getCartProductId = (item: CartItem) => item.productId ?? item.id;

/**
 * Calculate which product offers apply to the current cart items
 */
export function calculateAppliedOffers(
  items: CartItem[],
  offers: ProductOffer[],
  productNames: Record<string, string>,
  productPrices: Record<string, number> = {}
): AppliedProductOffer[] {
  const applied: AppliedProductOffer[] = [];

  const quantityByProduct = new Map<string, number>();
  const lineTotalByProduct = new Map<string, number>();
  const unitPriceByProduct = new Map<string, number>();

  items.forEach((item) => {
    const productId = getCartProductId(item);
    quantityByProduct.set(productId, (quantityByProduct.get(productId) ?? 0) + item.quantity);
    lineTotalByProduct.set(productId, (lineTotalByProduct.get(productId) ?? 0) + item.price * item.quantity);
    if (!unitPriceByProduct.has(productId)) unitPriceByProduct.set(productId, item.price);
  });

  const cartTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  for (const offer of offers) {
    const normalizedType = normalizeOfferType(offer.offer_type);
    const cartQty = quantityByProduct.get(offer.product_id) ?? 0;

    switch (normalizedType) {
      case "buy_x_get_y":
      case "buy_x_get_y_free_delivery": {
        if (offer.buy_quantity && offer.get_quantity && cartQty >= offer.buy_quantity) {
          const freeProductId =
            offer.offer_type === "buy_x_get_y_same" || offer.offer_type === "buy_x_get_y_free_delivery"
              ? offer.product_id
              : offer.free_product_id || offer.product_id;
          const freeProductName = productNames[freeProductId] || productNames[offer.product_id] || "Free Item";
          const setsQualified = Math.floor(cartQty / offer.buy_quantity);
          const freeQty = setsQualified * offer.get_quantity;
          const freeItemUnitPrice =
            productPrices[freeProductId] ??
            unitPriceByProduct.get(freeProductId) ??
            unitPriceByProduct.get(offer.product_id) ??
            0;

          // For same-product BXGY the free item is additional — no price discount on existing items.
          // For different-product BXGY the free item value IS the discount (customer gets a different product free).
          const isSameProduct = freeProductId === offer.product_id;
          applied.push({
            offerId: offer.id,
            offerType: normalizedType,
            displayText: offer.display_text || `Buy ${offer.buy_quantity} Get ${offer.get_quantity} Free`,
            freeItems: [{ productId: freeProductId, productName: freeProductName, quantity: freeQty }],
            discountAmount: isSameProduct ? 0 : freeQty * freeItemUnitPrice,
          });
        }
        break;
      }
      case "buy_x_get_discount": {
        if (offer.buy_quantity && offer.discount_value && cartQty >= offer.buy_quantity) {
          const setsQualified = Math.floor(cartQty / offer.buy_quantity);
          const discountPerSet = offer.discount_value;
          applied.push({
            offerId: offer.id,
            offerType: normalizedType,
            displayText: offer.display_text || `Buy ${offer.buy_quantity} and save ৳${offer.discount_value}`,
            freeItems: [],
            discountAmount: setsQualified * discountPerSet,
          });
        }
        break;
      }
      case "flat_percent": {
        if (!offer.discount_value || cartQty <= 0) break;
        if (offer.buy_quantity && cartQty < offer.buy_quantity) break;
        const lineTotal = lineTotalByProduct.get(offer.product_id) ?? 0;
        if (lineTotal <= 0) break;
        applied.push({
          offerId: offer.id,
          offerType: normalizedType,
          displayText:
            offer.display_text ||
            `${offer.discount_value}% off${offer.buy_quantity ? ` when you buy ${offer.buy_quantity}+` : ""}`,
          freeItems: [],
          discountAmount: Math.round((lineTotal * offer.discount_value) / 100),
        });
        break;
      }
      case "min_cart_discount": {
        if (offer.min_cart_total && offer.discount_value && cartTotal >= offer.min_cart_total) {
          applied.push({
            offerId: offer.id,
            offerType: normalizedType,
            displayText: offer.display_text || `Spend ৳${offer.min_cart_total}+ and save ৳${offer.discount_value}`,
            freeItems: [],
            discountAmount: offer.discount_value,
          });
        }
        break;
      }
      case "free_shipping": {
        if (!offer.min_cart_total || cartTotal >= offer.min_cart_total) {
          applied.push({
            offerId: offer.id,
            offerType: normalizedType,
            displayText: offer.display_text || (offer.min_cart_total ? "Free shipping unlocked!" : "Free shipping included!"),
            freeItems: [],
            discountAmount: 0,
          });
        }
        break;
      }
    }
  }

  return applied;
}

/**
 * Get product offers for a single product (for product detail page)
 */
export function getOffersForProduct(productId: string, offers: ProductOffer[]): ProductOffer[] {
  return offers.filter((o) => o.product_id === productId);
}

/** Raw DB offer types that use buy_quantity for qualification */
export const BUY_QTY_OFFER_TYPES = new Set([
  "buy_x_get_y_same",
  "buy_x_get_y_diff",
  "buy_x_get_off",
  "buy_x_get_y_free_delivery",
  "flat_percent",
]);

/**
 * Get offers where the user is close to qualifying (has some qty but not enough)
 */
export function getNearQualifyingOffers(
  quantityByProduct: Record<string, number>,
  offers: ProductOffer[]
): { offer: ProductOffer; needed: number }[] {
  const result: { offer: ProductOffer; needed: number }[] = [];
  for (const o of offers) {
    if (!BUY_QTY_OFFER_TYPES.has(o.offer_type) || !o.buy_quantity) continue;
    const qty = quantityByProduct[o.product_id] ?? 0;
    if (qty > 0 && qty < o.buy_quantity) {
      result.push({ offer: o, needed: o.buy_quantity - qty });
    }
  }
  return result;
}

/**
 * Simulate offers for a single product at a given quantity (for product detail page gamification)
 */
export function simulateOffersForProduct(
  productId: string,
  quantity: number,
  price: number,
  offers: ProductOffer[],
  productNames: Record<string, string>,
  productPrices: Record<string, number>
): { applied: AppliedProductOffer[]; nearQualifying: { offer: ProductOffer; needed: number }[] } {
  const syntheticItems: CartItem[] = [{ id: productId, productId, name: productNames[productId] || "", price, image: "", quantity }];
  const applied = calculateAppliedOffers(syntheticItems, offers.filter(o => o.product_id === productId), productNames, productPrices);
  const qtyMap: Record<string, number> = { [productId]: quantity };
  const nearQualifying = getNearQualifyingOffers(qtyMap, offers.filter(o => o.product_id === productId));
  return { applied, nearQualifying };
}

