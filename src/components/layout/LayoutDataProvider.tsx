import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackPageView } from "@/lib/trackingEvents";

interface FooterData {
  store_name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  copyright_text: string;
  social_links: any[];
  quick_links: any[];
  customer_care_links: any[];
  newsletter_enabled: boolean;
}

interface LayoutData {
  logoDesktop: string | null;
  logoMobile: string | null;
  logoFooter: string | null;
  whatsapp: { phone_number: string; enabled: boolean; radar_animation: boolean } | null;
  announcement: { enabled: boolean; text: string; link: string | null; bg_color: string; text_color: string; dismissible: boolean } | null;
  footer: FooterData | null;
  floatingIcons: { id: string; label: string; url: string; icon_url: string | null; bg_color: string; icon_color?: string; preset_key?: string | null; sort_order: number; enabled: boolean }[];
  floatingSettings: { enabled: boolean; radar_animation: boolean; expand_icon_url: string | null; animation_style?: string; animation_intensity?: string } | null;
  cardButtons: { showViewDetails: boolean; showAddToCart: boolean; showBuyNow: boolean };
  directOrderChannels: { id: string; enabled: boolean; label: string; identifier: string; message_template: string; sort_order: number }[];
  loaded: boolean;
}

const LayoutDataContext = createContext<LayoutData>({
  logoDesktop: null,
  logoMobile: null,
  logoFooter: null,
  whatsapp: null,
  announcement: null,
  footer: null,
  floatingIcons: [],
  floatingSettings: null,
  cardButtons: { showViewDetails: true, showAddToCart: true, showBuyNow: true },
  directOrderChannels: [],
  loaded: false,
});

export const useLayoutData = () => useContext(LayoutDataContext);

async function fetchLayoutData() {
  const [designRes, waRes, annRes, footerRes, fiRes, fiSetRes, shopRes, dorRes] = await Promise.all([
    supabase.from("design_settings").select("logo_desktop_url, logo_mobile_url, logo_footer_url").eq("id", "default").maybeSingle(),
    supabase.from("whatsapp_settings").select("*").eq("id", "default").maybeSingle(),
    supabase.from("announcement_bar").select("*").eq("id", "default").maybeSingle(),
    supabase.from("footer_settings").select("*").eq("id", "default").maybeSingle(),
    supabase.from("floating_icons").select("*").eq("enabled", true).order("sort_order"),
    supabase.from("floating_icons_settings").select("*").eq("id", "default").maybeSingle(),
    supabase.from("shop_settings").select("card_show_view_details, card_show_add_to_cart, card_show_buy_now").eq("id", "default").maybeSingle(),
    supabase.from("direct_order_channels").select("*").eq("enabled", true).order("sort_order"),
  ]);

  const design = designRes.data as any;
  const shop = (shopRes.data as any) ?? {};

  return {
    logoDesktop: design?.logo_desktop_url ?? null,
    logoMobile: design?.logo_mobile_url ?? null,
    logoFooter: design?.logo_footer_url ?? null,
    whatsapp: waRes.data as any,
    announcement: annRes.data as any,
    footer: footerRes.data as any,
    floatingIcons: (fiRes.data as any[]) ?? [],
    floatingSettings: fiSetRes.data as any,
    cardButtons: {
      showViewDetails: shop.card_show_view_details !== false,
      showAddToCart: shop.card_show_add_to_cart !== false,
      showBuyNow: shop.card_show_buy_now !== false,
    },
    directOrderChannels: (dorRes.data as any[]) ?? [],
  };
}

export const LayoutDataProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const pixelsInjected = useRef(false);

  useEffect(() => {
    // Fire page-view immediately on every route change. Meta `fbq` and TikTok `ttq`
    // both buffer calls before the script finishes loading, so we don't need to gate
    // on pixel readiness — that just delayed the very first PageView unnecessarily.
    trackPageView();
  }, [location.pathname]);

  const { data: layoutData } = useQuery({
    queryKey: ["layout-data"],
    queryFn: fetchLayoutData,
    // Keep fresh: storefront must reflect admin toggles (CTAs, announcement, etc.)
    // immediately on next mount/route change. Cached value is shown instantly while
    // a background refetch updates it.
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
  });

  const layoutLoaded = layoutData !== undefined;

  const { data: pixels } = useQuery({
    queryKey: ["tracking-pixels"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_tracking_pixels");
      return data ?? [];
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (!pixels || pixels.length === 0 || pixelsInjected.current) return;
    pixelsInjected.current = true;

    const injectPixel = (px: any) => {
      if (!px.pixel_id) return;

      if (px.platform === "facebook") {
        const script = document.createElement("script");
        script.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${px.pixel_id}');`;
        document.head.appendChild(script);
      }

      if (px.platform === "google_analytics") {
        const loader = document.createElement("script");
        loader.async = true;
        loader.src = `https://www.googletagmanager.com/gtag/js?id=${px.pixel_id}`;
        document.head.appendChild(loader);

        const init = document.createElement("script");
        init.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${px.pixel_id}');`;
        document.head.appendChild(init);
      }

      if (px.platform === "tiktok") {
        const script = document.createElement("script");
        script.innerHTML = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${px.pixel_id}');ttq.page()}(window,document,'ttq');`;
        document.head.appendChild(script);
      }
    };

    const ric = (cb: () => void) =>
      "requestIdleCallback" in window
        ? (window as any).requestIdleCallback(cb, { timeout: 2000 })
        : globalThis.setTimeout(cb, 100);

    const inject = (i = 0) => {
      const list = pixels as any[];
      if (i >= list.length) return;
      injectPixel(list[i]);
      ric(() => inject(i + 1));
    };

    ric(() => inject(0));
  }, [pixels]);

  const value: LayoutData = {
    logoDesktop: layoutLoaded ? layoutData.logoDesktop : null,
    logoMobile: layoutLoaded ? layoutData.logoMobile : null,
    logoFooter: layoutLoaded ? layoutData.logoFooter : null,
    whatsapp: layoutLoaded ? layoutData.whatsapp : null,
    announcement: layoutLoaded ? layoutData.announcement : null,
    footer: layoutLoaded ? layoutData.footer : null,
    floatingIcons: layoutLoaded ? layoutData.floatingIcons : [],
    floatingSettings: layoutLoaded ? layoutData.floatingSettings : null,
    cardButtons: layoutLoaded ? layoutData.cardButtons : { showViewDetails: true, showAddToCart: true, showBuyNow: true },
    directOrderChannels: layoutLoaded ? layoutData.directOrderChannels : [],
    loaded: layoutLoaded,
  };

  return <LayoutDataContext.Provider value={value}>{children}</LayoutDataContext.Provider>;
};
