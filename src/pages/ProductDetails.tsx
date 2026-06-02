import { useState, useEffect, useRef } from "react";
import { ScrollScene } from "@/components/ui/scroll-scene";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { trackViewContent, trackAddToCart } from "@/lib/trackingEvents";
import { MinusIcon, PlusIcon, ShoppingBagIcon, ArrowLeftIcon, CheckIcon, TruckIcon, TagIcon, GiftIcon, PartyPopperIcon, ChevronDownIcon } from "@/components/ui/icons";
import { useCartStore } from "@/data/cartStore";
import { CURRENCY_SYMBOL, toBanglaDigits } from "@/lib/currency";
import { simulateOffersForProduct, type ProductOffer } from "@/lib/productOffers";
import ProductCard from "@/components/ProductCard";
import StarRating from "@/components/ui/StarRating";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Product } from "@/types/database";
import {
  getProductPriceRange,
  parseOptionGroups,
  getVariantRowsPriceRange,
  resolveVariantRow,
  effectiveRowPrice,
  type VariantRow,
} from "@/lib/variants";

import { ProductDetailsSkeleton } from "@/components/ui/page-skeletons";
import { useLayoutData } from "@/components/layout/LayoutDataProvider";
import DynamicIcon from "@/components/ui/DynamicIcon";

import { fetchProductData } from "@/lib/fetchProductData";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  
  const [addedFeedback, setAddedFeedback] = useState(false);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const { directOrderChannels } = useLayoutData();

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductData(id!),
    enabled: !!id,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const productImages = data?.product?.images;
  // Preload all product images so variant image-swap is instant.
  useEffect(() => {
    if (!productImages?.length) return;
    productImages.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }, [productImages]);

  // Track ViewContent only when the user actually lands on this product.
  const product = data?.product;
  const categoryNameForTrack = data?.categoryName;
  useDocumentMeta({
    title: product?.name ? `${product.name} — AEROM` : "Product — AEROM",
    description: product
      ? (product.short_description || product.description || `${product.name} — modest fashion from AEROM Bangladesh.`).replace(/<[^>]+>/g, "").slice(0, 160)
      : "Discover modest fashion essentials at AEROM",
    canonicalPath: id ? `/product/${id}` : "/shop",
  });
  useEffect(() => {
    if (!product) return;
    trackViewContent({
      id: product.id,
      name: product.name,
      price: (product as any).sale_price || product.price,
      category: categoryNameForTrack || undefined,
    });
  }, [product?.id, categoryNameForTrack]);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [data?.product?.id]);

  if (isLoading && !data) {
    return <ProductDetailsSkeleton />;
  }
  if (!data) {
    return <ProductDetailsSkeleton />;
  }

  const { categoryName, brandName, tabs, faqs, productOffers, reviews, related, variantRows, deliveryZones, showShipmentDetails, showWhyChooseUs, whyCards } = data;

  if (!product) {
    return (
      <div className="section-padding section-spacing text-center">
        <p className="apple-body">Product not found.</p>
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-primary mt-4"><ArrowLeftIcon size={16} /> Back to shop</Link>
      </div>
    );
  }

  // ── Modern variant system (product_variants rows) with legacy fallback ──
  const optionGroups = parseOptionGroups((product as any).option_groups);
  const useModernVariants = optionGroups.length > 0 && variantRows.length > 0;

  // Legacy parsed variants (only used if no option_groups defined)
  const legacyVariants = useModernVariants
    ? []
    : ((product.variants as any[]) ?? []).map((v: any) => {
        const options = (v.options || []).map((o: any) =>
          typeof o === "string" ? { value: o, price: null, image_index: null } : o
        );
        return { type: v.type, same_price: v.same_price !== false, options };
      });

  const variantTypes = useModernVariants ? optionGroups.map((g) => g.name) : legacyVariants.map((v) => v.type);
  const hasUnselectedVariants = variantTypes.some((t) => !selectedVariants[t]);

  const selectedVariantSummary = variantTypes
    .map((t) => (selectedVariants[t] ? `${t}: ${selectedVariants[t]}` : null))
    .filter(Boolean)
    .join(" • ");

  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const basePrice = hasDiscount ? product.sale_price! : product.price;

  // Resolve effective price + stock from selected variant row (modern) or legacy options
  let resolvedRow: VariantRow | null = null;
  let variantPrice: number | null = null;
  let variantStock: number | null = null;
  if (useModernVariants && !hasUnselectedVariants) {
    resolvedRow = resolveVariantRow(variantRows, selectedVariants);
    if (resolvedRow) {
      variantPrice = effectiveRowPrice(resolvedRow);
      variantStock = resolvedRow.stock;
    }
  } else if (!useModernVariants) {
    for (const v of legacyVariants) {
      const selected = selectedVariants[v.type];
      if (!selected || v.same_price) continue;
      const opt = v.options.find((o: any) => o.value === selected);
      if (opt?.price != null) { variantPrice = opt.price; break; }
    }
  }

  // When a variant row resolves, the comparison "original" price is that
  // row's `price` (not the product-level price). Sale = row.sale_price.
  const variantOriginalPrice = resolvedRow ? resolvedRow.price : product.price;
  const variantHasSale = resolvedRow != null && resolvedRow.sale_price != null && resolvedRow.sale_price > 0 && resolvedRow.sale_price < resolvedRow.price;
  const currentPrice = variantPrice ?? basePrice;
  const compareAtPrice = resolvedRow ? variantOriginalPrice : product.price;
  const showCompareAt = resolvedRow ? variantHasSale : (product.sale_price != null && product.sale_price < product.price);
  const discountPercent = compareAtPrice > currentPrice ? Math.round(((compareAtPrice - currentPrice) / compareAtPrice) * 100) : 0;

  // Filtered range: respects partial selection — only rows matching all currently
  // selected option values contribute to the displayed min/max.
  const priceRange = useModernVariants
    ? (() => {
        const filtered = variantRows.filter((r) => {
          if (r.active === false) return false;
          for (const [k, v] of Object.entries(selectedVariants)) {
            if (v && r.option_values?.[k] !== v) return false;
          }
          return true;
        });
        return getVariantRowsPriceRange(basePrice, filtered);
      })()
    : getProductPriceRange(basePrice, product.variants);
  // Show a range whenever there's no resolved single variant price AND multiple
  // candidate prices remain (no selection OR partial selection).
  const showRange = priceRange.hasRange && variantPrice == null;
  const galleryImages = (product.images ?? []).filter((src: string) => typeof src === "string" && src.trim().length > 0);
  const hasGalleryImages = galleryImages.length > 1;
  const mainImage = galleryImages[selectedImage] || galleryImages[0] || "/placeholder.svg";
  const allTabs = tabs.map((t: any) => ({ label: t.title, content: t.content, display_style: t.display_style || "text" }));
  const effectiveStock = variantStock ?? product.stock ?? 0;
  const isOutOfStock = effectiveStock <= 0;
  const maxQuantity = effectiveStock > 0 ? effectiveStock : 1;

  const avgRating = reviews.length > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : product.rating;

  const showShippingText = (product as any).show_shipping_info !== false;
  const showStockStatus = (product as any).show_stock_status !== false;
  const showOffers = (product as any).show_offers !== false;
  const shippingText = `${CURRENCY_SYMBOL}${toBanglaDigits(2000)} + orders ship free`;
  const stockStatusText = "In stock — ready to ship";

  const buildCartLineId = () => {
    if (!selectedVariantSummary) return product.id;
    return `${product.id}::${selectedVariantSummary}`;
  };

  const handleAddToCart = () => {
    if (isOutOfStock || hasUnselectedVariants) return;
    addItem(
      {
        id: buildCartLineId(),
        productId: product.id,
        name: product.name,
        price: currentPrice,
        image: product.images?.[0] || "/placeholder.svg",
        variant: selectedVariantSummary || undefined,
      },
      quantity
    );
    trackAddToCart({ id: product.id, name: product.name, price: currentPrice, quantity, variant: selectedVariantSummary || undefined });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock || hasUnselectedVariants) return;
    useCartStore.getState().clearCart();
    addItem(
      {
        id: buildCartLineId(),
        productId: product.id,
        name: product.name,
        price: currentPrice,
        image: product.images?.[0] || "/placeholder.svg",
        variant: selectedVariantSummary || undefined,
      },
      quantity
    );
    navigate("/checkout");
  };

  return (
    <div className="page-enter">
      {/* Back link */}
      <div className="section-padding pt-4 pb-3 sm:pt-6 sm:pb-4 lg:pt-4 lg:pb-2">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeftIcon size={16} /> Back to shop
        </Link>
      </div>

      <div className="fade-up">
        {/* Main product grid */}
        <div className="section-padding pb-10 sm:pb-14">
        <div className="grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] gap-6 sm:gap-10 lg:gap-8 xl:gap-12 max-w-[1200px] mx-auto items-start">
            {/* Images */}
            <div className="space-y-5 lg:sticky lg:top-20 lg:self-start lg:max-w-[580px] mx-auto w-full">
              <div className="relative group">
                <div
                  key={selectedImage}
                  className="aspect-[4/5] lg:h-[min(57vh,490px)] mx-auto rounded-2xl lg:rounded-[22px] overflow-hidden bg-secondary/20 animate-fade-in"
                >
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover object-center lg:object-contain transition-transform duration-500 ease-out group-hover:scale-[1.015]"
                    loading="eager"
                    decoding="async"
                    width={600}
                    height={750}
                    {...({ fetchpriority: "high" } as any)}
                  />
                </div>

                {hasGalleryImages && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={() => setSelectedImage((selectedImage - 1 + galleryImages.length) % galleryImages.length)}
                      className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-background/60 hover:bg-background/90 backdrop-blur-md border border-white/30 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] flex items-center justify-center text-foreground/80 hover:text-primary opacity-0 group-hover:opacity-100 hover:scale-105 transition-all duration-300 ease-out"
                    >
                      <ChevronDownIcon size={15} className="rotate-90" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      onClick={() => setSelectedImage((selectedImage + 1) % galleryImages.length)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-background/60 hover:bg-background/90 backdrop-blur-md border border-white/30 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] flex items-center justify-center text-foreground/80 hover:text-primary opacity-0 group-hover:opacity-100 hover:scale-105 transition-all duration-300 ease-out"
                    >
                      <ChevronDownIcon size={15} className="-rotate-90" />
                    </button>
                  </>
                )}
              </div>

              {hasGalleryImages && (
                <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImage(i)}
                      aria-label={`View image ${i + 1}`}
                      aria-current={i === selectedImage}
                      className={`group/thumb w-[56px] h-[68px] sm:w-[60px] sm:h-[72px] rounded-[10px] overflow-hidden border transition-all duration-300 ease-out bg-background ${
                        i === selectedImage
                          ? "border-primary/70 shadow-[0_0_0_3px_hsl(var(--primary)/0.10),0_4px_14px_-6px_hsl(var(--primary)/0.35)]"
                          : "border-border/30 hover:border-primary/40 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover/thumb:scale-[1.06]"
                        loading="lazy"
                        decoding="async"
                        width={80}
                        height={100}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="space-y-6 lg:space-y-3.5 lg:py-0 lg:max-w-[580px]">
              {categoryName && <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground block">{categoryName}</span>}
              <h1 className="text-2xl sm:text-3xl lg:text-[27px] xl:text-[31px] font-semibold tracking-[-0.028em] text-foreground leading-[1.12]">{product.name}</h1>

              {reviews.length > 0 && product.review_count > 0 && (
                <div className="flex items-center gap-3">
                  <StarRating rating={product.rating} />
                  <span className="text-xs sm:text-sm text-muted-foreground">({toBanglaDigits(product.review_count)} reviews)</span>
                </div>
              )}

              {product.short_description && <p className="apple-body-sm whitespace-pre-line">{product.short_description}</p>}

              {/* Price */}
              <div className="flex items-baseline gap-3 lg:pt-0">
                {showRange ? (
                  <span className="text-[26px] sm:text-3xl lg:text-[28px] font-semibold text-foreground tabular-nums tracking-[-0.02em]">
                    {CURRENCY_SYMBOL}{toBanglaDigits(priceRange.min)} – {CURRENCY_SYMBOL}{toBanglaDigits(priceRange.max)}
                  </span>
                ) : (
                  <span className="text-[26px] sm:text-3xl lg:text-[28px] font-semibold text-foreground tabular-nums tracking-[-0.02em]">{CURRENCY_SYMBOL}{toBanglaDigits(currentPrice)}</span>
                )}
                {showCompareAt && !showRange && (
                  <>
                    <span className="text-base sm:text-lg text-muted-foreground/70 line-through tabular-nums">{CURRENCY_SYMBOL}{toBanglaDigits(compareAtPrice)}</span>
                    <span className="badge-sale text-[11px]">{toBanglaDigits(discountPercent)}% off</span>
                  </>
                )}
              </div>

              {/* Offer badges */}
              {showOffers && productOffers.length > 0 && (
                <div className="space-y-1.5">
                  {productOffers.map((offer: any) => {
                    let icon = <TagIcon size={11} />;
                    let colorClass = "from-[hsl(var(--offer-bg))] to-[hsl(var(--offer-bg)/0.4)] border-[hsl(var(--offer-border))] text-[hsl(var(--offer-text))]";
                    if (["buy_x_get_y", "buy_x_get_y_same", "buy_x_get_y_diff", "buy_x_get_y_free_delivery"].includes(offer.offer_type)) {
                      icon = <GiftIcon size={11} />;
                      colorClass = "from-[hsl(var(--gift-bg))] to-[hsl(var(--gift-bg)/0.4)] border-[hsl(var(--gift-border))] text-[hsl(var(--gift-text))]";
                    } else if (["buy_x_get_discount", "buy_x_get_off", "flat_percent"].includes(offer.offer_type)) {
                      icon = <PartyPopperIcon size={11} />;
                      colorClass = "from-[hsl(var(--nudge-bg))] to-[hsl(var(--nudge-bg)/0.4)] border-[hsl(var(--nudge-border))] text-[hsl(var(--nudge-text))]";
                    }
                    return (
                      <div key={offer.id} className={`flex items-center gap-2 bg-gradient-to-r ${colorClass} border rounded-lg px-3 py-1.5`}>
                        {icon}
                        <span className="text-[11px] font-medium">{offer.display_text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Offer gamification */}
              {showOffers && product && (() => {
                const offerProductNames: Record<string, string> = { [product.id]: product.name };
                const offerProductPrices: Record<string, string | number> = { [product.id]: currentPrice };
                productOffers.forEach((o: any) => {
                  if (o.free_product_id) {
                    offerProductNames[o.free_product_id] = offerProductNames[o.free_product_id] || "Free item";
                  }
                });
                const { applied, nearQualifying } = simulateOffersForProduct(
                  product.id, quantity, currentPrice,
                  productOffers as ProductOffer[],
                  offerProductNames,
                  offerProductPrices as Record<string, number>
                );
                return (
                  <>
                    {nearQualifying.length > 0 && (
                      <div className="space-y-1.5">
                        {nearQualifying.map(({ offer, needed }) => {
                          const progress = Math.round(((offer.buy_quantity! - needed) / offer.buy_quantity!) * 100);
                          return (
                            <div key={offer.id} className="bg-gradient-to-r from-[hsl(var(--nudge-bg))] to-[hsl(var(--nudge-bg)/0.4)] border border-[hsl(var(--nudge-border))] rounded-xl px-3 py-2 flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-[hsl(var(--nudge-accent))] flex items-center justify-center flex-shrink-0">
                                <PartyPopperIcon size={10} className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-[hsl(var(--nudge-text))]">
                                  Add <span className="font-bold text-[hsl(var(--nudge-accent))]">{toBanglaDigits(needed)} more</span> → <span className="font-semibold">{offer.display_text}</span>
                                </p>
                                <div className="mt-1 h-1 bg-[hsl(var(--nudge-border)/0.5)] rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-[hsl(var(--nudge-accent))] to-[hsl(var(--nudge-accent)/0.7)] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {applied.length > 0 && (
                      <div className="space-y-1.5">
                        {applied.map((ao) => (
                          <div key={ao.offerId} className="bg-gradient-to-r from-[hsl(var(--gift-bg))] to-[hsl(var(--gift-bg)/0.4)] border border-[hsl(var(--gift-border))] rounded-xl px-3 py-2 flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-[hsl(var(--gift-accent))] flex items-center justify-center flex-shrink-0">
                              <GiftIcon size={10} className="text-white" />
                            </div>
                            <div className="text-[11px] text-[hsl(var(--gift-text))] leading-snug">
                              <span className="font-bold">🎉 Unlocked!</span> {ao.displayText}
                              {ao.freeItems.length > 0 && (
                                <span className="text-[hsl(var(--gift-accent))] font-semibold"> · 🎁 {ao.freeItems.map((f) => `${toBanglaDigits(f.quantity)}x ${f.productName}`).join(", ")} Free</span>
                              )}
                              {ao.discountAmount > 0 && (
                                <span className="text-[hsl(var(--gift-accent))] font-bold"> · Save {CURRENCY_SYMBOL}{toBanglaDigits(ao.discountAmount.toFixed(0))}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Variants */}
              {useModernVariants
                ? optionGroups.map((g) => {
                    const isColor = g.type === "color";
                    // Hide values that have no active variant row matching current other selections
                    const visibleValues = g.values.filter((val) => {
                      return variantRows.some((r) => {
                        if (r.active === false) return false;
                        if (r.option_values?.[g.name] !== val) return false;
                        for (const [k, sv] of Object.entries(selectedVariants)) {
                          if (k === g.name) continue;
                          if (sv && r.option_values?.[k] !== sv) return false;
                        }
                        return true;
                      });
                    });
                    if (visibleValues.length === 0) return null;
                    return (
                    <div key={g.name}>
                      <label className="text-xs sm:text-sm font-medium text-foreground mb-2 block">
                        {g.name}
                        {selectedVariants[g.name] ? `: ${selectedVariants[g.name]}` : ""}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {visibleValues.map((val) => {
                          const imgIdx = g.image_map?.[val];
                          const selected = selectedVariants[g.name] === val;
                          const hex = g.color_map?.[val];
                          const onClick = () => {
                            setSelectedVariants({ ...selectedVariants, [g.name]: val });
                            if (imgIdx != null && imgIdx < (product.images?.length ?? 0)) {
                              setSelectedImage(imgIdx);
                            }
                          };
                          if (isColor) {
                            return (
                              <button
                                key={val}
                                onClick={onClick}
                                title={val}
                                aria-label={val}
                                className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200 active:scale-95 touch-manipulation ${
                                  selected
                                    ? "border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                                    : "border-border/40 hover:border-primary/40"
                                }`}
                                style={{ background: hex || "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px" }}
                              />
                            );
                          }
                          return (
                            <button
                              key={val}
                              onClick={onClick}
                              className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm border transition-all duration-200 active:scale-95 touch-manipulation ${
                                selected
                                  ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_8px_-3px_hsl(var(--primary)/0.3)]"
                                  : "border-border/60 text-foreground hover:border-primary/40"
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    );
                  })
                : legacyVariants.map((v) => (
                    <div key={v.type}>
                      <label className="text-xs sm:text-sm font-medium text-foreground mb-2 block">
                        {v.type}
                        {selectedVariants[v.type] ? `: ${selectedVariants[v.type]}` : ""}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {v.options.map((opt: any) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setSelectedVariants({ ...selectedVariants, [v.type]: opt.value });
                              if (opt.image_index != null && opt.image_index < (product.images?.length ?? 0)) {
                                setSelectedImage(opt.image_index);
                              }
                            }}
                            className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm border transition-all duration-200 active:scale-95 touch-manipulation ${
                              selectedVariants[v.type] === opt.value
                                ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_8px_-3px_hsl(var(--primary)/0.3)]"
                                : "border-border/60 text-foreground hover:border-primary/40"
                            }`}
                          >
                            {opt.value}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

              {/* CTA stack — strict order: Quantity+Add to Cart → Buy Now → WhatsApp → Messenger */}
              <div ref={ctaRef} className="flex flex-col gap-2 pt-2">
                {/* Quantity + Add to Cart inline */}
                <div className="flex items-stretch gap-2">
                  <div className="flex items-center border border-border/60 rounded-[12px] shrink-0 bg-background">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-11 lg:h-12 flex items-center justify-center active:bg-secondary rounded-l-[11px] transition-colors touch-manipulation" disabled={isOutOfStock || hasUnselectedVariants} aria-label="Decrease quantity"><MinusIcon size={14} /></button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{toBanglaDigits(quantity)}</span>
                    <button onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))} className="w-9 h-11 lg:h-12 flex items-center justify-center active:bg-secondary rounded-r-[11px] transition-colors touch-manipulation" disabled={isOutOfStock || hasUnselectedVariants} aria-label="Increase quantity"><PlusIcon size={14} /></button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || hasUnselectedVariants}
                    className="flex-1 min-w-0 h-11 lg:h-12 inline-flex items-center justify-center gap-2 border border-foreground/80 text-foreground rounded-[10px] text-[13px] sm:text-[14px] font-medium tracking-[0.04em] uppercase hover:bg-foreground hover:text-background active:scale-[0.98] transition-all duration-150 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addedFeedback ? (
                      <><CheckIcon size={14} className="text-primary" /> Added</>
                    ) : (
                      <><ShoppingBagIcon size={14} /> {isOutOfStock ? "Sold out" : hasUnselectedVariants ? "Select options" : "Add to cart"}</>
                    )}
                  </button>
                </div>
                {hasUnselectedVariants && <p className="text-xs text-muted-foreground -mt-1">Select options to order</p>}

                {/* Buy Now (Primary) */}
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || hasUnselectedVariants}
                  className="w-full h-11 lg:h-12 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-[10px] text-[13px] sm:text-[14px] font-semibold tracking-[0.06em] uppercase hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_6px_24px_-10px_hsl(var(--primary)/0.5)]"
                >
                  {isOutOfStock ? "Sold out" : hasUnselectedVariants ? "Select options first" : "Buy it now"}
                </button>

                {/* Direct order channels (WhatsApp / Messenger) — side-by-side on desktop when both enabled */}
                {(() => {
                  const productUrl = typeof window !== "undefined" ? `${window.location.origin}/product/${product.slug}` : `/product/${product.slug}`;
                  const validChannels = directOrderChannels
                    .filter((ch) => ch.identifier && ch.identifier.trim())
                    .map((ch) => {
                      const labelLower = (ch.label || "").toLowerCase();
                      const isWa = !(labelLower.includes("messenger") || labelLower.includes("facebook"));
                      let href = "";
                      if (isWa) {
                        const num = ch.identifier.replace(/[^0-9]/g, "");
                        if (!num) return null;
                        const message = (ch.message_template || "").replace(/\{product_name\}/g, product.name).replace(/\{product_url\}/g, productUrl);
                        href = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
                      } else {
                        href = `https://m.me/${ch.identifier.trim()}?ref=${encodeURIComponent(productUrl)}`;
                      }
                      return { ch, isWa, href };
                    })
                    .filter(Boolean) as { ch: any; isWa: boolean; href: string }[];

                  if (validChannels.length === 0) return null;
                  const twoUp = validChannels.length >= 2;

                  return (
                    <div className={twoUp ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5" : ""}>
                      {validChannels.map(({ ch, isWa, href }) => {
                        const icon = isWa ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.2 0 1.3.9 2.5 1.1 2.7.1.2 1.9 2.9 4.6 4 .6.3 1.1.4 1.5.5.6.2 1.2.2 1.7.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z"/><path d="M20.5 3.5A10 10 0 0 0 3.6 17.6L2 22l4.5-1.6A10 10 0 1 0 20.5 3.5zm-8.5 16a8.3 8.3 0 0 1-4.2-1.1l-.3-.2-2.7.9.9-2.6-.2-.3a8.3 8.3 0 1 1 6.5 3.3z"/></svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2C6.5 2 2 6.1 2 11.2c0 2.9 1.5 5.5 3.8 7.2v3.5l3.5-1.9c1 .3 2 .4 3 .4 5.5 0 10-4.1 10-9.2C22 6.1 17.5 2 12 2zm1.1 12.4-2.5-2.7-5 2.7 5.4-5.7 2.6 2.7 4.9-2.7-5.4 5.7z"/></svg>
                        );
                        return (
                          <a
                            key={ch.id}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full h-11 inline-flex items-center justify-center gap-2 rounded-[12px] text-[13px] sm:text-sm font-semibold transition-all duration-150 active:scale-[0.98] touch-manipulation text-white ${isWa ? "bg-[#1faa55] hover:bg-[#1c9a4d]" : "bg-[#1976d2] hover:bg-[#1668bd]"}`}
                          >
                            {icon}
                            {ch.label && ch.label !== "Order on WhatsApp" && ch.label !== "Order on Messenger" ? ch.label : (isWa ? "Order on WhatsApp" : "Order on Messenger")}
                          </a>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Shipment Details — from delivery_zones, toggle via shop_settings.pdp_show_shipment_details */}
              {showShipmentDetails && deliveryZones.length > 0 && (
                <div className="mt-2 rounded-2xl border border-border/30 bg-gradient-to-br from-secondary/30 to-background/50 p-4 sm:p-5 shadow-[0_1px_2px_hsl(var(--foreground)/0.02)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <TruckIcon size={14} className="text-primary" />
                    </div>
                    <h3 className="text-sm sm:text-[15px] font-semibold text-foreground tracking-tight">Shipping Details</h3>
                  </div>
                  <ul className="divide-y divide-border/40">
                    {deliveryZones.map((z: any) => {
                      const freeMin = z.free_delivery_minimum ?? z.free_shipping_threshold;
                      const charge = z.delivery_charge ?? z.shipping_cost ?? 0;
                      return (
                        <li key={z.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-foreground">{z.zone_name || z.name}</p>
                            {z.estimated_days && (
                              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{toBanglaDigits(z.estimated_days)} day delivery</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs sm:text-sm font-semibold text-foreground tabular-nums">
                              {CURRENCY_SYMBOL}{toBanglaDigits(Number(charge).toFixed(0))}
                            </p>
                            {freeMin != null && Number(freeMin) > 0 && (
                              <p className="text-[10px] sm:text-[11px] text-primary font-medium mt-0.5">
                                {CURRENCY_SYMBOL}{toBanglaDigits(Number(freeMin).toFixed(0))} + ships free
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Meta info */}
              <div className="flex flex-col gap-2.5 pt-4 border-t border-border/30">
                {brandName && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <TagIcon size={14} className="text-primary/60" />
                    <span>Brand: <span className="font-medium text-foreground">{brandName}</span></span>
                  </div>
                )}
                {showShippingText && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"><TruckIcon size={14} className="text-primary/60" /><span>{shippingText}</span></div>
                )}
                {showStockStatus && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className={`w-1.5 h-1.5 rounded-full ${(product.stock ?? 0) > 10 ? "bg-success" : (product.stock ?? 0) > 0 ? "bg-star" : "bg-destructive"}`} />
                    <span className="text-muted-foreground">{(product.stock ?? 0) > 10 ? stockStatusText : (product.stock ?? 0) > 0 ? `Only ${toBanglaDigits(product.stock!)} left in stock` : "Sold out"}</span>
                  </div>
                )}
              </div>

              {/* Tabs (accordion) — directly below product info */}
              {allTabs.length > 0 && (
                <Accordion type="multiple" defaultValue={allTabs.map((_, i) => `tab-${i}`)}>
                  {allTabs.map((tab, i) => {
                    const content = (tab.content || "").trim();
                    const style = tab.display_style || 'text';
                    const lines = (style === 'list' || style === 'highlight' || style === 'bullet')
                      ? content.split(/\n/).map((l: string) => l.trim().replace(/^[•\-–—]\s*/, "")).filter(Boolean)
                      : [];

                    return (
                      <AccordionItem key={i} value={`tab-${i}`} className="border-b border-border/20 px-0">
                        <AccordionTrigger className="text-sm sm:text-base font-medium text-foreground py-4 hover:no-underline">
                          {tab.label}
                        </AccordionTrigger>
                        <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-4">
                          {(style === 'list' || style === 'bullet') ? (
                            <ul className="space-y-2.5 list-none p-0 m-0">
                              {lines.map((line: string, li: number) => (
                                <li key={li} className="flex items-start gap-3 leading-[1.7]">
                                  <span className="w-[4px] h-[4px] rounded-full bg-foreground/25 mt-[8px] flex-shrink-0" />
                                  <span className="text-foreground/70">{line}</span>
                                </li>
                              ))}
                            </ul>
                          ) : style === 'highlight' ? (
                            <div className="space-y-1.5">
                              {lines.map((line: string, li: number) => (
                                <div key={li} className="border-l-2 border-primary/30 pl-3.5 py-1.5 text-foreground/70 leading-[1.7]">
                                  {line}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="whitespace-pre-line text-foreground/70">{content}</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </div>
          </div>
        </div>

        {/* Why Choose Us — toggle via shop_settings.pdp_show_why_choose_us */}
        {showWhyChooseUs && whyCards.length > 0 && (
          <ScrollScene variant="cinematic" intensity={0.85}>
          <section className="section-padding pb-8 sm:pb-12">

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {whyCards.map((card: any, idx: number) => (
                <div key={card.id} className="text-center p-4 sm:p-6 glass-card rounded-2xl hover:-translate-y-0.5 transition-transform duration-300">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-float" style={{ animationDelay: `${idx * 0.5}s` }}>
                    <DynamicIcon name={card.icon_name || "Shield"} className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{card.title}</h3>
                  <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
          </section>
          </ScrollScene>
        )}

        {/* FAQs — card style */}
        {faqs.length > 0 && (
          <ScrollScene variant="rise" intensity={0.8}>
          <div className="section-padding pb-8 sm:pb-12">
            <h2 className="text-sm sm:text-base font-semibold text-foreground mb-4">Product Q&A</h2>
            <Accordion type="single" collapsible className="space-y-2 max-w-3xl">
              {faqs.map((faq: any) => (
                <AccordionItem key={faq.id} value={faq.id} className="glass-card rounded-xl px-4 sm:px-5 border-none">
                  <AccordionTrigger className="text-sm sm:text-base font-normal text-muted-foreground py-4 hover:no-underline text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          </ScrollScene>
        )}

        {/* Reviews — card style */}
        {reviews.length > 0 && (
          <ScrollScene variant="rise" intensity={0.8}>
          <div className="section-padding pb-8 sm:pb-12">
            <div className="flex items-center justify-between mb-4 max-w-3xl">
              <h2 className="text-sm sm:text-base font-semibold text-foreground">Reviews ({toBanglaDigits(reviews.length)})</h2>
              <div className="flex items-center gap-2">
                <StarRating rating={avgRating} size={14} />
                <span className="text-xs sm:text-sm font-medium text-foreground tabular-nums">{toBanglaDigits(avgRating.toFixed(1))}</span>
              </div>
            </div>
            <div className="space-y-2 max-w-3xl">
              {reviews.map((review: any) => (
                <div key={review.id} className="glass-card rounded-xl px-4 sm:px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-foreground">{review.customer_name}</span>
                    <StarRating rating={review.rating} size={12} />
                  </div>
                  {(review.comment || review.review) && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">"{review.comment || review.review}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          </ScrollScene>
        )}

        {/* Related products */}
        {related.length > 0 && (
          <ScrollScene variant="cinematic" intensity={1}>
          <div className="section-padding py-10 sm:py-14">
            <div className="premium-divider mb-6" />
            <h2 className="text-sm sm:text-base font-semibold text-foreground mb-5">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5 xl:gap-6">
              {related.map((p) => <ProductCard key={p.id} product={p} categoryName={categoryName} />)}
            </div>
          </div>
          </ScrollScene>
        )}
      </div>

      {/* Desktop floating purchase bar — appears when main CTA scrolls out of view */}
      <div
        className={`hidden lg:block fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-200 ${
          showStickyBar ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
        aria-hidden={!showStickyBar}
      >
        <div className="flex items-center gap-4 pl-3 pr-3 py-2 rounded-full bg-background/95 backdrop-blur-xl border border-border/60 shadow-[0_18px_50px_-18px_hsl(153_64%_8%/0.35)] max-w-[760px]">
          <div className="flex items-center gap-3 min-w-0 pl-1">
            <img src={mainImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground truncate max-w-[220px]">{product.name}</p>
              <p className="text-[13px] font-semibold text-foreground tabular-nums">
                {CURRENCY_SYMBOL}{toBanglaDigits(currentPrice)}
                {showCompareAt && !showRange && (
                  <span className="ml-2 text-[11px] text-muted-foreground/70 line-through font-normal">{CURRENCY_SYMBOL}{toBanglaDigits(compareAtPrice)}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || hasUnselectedVariants}
              className="h-10 px-4 inline-flex items-center justify-center gap-2 border border-foreground/80 text-foreground rounded-full text-[12px] font-medium tracking-[0.04em] uppercase hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBagIcon size={13} /> Add to cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock || hasUnselectedVariants}
              className="h-10 px-5 inline-flex items-center justify-center bg-primary text-primary-foreground rounded-full text-[12px] font-semibold tracking-[0.06em] uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOutOfStock ? "Sold out" : "Buy now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
