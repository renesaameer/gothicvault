// Steadfast cron-driven status sync. Runs every 30 min.
// Also retries orders where create_order previously failed.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_BASE = "https://portal.packzy.com/api/v1";

const extractSteadfastMessage = (data: any, fallback: string) => {
  if (typeof data === "string") return data;
  return data?.message || data?.error || data?.raw || fallback;
};

const isInactiveAccount = (message: string) => /account\s+is\s+not\s+active/i.test(message);

async function recordSteadfastIssue(supabase: any, message: string) {
  const { data: row } = await supabase.from("delivery_partners").select("config").eq("slug", "steadfast").maybeSingle();
  const cfg = row?.config || {};
  await supabase.from("delivery_partners").update({
    config: { ...cfg, connection_error: message, last_failed_at: new Date().toISOString() },
  }).eq("slug", "steadfast");
}

const STATUS_MAP: Record<string, { internal: string; note?: string }> = {
  pending: { internal: "processing" },
  in_review: { internal: "pending" },
  delivered: { internal: "delivered" },
  partial_delivered: { internal: "delivered", note: "Partially delivered" },
  cancelled: { internal: "cancelled" },
  hold: { internal: "processing", note: "On hold" },
  unknown_approval: { internal: "pending" },
};

async function loadCreds(supabase: any) {
  let apiKey = Deno.env.get("STEADFAST_API_KEY") ?? "";
  let secret = Deno.env.get("STEADFAST_SECRET_KEY") ?? "";
  let base = DEFAULT_BASE;
  try {
    const { data } = await supabase.from("delivery_partners").select("config").eq("slug", "steadfast").maybeSingle();
    const cfg = (data?.config ?? {}) as Record<string, any>;
    if (cfg.api_key) apiKey = String(cfg.api_key);
    if (cfg.secret_key) secret = String(cfg.secret_key);
    if (cfg.api_base_url) base = String(cfg.api_base_url).replace(/\/+$/, "");
  } catch {}
  return { apiKey, secret, base };
}

async function callSteadfast(supabase: any, path: string, init: RequestInit = {}) {
  const { apiKey, secret, base } = await loadCreds(supabase);
  const resp = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Api-Key": apiKey,
      "Secret-Key": secret,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers as any),
    },
  });
  const text = await resp.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  console.log(`[steadfast-sync] ${init.method || "GET"} ${path} -> ${resp.status}`);
  if (!resp.ok) {
    const msg = extractSteadfastMessage(data, `HTTP ${resp.status}`);
    if (isInactiveAccount(msg)) await recordSteadfastIssue(supabase, msg);
    throw new Error(`HTTP ${resp.status}: ${msg}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const summary = { synced: 0, retried: 0, errors: 0 };

  try {
    // Guard: only run when admin has connected the integration
    const { data: partner } = await supabase.from("delivery_partners").select("enabled, config").eq("slug", "steadfast").maybeSingle();
    if (!partner?.enabled || partner?.config?.connected !== true) {
      return new Response(JSON.stringify({ skipped: "not_connected" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step 1: status sync for already-pushed orders
    const { data: pushed } = await supabase
      .from("orders")
      .select("id, order_number, steadfast_consignment_id, order_status")
      .not("steadfast_consignment_id", "is", null)
      .not("order_status", "in", "(delivered,cancelled)")
      .limit(200);

    for (const o of pushed ?? []) {
      try {
        const data = await callSteadfast(supabase, `/status_by_cid/${encodeURIComponent(o.steadfast_consignment_id)}`);
        const sfStatus = String(data?.delivery_status ?? data?.status ?? "").toLowerCase();
        const map = STATUS_MAP[sfStatus];
        const updates: any = {
          steadfast_status: sfStatus || null,
          last_status_sync_time: new Date().toISOString(),
        };
        if (map) {
          updates.order_status = map.internal;
          if (map.note) updates.notes = map.note;
        }
        await supabase.from("orders").update(updates).eq("id", o.id);
        summary.synced++;
      } catch (e: any) {
        console.error("sync error", o.order_number, e?.message);
        summary.errors++;
      }
    }

    // Step 2: retry queue — push orders that failed previously or were never pushed (COD only)
    const { data: pending } = await supabase
      .from("orders")
      .select("*")
      .is("steadfast_consignment_id", null)
      .eq("courier_sync_failed", true)
      .eq("payment_method", "cod")
      .not("order_status", "in", "(delivered,cancelled)")
      .limit(50);

    for (const o of pending ?? []) {
      try {
        const phone = (o.customer_phone || "").replace(/\D/g, "");
        if (phone.length < 10) continue;
        const shipping = o.shipping_address || {};
        const address = o.customer_address || [shipping.line1, shipping.landmark, shipping.city, shipping.district, shipping.country].filter(Boolean).join(", ");
        const payload = {
          invoice: o.order_number,
          recipient_name: o.customer_name || "Customer",
          recipient_phone: phone,
          recipient_address: address,
          cod_amount: Number(o.total),
          note: o.notes || "",
          delivery_type: 0,
        };
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
        }).eq("id", o.id);
        summary.retried++;
      } catch (e: any) {
        await supabase.from("orders").update({
          courier_last_error: String(e?.message ?? e).slice(0, 500),
        }).eq("id", o.id);
        summary.errors++;
      }
    }

    return new Response(JSON.stringify({ success: true, ...summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[steadfast-sync-status] fatal:", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
