import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ECOMDRIVE_API_KEY_ENV = Deno.env.get("ECOMDRIVE_API_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type Settings = {
  enabled: boolean;
  business_id: string;
  api_key: string;
  api_base_url: string;
  default_courier_method_id: string | null;
  default_delivery_charge: number;
  auto_push: boolean;
  auto_sync_tracking: boolean;
  retry_failed: boolean;
  sandbox_mode: boolean;
  enable_logs: boolean;
  api_timeout_ms: number;
};

async function getSettings(): Promise<Settings> {
  const { data } = await admin.from("ecomdrive_settings").select("*").eq("id", "default").maybeSingle();
  if (!data) throw new Error("EcomDrive settings not initialized");
  return data as Settings;
}

function resolveApiKey(settings: Settings): string {
  const fromDb = (settings.api_key || "").trim();
  return fromDb || ECOMDRIVE_API_KEY_ENV;
}

async function logCall(row: {
  order_id?: string | null;
  invoice_number?: string | null;
  endpoint: string;
  method?: string;
  request_payload?: unknown;
  response_body?: unknown;
  http_status?: number | null;
  success: boolean;
  error?: string | null;
  retry_attempt?: number;
}, settings: Settings) {
  if (!settings.enable_logs) return;
  try {
    await admin.from("ecomdrive_logs").insert({
      order_id: row.order_id ?? null,
      invoice_number: row.invoice_number ?? null,
      endpoint: row.endpoint,
      method: row.method ?? "POST",
      request_payload: row.request_payload ?? null,
      response_body: row.response_body ?? null,
      http_status: row.http_status ?? null,
      success: row.success,
      error: row.error ?? null,
      retry_attempt: row.retry_attempt ?? 0,
    });
  } catch (_) { /* swallow */ }
}

async function ecomFetch(
  settings: Settings,
  path: string,
  init: RequestInit & { query?: Record<string, string | number | undefined> } = {},
) {
  const base = settings.api_base_url.replace(/\/$/, "");
  const url = new URL(`${base}${path}`);
  url.searchParams.set("businessId", settings.business_id);
  for (const [k, v] of Object.entries(init.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const headers = new Headers(init.headers ?? {});
  const apiKey = resolveApiKey(settings);
  headers.set("X-API-Key", apiKey);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), settings.api_timeout_ms || 15000);
  try {
    const res = await fetch(url.toString(), { ...init, headers, signal: ctrl.signal });
    const text = await res.text();
    let parsed: any = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = { raw: text }; }
    return { status: res.status, ok: res.ok, body: parsed };
  } finally {
    clearTimeout(t);
  }
}

function apiSuccess(result: { ok: boolean; body: any }) {
  return result.ok && result.body?.success !== false && !result.body?.error;
}

function apiError(result: { status?: number; body: any }) {
  return result.body?.error || result.body?.message || result.body?.raw || `HTTP ${result.status ?? 500}`;
}

function normalizeProductId(value: unknown) {
  return String(value || "").split("::")[0];
}

async function getProductLookup(items: any[]) {
  const ids = Array.from(new Set(items.map((i) => normalizeProductId(i.product_id ?? i.productId ?? i.id)).filter(Boolean)));
  if (!ids.length) return {} as Record<string, { sku?: string | null; name?: string | null }>;
  const { data } = await admin.from("products").select("id, sku, name").in("id", ids);
  return Object.fromEntries((data ?? []).map((p: any) => [p.id, { sku: p.sku, name: p.name }]));
}

async function getEmployeeEmail(order: any) {
  const explicit = Deno.env.get("ECOMDRIVE_EMPLOYEE_EMAIL")?.trim();
  if (explicit) return explicit;
  const { data: footer } = await admin.from("footer_settings").select("email").eq("id", "default").maybeSingle();
  const { data: contact } = await admin.from("contact_settings").select("email_address").eq("id", "default").maybeSingle();
  return footer?.email || contact?.email_address || order.customer_email || undefined;
}

function buildOrderPayload(order: any, settings: Settings, productLookup: Record<string, { sku?: string | null; name?: string | null }>, courierMethodId?: string, courierCharge?: number) {
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const products = items.map((i: any) => {
    const productId = normalizeProductId(i.product_id ?? i.productId ?? i.id);
    const product = productLookup[productId] ?? {};
    return {
      sku: i.sku || i.product_sku || product.sku || productId || "ITEM",
      name: i.name || product.name || undefined,
      quantity: Number(i.quantity ?? 1),
      price: i.price != null ? Number(i.price) : undefined,
    };
  }).filter((p) => p.sku && p.quantity > 0);

  const ship = order.shipping_address || {};
  const addressParts = [ship.line1, ship.address, ship.full_address, ship.area, ship.delivery_zone, ship.landmark, ship.thana, ship.district, ship.city]
    .filter(Boolean).join(", ");

  return {
    customer: {
      name: (order.customer_name || "Customer").slice(0, 100),
      phone: String(order.customer_phone || "").replace(/\D/g, "").slice(-11) || "01700000000",
      address: (addressParts || ship.full_address || "Address not provided").slice(0, 500),
      district: ship.district || ship.city || undefined,
      thana: ship.thana || ship.area || undefined,
      email: order.customer_email || undefined,
    },
    products,
    delivery: {
      methodId: courierMethodId || settings.default_courier_method_id,
      charge: Number(courierCharge ?? order.shipping_cost ?? settings.default_delivery_charge ?? 0),
    },
    source: "WEB",
    discount: Number(order.discount_amount ?? 0),
    advance: 0,
    note: order.notes || undefined,
  };
}

async function resolveDefaultCourierMethod(settings: Settings) {
  const { data: cached } = await admin.from("ecomdrive_courier_methods")
    .select("method_id")
    .eq("enabled", true)
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  if (cached?.method_id) return cached.method_id as string;

  const result = await ecomFetch(settings, "/delivery-methods", { method: "GET" });
  await logCall({
    endpoint: "/delivery-methods", method: "GET",
    response_body: result.body, http_status: result.status, success: apiSuccess(result),
    error: apiSuccess(result) ? null : apiError(result),
  }, settings);
  if (!apiSuccess(result)) return null;

  const list: any[] = result.body?.data?.deliveryMethods ?? result.body?.data ?? [];
  if (!Array.isArray(list) || !list.length) return null;
  const rows = list.map((m, idx) => ({
    method_id: String(m.id ?? m.methodId),
    name: m.name ?? m.title ?? "Method",
    courier: m.type ?? m.courier ?? m.provider ?? "Unknown",
    requires_location_data: !!(m.requiresLocationData ?? m.requires_location_data),
    enabled: m.enabled !== false,
    sort_order: idx,
    raw: m,
    synced_at: new Date().toISOString(),
  })).filter((m) => m.method_id && m.method_id !== "undefined");
  if (!rows.length) return null;
  await admin.from("ecomdrive_courier_methods").upsert(rows, { onConflict: "method_id" });
  const fallback = rows.find((m) => m.enabled) ?? rows[0];
  await admin.from("ecomdrive_settings").update({ default_courier_method_id: fallback.method_id, last_sync_at: new Date().toISOString(), last_error: null }).eq("id", "default");
  return fallback.method_id;
}

async function pushOrder(orderId: string, opts: { force?: boolean; courierMethodId?: string; courierCharge?: number } = {}) {
  const settings = await getSettings();
  if (!settings.business_id) throw new Error("EcomDrive Business ID not configured");
  if (!resolveApiKey(settings)) throw new Error("EcomDrive API Key not set. Add it in Admin → Settings → EcomDrive.");

  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error || !order) throw new Error("Order not found");
  if (order.ecomdrive_status === "pushed" && !opts.force) {
    return { success: true, alreadyPushed: true, data: order.ecomdrive_response };
  }

  const methodId = opts.courierMethodId || order.ecomdrive_courier_method_id || settings.default_courier_method_id || (await resolveDefaultCourierMethod(settings));
  if (!methodId) throw new Error("No EcomDrive courier method available. Check delivery methods in EcomDrive settings.");

  const productLookup = await getProductLookup(Array.isArray(order.items) ? order.items : []);
  const payload = buildOrderPayload(order, settings, productLookup, methodId, opts.courierCharge);
  (payload as any).employeeEmail = await getEmployeeEmail(order);
  const retryAttempt = (order.ecomdrive_retry_count ?? 0);
  const idempotencyKey = `order-${orderId}-${retryAttempt}`;

  const result = await ecomFetch(settings, "/orders", {
    method: "POST",
    headers: { "X-Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  });

  await logCall({
    order_id: orderId,
    invoice_number: order.order_number,
    endpoint: "/orders",
    request_payload: payload,
    response_body: result.body,
    http_status: result.status,
    success: apiSuccess(result),
    error: apiSuccess(result) ? null : apiError(result),
    retry_attempt: retryAttempt,
  }, settings);

  if (apiSuccess(result)) {
    const d = result.body?.data ?? {};
    // Determine courier name from cached methods
    const { data: m } = await admin.from("ecomdrive_courier_methods").select("courier,name").eq("method_id", methodId).maybeSingle();
    await admin.from("orders").update({
      ecomdrive_status: "pushed",
      ecomdrive_order_id: d.orderId ?? null,
      ecomdrive_invoice_number: d.invoiceNumber ?? order.order_number,
      ecomdrive_courier_name: m?.courier ?? null,
      ecomdrive_courier_method_id: methodId,
      ecomdrive_pushed_at: new Date().toISOString(),
      ecomdrive_response: result.body,
      ecomdrive_error: null,
      ecomdrive_failed_payload: null,
      ecomdrive_next_retry_at: null,
    }).eq("id", orderId);
    return { success: true, data: d };
  } else {
    const errMsg = apiError(result);
    const newCount = retryAttempt + 1;
    const backoff = [1, 5, 15, 60, 360][Math.min(newCount - 1, 4)] * 60_000;
    await admin.from("orders").update({
      ecomdrive_status: "failed",
      ecomdrive_error: errMsg,
      ecomdrive_failed_payload: payload,
      ecomdrive_response: result.body,
      ecomdrive_retry_count: newCount,
      ecomdrive_next_retry_at: new Date(Date.now() + backoff).toISOString(),
    }).eq("id", orderId);
    return { success: false, error: errMsg, status: result.status };
  }
}

async function syncTracking(orderId: string) {
  const settings = await getSettings();
  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) throw new Error("Order not found");
  const inv = order.ecomdrive_invoice_number || order.order_number;
  if (!inv) throw new Error("No invoice number");

  const result = await ecomFetch(settings, "/orders/tracking", {
    method: "GET",
    query: { invoiceNumber: inv },
  });
  await logCall({
    order_id: orderId, invoice_number: inv, endpoint: "/orders/tracking", method: "GET",
    response_body: result.body, http_status: result.status, success: result.ok,
    error: result.ok ? null : (result.body?.error || `HTTP ${result.status}`),
  }, settings);

  if (!result.ok) return { success: false, error: result.body?.error || `HTTP ${result.status}` };

  const d = result.body?.data ?? {};
  const tracking = d.tracking ?? null;
  const courierStatus = d.order?.status as string | undefined;
  const update: Record<string, unknown> = {
    ecomdrive_last_status_sync: new Date().toISOString(),
    ecomdrive_response: result.body,
  };
  if (tracking) {
    update.ecomdrive_courier_name = tracking.courier ?? null;
    update.ecomdrive_tracking_id = tracking.trackingId ?? null;
    update.ecomdrive_rider_name = tracking.riderName ?? null;
    update.ecomdrive_rider_phone = tracking.riderPhone ?? null;
    update.tracking_number = tracking.trackingId ?? order.tracking_number;
  }
  // Mirror EcomDrive lifecycle to local order_status
  if (courierStatus) {
    const map: Record<string, string> = {
      "Pending": "confirmed", "Shipped": "shipped", "Delivered": "delivered",
      "Returned": "cancelled", "Cancelled": "cancelled", "Pending_Cancel": "cancelled",
      "RTS": "shipped", "Partial": "delivered", "Lost": "cancelled",
      "Pending_Return": "shipped", "Exchange": "shipped", "Preorder": "confirmed",
    };
    if (map[courierStatus]) update.order_status = map[courierStatus];
  }
  await admin.from("orders").update(update).eq("id", orderId);
  return { success: true, data: d };
}

async function syncDeliveryMethods() {
  const settings = await getSettings();
  const result = await ecomFetch(settings, "/delivery-methods", { method: "GET" });
  await logCall({
    endpoint: "/delivery-methods", method: "GET",
    response_body: result.body, http_status: result.status, success: apiSuccess(result),
    error: apiSuccess(result) ? null : apiError(result),
  }, settings);
  if (!apiSuccess(result)) return { success: false, error: apiError(result) };

  const list: any[] = result.body?.data?.deliveryMethods ?? result.body?.data ?? [];
  if (Array.isArray(list)) {
    const rows = list.map((m, idx) => ({
      method_id: String(m.id ?? m.methodId),
      name: m.name ?? m.title ?? "Method",
      courier: m.type ?? m.courier ?? m.provider ?? "Unknown",
      requires_location_data: !!(m.requiresLocationData ?? m.requires_location_data),
      enabled: m.enabled !== false,
      sort_order: idx,
      raw: m,
      synced_at: new Date().toISOString(),
    }));
    if (rows.length) {
      await admin.from("ecomdrive_courier_methods").upsert(rows, { onConflict: "method_id" });
    }
  }
  await admin.from("ecomdrive_settings").update({ last_sync_at: new Date().toISOString(), last_error: null }).eq("id", "default");
  return { success: true, count: list?.length ?? 0 };
}

async function testConnection() {
  const settings = await getSettings();
  if (!settings.business_id) return { success: false, error: "Business ID not set" };
  if (!resolveApiKey(settings)) return { success: false, error: "API Key not set" };
  const result = await ecomFetch(settings, "/products", { method: "GET", query: { limit: 1 } });
  await logCall({
    endpoint: "/products", method: "GET",
    response_body: result.body, http_status: result.status, success: apiSuccess(result), error: apiSuccess(result) ? null : apiError(result),
  }, settings);
  await admin.from("ecomdrive_settings").update({
    last_test_at: new Date().toISOString(),
    last_error: apiSuccess(result) ? null : apiError(result),
  }).eq("id", "default");
  return { success: apiSuccess(result), status: result.status, error: apiSuccess(result) ? null : apiError(result) };
}

async function locationProxy(action: string, params: Record<string, string>) {
  const settings = await getSettings();
  const map: Record<string, string> = {
    pathao_cities: "/pathao/cities",
    pathao_zones: "/pathao/zones",
    pathao_areas: "/pathao/areas",
    redx_districts: "/redx/districts",
    redx_areas: "/redx/areas",
    carrybee_cities: "/carrybee/cities",
    carrybee_zones: "/carrybee/zones",
    paperfly_cities: "/paperfly/cities",
    paperfly_areas: "/paperfly/areas",
  };
  const path = map[action];
  if (!path) throw new Error("Unknown location action");
  const result = await ecomFetch(settings, path, { method: "GET", query: params });
  return { success: result.ok, data: result.body, status: result.status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    // Public action: triggered by storefront checkout. Push whenever the integration is enabled.
    if (action === "auto_push") {
      const orderId = String(body.orderId || "");
      if (!orderId) return json(400, { error: "orderId required" });
      const settings = await getSettings().catch(() => null);
      if (!settings || !settings.enabled) {
        return json(200, { success: true, skipped: true });
      }
      try {
        const result = await pushOrder(orderId);
        return json(200, result);
      } catch (e: any) {
        return json(200, { success: false, error: e?.message || String(e) });
      }
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: cErr } = await userClient.auth.getClaims(token);
    if (cErr || !claims?.claims) return json(401, { error: "Unauthorized" });
    const userId = claims.claims.sub;

    const { data: isAdminStaff } = await admin.rpc("is_admin_or_staff", { _user_id: userId });
    if (!isAdminStaff) return json(403, { error: "Forbidden" });

    switch (action) {
      case "test_connection":
        return json(200, await testConnection());
      case "sync_delivery_methods":
        return json(200, await syncDeliveryMethods());
      case "push_order":
        return json(200, await pushOrder(String(body.orderId), { force: !!body.force, courierMethodId: body.courierMethodId, courierCharge: body.courierCharge }));
      case "bulk_push": {
        const ids: string[] = Array.isArray(body.orderIds) ? body.orderIds : [];
        const results = [] as any[];
        for (const id of ids) {
          try { results.push({ id, ...(await pushOrder(id, { force: !!body.force })) }); }
          catch (e: any) { results.push({ id, success: false, error: e?.message || String(e) }); }
        }
        return json(200, { success: true, results });
      }
      case "sync_tracking":
        return json(200, await syncTracking(String(body.orderId)));
      case "bulk_sync_tracking": {
        const ids: string[] = Array.isArray(body.orderIds) ? body.orderIds : [];
        const results = [] as any[];
        for (const id of ids) {
          try { results.push({ id, ...(await syncTracking(id)) }); }
          catch (e: any) { results.push({ id, success: false, error: e?.message || String(e) }); }
        }
        return json(200, { success: true, results });
      }
      case "retry_failed": {
        const { data: failed } = await admin.from("orders").select("id, ecomdrive_retry_count")
          .eq("ecomdrive_status", "failed").limit(50);
        const results = [] as any[];
        for (const o of failed ?? []) {
          if ((o.ecomdrive_retry_count ?? 0) >= 5) continue;
          try { results.push({ id: o.id, ...(await pushOrder(o.id, { force: true })) }); }
          catch (e: any) { results.push({ id: o.id, success: false, error: e?.message || String(e) }); }
        }
        return json(200, { success: true, results });
      }
      case "location":
        return json(200, await locationProxy(String(body.locationAction), body.params || {}));
      default:
        return json(400, { error: `Unknown action: ${action}` });
    }
  } catch (e: any) {
    return json(500, { error: e?.message || String(e) });
  }
});
