import { Link } from "react-router-dom";
import { MinusIcon, PlusIcon, XIcon, ShoppingBagIcon, ArrowLeftIcon, GiftIcon, SparklesIcon, PartyPopperIcon, TruckIcon } from "@/components/ui/icons";
import { useCartStore } from "@/data/cartStore";
import { CURRENCY_SYMBOL, toBanglaDigits } from "@/lib/currency";
import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getActiveOffers, type ActiveOffer } from "@/lib/offers";
import { getAllProductOffers, calculateAppliedOffers, getNearQualifyingOffers, type ProductOffer } from "@/lib/productOffers";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const SHIPPING_CACHE_KEY = "cart_shipping_cfg_v1";
const readShippingCache = (): { defaultShipping: number; freeThreshold: number } | null => {
  try {
    const raw = sessionStorage.getItem(SHIPPING_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const Cart = () => {
  useDocumentMeta({
    title: "Your Cart — AEROM",
    description: "Review the modest fashion pieces in your cart and continue to checkout. Cash on delivery across Bangladesh.",
    canonicalPath: "/cart",
  });
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const cached = readShippingCache();
  const [defaultShipping, setDefaultShipping] = useState<number>(cached?.defaultShipping ?? 0);
  const [freeThreshold, setFreeThreshold] = useState<number>(cached?.freeThreshold ?? 0);
  const [shippingLoaded, setShippingLoaded] = useState<boolean>(!!cached);
  const [activeOffers, setActiveOffers] = useState<ActiveOffer[]>([]);
  const [productOffers, setProductOffers] = useState<ProductOffer[]>([]);
  // Lazy-init from cart items — instant first paint, no exhaustive-deps suppression needed.
  const [productNames, setProductNames] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    items.forEach((i) => { m[i.productId ?? i.id] = i.name; });
    return m;
  });
  const [productPrices, setProductPrices] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    items.forEach((i) => { m[i.productId ?? i.id] = i.price; });
    return m;
  });
  const [productImages, setProductImages] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    items.forEach((i) => { if (i.image) m[i.productId ?? i.id] = i.image; });
    return m;
  });

  useEffect(() => {
    supabase.from("delivery_zones").select("*").eq("enabled", true).order("sort_order").limit(1).then(({ data }) => {
      const ds = data && data.length > 0 ? Number(data[0].delivery_charge) || 120 : 120;
      const ft = data && data.length > 0 ? Number(data[0].free_delivery_minimum) || 0 : 0;
      setDefaultShipping(ds);
      setFreeThreshold(ft);
      setShippingLoaded(true);
      try { sessionStorage.setItem(SHIPPING_CACHE_KEY, JSON.stringify({ defaultShipping: ds, freeThreshold: ft })); } catch {}
    });
    getActiveOffers().then(setActiveOffers);
    getAllProductOffers().then(setProductOffers);
  }, []);

  const productIdKey = useMemo(() => {
    const ids = new Set<string>();
    productOffers.forEach((o) => {
      ids.add(o.product_id);
      if (o.free_product_id) ids.add(o.free_product_id);
    });
    items.forEach((i) => ids.add(i.productId ?? i.id));
    return Array.from(ids).sort().join(",");
  }, [items, productOffers]);

  const prevIdKeyRef = useRef("");

  useEffect(() => {
    if (!productIdKey || productIdKey === prevIdKeyRef.current) return;
    prevIdKeyRef.current = productIdKey;
    const ids = productIdKey.split(",").filter(Boolean);

    Promise.all([
      supabase.from("products").select("id, name, price, sale_price").in("id", ids),
      supabase.from("product_media").select("product_id, image_url, sort_order").in("product_id", ids).is("variant_id", null).order("sort_order"),
    ]).then(([{ data }, { data: media }]) => {
      const nameMap: Record<string, string> = {};
      const priceMap: Record<string, number> = {};
      const imgMap: Record<string, string> = {};
      (media ?? []).forEach((m: any) => { if (!imgMap[m.product_id]) imgMap[m.product_id] = m.image_url; });
      (data ?? []).forEach((p: any) => {
        nameMap[p.id] = p.name;
        priceMap[p.id] = Number(p.sale_price ?? p.price ?? 0);
      });
      items.forEach((i) => {
        const productId = i.productId ?? i.id;
        nameMap[productId] = nameMap[productId] || i.name;
        if (!priceMap[productId]) priceMap[productId] = i.price;
        if (!imgMap[productId] && i.image) imgMap[productId] = i.image;
      });
      // Merge with previous (which already includes cart-seeded values) — single batched render.
      setProductNames((prev) => ({ ...prev, ...nameMap }));
      setProductPrices((prev) => ({ ...prev, ...priceMap }));
      setProductImages((prev) => ({ ...prev, ...imgMap }));
    });
  }, [productIdKey]);

  if (items.length === 0) {
    return (
      <div className="section-padding section-spacing text-center">
        <div className="fade-up">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <ShoppingBagIcon className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Your cart is empty</h1>
          <p className="text-sm text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
          <Link to="/shop" className="inline-flex items-center justify-center bg-primary text-primary-foreground px-7 py-3 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-[0_4px_16px_-6px_hsl(var(--primary)/0.35)]">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = totalPrice();
  const appliedOffers = calculateAppliedOffers(items, productOffers, productNames, productPrices);
  const totalOfferDiscount = appliedOffers.reduce((s, o) => s + o.discountAmount, 0);
  const hasFreeShippingOffer = appliedOffers.some((o) => o.offerType === "free_shipping" || o.offerType === "buy_x_get_y_free_delivery");
  const shippingCost = hasFreeShippingOffer ? 0 : (freeThreshold > 0 && subtotal >= freeThreshold ? 0 : defaultShipping);
  const total = Math.max(0, subtotal - totalOfferDiscount + shippingCost);
  const freeShippingProgress = freeThreshold > 0 && subtotal < freeThreshold && !hasFreeShippingOffer ? Math.round((subtotal / freeThreshold) * 100) : 100;

  const quantityByProduct = items.reduce<Record<string, number>>((acc, item) => {
    const productId = item.productId ?? item.id;
    acc[productId] = (acc[productId] ?? 0) + item.quantity;
    return acc;
  }, {});

  const nearQualifyingOffers = getNearQualifyingOffers(quantityByProduct, productOffers);

  return (
    <div className="section-padding section-spacing page-enter">
      <div className="fade-up">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeftIcon size={16} /> Continue Shopping
        </Link>

        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Shopping Cart</h1>
        <div className="premium-divider max-w-[40px] mb-6" />

        {activeOffers.length > 0 && (
          <div className="mb-3 glass-card rounded-xl px-3 py-2.5 trust-badge">
            <div className="flex items-center gap-1.5 mb-1.5">
              <SparklesIcon size={11} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Active offers</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeOffers.map((offer) => (
                <span key={offer.id} className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  <GiftIcon size={9} />
                  {offer.name}: {toBanglaDigits(offer.discount_value)}{offer.discount_type === "percentage" ? "%" : ` ${CURRENCY_SYMBOL}`} off
                </span>
              ))}
            </div>
          </div>
        )}

        {nearQualifyingOffers.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {nearQualifyingOffers.map(({ offer, needed }) => {
              const progress = Math.round(((offer.buy_quantity! - needed) / offer.buy_quantity!) * 100);
              return (
                <div key={offer.id} className="bg-gradient-to-r from-[hsl(var(--nudge-bg))] to-[hsl(var(--nudge-bg)/0.4)] border border-[hsl(var(--nudge-border))] rounded-xl px-3 py-2 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[hsl(var(--nudge-accent))] flex items-center justify-center flex-shrink-0">
                    <PartyPopperIcon size={11} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[hsl(var(--nudge-text))]">
                      <span className="font-bold">Almost there!</span> Add <span className="font-bold text-[hsl(var(--nudge-accent))]">{toBanglaDigits(needed)}more</span> {productNames[offer.product_id] || "items"} → <span className="font-semibold">{offer.display_text}</span>
                    </p>
                    <div className="mt-1.5 h-1.5 bg-[hsl(var(--nudge-border)/0.5)] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[hsl(var(--nudge-accent))] to-[hsl(var(--nudge-accent)/0.7)] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {appliedOffers.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {appliedOffers.map((ao) => (
              <div key={`${ao.offerId}-${ao.offerType}`} className="bg-gradient-to-r from-[hsl(var(--gift-bg))] to-[hsl(var(--gift-bg)/0.4)] border border-[hsl(var(--gift-border))] rounded-xl px-3 py-2 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[hsl(var(--gift-accent))] flex items-center justify-center flex-shrink-0">
                  <GiftIcon size={11} className="text-white" />
                </div>
                <div className="text-[11px] text-[hsl(var(--gift-text))] leading-snug">
                  <span className="font-bold">🎉 Offer applied!</span> {ao.displayText}
                  {ao.freeItems.length > 0 && (
                    <span className="text-[hsl(var(--gift-accent))] font-semibold"> · 🎁 Free: {ao.freeItems.map((f) => `${toBanglaDigits(f.quantity)}× ${f.productName}`).join(", ")}</span>
                  )}
                  {ao.discountAmount > 0 && (
                    <span className="text-[hsl(var(--gift-accent))] font-bold"> · Save {CURRENCY_SYMBOL}{toBanglaDigits(ao.discountAmount.toFixed(0))}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 glass-card rounded-xl hover:-translate-y-0.5 transition-transform duration-200">
                <img src={item.image} alt={item.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0 border border-border/30" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-[13px] sm:text-sm font-medium text-foreground line-clamp-2">{item.name}</h3>
                      {item.variant && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.variant}</p>}
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                      <XIcon size={15} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1 tabular-nums">{CURRENCY_SYMBOL}{toBanglaDigits(item.price)}</p>
                  <div className="flex items-center gap-0 mt-2 border border-border/60 rounded-full w-fit">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 hover:bg-secondary/50 rounded-l-full transition-colors"><MinusIcon size={13} /></button>
                    <span className="w-7 text-center text-sm tabular-nums">{toBanglaDigits(item.quantity)}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:bg-secondary/50 rounded-r-full transition-colors"><PlusIcon size={13} /></button>
                  </div>
                </div>
              </div>
            ))}

            {appliedOffers.filter((ao) => ao.freeItems.length > 0).flatMap((ao) =>
              ao.freeItems.map((freeItem) => (
                <div key={`free-${ao.offerId}-${freeItem.productId}`} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-[hsl(var(--gift-bg))] to-[hsl(var(--gift-bg)/0.3)] rounded-xl border border-[hsl(var(--gift-border))] relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[hsl(var(--gift-accent))] text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                    <GiftIcon size={9} /> Free Gift
                  </div>
                  <img src={productImages[freeItem.productId] || "/placeholder.svg"} alt={freeItem.productName} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0 opacity-90" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] sm:text-sm font-medium text-foreground">{freeItem.productName}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">🎁 {ao.displayText}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-sm text-muted-foreground line-through tabular-nums">{CURRENCY_SYMBOL}{toBanglaDigits((productPrices[freeItem.productId] ?? 0) * freeItem.quantity)}</span>
                      <span className="text-sm font-bold text-foreground tabular-nums">{CURRENCY_SYMBOL}0</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Qty: {toBanglaDigits(freeItem.quantity)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="glass-card rounded-2xl p-4 sm:p-5 h-fit">
            <h2 className="text-sm font-semibold text-foreground mb-1">Order Summary</h2>
            <div className="premium-divider mb-5" />

            {shippingLoaded && !hasFreeShippingOffer && freeThreshold > 0 && subtotal < freeThreshold && (
              <div className="mb-4 bg-gradient-to-r from-[hsl(var(--shipping-bg))] to-[hsl(var(--shipping-bg)/0.4)] border border-[hsl(var(--shipping-border))] rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <TruckIcon size={12} className="text-[hsl(var(--shipping-accent))]" />
                    <span className="text-[11px] font-semibold text-[hsl(var(--shipping-text))]">Free Delivery</span>
                  </div>
                  <span className="text-[10px] font-bold text-[hsl(var(--shipping-accent))] tabular-nums">{toBanglaDigits(freeShippingProgress)}%</span>
                </div>
                <div className="h-1.5 bg-[hsl(var(--shipping-border)/0.4)] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[hsl(var(--shipping-accent))] to-[hsl(210,80%,60%)] rounded-full transition-all duration-500" style={{ width: `${freeShippingProgress}%` }} />
                </div>
                <p className="text-[10px] text-[hsl(var(--shipping-text))] mt-1.5">
                  Add <span className="font-bold text-[hsl(var(--shipping-accent))]">{CURRENCY_SYMBOL}{toBanglaDigits((freeThreshold - subtotal).toFixed(0))}</span> more for <span className="font-bold">Free Delivery!</span>
                </p>
              </div>
            )}
            {shippingLoaded && (hasFreeShippingOffer || (freeThreshold > 0 && subtotal >= freeThreshold)) && (
              <div className="mb-4 bg-gradient-to-r from-[hsl(var(--shipping-bg))] to-[hsl(var(--shipping-bg)/0.4)] border border-[hsl(var(--shipping-border))] rounded-xl px-3 py-2 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[hsl(var(--shipping-accent))] flex items-center justify-center">
                  <TruckIcon size={10} className="text-white" />
                </div>
                <span className="text-[11px] font-semibold text-[hsl(var(--shipping-text))]">🎉 Free delivery unlocked!</span>
              </div>
            )}
            {!shippingLoaded && (
              <div className="mb-4 h-[58px] rounded-xl bg-muted/40 animate-pulse" />
            )}

            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground font-medium tabular-nums">{CURRENCY_SYMBOL}{toBanglaDigits(subtotal.toFixed(0))}</span>
              </div>
              {totalOfferDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Offer discount</span>
                  <span className="text-primary font-medium tabular-nums">-{CURRENCY_SYMBOL}{toBanglaDigits(totalOfferDiscount.toFixed(0))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                {!shippingLoaded ? (
                  <span className="inline-block h-3 w-12 rounded bg-muted/60 animate-pulse" />
                ) : shippingCost === 0 ? (
                  <span className="inline-flex items-center gap-1 text-[hsl(var(--shipping-accent))] font-semibold text-xs">
                    <TruckIcon size={11} /> Free
                  </span>
                ) : (
                  <span className="text-foreground font-medium tabular-nums">{CURRENCY_SYMBOL}{toBanglaDigits(shippingCost)}</span>
                )}
              </div>
              <div className="border-t border-border/40 pt-2.5 flex justify-between">
                <span className="text-sm font-semibold text-foreground">Total</span>
                {!shippingLoaded ? (
                  <span className="inline-block h-4 w-16 rounded bg-muted/60 animate-pulse" />
                ) : (
                  <span className="text-base font-semibold text-foreground tabular-nums">{CURRENCY_SYMBOL}{toBanglaDigits(total.toFixed(0))}</span>
                )}
              </div>
            </div>
            <Link
              to="/checkout"
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all duration-200 block text-center shadow-[0_4px_16px_-6px_hsl(var(--primary)/0.35)]"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;