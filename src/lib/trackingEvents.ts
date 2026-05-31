// Comprehensive Meta Pixel + GA4 + TikTok tracking with CAPI support, advanced matching & event deduplication

const SUPABASE_URL = "https://drobkzgastbtbwkvmwlj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyb2Jremdhc3RidGJ3a3Ztd2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDkwOTUsImV4cCI6MjA4ODMyNTA5NX0.p8g0IwO8OQu5oUiyv1kkHwkr01H_DQ2g2gcXO4firsY";

const win = typeof window !== "undefined" ? (window as any) : null;
const fbq = (...args: any[]) => win?.fbq?.(...args);
const gtag = (...args: any[]) => win?.gtag?.(...args);
const ttq = win?.ttq;

const genEventId = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// ─── Advanced Matching Helpers ──────────────────────────────────

const getCookie = (name: string): string => {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : "";
};

const setCookie = (name: string, value: string, days = 90) => {
  if (typeof document === "undefined") return;
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
};

/** Capture fbclid from URL on load and synthesize _fbc cookie if missing */
const ensureFbc = () => {
  if (typeof window === "undefined") return;
  if (getCookie("_fbc")) return;
  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid");
    if (fbclid) setCookie("_fbc", `fb.1.${Date.now()}.${fbclid}`);
  } catch {}
};
if (typeof window !== "undefined") ensureFbc();

/** Stable per-visitor anonymous ID for advanced matching */
const getExternalId = (): string => {
  if (typeof localStorage === "undefined") return "";
  try {
    let id = localStorage.getItem("__sas_eid");
    if (!id) {
      id = genEventId();
      localStorage.setItem("__sas_eid", id);
    }
    return id;
  } catch {
    return "";
  }
};

const buildUserData = (extra?: Record<string, any>) => {
  const ud: Record<string, any> = {
    fbp: getCookie("_fbp") || undefined,
    fbc: getCookie("_fbc") || undefined,
    external_id: getExternalId() || undefined,
  };
  if (extra) {
    if (extra.email) ud.em = String(extra.email).trim().toLowerCase();
    if (extra.phone) ud.ph = String(extra.phone).replace(/\D/g, "");
    if (extra.firstName) ud.fn = String(extra.firstName).trim().toLowerCase();
    if (extra.lastName) ud.ln = String(extra.lastName).trim().toLowerCase();
    if (extra.city) ud.ct = String(extra.city).replace(/\s+/g, "").toLowerCase();
    if (extra.country) ud.country = String(extra.country).trim().toLowerCase();
  }
  // Strip undefined
  Object.keys(ud).forEach((k) => ud[k] === undefined && delete ud[k]);
  return ud;
};

/** Split full name into first/last for matching */
export const splitName = (fullName?: string) => {
  if (!fullName) return { firstName: undefined, lastName: undefined };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: undefined };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

/** Fire-and-forget CAPI call via edge function (non-blocking) */
const sendCAPI = (eventName: string, eventId: string, customData: Record<string, any>, userData?: Record<string, any>) => {
  const run = () => {
    fetch(`${SUPABASE_URL}/functions/v1/meta-capi`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId,
        event_source_url: window.location.href,
        custom_data: customData,
        user_data: userData || {},
      }),
      keepalive: true,
    }).catch(() => {});
  };
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 0);
  }
};

// ─── Standard Events ────────────────────────────────────────────

export const trackPageView = () => {
  const eventId = genEventId();
  fbq("track", "PageView", {}, { eventID: eventId });
  gtag("event", "page_view");
  ttq?.track("Pageview");
  sendCAPI("PageView", eventId, {}, buildUserData());
};

export const trackViewContent = (product: {
  id: string; name: string; price: number; category?: string; currency?: string;
}) => {
  const eventId = genEventId();
  const currency = product.currency || "BDT";
  const data = {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: Number(product.price),
    currency,
  };
  fbq("track", "ViewContent", data, { eventID: eventId });
  gtag("event", "view_item", {
    items: [{ item_id: product.id, item_name: product.name, price: product.price }],
    currency,
    value: product.price,
  });
  ttq?.track("ViewContent", { content_id: product.id, content_name: product.name, value: product.price, currency });
  sendCAPI("ViewContent", eventId, data, buildUserData());
};

export const trackSearch = (query: string) => {
  if (!query.trim()) return;
  const eventId = genEventId();
  const data = { search_string: query };
  fbq("track", "Search", data, { eventID: eventId });
  gtag("event", "search", { search_term: query });
  ttq?.track("Search", { query });
  sendCAPI("Search", eventId, data, buildUserData());
};

// AddToCart burst-throttle (per-product, 500ms)
const atcLast: Record<string, number> = {};
export const trackAddToCart = (product: {
  id: string; name: string; price: number; quantity: number; currency?: string; variant?: string;
}) => {
  const now = Date.now();
  if (atcLast[product.id] && now - atcLast[product.id] < 500) return;
  atcLast[product.id] = now;

  const eventId = genEventId();
  const currency = product.currency || "BDT";
  const value = Number(product.price) * Number(product.quantity);
  const data = {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value,
    currency,
    num_items: product.quantity,
  };
  fbq("track", "AddToCart", data, { eventID: eventId });
  gtag("event", "add_to_cart", {
    items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: product.quantity }],
    currency,
    value,
  });
  ttq?.track("AddToCart", { content_id: product.id, content_name: product.name, value, currency, quantity: product.quantity });
  sendCAPI("AddToCart", eventId, data, buildUserData());
};

export type CheckoutUserData = {
  email?: string; phone?: string; firstName?: string; lastName?: string; city?: string; country?: string;
};

export const trackInitiateCheckout = (
  items: { id: string; name: string; price: number; quantity: number }[],
  value: number,
  currency = "BDT",
  userData?: CheckoutUserData,
) => {
  const eventId = genEventId();
  const data = {
    content_ids: items.map((i) => i.id),
    content_type: "product",
    value: Number(value),
    currency,
    num_items: items.reduce((s, i) => s + i.quantity, 0),
  };
  fbq("track", "InitiateCheckout", data, { eventID: eventId });
  gtag("event", "begin_checkout", {
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
    currency,
    value,
  });
  ttq?.track("InitiateCheckout", { value, currency });
  sendCAPI("InitiateCheckout", eventId, data, buildUserData(userData));
};

export const trackAddPaymentInfo = (value: number, currency = "BDT", userData?: CheckoutUserData) => {
  const eventId = genEventId();
  const data = { value: Number(value), currency };
  fbq("track", "AddPaymentInfo", data, { eventID: eventId });
  gtag("event", "add_payment_info", { currency, value });
  sendCAPI("AddPaymentInfo", eventId, data, buildUserData(userData));
};

export const trackPurchase = (orderData: {
  orderNumber: string;
  total: number;
  currency?: string;
  items?: { id: string; name: string; price: number; quantity: number }[];
  userData?: CheckoutUserData;
}) => {
  const eventId = genEventId();
  const currency = orderData.currency || "BDT";
  const data: Record<string, any> = {
    content_ids: orderData.items?.map((i) => i.id) || [orderData.orderNumber],
    content_type: "product",
    value: Number(orderData.total),
    currency,
    order_id: orderData.orderNumber,
    num_items: orderData.items?.reduce((s, i) => s + i.quantity, 0) || 1,
  };
  fbq("track", "Purchase", data, { eventID: eventId });
  gtag("event", "purchase", {
    transaction_id: orderData.orderNumber,
    value: orderData.total,
    currency,
    items: orderData.items?.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
  ttq?.track("CompletePayment", { value: orderData.total, currency, content_id: orderData.orderNumber });
  sendCAPI("Purchase", eventId, data, buildUserData(orderData.userData));
};

export const trackLead = (formData?: { email?: string; phone?: string }) => {
  const eventId = genEventId();
  fbq("track", "Lead", {}, { eventID: eventId });
  gtag("event", "generate_lead");
  ttq?.track("SubmitForm");
  sendCAPI("Lead", eventId, {}, buildUserData(formData));
};

export const trackCompleteRegistration = (userData?: { email?: string }) => {
  const eventId = genEventId();
  fbq("track", "CompleteRegistration", {}, { eventID: eventId });
  gtag("event", "sign_up");
  ttq?.track("CompleteRegistration");
  sendCAPI("CompleteRegistration", eventId, {}, buildUserData(userData));
};
