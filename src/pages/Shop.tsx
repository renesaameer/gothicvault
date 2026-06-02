import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useStaggerIn } from "@/hooks/useMotion";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, ChevronDownIcon, TagIcon } from "@/components/ui/icons";
import { trackSearch } from "@/lib/trackingEvents";
import { apiClient } from "@/lib/api/client.js";
import ProductCard from "@/components/ProductCard";
import { getActiveOffers, type ActiveOffer } from "@/lib/offers";
import { CURRENCY_SYMBOL, toBanglaDigits } from "@/lib/currency";
import type { Product, Category } from "@/types/database";

import { ShopPageSkeleton } from "@/components/ui/page-skeletons";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { attachImagesToProducts } from "@/lib/productMedia";
import { ScrollScene } from "@/components/ui/scroll-scene";

async function fetchShopData() {
  const [prodRes, catRes, setRes, offers] = await Promise.all([
    apiClient.get('/products', { query: { limit: 100 } }),
    apiClient.get('/categories', { query: { categoryType: 'product', limit: 50 } }),
    apiClient.get('/shop-settings'),
    getActiveOffers(),
  ]);
  const productsRaw = (prodRes as any).data ?? [];
  const [products, variantRanges] = await Promise.all([
    attachImagesToProducts(productsRaw),
    fetchVariantPriceRanges(productsRaw.map((p: any) => p.id)),
  ]);
  return {
    products: products as Product[],
    variantRanges,
    categories: (catRes as any).data ?? [],
    settings: setRes ?? { searchEnabled: true, sortingEnabled: true, defaultSorting: "featured", cardCtaMode: "view_details" },
    activeOffers: offers,
  };
}

async function fetchVariantPriceRanges(productIds: string[]): Promise<Record<string, { min: number; max: number }>> {
  if (productIds.length === 0) return {};
  
  // Fetch variants for each product using the API client
  const variantPromises = productIds.map(async (productId) => {
    try {
      const variants = await apiClient.get(`/products/${productId}/variants`);
      return { productId, variants: (variants as any[]) ?? [] };
    } catch (error) {
      return { productId, variants: [] };
    }
  });
  
  const results = await Promise.all(variantPromises);
  const map: Record<string, { min: number; max: number }> = {};
  
  results.forEach(({ productId, variants }) => {
    ((variants as any[]) ?? []).forEach((r: any) => {
      const p = Number(r.price ?? 0);
      const sp = r.salePrice != null ? Number(r.salePrice) : null;
      const eff = sp != null && sp > 0 && sp < p ? sp : p;
      const cur = map[productId];
      if (!cur) map[productId] = { min: eff, max: eff };
      else { if (eff < cur.min) cur.min = eff; if (eff > cur.max) cur.max = eff; }
    });
  });
  
  return map;
}

const Shop = () => {
  useDocumentMeta({
    title: "Shop — AEROM",
    description: "Browse our collection of premium modest fashion: abayas, khimars, modest sets and accessories. Curated for comfort and grace.",
    canonicalPath: "/shop",
  });
  const { data, isLoading } = useQuery({
    queryKey: ["shop"],
    queryFn: fetchShopData,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const grid = useStaggerIn<HTMLDivElement>("stagger-grid");

  const products = data?.products ?? [];
  const categories = data?.categories ?? [];
  const settings = (data?.settings as any) ?? { searchEnabled: true, sortingEnabled: true, defaultSorting: "featured", cardCtaMode: "view_details" };
  const activeOffers = data?.activeOffers ?? [];
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(settings.defaultSorting || "featured");
  const [category, setCategory] = useState(() => searchParams.get("category") || "All");

  useEffect(() => {
    const urlCat = searchParams.get("category");
    if (urlCat) setCategory(urlCat);
  }, [searchParams]);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.trim().length >= 3) {
      searchTimerRef.current = setTimeout(() => trackSearch(value.trim()), 800);
    }
  }, []);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => { map[c.id] = c.name; });
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (category !== "All") {
      const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "-");
      const cat = categories.find(
        (c: any) => c.name === category || c.slug === category || norm(c.name) === norm(category),
      );
      if (cat) list = list.filter((p) => p.category_id === cat.id);
    }
    if (sort === "price-asc") list.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
    if (sort === "price-desc") list.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
    if (sort === "newest") list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    // "featured" (default): preserve the sort_order returned by the DB query.
    return list;
  }, [search, sort, category, products, categories]);

  if (isLoading && !data) return <ShopPageSkeleton />;
  if (!data) return <ShopPageSkeleton />;

  return (
    <div className="section-padding pt-6 sm:pt-10 lg:pt-14 pb-16 sm:pb-24 lg:pb-[120px] page-enter">
      <ScrollScene variant="rise" intensity={0.9}>
        <h1 className="apple-heading-lg text-foreground text-center mb-2">Shop</h1>
        <p className="apple-body text-center mb-3">Browse our full collection.</p>
        <div className="premium-divider max-w-[60px] mx-auto mb-6 sm:mb-8" />
      </ScrollScene>


      {activeOffers.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-6 sm:mb-8">
          {activeOffers.map((offer) => (
            <div key={offer.id} className="inline-flex items-center gap-1.5 glass-card trust-badge px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-medium text-foreground">
              <TagIcon size={12} className="text-primary flex-shrink-0" />
              <span className="truncate">{offer.name}: {toBanglaDigits(offer.discount_value)}{offer.discount_type === "percentage" ? "%" : ` ${CURRENCY_SYMBOL}`} off</span>
              {offer.apply_to === "entire_store" && <span className="text-muted-foreground ml-1 hidden sm:inline">all products</span>}
            </div>
          ))}
        </div>
      )}

      {/* Filters — responsive mobile layout */}
      <div className="flex flex-col gap-3 mb-8 sm:mb-10 max-w-3xl mx-auto">
        {settings.searchEnabled && (
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-secondary/70 border border-border/40 rounded-full pl-11 pr-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
            />
          </div>
        )}
        <div className="flex gap-2 w-full">
          {categories.length > 0 && (
            <div className="relative flex-1 min-w-0">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none bg-secondary/70 border border-border/40 rounded-full px-4 py-3 pr-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all truncate"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          )}
          {settings.sortingEnabled && (
            <div className="relative flex-1 min-w-0">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full appearance-none bg-secondary/70 border border-border/40 rounded-full px-4 py-3 pr-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all truncate"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div ref={grid.ref} className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-4 sm:gap-y-9 lg:gap-x-5 lg:gap-y-10 ${grid.className}`}>
          {filtered.map((p, i) => {
            const r = data?.variantRanges?.[p.id];
            return <ProductCard key={p.id} product={p} categoryName={p.category_id ? categoryMap[p.category_id] : undefined} offers={activeOffers} priority={i < 4} variantPriceMin={r?.min ?? null} variantPriceMax={r?.max ?? null} />;
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="apple-body">No products found.</p>
        </div>
      )}
    </div>
  );
};

export default Shop;