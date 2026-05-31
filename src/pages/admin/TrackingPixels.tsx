import { useEffect, useState, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Section, FormRow, StickyActionBar, EmptyState } from "@/components/admin/ui";
import { useDirtyForm } from "@/hooks/useDirtyForm";

interface Pixel {
  id: string;
  platform: string;
  pixel_id: string;
  enabled: boolean;
  access_token: string;
  test_event_code: string;
  advanced_matching: boolean;
}

const PLATFORMS = [
  { value: "facebook", name: "Meta (Facebook) Pixel", placeholder: "e.g. 123456789012345", help: "Find in Meta Events Manager → Data Sources → Pixel ID" },
  { value: "google_analytics", name: "Google Analytics (GA4)", placeholder: "e.g. G-XXXXXXXXXX", help: "Find in GA4 → Admin → Data Streams → Measurement ID" },
  { value: "tiktok", name: "TikTok Pixel", placeholder: "e.g. CXXXXXXXXXXXXXXX", help: "Find in TikTok Ads → Assets → Events → Pixel ID" },
];

const TrackingPixels = forwardRef<HTMLDivElement, { hideTitle?: boolean }>(({ hideTitle }, ref) => {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();
  const { dirty, rebase } = useDirtyForm(pixels);

  const load = async () => {
    const { data } = await supabase.from("tracking_pixels").select("*").order("platform");
    const next = (data as any[]) ?? [];
    setPixels(next);
    rebase(next);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const update = (id: string, field: string, value: any) => {
    setPixels((p) => p.map((px) => (px.id === id ? { ...px, [field]: value } : px)));
  };

  const addPixel = async (platform: string) => {
    const { data, error } = await supabase.from("tracking_pixels").insert({
      platform, pixel_id: "", enabled: false, access_token: "", test_event_code: "", advanced_matching: true,
    }).select().single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    const next = [...pixels, data as any];
    setPixels(next);
    rebase(next);
    toast({ title: `${PLATFORMS.find(p => p.value === platform)?.name || platform} added` });
  };

  const removePixel = async (id: string) => {
    if (!confirm("Remove this pixel?")) return;
    await supabase.from("tracking_pixels").delete().eq("id", id);
    const next = pixels.filter(px => px.id !== id);
    setPixels(next);
    rebase(next);
    toast({ title: "Pixel removed" });
  };

  const save = async () => {
    setSaving(true);
    for (const px of pixels) {
      await supabase.from("tracking_pixels").update({
        pixel_id: px.pixel_id, enabled: px.enabled, access_token: px.access_token,
        test_event_code: px.test_event_code, advanced_matching: px.advanced_matching,
      } as any).eq("id", px.id);
    }
    setSaving(false);
    rebase(pixels);
    toast({ title: "Tracking pixels saved" });
  };

  if (loading) return <div ref={ref}><Skeleton className="h-64 max-w-2xl rounded-2xl" /></div>;

  const existingPlatforms = new Set(pixels.map(px => px.platform));
  const availablePlatforms = PLATFORMS.filter(p => !existingPlatforms.has(p.value));
  const fbPixel = pixels.find((px) => px.platform === "facebook");
  const otherPixels = pixels.filter((px) => px.platform !== "facebook");

  const AddBar = () =>
    availablePlatforms.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {availablePlatforms.map(p => (
          <Button key={p.value} variant="outline" size="sm" className="h-9 gap-1.5 text-[12px]" onClick={() => addPixel(p.value)}>
            <Plus size={12} /> {p.name}
          </Button>
        ))}
      </div>
    ) : null;

  return (
    <div ref={ref} className="max-w-2xl space-y-5 pb-20">
      {!hideTitle && <h1 className="text-xl font-semibold text-foreground tracking-tight">Tracking pixels</h1>}

      {pixels.length === 0 ? (
        <EmptyState
          title="No pixels configured"
          description="Add a Meta, GA4, or TikTok pixel to start tracking conversions."
          action={<AddBar />}
        />
      ) : (
        <>
          {fbPixel && (
            <Section
              title="Meta (Facebook) Pixel"
              description="Browser pixel + server-side Conversions API"
              actions={
                <>
                  <Switch checked={fbPixel.enabled} onCheckedChange={(v) => update(fbPixel.id, "enabled", v)} />
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive hover:text-destructive" onClick={() => removePixel(fbPixel.id)}>
                    <Trash2 size={14} />
                  </Button>
                </>
              }
            >
              <div className="space-y-4">
                <FormRow label="Pixel ID" hint="Meta Events Manager → Data Sources → Pixel ID">
                  <Input className="h-11" inputMode="numeric" value={fbPixel.pixel_id} onChange={(e) => update(fbPixel.id, "pixel_id", e.target.value)} placeholder="e.g. 123456789012345" />
                </FormRow>
                <FormRow label="Conversions API access token" hint="Required for server-side tracking. Events Manager → Settings → Conversions API.">
                  <div className="relative">
                    <Input
                      className="h-11 pr-11"
                      type={showToken ? "text" : "password"}
                      value={fbPixel.access_token || ""}
                      onChange={(e) => update(fbPixel.id, "access_token", e.target.value)}
                      placeholder="EAAxxxxxxx..."
                    />
                    <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </FormRow>
                <FormRow label="Test event code" hint="From Events Manager → Test Events. Remove when going live.">
                  <Input className="h-11" value={fbPixel.test_event_code || ""} onChange={(e) => update(fbPixel.id, "test_event_code", e.target.value)} placeholder="TEST12345" />
                </FormRow>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">Advanced matching</p>
                    <p className="text-[11px] text-muted-foreground/60">Hash & send email/phone for better attribution (SHA-256).</p>
                  </div>
                  <Switch checked={fbPixel.advanced_matching ?? true} onCheckedChange={(v) => update(fbPixel.id, "advanced_matching", v)} />
                </div>
                {fbPixel.access_token && (
                  <div className="rounded-xl bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                    ✅ <span className="font-medium text-foreground">Server-side tracking (CAPI)</span> is active.
                  </div>
                )}
              </div>
            </Section>
          )}

          {otherPixels.map((px) => {
            const label = PLATFORMS.find(p => p.value === px.platform) || { name: px.platform, placeholder: "Pixel ID", help: "" };
            return (
              <Section
                key={px.id}
                title={label.name}
                actions={
                  <>
                    <Switch checked={px.enabled} onCheckedChange={(v) => update(px.id, "enabled", v)} />
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive hover:text-destructive" onClick={() => removePixel(px.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </>
                }
              >
                <FormRow label="Pixel / Measurement ID" hint={label.help}>
                  <Input className="h-11" value={px.pixel_id} onChange={(e) => update(px.id, "pixel_id", e.target.value)} placeholder={label.placeholder} />
                </FormRow>
              </Section>
            );
          })}

          {availablePlatforms.length > 0 && <AddBar />}
        </>
      )}

      <StickyActionBar visible={dirty} message="Unsaved tracking changes">
        <Button size="sm" variant="ghost" onClick={load} disabled={saving}>Discard</Button>
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </StickyActionBar>
    </div>
  );
});

TrackingPixels.displayName = "TrackingPixels";
export default TrackingPixels;
