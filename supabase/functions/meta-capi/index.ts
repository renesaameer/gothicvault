const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_EVENTS = new Set([
  "PageView", "ViewContent", "Search", "AddToCart",
  "InitiateCheckout", "AddPaymentInfo", "Purchase",
  "Lead", "CompleteRegistration",
]);

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Direct PostgREST fetch (no Supabase SDK to avoid esm.sh stability issues)
async function fetchPixelConfig() {
  const url = `${Deno.env.get("SUPABASE_URL")}/rest/v1/tracking_pixels?platform=eq.facebook&select=pixel_id,access_token,test_event_code,advanced_matching,enabled&limit=1`;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const r = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows?.[0] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { event_name, event_id, event_source_url, custom_data, user_data } = body;

    if (!event_name || !event_id || typeof event_name !== "string" || typeof event_id !== "string") {
      return new Response(JSON.stringify({ error: "Missing event_name or event_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!ALLOWED_EVENTS.has(event_name)) {
      return new Response(JSON.stringify({ error: "Unsupported event_name" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pixel = await fetchPixelConfig();
    if (!pixel?.enabled || !pixel?.pixel_id || !pixel?.access_token) {
      return new Response(JSON.stringify({ skipped: true, reason: "CAPI not configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userData: Record<string, any> = {
      client_user_agent: req.headers.get("user-agent") || "",
      client_ip_address:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip") || "",
    };

    if (user_data && typeof user_data === "object") {
      // Unhashed pass-through (Meta requires plain values for these)
      if (user_data.fbp) userData.fbp = String(user_data.fbp);
      if (user_data.fbc) userData.fbc = String(user_data.fbc);

      // external_id can be hashed or not; Meta accepts both — we hash for consistency
      if (user_data.external_id) userData.external_id = [await sha256(String(user_data.external_id))];

      if (pixel.advanced_matching) {
        if (user_data.em) userData.em = [await sha256(String(user_data.em))];
        if (user_data.ph) userData.ph = [await sha256(String(user_data.ph).replace(/\D/g, ""))];
        if (user_data.fn) userData.fn = [await sha256(String(user_data.fn))];
        if (user_data.ln) userData.ln = [await sha256(String(user_data.ln))];
        if (user_data.ct) userData.ct = [await sha256(String(user_data.ct))];
        if (user_data.country) userData.country = [await sha256(String(user_data.country))];
        if (user_data.zp) userData.zp = [await sha256(String(user_data.zp))];
      }
    }

    // Coerce numeric fields in custom_data
    const cd = { ...(custom_data || {}) };
    if (cd.value !== undefined) cd.value = Number(cd.value);

    const eventPayload = {
      data: [
        {
          event_name,
          event_id,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: event_source_url || "",
          action_source: "website",
          user_data: userData,
          custom_data: cd,
        },
      ],
      ...(pixel.test_event_code ? { test_event_code: pixel.test_event_code } : {}),
    };

    const apiUrl = `https://graph.facebook.com/v21.0/${pixel.pixel_id}/events?access_token=${pixel.access_token}`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventPayload),
    });

    const result = await response.text();

    return new Response(JSON.stringify({ success: response.ok, result }), {
      status: response.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
