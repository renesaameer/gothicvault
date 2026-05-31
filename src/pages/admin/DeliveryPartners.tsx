import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, Truck, ExternalLink, Send, Eye, EyeOff, Plus } from "lucide-react";

interface DeliveryPartner {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  api_base_url: string;
  api_token: string;
  store_id: string;
  config: Record<string, any>;
}

const DEFAULT_PARTNERS: Omit<DeliveryPartner, "id">[] = [
  {
    name: "Pathao Courier",
    slug: "pathao",
    enabled: false,
    api_base_url: "https://api-hermes.pathao.com",
    api_token: "",
    store_id: "",
    config: { delivery_type: 48, item_type: 2 },
  },
  {
    name: "RedX Courier",
    slug: "redx",
    enabled: false,
    api_base_url: "https://openapi.redx.com.bd/v1.0.0-beta",
    api_token: "",
    store_id: "",
    config: { pickup_store_id: "" },
  },
  {
    name: "Steadfast Courier",
    slug: "steadfast",
    enabled: false,
    api_base_url: "https://portal.packzy.com/api/v1",
    api_token: "",
    store_id: "",
    config: { delivery_type: 0, connected: false, api_base_url: "https://portal.packzy.com/api/v1" },
  },
];

const DeliveryPartners = ({ hideTitle }: { hideTitle?: boolean }) => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showToken, setShowToken] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string } | null>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchPartners(); }, []);

  const fetchPartners = async () => {
    const { data } = await supabase.from("delivery_partners").select("*").order("name");
    const rows = ((data as any[]) ?? []).map((p) => {
      const cfg = p.config || {};
      return {
        ...p,
        api_base_url: p.api_base_url ?? cfg.api_base_url ?? "",
        api_token: p.api_token ?? cfg.api_token ?? "",
        store_id: p.store_id ?? cfg.store_id ?? "",
        config: cfg,
      };
    });
    setPartners(rows);
    setLoading(false);
  };

  const addPartner = async (template: Omit<DeliveryPartner, "id">) => {
    const row = {
      name: template.name,
      slug: template.slug,
      enabled: template.enabled,
      config: { ...template.config, api_base_url: template.api_base_url, api_token: template.api_token, store_id: template.store_id },
    };
    const { error } = await supabase.from("delivery_partners").insert(row as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${template.name} added` });
      fetchPartners();
    }
  };

  const updatePartner = (id: string, field: string, value: any) => {
    setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const updateConfig = (id: string, key: string, value: any) => {
    setPartners((prev) => prev.map((p) => p.id === id ? { ...p, config: { ...p.config, [key]: value } } : p));
  };

  const savePartner = async (partner: DeliveryPartner) => {
    setSaving(partner.id);
    // Persist URL/token inside config so the existing schema (only enabled + config) accepts it
    const mergedConfig = {
      ...(partner.config || {}),
      api_base_url: partner.api_base_url,
      api_token: partner.api_token,
      store_id: partner.store_id,
    };
    const { error } = await supabase.from("delivery_partners").update({
      enabled: partner.enabled,
      config: mergedConfig,
    } as any).eq("id", partner.id);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${partner.name} settings saved` });
    }
    setSaving(null);
  };

  const testConnection = async (partner: DeliveryPartner) => {
    if (partner.slug !== "steadfast") {
      const hasCredentials = partner.slug === "pathao"
        ? !!(partner.config?.client_id && partner.config?.client_secret && partner.config?.username && partner.config?.password)
        : !!partner.api_token;
      if (!hasCredentials) {
        setTestResult((prev) => ({
          ...prev,
          [partner.id]: {
            success: false,
            message: partner.slug === "pathao"
              ? "API credentials are required. Fill in Client ID, Client Secret, Username, and Password."
              : "API token is required",
          },
        }));
        return;
      }
    }
    setTesting(partner.id);
    setTestResult((prev) => ({ ...prev, [partner.id]: null }));

    try {
      if (partner.slug === "steadfast") {
        const { data, error } = await supabase.functions.invoke("steadfast-proxy", { body: { action: "get_balance" } });
        if (error) throw error;
        const ok = (data as any)?.status === 200 || typeof (data as any)?.current_balance === "number";
        setTestResult((prev) => ({
          ...prev,
          [partner.id]: ok
            ? { success: true, message: `Connected. COD balance: ৳${(data as any).current_balance ?? 0}` }
            : { success: false, message: (data as any)?.message || "Connection failed" },
        }));
      } else {
        const resp = await supabase.functions.invoke("courier-proxy", {
          body: { action: "test", partner_id: partner.id },
        });
        const result = resp.data;
        setTestResult((prev) => ({
          ...prev,
          [partner.id]: { success: result?.success || false, message: result?.message || result?.error || "Unknown response" },
        }));
      }
    } catch (err: any) {
      setTestResult((prev) => ({ ...prev, [partner.id]: { success: false, message: err.message || "Connection failed" } }));
    } finally {
      setTesting(null);
    }
  };

  const connectSteadfast = async (partner: DeliveryPartner) => {
    const apiKey = (partner.config?.api_key || "").trim();
    const secretKey = (partner.config?.secret_key || "").trim();
    const baseUrl = (partner.api_base_url || "https://portal.packzy.com/api/v1").trim();
    if (!apiKey || !secretKey) {
      toast({ title: "Api-Key and Secret-Key required", variant: "destructive" });
      return;
    }
    setSaving(partner.id);
    setTestResult((p) => ({ ...p, [partner.id]: null }));
    try {
      const { data, error } = await supabase.functions.invoke("steadfast-proxy", {
        body: { action: "validate", api_key: apiKey, secret_key: secretKey, api_base_url: baseUrl },
      });
      if (error) throw error;
      const ok = (data as any)?.connected === true;
      if (!ok) {
        const msg = (data as any)?.error || "❌ Invalid API Key";
        setTestResult((p) => ({ ...p, [partner.id]: { success: false, message: msg } }));
        toast({ title: "Connection failed", description: msg, variant: "destructive" });
        return;
      }
      const balance = (data as any).balance ?? 0;
      const newConfig = {
        ...(partner.config || {}),
        api_key: apiKey,
        secret_key: secretKey,
        api_base_url: baseUrl,
        connected: true,
        connection_error: null,
        last_validated_at: new Date().toISOString(),
        last_balance: balance,
      };
      const { error: upErr } = await supabase
        .from("delivery_partners")
        .update({ enabled: partner.config?.connected ? partner.enabled : true, config: newConfig } as any)
        .eq("id", partner.id);
      if (upErr) throw upErr;
      setPartners((prev) => prev.map((p) => (p.id === partner.id ? { ...p, enabled: partner.config?.connected ? partner.enabled : true, config: newConfig } : p)));
      setTestResult((p) => ({ ...p, [partner.id]: { success: true, message: `✅ Connected — Balance: ৳${balance}` } }));
      toast({ title: "Steadfast Connected", description: `Balance: ৳${balance}` });
    } catch (e: any) {
      const msg = e?.message || "Connection failed";
      setTestResult((p) => ({ ...p, [partner.id]: { success: false, message: msg } }));
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const refreshSteadfastBalance = async (partner: DeliveryPartner) => {
    setTesting(partner.id);
    try {
      const { data, error } = await supabase.functions.invoke("steadfast-proxy", { body: { action: "get_balance" } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const bal = (data as any)?.current_balance ?? 0;
      const newConfig = { ...(partner.config || {}), last_balance: bal, last_validated_at: new Date().toISOString(), connected: true, connection_error: null };
      setPartners((prev) => prev.map((p) => (p.id === partner.id ? { ...p, config: newConfig } : p)));
      toast({ title: `Balance: ৳${bal}` });
    } catch (e: any) {
      toast({ title: "Could not fetch balance", description: e?.message, variant: "destructive" });
    } finally {
      setTesting(null);
    }
  };

  const existingSlugs = partners.map((p) => p.slug);
  const availableToAdd = DEFAULT_PARTNERS.filter((t) => !existingSlugs.includes(t.slug));

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div>
      {!hideTitle && <h1 className="text-xl font-semibold text-foreground mb-4">Delivery Partners</h1>}

      {availableToAdd.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {availableToAdd.map((t) => (
            <Button key={t.slug} size="sm" variant="outline" onClick={() => addPartner(t)} className="gap-1.5">
              <Plus size={13} /> Add {t.name}
            </Button>
          ))}
        </div>
      )}

      {partners.length === 0 ? (
        <p className="text-sm text-muted-foreground">No delivery partners configured. Add one above.</p>
      ) : (
        <div className="space-y-4">
          {partners.map((partner) => (
            <div key={partner.id} className="bg-background border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Truck size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{partner.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{partner.api_base_url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-muted-foreground">Enable</label>
                  <Switch
                    checked={partner.enabled}
                    onCheckedChange={(v) => updatePartner(partner.id, "enabled", v)}
                  />
                </div>
              </div>

              {partner.slug === "steadfast" && (
                <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${partner.config?.connected ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
                  <div className="text-xs font-medium flex items-center gap-2">
                    {partner.config?.connected
                      ? <>🟢 Connected — Balance: ৳{partner.config?.last_balance ?? 0}</>
                      : <>🔴 Not Connected{partner.config?.connection_error ? ` — ${partner.config.connection_error}` : ""}</>}
                  </div>
                  {partner.config?.connected && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => refreshSteadfastBalance(partner)} disabled={testing === partner.id}>
                      {testing === partner.id ? "..." : "Refresh Balance"}
                    </Button>
                  )}
                </div>
              )}

              <div className="grid gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">API Base URL</label>
                  <Input value={partner.api_base_url} onChange={(e) => updatePartner(partner.id, "api_base_url", e.target.value)} />
                </div>
                {partner.slug !== "pathao" && partner.slug !== "steadfast" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {partner.slug === "redx" ? "API Access Token" : "API Access Token (Bearer)"}
                  </label>
                  <div className="relative">
                    <Input
                      type={showToken[partner.id] ? "text" : "password"}
                      value={partner.api_token}
                      onChange={(e) => updatePartner(partner.id, "api_token", e.target.value)}
                      placeholder="Paste your access token here"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken((p) => ({ ...p, [partner.id]: !p[partner.id] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showToken[partner.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                )}

                {partner.slug === "steadfast" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Api-Key</label>
                        <Input
                          type={showToken[`${partner.id}-api`] ? "text" : "password"}
                          value={partner.config?.api_key ?? ""}
                          onChange={(e) => updateConfig(partner.id, "api_key", e.target.value)}
                          placeholder="Steadfast Api-Key"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Secret-Key</label>
                        <Input
                          type={showToken[`${partner.id}-sec`] ? "text" : "password"}
                          value={partner.config?.secret_key ?? ""}
                          onChange={(e) => updateConfig(partner.id, "secret_key", e.target.value)}
                          placeholder="Steadfast Secret-Key"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowToken((p) => ({ ...p, [`${partner.id}-api`]: !p[`${partner.id}-api`], [`${partner.id}-sec`]: !p[`${partner.id}-sec`] }))}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {showToken[`${partner.id}-api`] ? <EyeOff size={12} /> : <Eye size={12} />} Show / Hide keys
                    </button>
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3 text-[11px] text-muted-foreground">
                      In the Steadfast Merchant Panel → Developer / API, generate your <strong>Api-Key</strong> and <strong>Secret-Key</strong> and paste them here. The default Base URL is <code className="bg-secondary px-1 rounded">https://portal.packzy.com/api/v1</code>. Then press <strong>Connect / Save</strong>.
                    </div>
                  </div>
                )}


                {partner.slug === "pathao" && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Store ID (merchant_store_id)</label>
                      <Input value={partner.store_id} onChange={(e) => updatePartner(partner.id, "store_id", e.target.value)} placeholder="Your merchant store ID" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Sender Name</label>
                        <Input value={partner.config?.sender_name ?? ""} onChange={(e) => updateConfig(partner.id, "sender_name", e.target.value)} placeholder="Your store/business name" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Sender Phone</label>
                        <Input value={partner.config?.sender_phone ?? ""} onChange={(e) => updateConfig(partner.id, "sender_phone", e.target.value)} placeholder="01XXXXXXXXX" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Delivery Type</label>
                        <Input type="number" value={partner.config?.delivery_type ?? 48} onChange={(e) => updateConfig(partner.id, "delivery_type", +e.target.value)} />
                        <p className="text-[10px] text-muted-foreground mt-0.5">48 = Normal, 12 = On-demand</p>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Item Type</label>
                        <Input type="number" value={partner.config?.item_type ?? 2} onChange={(e) => updateConfig(partner.id, "item_type", +e.target.value)} />
                        <p className="text-[10px] text-muted-foreground mt-0.5">1 = Document, 2 = Parcel</p>
                      </div>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                      <p className="text-[11px] font-medium text-foreground">🔑 API Credentials (Required)</p>
                      <p className="text-[10px] text-muted-foreground">Get these from your Pathao Merchant Panel → Developer API → Merchant API Credentials.</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Client ID</label>
                          <Input value={partner.config?.client_id ?? ""} onChange={(e) => updateConfig(partner.id, "client_id", e.target.value)} placeholder="Pathao Client ID" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Client Secret</label>
                          <Input type="password" value={partner.config?.client_secret ?? ""} onChange={(e) => updateConfig(partner.id, "client_secret", e.target.value)} placeholder="Pathao Client Secret" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Username (Email)</label>
                          <Input value={partner.config?.username ?? ""} onChange={(e) => updateConfig(partner.id, "username", e.target.value)} placeholder="Your Pathao merchant email" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Password</label>
                          <Input type="password" value={partner.config?.password ?? ""} onChange={(e) => updateConfig(partner.id, "password", e.target.value)} placeholder="Your Pathao merchant password" />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Token is auto-managed: initial login via username/password, then auto-refreshed.</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground text-[11px]">🗺️ Auto City/Zone/Area Lookup</p>
                      <p>When sending orders, city/zone/area IDs are automatically resolved from the customer's district and city name using the Pathao API.</p>
                    </div>
                  </>
                )}

                {partner.slug === "redx" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Pickup Store ID</label>
                    <Input value={partner.config?.pickup_store_id ?? ""} onChange={(e) => updateConfig(partner.id, "pickup_store_id", e.target.value)} placeholder="Your RedX pickup store ID" />
                  </div>
                )}
              </div>

              {testResult[partner.id] && (
                <div className={`text-xs px-3 py-2 rounded-lg ${testResult[partner.id]!.success ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-destructive/10 text-destructive"}`}>
                  {testResult[partner.id]!.message}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {partner.slug === "steadfast" ? (
                  <Button size="sm" className="gap-1.5" onClick={() => connectSteadfast(partner)} disabled={saving === partner.id}>
                    <Send size={13} /> {saving === partner.id ? "Verifying..." : "Connect / Save"}
                  </Button>
                ) : (
                  <>
                    <Button size="sm" className="gap-1.5" onClick={() => savePartner(partner)} disabled={saving === partner.id}>
                      <Save size={13} /> {saving === partner.id ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => testConnection(partner)} disabled={testing === partner.id}>
                      <Send size={13} /> {testing === partner.id ? "Testing..." : "Test Connection"}
                    </Button>
                  </>
                )}
                {partner.slug === "pathao" && (
                  <a href="https://merchant.pathao.com" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto">
                    <ExternalLink size={12} /> Pathao Merchant Panel
                  </a>
                )}
                {partner.slug === "redx" && (
                  <a href="https://redx.com.bd" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto">
                    <ExternalLink size={12} /> RedX Dashboard
                  </a>
                )}
              </div>

              {partner.slug === "pathao" && (
                <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1.5">
                  <p className="font-medium text-foreground text-[11px]">📦 Pathao API Integration</p>
                  <p>Orders use the simplified API — only full address is required (no city/zone/area IDs).</p>
                  <p className="text-[10px]">Endpoint: <code className="bg-secondary px-1 rounded">{partner.api_base_url}/aladdin/api/v1/orders</code></p>
                </div>
              )}
              {partner.slug === "redx" && (
                <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1.5">
                  <p className="font-medium text-foreground text-[11px]">📦 RedX API Integration</p>
                  <p>Orders are created via RedX Open API. Area lookup is automatic from district name.</p>
                  <p className="text-[10px]">Create: <code className="bg-secondary px-1 rounded">{partner.api_base_url}/parcel</code></p>
                  <p className="text-[10px]">Areas: <code className="bg-secondary px-1 rounded">{partner.api_base_url}/areas?district_name=Dhaka</code></p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryPartners;
