import { Link, useNavigate } from "react-router-dom";
import { CURRENCY_SYMBOL, toBanglaDigits } from "@/lib/currency";
import { useCartStore } from "@/data/cartStore";
import { applyOfferDiscount, type ActiveOffer } from "@/lib/offers";
import type { Product } from "@/types/database";
import { useState, useCallback, memo, forwardRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchProductData } from "@/lib/fetchProductData";
import { ShoppingBagIcon, ZapIcon } from "@/components/ui/icons";
import { getProductPriceRange, parseOptionGroups } from "@/lib/variants";
import { useLayoutData } from "@/components/layout/LayoutDataProvider";
import { TiltCard } from "@/components/ui/tilt-card";

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  offers?: ActiveOffer[];
  priority?: boolean;
  /** Optional pre-computed variant price range from product_variants rows */
  variantPriceMin?: number | null;
  variantPriceMax?: number | null;
}

const ProductCard = forwardRef<HTMLAnchorElement, ProductCardProps>(({ product, categoryName, offers = [], priority = false, variantPriceMin, variantPriceMax }, ref) => {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const queryClient = useQueryClient();
  const { cardButtons } = useLayoutData();
  const showViewDetails = cardButtons?.showViewDetails !== false;
  const showAddToCart = cardButtons?.showAddToCart !== false;
  const showBuyNow = cardButtons?.showBuyNow !== false;
  const anyButton = showViewDetails || showAddToCart || showBuyNow;

  const prefetchProduct = useCallback(() => {
    // Prefetch the EXACT same payload PDP expects, so navigation is instant
    // AND nothing (shipment details, variants, zones) is missing on first paint.
    queryClient.prefetchQuery({
      queryKey: ["product", product.slug],
      queryFn: () => fetchProductData(product.slug),
      staleTime: 5 * 60 * 1000,
    });
  }, [product.slug, queryClient]);

  const basePrice = product.sale_price && product.sale_price < product.price ? product.sale_price : product.price;
  const { finalPrice, offerName } = applyOfferDiscount(basePrice, product.id, product.category_id, product.brand_id, offers);
  const currentPrice = finalPrice;
  const hasDiscount = currentPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - currentPrice) / product.price) * 100) : 0;
  // Prefer pre-computed variant range from product_variants rows; fall back to legacy variants JSONB.
  const hasVariantRange =
    variantPriceMin != null && variantPriceMax != null && variantPriceMin !== variantPriceMax;
  const legacyRange = getProductPriceRange(currentPrice, (product as any).variants);
  const variantRange = hasVariantRange
    ? { min: variantPriceMin!, max: variantPriceMax!, hasRange: true }
    : legacyRange;
  const mainImage = product.images?.[0] || "/placeholder.svg";
  const secondImage = product.images?.[1] || null;
  const [hovered, setHovered] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isOutOfStock) return;
    addItem({ id: product.id, productId: product.id, name: product.name, price: currentPrice, image: mainImage });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isOutOfStock) return;
    useCartStore.getState().clearCart();
    addItem({ id: product.id, productId: product.id, name: product.name, price: currentPrice, image: mainImage });
    navigate("/checkout");
  };

  return (
    <Link ref={ref} to={`/product/${product.slug}`} className="group block" onMouseEnter={prefetchProduct} onTouchStart={prefetchProduct}>
      <TiltCard intensity={6} perspective={1200} className="h-full">
      <div className="flex flex-col h-full rounded-[20px] sm:rounded-[24px] border border-black/[0.06] hover:border-black/[0.12] p-2 sm:p-2.5 transition-colors duration-300 [transform-style:preserve-3d]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] sm:rounded-[18px] bg-white transition-shadow duration-500 group-hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.18)]" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          <div className="absolute inset-0 bg-muted shimmer-loading" aria-hidden />
          <img
            src={(hovered && secondImage ? secondImage : mainImage)}
            alt={product.name}
            data-shimmer
            className="relative w-full h-full object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            loading={priority ? "eager" : "lazy"}
            {...(priority ? { fetchpriority: "high" } : {})}
            sizes="(min-width: 1024px) 25vw, 50vw"
            decoding="async"
            width={400} height={500}
          />
          {isOutOfStock ? (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center bg-white text-foreground text-[10px] sm:text-[11px] font-semibold tracking-[0.12em] uppercase px-2.5 py-1 rounded-md shadow-sm">Sold out</span>
          ) : hasDiscount ? (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center bg-foreground text-background text-[10px] sm:text-[11px] font-semibold tracking-[0.04em] px-2.5 py-1 rounded-md shadow-sm">−{discountPercent}%</span>
          ) : product.best_seller ? (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center bg-foreground text-background text-[10px] sm:text-[11px] font-semibold tracking-[0.1em] uppercase px-2.5 py-1 rounded-md shadow-sm">Best Seller</span>
          ) : null}
          {offerName && !isOutOfStock && (
            <span className="absolute top-2.5 right-2.5 bg-white text-foreground text-[10px] sm:text-[11px] font-medium tracking-[0.08em] uppercase px-2.5 py-1 rounded-md shadow-sm">{offerName}</span>
          )}
        </div>
        <div className="pt-2.5 px-1 sm:px-1.5 pb-1.5 flex flex-col flex-1">
          {/* Title — uppercase, bold, editorial */}
          <h3 className="text-[12px] sm:text-[13px] lg:text-[14px] font-bold tracking-[0.04em] uppercase text-foreground leading-snug line-clamp-2 mb-2">
            {product.name}
          </h3>

          {/* Variant preview (color swatches / text pills) */}
          {(() => {
            const groups = parseOptionGroups((product as any).option_groups).filter(g => g.show_on_card !== false && g.values.length > 0);
            if (groups.length === 0) return null;
            return (
              <div className="flex flex-col gap-1 mb-2">
                {groups.slice(0, 2).map((g, gi) => {
                  const visible = g.values.slice(0, 4);
                  const extra = g.values.length - visible.length;
                  const isColor = g.type === "color";
                  return (
                    <div key={gi} className="flex items-center gap-1.5 flex-wrap">
                      {visible.map((val) => isColor ? (
                        <span
                          key={val}
                          title={val}
                          className="w-4 h-4 rounded-full border border-black/15 shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                          style={{ background: g.color_map?.[val] || "#e5e5e5" }}
                        />
                      ) : (
                        <span
                          key={val}
                          className="px-1.5 h-5 inline-flex items-center text-[10px] font-medium rounded-full border border-foreground/15 text-foreground/70 bg-background"
                        >
                          {val}
                        </span>
                      ))}
                      {extra > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground/70 tabular-nums">+{extra}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Price */}
          <div className="flex items-baseline flex-wrap gap-x-1.5 sm:gap-x-2 gap-y-0 leading-none mb-2.5">
            {variantRange.hasRange ? (
              <span className="text-[12.5px] sm:text-[14px] lg:text-[15px] font-normal text-foreground tabular-nums">
                {CURRENCY_SYMBOL}{toBanglaDigits(variantRange.min)}<span className="mx-0.5 sm:mx-1 text-muted-foreground">–</span>{CURRENCY_SYMBOL}{toBanglaDigits(variantRange.max)}
              </span>
            ) : (
              <>
                <span className="text-[12.5px] sm:text-[14px] lg:text-[15px] font-normal text-foreground tabular-nums">
                  {CURRENCY_SYMBOL}{toBanglaDigits(currentPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-[11px] sm:text-[12.5px] font-normal text-muted-foreground/55 line-through tabular-nums">
                    {CURRENCY_SYMBOL}{toBanglaDigits(product.price)}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Actions — pill style, glass + ink */}
          {anyButton && (
            <div className="mt-auto flex flex-col gap-2.5">
              {(showViewDetails || showAddToCart) && (
                <div className={`grid gap-2 ${showViewDetails && showAddToCart ? "grid-cols-2" : "grid-cols-1"}`}>
                  {showViewDetails && (
                    <button
                      onClick={(e) => { e.preventDefault(); navigate(`/product/${product.slug}`); }}
                      className="h-9 rounded-full border border-foreground/15 hover:border-foreground/30 text-foreground/75 hover:text-foreground hover:bg-foreground/[0.03] text-[11px] sm:text-[12px] font-medium tracking-[-0.005em] active:scale-[0.97] transition-all duration-200 touch-manipulation inline-flex items-center justify-center"
                      aria-label="View details"
                    >
                      <span className="hidden xs:inline">View details</span><span className="xs:hidden">Details</span>
                    </button>
                  )}
                  {showAddToCart && (
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className="h-9 rounded-full glass-button text-foreground text-[11px] sm:text-[12px] font-medium tracking-[-0.005em] active:scale-[0.97] transition-all duration-200 touch-manipulation inline-flex items-center justify-center gap-1 sm:gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Add to cart"
                    >
                      {addedFeedback ? <>✓ Added</> : <><ShoppingBagIcon size={12} /> <span className="hidden xs:inline">Add to cart</span><span className="xs:hidden">Add</span></>}
                    </button>
                  )}
                </div>
              )}
              {showBuyNow && (
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="w-full h-10 rounded-full bg-foreground text-background text-[11px] sm:text-[12px] font-medium tracking-[-0.005em] hover:bg-foreground/90 active:scale-[0.97] transition-all duration-200 touch-manipulation inline-flex items-center justify-center gap-1 sm:gap-1.5 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.18)] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Buy now"
                >
                  <ZapIcon size={12} /> Buy now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </TiltCard>
    </Link>
  );
});
ProductCard.displayName = "ProductCard";

export default memo(ProductCard);
