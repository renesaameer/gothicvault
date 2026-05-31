import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBagIcon, MenuIcon, XIcon } from "@/components/ui/icons";
import { useCartStore } from "@/data/cartStore";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getActiveOffers } from "@/lib/offers";
import BrandMark from "@/components/brand/BrandMark";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Track Order", to: "/track-order" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Policies", to: "/policies" },
];

const pageLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Track Order", to: "/track-order" },
  { label: "Contact", to: "/contact" },
  { label: "Policies", to: "/policies" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const location = useLocation();
  const queryClient = useQueryClient();

  const { data: menuCategories = [] } = useQuery({
    queryKey: ["header-categories"],
    queryFn: async () => {
      const r = await supabase.from("categories").select("id,name,slug,sort_order").order("sort_order");
      return (r.data as any[]) ?? [];
    },
    staleTime: 60 * 1000,
    refetchOnMount: "always",
  });

  const shopCategories = [
    { label: "All Products", to: "/shop" },
    ...menuCategories.map((c: any) => ({
      label: String(c.name || "").toUpperCase(),
      to: `/shop?category=${encodeURIComponent(c.name)}`,
    })),
  ];

  const prefetchRoute = useCallback((to: string) => {
    if (to === "/shop") {
      queryClient.prefetchQuery({
        queryKey: ["shop"],
        queryFn: async () => {
          const [prodRes, catRes, setRes, offers] = await Promise.all([
            supabase.from("products").select("*").order("created_at", { ascending: false }),
            supabase.from("categories").select("*").order("sort_order"),
            supabase.from("shop_settings").select("*").eq("id", "default").single(),
            getActiveOffers(),
          ]);

          return {
            products: (prodRes.data as any[]) ?? [],
            categories: (catRes.data as any[]) ?? [],
            settings: (setRes.data as any) ?? { search_enabled: true, sorting_enabled: true, default_sorting: "newest", card_cta_mode: "view_details" },
            activeOffers: offers,
          };
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      });
      return;
    }

    if (to === "/about") {
      queryClient.prefetchQuery({
        queryKey: ["about-sections"],
        queryFn: async () => {
          const r = await supabase.from("about_sections").select("*").order("sort_order");
          return r.data ?? [];
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      });
      return;
    }

    if (to === "/contact") {
      queryClient.prefetchQuery({
        queryKey: ["contact-settings"],
        queryFn: async () => {
          const r = await (supabase.rpc as any)("get_public_contact_settings");
          return Array.isArray(r.data) ? r.data[0] : r.data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      });
      return;
    }

    if (to === "/policies") {
      queryClient.prefetchQuery({
        queryKey: ["policies"],
        queryFn: async () => {
          const r = await supabase.from("policies").select("*").eq("enabled", true).order("sort_order");
          return r.data ?? [];
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      });
    }
  }, [queryClient]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (path: string) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));

  return (
    <>
      <header className="sticky top-0 z-[70] px-3 sm:px-6 pt-2 sm:pt-2.5 pb-2 sm:pb-3">
        <div
          className={`relative mx-auto max-w-[1400px] rounded-full backdrop-blur-2xl backdrop-saturate-[1.8] transition-all duration-500 ease-out
            ${scrolled
              ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(248,248,250,0.72))] border border-black/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.04),0_18px_40px_-18px_rgba(0,0,0,0.22)]"
              : "bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,248,250,0.55))] border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),inset_0_0_0_1px_rgba(255,255,255,0.3),0_10px_30px_-14px_rgba(0,0,0,0.16)]"
            }`}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-[radial-gradient(120%_100%_at_50%_-30%,rgba(255,255,255,0.6),transparent_60%)]" />
          </div>
          {/* Desktop */}
          <div className="hidden lg:flex items-center justify-between px-6 lg:px-8 h-16 relative">
            <Link to="/" className="flex-shrink-0" aria-label="AEROM — Home">
              <BrandMark size="md" />
            </Link>

            <nav className="flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onMouseEnter={() => prefetchRoute(link.to)}
                  className={`relative text-[11px] font-semibold tracking-[0.22em] uppercase transition-all duration-300 px-3 py-1.5 rounded-full ${
                    isActive(link.to)
                      ? "text-foreground bg-black/[0.05] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(255,255,255,0.6)]"
                      : "text-foreground/55 hover:text-foreground hover:bg-black/[0.03]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <Link
              to="/cart"
              className="relative inline-flex items-center justify-center w-10 h-10 -mr-1 rounded-full bg-white/60 border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_12px_-4px_rgba(0,0,0,0.12)] hover:bg-white/80 hover:-translate-y-0.5 transition-all duration-300 group"
              aria-label="Cart"
            >
              <ShoppingBagIcon className="w-[18px] h-[18px] text-foreground transition-transform duration-300 group-hover:scale-110" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-foreground text-background text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center tabular-nums shadow-[0_2px_6px_rgba(0,0,0,0.25)]">{totalItems}</span>
              )}
            </Link>
          </div>

          {/* Mobile + Tablet */}
          <div className="flex lg:hidden items-center justify-between px-4 h-14 relative">
            <button onClick={() => setMobileOpen((v) => !v)} className="p-2 -ml-2 rounded-full active:bg-black/[0.05] transition-colors duration-150" aria-label={mobileOpen ? "Close menu" : "Open menu"}>
              {mobileOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>

            <Link to="/" className="absolute left-1/2 -translate-x-1/2" aria-label="AEROM — Home">
              <BrandMark size="md" />
            </Link>

            <Link to="/cart" className="relative inline-flex items-center justify-center w-10 h-10 -mr-1 rounded-full bg-white/60 border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_12px_-4px_rgba(0,0,0,0.12)] active:bg-white/80 transition-colors duration-150" aria-label="Cart">
              <ShoppingBagIcon className="w-[18px] h-[18px]" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-foreground text-background text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center tabular-nums shadow-[0_2px_6px_rgba(0,0,0,0.25)]">{totalItems}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile menu — floating rounded card */}
      <div className={`lg:hidden fixed inset-0 z-[60] transition-opacity duration-200 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden />
        <div
          className={`absolute left-3 right-3 top-[68px] rounded-[28px] bg-[linear-gradient(180deg,rgba(255,253,249,0.92),rgba(245,239,228,0.85))] backdrop-blur-2xl backdrop-saturate-[1.6] border border-black/[0.06] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out ${mobileOpen ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"}`}
        >
          <div className="px-2 pt-2 pb-3 max-h-[calc(100vh-100px)] overflow-y-auto">
            <nav>
              <ul className="space-y-0">
                {navLinks.map((link) => {
                  const active = isActive(link.to);
                  return (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        onClick={() => { setMobileOpen(false); prefetchRoute(link.to); }}
                        className={`block px-5 py-3.5 rounded-full text-[15px] font-medium tracking-[-0.01em] transition-colors ${
                          active
                            ? "bg-black/[0.06] text-foreground shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
                            : "text-foreground hover:bg-black/[0.04]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
