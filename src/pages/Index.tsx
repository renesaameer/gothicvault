import { Link } from "react-router-dom";
import { useState, useMemo, lazy, Suspense, forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import { getActiveOffers, type ActiveOffer } from "@/lib/offers";
import { CURRENCY_SYMBOL, toBanglaDigits } from "@/lib/currency";
import StarRating from "@/components/ui/StarRating";

import { SparklesIcon, GiftIcon, ArrowRightIcon } from "@/components/ui/icons";
import DynamicIcon from "@/components/ui/DynamicIcon";
import HeroSlider from "@/components/homepage/HeroSlider";
import FeaturedCategories, { type FeaturedCategory } from "@/components/homepage/FeaturedCategories";
import type { Product, HomepageSection, Testimonial, HomeFaq, WhyChooseUsCard } from "@/types/database";
const VideoReels = lazy(() => import("@/components/homepage/VideoReels"));
import { useToast } from "@/hooks/use-toast";
import { useFadeIn, useStaggerIn } from "@/hooks/useMotion";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { attachImagesToProducts } from "@/lib/productMedia";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";

const LazyAccordion = lazy(() => import("@/components/ui/accordion").then(mod => ({
  default: forwardRef<HTMLDivElement, { faqs: HomeFaq[] }>(({ faqs }, ref) => (
    <mod.Accordion ref={ref} type="single" collapsible className="space-y-2">
      {faqs.map((faq) => (
        <mod.AccordionItem key={faq.id} value={faq.id} className="bg-background rounded-xl px-5 border-none">
          <mod.AccordionTrigger className="text-[13px] sm:text-sm font-medium text-foreground py-4 hover:no-underline text-left">{faq.question}</mod.AccordionTrigger>
          <mod.AccordionContent className="text-[13px] sm:text-sm text-muted-foreground pb-4">{faq.answer}</mod.AccordionContent>
        </mod.AccordionItem>
      ))}
    </mod.Accordion>
  ))
})));

interface CategoryWithImage { id: string; name: string; slug: string; image_url: string | null; parent_id: string | null; }
interface Brand { id: string; name: string; slug: string; logo_url: string | null; enabled: boolean; }


const FadeSection = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(({ children, className = "" }, _ref) => {
  const fade = useFadeIn();
  return <div ref={fade.ref} className={`${fade.className} ${className}`}>{children}</div>;
});
FadeSection.displayName = "FadeSection";

// Critical above-fold queries — block first paint
async function fetchCriticalHomepageData() {
  const [heroRes, secRes, featRes, catRes, brandRes, shopSetRes, offers, featCatRes] = await Promise.all([
    supabase.from("hero_slides").select("*").eq("enabled", true).order("sort_order"),
    supabase.from("homepage_sections").select("*").order("sort_order"),
    supabase.from("products").select("*").eq("featured", true).order("sort_order", { ascending: true }).limit(8),
    supabase.from("categories").select("id, name, slug, image_url, parent_id"),
    supabase.from("brands").select("id, name, slug, logo_url, enabled").eq("enabled", true).order("sort_order"),
    supabase.from("shop_settings").select("card_cta_mode").eq("id", "default").single(),
    getActiveOffers(),
    supabase.from("featured_categories").select("*").eq("enabled", true).order("sort_order"),
  ]);
  const featuredRaw = (featRes.data as any[]) ?? [];
  const featured = (await attachImagesToProducts(featuredRaw)) as Product[];
  const featuredVariantRanges = await fetchVariantPriceRanges(featured.map((p) => p.id));
  return {
    heroSlides: (heroRes.data as any[]) ?? [],
    sections: (secRes.data as unknown as HomepageSection[]) ?? [],
    featured,
    featuredVariantRanges,
    categories: (catRes.data as CategoryWithImage[]) ?? [],
    brands: (brandRes.data as Brand[]) ?? [],
    cardCtaMode: ((shopSetRes.data as any)?.card_cta_mode || "view_details") as "add_to_cart" | "view_details",
    activeOffers: offers,
    featuredCategories: (featCatRes.data as unknown as FeaturedCategory[]) ?? [],
  };
}

// Below-fold queries — fetched in parallel but don't block hero render
async function fetchDeferredHomepageData() {
  const [bsRes, testRes, faqRes, whyRes, reelsRes] = await Promise.all([
    supabase.from("products").select("*").eq("best_seller", true).order("sort_order", { ascending: true }).limit(8),
    supabase.from("testimonials").select("*").order("sort_order"),
    supabase.from("home_faqs").select("*").order("sort_order"),
    supabase.from("why_choose_us_cards").select("*").order("sort_order"),
    supabase.from("video_testimonials").select("*").eq("enabled", true).order("sort_order"),
  ]);
  const bestSellersRaw = (bsRes.data as any[]) ?? [];
  const bestSellers = (await attachImagesToProducts(bestSellersRaw)) as Product[];
  const bestSellerVariantRanges = await fetchVariantPriceRanges(bestSellers.map((p) => p.id));

  // Attach product info to reels
  const reelsRaw = (reelsRes.data as any[]) ?? [];
  const productIds = [...new Set(reelsRaw.map((r) => r.product_id).filter(Boolean))];
  let productMap: Record<string, any> = {};
  if (productIds.length) {
    const { data: prods } = await supabase
      .from("products")
      .select("id, name, slug, price, sale_price")
      .in("id", productIds);
    const withImages = await attachImagesToProducts((prods as any[]) ?? []);
    productMap = Object.fromEntries(withImages.map((p: any) => [p.id, { ...p, image: p.images?.[0] ?? null }]));
  }
  const reels = reelsRaw.map((r) => ({ ...r, product: r.product_id ? productMap[r.product_id] ?? null : null }));

  return {
    bestSellers,
    bestSellerVariantRanges,
    testimonials: (testRes.data as Testimonial[]) ?? [],
    faqs: (faqRes.data as HomeFaq[]) ?? [],
    whyCards: (whyRes.data as WhyChooseUsCard[]) ?? [],
    reels,
  };
}

// Returns { [productId]: { min, max } } using effective price (sale_price if set & lower).
async function fetchVariantPriceRanges(productIds: string[]): Promise<Record<string, { min: number; max: number }>> {
  if (productIds.length === 0) return {};
  const { data } = await supabase
    .from("product_variants")
    .select("product_id, price, sale_price, active")
    .in("product_id", productIds)
    .eq("active", true);
  const map: Record<string, { min: number; max: number }> = {};
  ((data as any[]) ?? []).forEach((r) => {
    const p = Number(r.price ?? 0);
    const sp = r.sale_price != null ? Number(r.sale_price) : null;
    const eff = sp != null && sp > 0 && sp < p ? sp : p;
    const cur = map[r.product_id];
    if (!cur) map[r.product_id] = { min: eff, max: eff };
    else { if (eff < cur.min) cur.min = eff; if (eff > cur.max) cur.max = eff; }
  });
  return map;
}


const Index = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["homepage-critical"],
    queryFn: fetchCriticalHomepageData,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: deferred } = useQuery({
    queryKey: ["homepage-deferred"],
    queryFn: fetchDeferredHomepageData,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const featuredGrid = useStaggerIn<HTMLDivElement>("stagger-grid");
  const bsGrid = useStaggerIn<HTMLDivElement>("stagger-grid");
  const catGrid = useStaggerIn<HTMLDivElement>("stagger-grid");
  const whyGrid = useStaggerIn<HTMLDivElement>("stagger-grid");

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const { toast } = useToast();

  const sections = data?.sections ?? [];
  const featured = data?.featured ?? [];
  const bestSellers = deferred?.bestSellers ?? [];
  const categories = data?.categories ?? [];
  const brands = data?.brands ?? [];
  const testimonials = deferred?.testimonials ?? [];
  const faqs = deferred?.faqs ?? [];
  const whyCards = deferred?.whyCards ?? [];
  const reels = (deferred as any)?.reels ?? [];
  const activeOffers = data?.activeOffers ?? [];

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => { map[c.id] = c.name; });
    return map;
  }, [categories]);

  const showcaseCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);

  const hasLoadedHomepageData = !!data;

  const getSection = (id: string) => sections.find((s) => s.id === id);
  const isEnabled = (id: string) => getSection(id)?.enabled !== false;
  const sectionContent = (id: string): Record<string, any> => (getSection(id)?.content as any) ?? {};
  const getContent = (id: string) => (getSection(id)?.content as any) ?? {};

  const heroSectionData = getSection("hero");
  const heroEnabled = heroSectionData?.enabled !== false;
  const heroContent = (heroSectionData?.content as any) ?? {};
  const heroAutoplay = heroContent.autoplay !== false;
  const heroAutoplaySpeed = Number(heroContent.autoplay_speed) || 6000;
  const featuredCategories = data?.featuredCategories ?? [];

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    const result = await subscribeToNewsletter(newsletterEmail);
    setSubscribing(false);
    if (!result.ok) {
      toast({ title: "Could not subscribe", description: result.message, variant: "destructive" });
      return;
    }
    toast({ title: "Subscribed!", description: "Thanks for joining our newsletter." });
    setNewsletterEmail("");
  };

  const brandStory = getContent("brand_story");
  const featuredSection = getContent("featured");
  const bsSection = getContent("bestsellers");
  const newsletterSection = getContent("newsletter");
  const catSection = getContent("categories_showcase");
  const brandSection = getContent("brands_showcase");

  useDocumentMeta({
    title: "AEROM — Modest Fashion in Bangladesh",
    description: "Premium abayas, khimars, modest sets and accessories. Crafted for comfort and grace. Cash on delivery across Bangladesh.",
    canonicalPath: "/",
  });

  // Render the page shell immediately. Sections gate themselves on `data`/`hasLoadedHomepageData`.
  // This avoids a full blank screen flash and lets the hero/LCP image start loading as soon as
  // the homepage data resolves (typically <300ms with prefetch).

  return (
    <div style={{ minHeight: '100vh' }} className="contain-content">
      {heroEnabled && (
        <HeroSlider
          fallbackHero={{ image: heroContent.image, title: heroContent.headline || heroContent.title, subtitle: heroContent.subtext || heroContent.subtitle, button_text: heroContent.button1_text || heroContent.button_text, button_link: heroContent.button1_link || heroContent.button_link }}
          slides={data?.heroSlides ?? []}
          loading={isLoading}
          autoplay={heroAutoplay}
          autoplaySpeed={heroAutoplaySpeed}
        />
      )}

      {hasLoadedHomepageData && featuredCategories.length > 0 && (
        <FeaturedCategories categories={featuredCategories} categoryRefs={categories} />
      )}

      {/* Reserve space for sections during initial load to prevent CLS jump */}
      {!hasLoadedHomepageData && (
        <section className="py-8 sm:py-10 lg:py-14 section-padding">
          <div className="text-center mb-6 sm:mb-8 space-y-2">
            <div className="h-6 w-40 mx-auto bg-muted rounded animate-pulse" />
            <div className="h-3 w-56 mx-auto bg-muted/70 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-4 sm:gap-y-9 lg:gap-x-5 lg:gap-y-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[4/5] bg-muted rounded-[20px] sm:rounded-[24px] animate-pulse" />
                <div className="pt-4 sm:pt-5 space-y-2">
                  <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <>
        <>
          {activeOffers.length > 0 && (
            <section className="py-6 sm:py-8 section-padding">
              <FadeSection className="text-center mb-4 sm:mb-5">
                <div className="inline-flex items-center gap-2 bg-foreground text-background px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2.5">
                  <SparklesIcon size={12} /> Limited time offer
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground">Don't miss out!</h2>
              </FadeSection>
              <FadeSection>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeOffers.map((offer) => (
                    <Link key={offer.id} to="/shop" className="group relative overflow-hidden glass-card rounded-xl p-4 sm:p-5 hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 trust-badge">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="inline-flex items-center gap-1 bg-foreground text-background text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          <GiftIcon size={11} />
                          {toBanglaDigits(offer.discount_value)}{offer.discount_type === "percentage" ? "%" : ` ${CURRENCY_SYMBOL}`} off
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-foreground">{offer.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {offer.apply_to === "entire_store" ? "On all products" : `On selected products`}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-3 group-hover:gap-2 transition-all">
                        Shop now <ArrowRightIcon size={12} />
                      </span>
                    </Link>
                  ))}
                </div>
              </FadeSection>
            </section>
          )}

          {hasLoadedHomepageData && isEnabled("featured") && (
            <section className="py-8 sm:py-10 lg:py-14 section-padding">
              <FadeSection className="text-center mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground">{featuredSection.section_title || "Featured Collection"}</h2>
                {featuredSection.subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 max-w-md mx-auto">{featuredSection.subtitle}</p>}
                <div className="premium-divider max-w-[60px] mx-auto mt-4" />
              </FadeSection>
              {featured.length > 0 && (
                <div ref={featuredGrid.ref} className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-4 sm:gap-y-9 lg:gap-x-5 lg:gap-y-10 ${featuredGrid.className}`}>
                  {featured.map((p, i) => {
                    const r = data?.featuredVariantRanges?.[p.id];
                    return <ProductCard key={p.id} product={p} categoryName={p.category_id ? categoryMap[p.category_id] : undefined} offers={activeOffers} priority={i < 4} variantPriceMin={r?.min ?? null} variantPriceMax={r?.max ?? null} />;
                  })}
                </div>
              )}
            </section>
          )}

          {hasLoadedHomepageData && isEnabled("bestsellers") && (
            <section className="py-8 sm:py-10 lg:py-14 section-padding section-alt">
              <FadeSection className="text-center mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground">{bsSection.section_title || "Best Sellers"}</h2>
                {bsSection.subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 max-w-md mx-auto">{bsSection.subtitle}</p>}
                <div className="premium-divider max-w-[60px] mx-auto mt-4" />
              </FadeSection>
              {bestSellers.length > 0 && (
                <div ref={bsGrid.ref} className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-4 sm:gap-y-9 lg:gap-x-5 lg:gap-y-10 ${bsGrid.className}`}>
                  {bestSellers.map((p) => {
                    const r = deferred?.bestSellerVariantRanges?.[p.id];
                    return <ProductCard key={p.id} product={p} categoryName={p.category_id ? categoryMap[p.category_id] : undefined} offers={activeOffers} variantPriceMin={r?.min ?? null} variantPriceMax={r?.max ?? null} />;
                  })}
                </div>
              )}
            </section>
          )}

          {hasLoadedHomepageData && isEnabled("categories_showcase") && showcaseCategories.length > 0 && (
            <section className="py-8 sm:py-10 lg:py-14 section-padding contain-content">
              <FadeSection className="text-center mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground">{catSection.section_title || "Shop by Category"}</h2>
                {catSection.subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">{catSection.subtitle}</p>}
                <div className="premium-divider max-w-[60px] mx-auto mt-4" />
              </FadeSection>
              <div ref={catGrid.ref} className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 ${catGrid.className}`}>
                {showcaseCategories.map((cat) => (
                  <Link key={cat.id} to={`/shop?category=${encodeURIComponent(cat.name)}`} className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary shadow-sm">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy" decoding="async" width={400} height={300} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-foreground/5 to-foreground/10" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/15 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-sm sm:text-base font-semibold text-white drop-shadow-sm">{cat.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {hasLoadedHomepageData && isEnabled("brands_showcase") && brands.length > 0 && (
            <section className="py-8 sm:py-10 lg:py-14 section-padding section-alt contain-content">
              <FadeSection className="text-center mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground">{brandSection.section_title || "Our Brands"}</h2>
                {brandSection.subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">{brandSection.subtitle}</p>}
                <div className="premium-divider max-w-[60px] mx-auto mt-4" />
              </FadeSection>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {brands.map((brand) => (
                  <Link key={brand.id} to={`/shop?brand=${encodeURIComponent(brand.name)}`} className="group flex flex-col items-center justify-center glass-card rounded-xl aspect-square hover:border-primary/25 hover:-translate-y-1 hover:shadow-[0_6px_24px_-8px_hsl(var(--primary)/0.12)] transition-all duration-300 p-3 sm:p-4">
                    <div className="flex-1 w-full flex items-center justify-center">
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="max-h-[50%] w-auto max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-105" loading="lazy" decoding="async" width={80} height={80} />
                      ) : (
                        <span className="text-sm font-semibold text-foreground tracking-tight">{brand.name}</span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-1">{brand.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {hasLoadedHomepageData && isEnabled("brand_story") && (
            <section className="py-8 sm:py-10 lg:py-14 section-padding contain-content">
              <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-14 items-center">
                <FadeSection>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground mb-3 sm:mb-4">{brandStory.title || "Our Story"}</h2>
                  <div className="premium-divider max-w-[40px] mb-4" />
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5 sm:mb-6">
                    {brandStory.text || ""}
                  </p>
                  {brandStory.button_link && brandStory.button_text && (
                    <Link to={brandStory.button_link} className="inline-flex items-center text-sm font-medium text-primary border-b border-primary/50 pb-0.5 hover:border-primary transition-colors">
                      {brandStory.button_text} →
                    </Link>
                  )}
                </FadeSection>
                <FadeSection>
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-secondary shadow-lg">
                    <img src={brandStory.image || "/placeholder.svg"} alt="Our Story" className="w-full h-full object-cover" loading="lazy" decoding="async" width={600} height={450} />
                  </div>
                </FadeSection>
              </div>
            </section>
          )}

          {hasLoadedHomepageData && isEnabled("why_choose_us") && whyCards.length > 0 && (
            <section className="py-8 sm:py-10 lg:py-14 section-padding section-alt contain-content">
              <FadeSection className="text-center mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground">{sectionContent("why_choose_us").section_title || "Why Choose Us"}</h2>
                {sectionContent("why_choose_us").subtitle && <p className="text-sm text-muted-foreground mt-2">{sectionContent("why_choose_us").subtitle}</p>}
                <div className="premium-divider max-w-[60px] mx-auto mt-4" />
              </FadeSection>
              <div ref={whyGrid.ref} className={`grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${whyGrid.className}`}>
                {whyCards.map((card, idx) => (
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
          )}

          {hasLoadedHomepageData && isEnabled("testimonials") && testimonials.length > 0 && (
            <section className="py-8 sm:py-10 lg:py-14 section-padding contain-content">
              <FadeSection className="text-center mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground">{sectionContent("testimonials").section_title || "What Our Customers Say"}</h2>
                {sectionContent("testimonials").subtitle && <p className="text-sm text-muted-foreground mt-2">{sectionContent("testimonials").subtitle}</p>}
                <div className="premium-divider max-w-[60px] mx-auto mt-4" />
              </FadeSection>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {testimonials.map((t) => (
                  <div key={t.id} className="glass-card rounded-2xl p-4 sm:p-5 hover:-translate-y-0.5 transition-transform duration-300">
                    <StarRating rating={t.rating} size={13} />
                    <p className="text-[13px] text-foreground/80 mt-3 mb-4 leading-relaxed italic">"{t.review}"</p>
                    <div className="premium-divider mb-3" />
                    <div className="flex items-center gap-3">
                      {t.image_url && <img src={t.image_url} alt={t.name} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-primary/20" loading="lazy" decoding="async" width={36} height={36} />}
                      <span className="text-[13px] font-medium text-foreground">{t.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {hasLoadedHomepageData && isEnabled("video_reels") && reels.length > 0 && (
            <Suspense fallback={null}>
              <VideoReels
                reels={reels}
                sectionTitle={sectionContent("video_reels").section_title || "Real Customer Experiences"}
                subtitle={sectionContent("video_reels").subtitle || "See how our community experiences the collection."}
              />
            </Suspense>
          )}


          {hasLoadedHomepageData && isEnabled("faq") && faqs.length > 0 && (
            <section className="py-8 sm:py-10 lg:py-14 section-padding section-alt contain-content">
              <FadeSection className="max-w-3xl mx-auto">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground text-center mb-2">{sectionContent("faq").section_title || "Frequently Asked Questions"}</h2>
                {sectionContent("faq").subtitle && <p className="text-sm text-muted-foreground text-center mb-2">{sectionContent("faq").subtitle}</p>}
                <div className="premium-divider max-w-[60px] mx-auto mb-6 sm:mb-8" />
                <Suspense fallback={<div className="space-y-2">{faqs.map(f => <div key={f.id} className="bg-background rounded-xl px-5 py-4 text-[13px] sm:text-sm font-medium text-foreground">{f.question}</div>)}</div>}>
                  <LazyAccordion faqs={faqs} />
                </Suspense>
              </FadeSection>
            </section>
          )}

          {hasLoadedHomepageData && isEnabled("newsletter") && (
            <section className="py-10 sm:py-12 lg:py-16 section-padding contain-content">
              <FadeSection className="max-w-xl mx-auto text-center">
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground mb-2">{newsletterSection.title || newsletterSection.headline || "Stay in the Loop"}</h2>
                <p className="text-sm text-muted-foreground mb-6 sm:mb-7 leading-relaxed">
                  {newsletterSection.subtitle || newsletterSection.subtext || "Be the first to know about new launches, exclusive offers, and style tips."}
                </p>
                <form onSubmit={handleSubscribe} className="relative max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder={newsletterSection.placeholder || "Enter your email"}
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    aria-label="Email address"
                    className="w-full bg-secondary border border-border rounded-full pl-5 pr-[120px] py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={subscribing || !newsletterEmail.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 active:scale-[0.97] transition-all duration-200 whitespace-nowrap touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_16px_-6px_hsl(var(--primary)/0.35)]"
                  >
                    {subscribing ? "…" : (newsletterSection.button_text || "Subscribe")}
                  </button>
                </form>
                {newsletterSection.footnote && (
                  <p className="text-xs text-muted-foreground/70 mt-3">{newsletterSection.footnote}</p>
                )}
              </FadeSection>
            </section>
          )}
        </>
      </>
    </div>
  );
};

export default Index;
