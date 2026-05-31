// Steadfast Courier proxy — handles create_order, bulk_create, status lookups, returns, balance.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_BASE = "https://portal.packzy.com/api/v1";
const json = (d: any, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const extractSteadfastMessage = (data: any, fallback: string) => {
  if (typeof data === "string") return data;
  return data?.message || data?.error || data?.raw || fallback;
};

const isInactiveAccount = (message: string) => /account\s+is\s+not\s+active/i.test(message);

async function recordSteadfastIssue(supabase: any, message: string) {
  const { data: row } = await supabase.from("delivery_partners").select("config").eq("slug", "steadfast").maybeSingle();
  const cfg = row?.config || {};
  await supabase.from("delivery_partners").update({
    config: {
      ...cfg,
      connection_error: message,
      last_failed_at: new Date().toISOString(),
    },
  }).eq("slug", "steadfast");
}

async function loadCreds(supabase: any) {
  // Prefer DB config (admin-editable), fall back to env secrets
  let apiKey = "";
  let secret = "";
  let base = DEFAULT_BASE;
  try {
    const { data } = await supabase.from("delivery_partners").select("config").eq("slug", "steadfast").maybeSingle();
    const cfg = (data?.config ?? {}) as Record<string, any>;
    if (cfg.api_key) apiKey = String(cfg.api_key);
    if (cfg.secret_key) secret = String(cfg.secret_key);
    if (cfg.api_base_url) base = String(cfg.api_base_url).replace(/\/+$/, "");
  } catch (e) {
    console.warn("[steadfast] could not load DB creds:", (e as any)?.message);
  }
  if (!apiKey) apiKey = Deno.env.get("STEADFAST_API_KEY") ?? "";
  if (!secret) secret = Deno.env.get("STEADFAST_SECRET_KEY") ?? "";
  if (!apiKey || !secret) throw new Error("Steadfast API credentials are not configured (set them from Admin → Delivery Partners)");
  return { apiKey, secret, base };
}

async function callSteadfast(supabase: any, path: string, init: RequestInit = {}) {
  const { apiKey, secret, base } = await loadCreds(supabase);
  const url = `${base}${path}`;
  const headers = {
    "Api-Key": apiKey,
    "Secret-Key": secret,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  const resp = await fetch(url, { ...init, headers });
  const text = await resp.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  console.log(`[steadfast] ${init.method || "GET"} ${path} -> ${resp.status}`, data);
  if (!resp.ok) {
    const msg = extractSteadfastMessage(data, `HTTP ${resp.status}`);
    if (isInactiveAccount(msg)) {
      await recordSteadfastIssue(supabase, msg);
      throw new Error("Steadfast account is not active. Contact Steadfast support to activate merchant API. Your saved connection was kept active.");
    }
    throw new Error(`Steadfast API error [${resp.status}]: ${msg}`);
  }
  return data;
}

function adminClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function pushOrder(supabase: any, order: any) {
  const phone = (order.customer_phone || "").replace(/\D/g, "");
  if (phone.length < 10) throw new Error("Invalid phone number");
  const shipping = order.shipping_address || {};
  const address = order.customer_address || [shipping.line1, shipping.landmark, shipping.city, shipping.district, shipping.country].filter(Boolean).join(", ");
  const payload = {
    invoice: order.order_number,
    recipient_name: order.customer_name || "Customer",
    recipient_phone: phone,
    recipient_address: address,
    cod_amount: order.payment_method === "cod" ? Number(order.total) : 0,
    note: order.notes || "",
    delivery_type: 0,
  };
  try {
    const data = await callSteadfast(supabase, "/create_order", { method: "POST", body: JSON.stringify(payload) });
    const c = data?.consignment || data;
    await supabase.from("orders").update({
      steadfast_consignment_id: String(c?.consignment_id ?? ""),
      steadfast_tracking_code: c?.tracking_code ?? null,
      steadfast_status: c?.status ?? "in_review",
      tracking_number: c?.tracking_code ?? String(c?.consignment_id ?? ""),
      delivery_partner: "steadfast",
      courier_sync_failed: false,
      courier_last_error: null,
      last_status_sync_time: new Date().toISOString(),
    }).eq("id", order.id);
    return { success: true, consignment: c };
  } catch (e: any) {
    await supabase.from("orders").update({
      courier_sync_failed: true,
      courier_last_error: String(e?.message ?? e).slice(0, 500),
    }).eq("id", order.id);
    throw e;
  }
}

const STATUS_MAP: Record<string, string> = {
  pending: "processing",
  in_review: "pending",
  delivered: "delivered",
  partial_delivered: "delivered",
  cancelled: "cancelled",
  hold: "processing",
  unknown_approval: "pending",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const supabase = adminClient();

    // Gate Steadfast actions if the admin has not connected/enabled the integration.
    // `validate` is intentionally excluded because it tests raw credentials before saving.
    const gated = new Set(["create_order", "bulk_create", "get_balance"]);
    if (gated.has(action)) {
      const { data: partner } = await supabase.from("delivery_partners").select("enabled, config").eq("slug", "steadfast").maybeSingle();
      if (!partner?.enabled || partner?.config?.connected !== true) {
        return json({ error: "Courier not connected", skipped: "not_connected" }, 200);
      }
    }

    if (action === "create_order") {
      const orderId = String(body.orderId || "");
      if (!orderId) return json({ error: "orderId required" }, 400);
      const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (error || !order) return json({ error: "Order not found" }, 404);
      if (order.steadfast_consignment_id) {
        return json({
          success: true,
          skipped: "already_synced",
          consignment: {
            consignment_id: order.steadfast_consignment_id,
            tracking_code: order.steadfast_tracking_code,
            status: order.steadfast_status,
          },
        });
      }
      const result = await pushOrder(supabase, order);
      return json(result);
    }

    if (action === "bulk_create") {
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .is("steadfast_consignment_id", null)
        .eq("payment_method", "cod")
        .not("order_status", "in", "(delivered,cancelled)")
        .limit(500);
      if (!orders || orders.length === 0) return json({ success: true, count: 0, message: "কোনো অসিঙ্ক অর্ডার নেই" });

      const items = orders.map((o: any) => {
        const phone = (o.customer_phone || "").replace(/\D/g, "");
        const shipping = o.shipping_address || {};
        const address = o.customer_address || [shipping.line1, shipping.landmark, shipping.city, shipping.district, shipping.country].filter(Boolean).join(", ");
        return {
          invoice: o.order_number,
          recipient_name: o.customer_name || "Customer",
          recipient_phone: phone,
          recipient_address: address,
          cod_amount: o.payment_method === "cod" ? Number(o.total) : 0,
          note: o.notes || "",
          delivery_type: 0,
        };
      });

      try {
        const data = await callSteadfast(supabase, "/create_order/bulk-order", {
          method: "POST",
          body: JSON.stringify({ data: items }),
        });
        const list = data?.data || data?.consignments || [];
        const byInvoice: Record<string, any> = {};
        for (const c of list) byInvoice[c.invoice] = c;
        for (const o of orders) {
          const c = byInvoice[o.order_number];
          if (c?.consignment_id) {
            await supabase.from("orders").update({
              steadfast_consignment_id: String(c.consignment_id),
              steadfast_tracking_code: c.tracking_code ?? null,
              steadfast_status: c.status ?? "in_review",
              tracking_number: c.tracking_code ?? String(c.consignment_id),
              delivery_partner: "steadfast",
              courier_sync_failed: false,
              courier_last_error: null,
              last_status_sync_time: new Date().toISOString(),
            }).eq("id", o.id);
          } else {
            await supabase.from("orders").update({
              courier_sync_failed: true,
              courier_last_error: "Bulk push: no consignment returned",
            }).eq("id", o.id);
          }
        }
        return json({ success: true, count: list.length, total: orders.length });
      } catch (e: any) {
        const message = String(e?.message ?? e);
        await supabase.from("orders").update({
          courier_sync_failed: true,
          courier_last_error: message.slice(0, 500),
        }).in("id", orders.map((o: any) => o.id));
        return json({ error: message, count: 0, total: orders.length }, 200);
      }
    }

    if (action === "status_by_invoice") {
      const inv = String(body.invoice || "");
      const data = await callSteadfast(supabase, `/status_by_invoice/${encodeURIComponent(inv)}`);
      return json(data);
    }

    if (action === "status_by_tracking") {
      const tc = String(body.tracking || "");
      const data = await callSteadfast(supabase, `/status_by_trackingcode/${encodeURIComponent(tc)}`);
      return json(data);
    }

    if (action === "status_by_cid") {
      const cid = String(body.consignment_id || "");
      const data = await callSteadfast(supabase, `/status_by_cid/${encodeURIComponent(cid)}`);
      return json(data);
    }

    if (action === "create_return") {
      const payload: any = {};
      if (body.consignment_id) payload.consignment_id = body.consignment_id;
      if (body.invoice) payload.invoice = body.invoice;
      if (!payload.consignment_id && !payload.invoice) return json({ error: "consignment_id or invoice required" }, 400);
      const data = await callSteadfast(supabase, "/create_return_request", { method: "POST", body: JSON.stringify(payload) });
      return json(data);
    }

    if (action === "get_balance") {
      const data = await callSteadfast(supabase, "/get_balance");
      // refresh DB cached balance
      try {
        const { data: row } = await supabase.from("delivery_partners").select("config").eq("slug", "steadfast").maybeSingle();
        const cfg = row?.config || {};
        await supabase.from("delivery_partners").update({
          config: { ...cfg, last_balance: data?.current_balance ?? null, last_validated_at: new Date().toISOString(), connected: true },
        }).eq("slug", "steadfast");
      } catch {}
      return json(data);
    }

    if (action === "validate") {
      // Validate raw creds without persisting; admin uses this before save.
      const apiKey = String(body.api_key || "").trim();
      const secret = String(body.secret_key || "").trim();
      const base = String(body.api_base_url || DEFAULT_BASE).replace(/\/+$/, "");
      if (!apiKey || !secret) return json({ connected: false, error: "Api-Key এবং Secret-Key প্রয়োজন" }, 400);
      try {
        const headers = { "Api-Key": apiKey, "Secret-Key": secret, "Content-Type": "application/json", Accept: "application/json" };
        const resp = await fetch(`${base}/get_balance`, { headers });
        const text = await resp.text();
        let d: any = null; try { d = text ? JSON.parse(text) : null; } catch { d = { raw: text }; }
        console.log(`[steadfast] validate -> ${resp.status}`, d);
        if (!resp.ok || (d?.status && d.status !== 200)) {
          const msg = extractSteadfastMessage(d, `HTTP ${resp.status}`);
          return json({ connected: false, error: isInactiveAccount(msg) ? "Steadfast account is not active. Contact Steadfast support to activate merchant API." : msg }, 200);
        }
        const msg = extractSteadfastMessage(d, "");
        if (isInactiveAccount(msg)) {
          return json({ connected: false, error: "Steadfast account is not active. Contact Steadfast support to activate merchant API." }, 200);
        }

        return json({ connected: true, balance: d?.current_balance ?? 0 });
      } catch (e: any) {
        return json({ connected: false, error: String(e?.message ?? e) }, 200);
      }
    }

    if (action === "status_map") {
      return json({ map: STATUS_MAP });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    console.error("[steadfast-proxy] error:", e);
    const message = String(e?.message ?? e);
    const expectedCourierError = /Steadfast|Courier not connected|credentials/i.test(message);
    return json({ error: message }, expectedCourierError ? 200 : 500);
  }
});
