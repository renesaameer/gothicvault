import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const defaultBaseUrl = (slug: string) => {
  if (slug === "pathao") return "https://api-hermes.pathao.com";
  if (slug === "redx") return "https://openapi.redx.com.bd/v1.0.0-beta";
  return "";
};

const normalizePartner = (partner: any) => {
  const cfg = partner?.config || {};
  return {
    ...partner,
    api_base_url: partner?.api_base_url || cfg.api_base_url || defaultBaseUrl(partner?.slug),
    api_token: partner?.api_token || cfg.api_token || "",
    store_id: partner?.store_id || cfg.store_id || "",
    config: cfg,
  };
};

// ── Pathao: get valid access token (password grant → refresh grant → stored token) ──
async function getPathaoToken(partner: any, supabase: any): Promise<string> {
  const cfg = partner.config || {};
  const baseUrl = partner.api_base_url;
  const tokenUrl = `${baseUrl}/aladdin/api/v1/issue-token`;

  // Helper to persist new tokens
  const persistTokens = async (accessToken: string, refreshToken?: string) => {
    const updateConfig = { ...cfg };
    if (refreshToken) updateConfig.refresh_token = refreshToken;
    await supabase.from("delivery_partners").update({
      api_token: accessToken,
      config: updateConfig,
    }).eq("id", partner.id);
  };

  // Strategy 1: Try refresh_token grant if we have one
  if (cfg.client_id && cfg.client_secret && cfg.refresh_token && cfg.refresh_token !== '"ISSUED_REFRESH_TOKEN"') {
    try {
      const resp = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: cfg.client_id,
          client_secret: cfg.client_secret,
          grant_type: "refresh_token",
          refresh_token: cfg.refresh_token,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const newToken = data?.access_token || data?.token;
        const newRefresh = data?.refresh_token;
        if (newToken) {
          await persistTokens(newToken, newRefresh);
          return newToken;
        }
      }
    } catch {}
  }

  // Strategy 2: Password grant (initial token issuance)
  if (cfg.client_id && cfg.client_secret && cfg.username && cfg.password) {
    try {
      const resp = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: cfg.client_id,
          client_secret: cfg.client_secret,
          grant_type: "password",
          username: cfg.username,
          password: cfg.password,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const newToken = data?.access_token || data?.token;
        const newRefresh = data?.refresh_token;
        if (newToken) {
          await persistTokens(newToken, newRefresh);
          return newToken;
        }
      } else {
        const errBody = await resp.text();
        console.error("Pathao password grant failed:", resp.status, errBody);
      }
    } catch (e) {
      console.error("Pathao password grant error:", e);
    }
  }

  // Strategy 3: Fallback to stored static token
  const storedToken = partner.api_token || "";
  if (storedToken && storedToken !== '"ISSUED_ACCESS_TOKEN"') {
    return storedToken;
  }

  return "";
}

// ── Pathao: auto-lookup city/zone/area from address text ──
async function pathaoLookupLocation(
  baseUrl: string,
  token: string,
  district: string,
  city: string
): Promise<{ city_id: number; zone_id: number; area_id: number } | null> {
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" };
  const searchTerm = (district || city || "").toLowerCase().trim();
  if (!searchTerm) return null;

  try {
    // Step 1: Get all cities
    const cityResp = await fetch(`${baseUrl}/aladdin/api/v1/countries/1/city-list`, { headers });
    if (!cityResp.ok) {
      console.error("Pathao city-list failed:", cityResp.status, await cityResp.text());
      return null;
    }
    const cityData = await cityResp.json();
    const cities = cityData?.data?.data || cityData?.data || [];

    // Find best matching city
    let matchedCity = cities.find((c: any) =>
      (c.city_name || "").toLowerCase() === searchTerm
    );
    if (!matchedCity) {
      matchedCity = cities.find((c: any) =>
        (c.city_name || "").toLowerCase().includes(searchTerm) ||
        searchTerm.includes((c.city_name || "").toLowerCase())
      );
    }
    if (!matchedCity) {
      console.error("Pathao: no city match for:", searchTerm, "Available:", cities.map((c: any) => c.city_name));
      return null;
    }
    const cityId = matchedCity.city_id;

    // Step 2: Get zones for matched city
    const zoneResp = await fetch(`${baseUrl}/aladdin/api/v1/cities/${cityId}/zone-list`, { headers });
    if (!zoneResp.ok) return null;
    const zoneData = await zoneResp.json();
    const zones = zoneData?.data?.data || zoneData?.data || [];
    if (zones.length === 0) return null;

    // Try to match zone by city/area name, else use first zone
    const cityLower = (city || "").toLowerCase().trim();
    let matchedZone = cityLower
      ? zones.find((z: any) => (z.zone_name || "").toLowerCase().includes(cityLower))
      : null;
    if (!matchedZone) matchedZone = zones[0];
    const zoneId = matchedZone.zone_id;

    // Step 3: Get areas for matched zone
    const areaResp = await fetch(`${baseUrl}/aladdin/api/v1/zones/${zoneId}/area-list`, { headers });
    if (!areaResp.ok) return { city_id: cityId, zone_id: zoneId, area_id: 0 };
    const areaData = await areaResp.json();
    const areas = areaData?.data?.data || areaData?.data || [];

    let matchedArea = cityLower
      ? areas.find((a: any) => (a.area_name || "").toLowerCase().includes(cityLower))
      : null;
    if (!matchedArea && areas.length > 0) matchedArea = areas[0];
    const areaId = matchedArea?.area_id || 0;

    return { city_id: cityId, zone_id: zoneId, area_id: areaId };
  } catch (e) {
    console.error("Pathao location lookup error:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: hasRole } = await supabase.from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "staff"]);
    if (!hasRole || hasRole.length === 0) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const { action, partner_slug, partner_id } = body;

    // Fetch partner
    let partner: any;
    if (partner_id) {
      const { data } = await supabase.from("delivery_partners").select("*").eq("id", partner_id).single();
      partner = data;
    } else if (partner_slug) {
      const { data } = await supabase.from("delivery_partners").select("*").eq("slug", partner_slug).eq("enabled", true).single();
      partner = data;
    }
    if (!partner) return json({ error: "Delivery partner not found" }, 404);
    partner = normalizePartner(partner);

    // ── Test Connection ──
    if (action === "test") {
      const cfg = partner.config || {};
      if (!partner.api_token && !cfg.client_id) {
        return json({ success: false, message: "API credentials are required. Add Client ID, Client Secret, Username, and Password." });
      }

      if (partner.slug === "pathao") {
        const accessToken = await getPathaoToken(partner, supabase);
        if (!accessToken) {
          return json({ success: false, message: "Failed to obtain access token. Check your Client ID, Client Secret, Username, and Password." });
        }
        const resp = await fetch(`${partner.api_base_url}/aladdin/api/v1/stores`, {
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Accept: "application/json" },
        });
        const data = await resp.json();
        if (resp.ok) {
          const stores = data?.data?.data || [];
          return json({ success: true, message: `Connected! ${stores.length} store(s) found. Token auto-managed.` });
        }
        return json({ success: false, message: `Error ${resp.status}: ${data?.message || resp.statusText}` });
      }

      if (partner.slug === "redx") {
        const redxToken = partner.api_token || "";
        const resp = await fetch(`${partner.api_base_url}/pickup/stores`, {
          headers: { "API-ACCESS-TOKEN": `Bearer ${redxToken}`, "Content-Type": "application/json" },
        });
        const data = await resp.json();
        if (resp.ok) {
          const stores = data?.data || data?.stores || [];
          const count = Array.isArray(stores) ? stores.length : 0;
          return json({ success: true, message: `Connected! ${count} pickup store(s) found.` });
        }
        return json({ success: false, message: `Error ${resp.status}: ${data?.message || resp.statusText}` });
      }

      return json({ success: false, message: "Unknown courier type" });
    }

    // ── Send Order ──
    if (action === "send_order") {
      const { order_data } = body;
      if (!order_data) return json({ error: "order_data required" }, 400);

      if (partner.slug === "pathao") {
        const accessToken = await getPathaoToken(partner, supabase);
        if (!accessToken) {
          return json({ success: false, message: "Failed to obtain Pathao access token. Check credentials in Settings." });
        }

        // Auto-resolve store_id: if not numeric, fetch from Pathao API
        let storeId = Number(partner.store_id);
        if (!storeId || isNaN(storeId)) {
          try {
            const storeResp = await fetch(`${partner.api_base_url}/aladdin/api/v1/stores`, {
              headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Accept: "application/json" },
            });
            if (storeResp.ok) {
              const storeData = await storeResp.json();
              const stores = storeData?.data?.data || [];
              if (stores.length > 0) {
                // Try matching by name, fallback to first store
                const nameMatch = partner.store_id
                  ? stores.find((s: any) => (s.store_name || "").toLowerCase().includes(partner.store_id.toLowerCase()))
                  : null;
                storeId = nameMatch?.store_id || stores[0].store_id;
                // Persist the resolved numeric store_id for future use
                await supabase.from("delivery_partners").update({ store_id: String(storeId) }).eq("id", partner.id);
                console.log(`Pathao: auto-resolved store_id to ${storeId}`);
              }
            }
          } catch (e) {
            console.error("Pathao store lookup error:", e);
          }
        }

        if (!storeId || isNaN(storeId)) {
          return json({ success: false, message: "Store ID is required. Go to Settings → Delivery Partners and enter your Pathao numeric Store ID." });
        }

        // Use manual overrides if provided, otherwise auto-lookup
        let location: { city_id: number; zone_id: number; area_id: number } | null = null;
        if (order_data.pathao_city_id && order_data.pathao_zone_id) {
          location = {
            city_id: Number(order_data.pathao_city_id),
            zone_id: Number(order_data.pathao_zone_id),
            area_id: Number(order_data.pathao_area_id) || 0,
          };
          console.log("Pathao: using manual override IDs:", JSON.stringify(location));
        } else {
          location = await pathaoLookupLocation(
            partner.api_base_url,
            accessToken,
            order_data.district || "",
            order_data.city || ""
          );
        }

        if (!location) {
          return json({
            success: false,
            message: `Could not resolve Pathao city/zone for district "${order_data.district || "unknown"}", city "${order_data.city || "unknown"}". Please check the shipping address or use manual overrides.`,
          });
        }

        const cfg = partner.config || {};
        const payload = {
          store_id: storeId,
          merchant_order_id: order_data.order_number || "",
          sender_name: cfg.sender_name || "Store",
          sender_phone: cfg.sender_phone || "",
          recipient_name: order_data.customer_name,
          recipient_phone: order_data.customer_phone || "",
          recipient_address: order_data.full_address,
          recipient_city: location.city_id,
          recipient_zone: location.zone_id,
          recipient_area: location.area_id,
          delivery_type: cfg.delivery_type || 48,
          item_type: cfg.item_type || 2,
          special_instruction: order_data.notes || "",
          item_quantity: order_data.total_quantity || 1,
          item_weight: cfg.default_weight || 0.5,
          item_description: order_data.item_description || "",
          amount_to_collect: Number(order_data.total) || 0,
        };

        console.log("Pathao order payload:", JSON.stringify(payload));

        const resp = await fetch(`${partner.api_base_url}/aladdin/api/v1/orders`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await resp.json();
        console.log("Pathao order response:", resp.status, JSON.stringify(result));

        if (resp.ok && result?.data?.consignment_id) {
          return json({
            success: true,
            tracking_id: result.data.consignment_id,
            courier: "pathao",
            message: `Consignment: ${result.data.consignment_id}`,
          });
        }
        return json({ success: false, message: result?.message || JSON.stringify(result) });
      }

      if (partner.slug === "redx") {
        const redxToken = partner.api_token || "";
        let deliveryArea = order_data.city || order_data.district || "";
        let deliveryAreaId = 1;
        try {
          const areaResp = await fetch(
            `${partner.api_base_url}/areas?district_name=${encodeURIComponent(order_data.district || order_data.city || "Dhaka")}`,
            { headers: { "API-ACCESS-TOKEN": `Bearer ${redxToken}`, "Content-Type": "application/json" } },
          );
          if (areaResp.ok) {
            const areaData = await areaResp.json();
            const areas = areaData?.areas || [];
            if (areas.length > 0) { deliveryArea = areas[0].name; deliveryAreaId = areas[0].id; }
          }
        } catch {}

        const payload = {
          customer_name: order_data.customer_name,
          customer_phone: order_data.customer_phone || "",
          delivery_area: deliveryArea,
          delivery_area_id: deliveryAreaId,
          customer_address: order_data.full_address,
          merchant_invoice_id: order_data.order_number,
          cash_collection_amount: String(Number(order_data.total)),
          parcel_weight: 500,
          instruction: order_data.notes || "",
          value: String(Number(order_data.total)),
          ...(partner.config?.pickup_store_id ? { pickup_store_id: Number(partner.config.pickup_store_id) } : {}),
        };

        const resp = await fetch(`${partner.api_base_url}/parcel`, {
          method: "POST",
          headers: { "API-ACCESS-TOKEN": `Bearer ${redxToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await resp.json();
        if (resp.ok && result?.tracking_id) {
          return json({ success: true, tracking_id: result.tracking_id, courier: "redx", message: `Tracking: ${result.tracking_id}` });
        }
        return json({ success: false, message: result?.message || JSON.stringify(result) });
      }

      return json({ error: "Unknown courier type" }, 400);
    }

    // ── Fetch Pathao Locations ──
    if (action === "pathao_locations") {
      const { location_type, parent_id } = body;
      if (partner.slug !== "pathao") return json({ error: "Not a Pathao partner" }, 400);
      const accessToken = await getPathaoToken(partner, supabase);
      if (!accessToken) return json({ error: "Failed to obtain Pathao token" }, 400);
      const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Accept: "application/json" };
      const baseUrl = partner.api_base_url;

      try {
        if (location_type === "cities") {
          const resp = await fetch(`${baseUrl}/aladdin/api/v1/countries/1/city-list`, { headers });
          if (!resp.ok) return json({ error: `Pathao API error: ${resp.status}` }, resp.status);
          const data = await resp.json();
          const cities = (data?.data?.data || data?.data || []).map((c: any) => ({ id: c.city_id, name: c.city_name }));
          return json({ success: true, items: cities });
        }
        if (location_type === "zones" && parent_id) {
          const resp = await fetch(`${baseUrl}/aladdin/api/v1/cities/${parent_id}/zone-list`, { headers });
          if (!resp.ok) return json({ error: `Pathao API error: ${resp.status}` }, resp.status);
          const data = await resp.json();
          const zones = (data?.data?.data || data?.data || []).map((z: any) => ({ id: z.zone_id, name: z.zone_name }));
          return json({ success: true, items: zones });
        }
        if (location_type === "areas" && parent_id) {
          const resp = await fetch(`${baseUrl}/aladdin/api/v1/zones/${parent_id}/area-list`, { headers });
          if (!resp.ok) return json({ error: `Pathao API error: ${resp.status}` }, resp.status);
          const data = await resp.json();
          const areas = (data?.data?.data || data?.data || []).map((a: any) => ({ id: a.area_id, name: a.area_name }));
          return json({ success: true, items: areas });
        }
        return json({ error: "Invalid location_type. Use: cities, zones, areas" }, 400);
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("courier-proxy error:", err);
    return json({ error: err.message }, 500);
  }
});
