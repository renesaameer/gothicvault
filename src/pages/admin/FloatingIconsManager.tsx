import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, Loader2, GripVertical, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { FLOATING_PRESETS, getPresetByKey, getReadableColor } from "@/lib/floatingIconPresets";
import IconCropper from "@/components/admin/IconCropper";
import { Skeleton } from "@/components/ui/skeleton";
import { Section, FormRow, StickyActionBar, EmptyState } from "@/components/admin/ui";
import { useDirtyForm } from "@/hooks/useDirtyForm";

interface FloatingIcon {
  id: string;
  label: string;
  url: string;
  icon_url: string | null;
  bg_color: string;
  icon_color: string;
  preset_key: string | null;
  sort_order: number;
  enabled: boolean;
}

interface FloatingSettings {
  enabled: boolean;
  radar_animation: boolean;
  expand_icon_url: string | null;
  animation_style: "radar" | "bounce" | "none";
  animation_intensity: "low" | "med" | "high";
}

// Detects whether an image is square; if not we force the crop modal
const measureImage = (file: File): Promise<{ src: string; square: boolean }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => resolve({ src, square: img.width === img.height });
      img.onerror = reject;
      img.src = src;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const uploadBlob = async (blob: Blob, folder: string, ext = "png") => {
  const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(name, blob, { contentType: blob.type || "image/png" });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(name);
  return data.publicUrl;
};

interface IconPickerProps {
  icon: FloatingIcon;
  onChange: (patch: Partial<FloatingIcon>) => void;
}

const IconPicker = ({ icon, onChange }: IconPickerProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingExt, setPendingExt] = useState("png");
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    setPendingExt(ext === "svg" ? "svg" : "png");

    // SVG: skip crop, upload directly (vector, scales perfectly)
    if (file.type === "image/svg+xml") {
      setUploading(true);
      try {
        const url = await uploadBlob(file, "floating-icons", "svg");
        onChange({ icon_url: url, preset_key: null });
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
      return;
    }

    try {
      const { src, square } = await measureImage(file);
      // Always open the cropper — guarantees consistent 128x128 output
      setCropSrc(src);
      // even if square, allow user to fine-tune
      void square;
    } catch (err: any) {
      toast({ title: "Could not read image", description: err.message, variant: "destructive" });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleCropSave = async (blob: Blob) => {
    setCropSrc(null);
    setUploading(true);
    try {
      const url = await uploadBlob(blob, "floating-icons", "png");
      onChange({ icon_url: url, preset_key: null });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const choosePreset = (key: string) => {
    const preset = getPresetByKey(key);
    if (!preset) return;
    onChange({
      preset_key: key,
      icon_url: "",
      label: icon.label || preset.label,
      bg_color: preset.bgColor,
      icon_color: getReadableColor(preset.bgColor),
    });
  };

  const preset = getPresetByKey(icon.preset_key);

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Preview */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center border border-border/60 shrink-0"
          style={{ backgroundColor: icon.bg_color || "#25D366" }}
        >
          {preset ? (
            <svg viewBox="0 0 24 24" className="w-6 h-6" style={{ color: icon.icon_color || "#fff" }} dangerouslySetInnerHTML={{ __html: preset.svg }} />
          ) : icon.icon_url ? (
            <img src={icon.icon_url} alt="" className="w-6 h-6 object-contain" />
          ) : (
            <span className="text-[11px] uppercase font-bold" style={{ color: icon.icon_color || "#fff" }}>{icon.label?.[0] || "?"}</span>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-8 text-[11px]">
              <Sparkles size={12} className="mr-1" /> Choose preset
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2">
            <div className="space-y-1">
              {FLOATING_PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => choosePreset(p.key)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-left ${icon.preset_key === p.key ? "bg-muted/40" : ""}`}
                >
                  <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: p.bgColor }}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: getReadableColor(p.bgColor) }} dangerouslySetInnerHTML={{ __html: p.svg }} />
                  </span>
                  <span className="text-[12px]">{p.label}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleFile} className="hidden" />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()} className="h-8 text-[11px]">
          {uploading ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Upload size={12} className="mr-1" />}
          Custom
        </Button>
        {(icon.icon_url || icon.preset_key) && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ icon_url: "", preset_key: null })} className="h-8 text-[11px] text-muted-foreground">Clear</Button>
        )}
      </div>

      <IconCropper
        open={!!cropSrc}
        imageSrc={cropSrc}
        onCancel={() => setCropSrc(null)}
        onCrop={handleCropSave}
      />
      
    </>
  );
};

const ExpandIconUpload = ({ value, onChange }: { value: string | null; onChange: (url: string) => void }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const url = await uploadBlob(file, "floating-expand", ext);
      onChange(url);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div className="flex items-center gap-2">
      {value ? (
        <div className="w-9 h-9 rounded-full bg-background border border-border/60 flex items-center justify-center overflow-hidden">
          <img src={value} alt="" className="w-6 h-6 object-contain" />
        </div>
      ) : (
        <span className="text-[11px] text-muted-foreground/50">Default</span>
      )}
      <input ref={ref} type="file" accept="image/*" onChange={upload} className="hidden" />
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => ref.current?.click()} className="h-8 text-[11px]">
        {uploading ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Upload size={12} className="mr-1" />}
        {value ? "Change" : "Upload"}
      </Button>
      {value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")} className="h-8 text-[11px] text-muted-foreground">Clear</Button>}
    </div>
  );
};

const FloatingIconsManager = ({ hideTitle }: { hideTitle?: boolean }) => {
  const [icons, setIcons] = useState<FloatingIcon[]>([]);
  const [settings, setSettings] = useState<FloatingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { dirty, rebase } = useDirtyForm({ settings, icons });

  useEffect(() => {
    Promise.all([
      supabase.from("floating_icons").select("*").order("sort_order"),
      supabase.from("floating_icons_settings").select("*").eq("id", "default").maybeSingle(),
    ]).then(([iRes, sRes]) => {
      const rows = ((iRes.data as any[]) ?? []).map((r) => ({
        ...r,
        icon_color: r.icon_color || "#ffffff",
        preset_key: r.preset_key ?? null,
      }));
      const s = (sRes.data as any) ?? {};
      const nextSettings: FloatingSettings = {
        enabled: s.enabled ?? true,
        radar_animation: s.radar_animation ?? true,
        expand_icon_url: s.expand_icon_url ?? "",
        animation_style: s.animation_style ?? (s.radar_animation === false ? "none" : "radar"),
        animation_intensity: s.animation_intensity ?? "med",
      };
      setIcons(rows);
      setSettings(nextSettings);
      rebase({ settings: nextSettings, icons: rows });
      setLoading(false);
    });
  }, []);

  const updateIcon = (idx: number, patch: Partial<FloatingIcon>) => {
    setIcons((prev) => prev.map((i, idx2) => {
      if (idx2 !== idx) return i;
      const next = { ...i, ...patch };
      // If bg_color changed and we're auto-mode, recompute icon_color
      if (patch.bg_color && !patch.icon_color) {
        next.icon_color = getReadableColor(patch.bg_color);
      }
      return next;
    }));
  };

  const addIcon = () => {
    setIcons((prev) => [...prev, {
      id: `new-${Date.now()}`,
      label: "WhatsApp",
      url: "",
      icon_url: "",
      bg_color: "#25D366",
      icon_color: "#ffffff",
      preset_key: null,
      sort_order: prev.length,
      enabled: true,
    }]);
  };

  const removeIcon = async (idx: number) => {
    const ic = icons[idx];
    if (!ic.id.startsWith("new-")) {
      await supabase.from("floating_icons").delete().eq("id", ic.id);
    }
    setIcons((prev) => prev.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    setIcons((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await supabase.from("floating_icons_settings").upsert({
        id: "default",
        enabled: settings.enabled,
        radar_animation: settings.animation_style === "radar",
        expand_icon_url: settings.expand_icon_url || "",
        animation_style: settings.animation_style,
        animation_intensity: settings.animation_intensity,
        updated_at: new Date().toISOString(),
      } as any);

      for (let i = 0; i < icons.length; i++) {
        const ic = icons[i];
        const payload = {
          label: ic.label,
          url: ic.url,
          icon_url: ic.icon_url || "",
          bg_color: ic.bg_color,
          icon_color: ic.icon_color || getReadableColor(ic.bg_color),
          preset_key: ic.preset_key,
          sort_order: i,
          enabled: ic.enabled,
        };
        if (ic.id.startsWith("new-")) {
          const { data, error } = await supabase.from("floating_icons").insert(payload as any).select("id").single();
          if (error) throw error;
          if (data) setIcons((prev) => prev.map((p, pi) => (pi === i ? { ...p, id: data.id } : p)));
        } else {
          const { error } = await supabase.from("floating_icons").update(payload as any).eq("id", ic.id);
          if (error) throw error;
        }
      }
      toast({ title: "Floating icons saved" });
      setIcons((curr) => {
        rebase({ settings, icons: curr });
        return curr;
      });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      {!hideTitle && (
        <div>
          <h1 className="text-xl font-semibold text-foreground">Floating icons</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Premium floating contact widget. 1 icon = single button, 2+ icons = expandable stack.</p>
        </div>
      )}

      {/* Global Settings */}
      <Section title="Widget settings" description="Site-wide controls for the floating contact widget.">
        <div className="space-y-5">
          <FormRow label="Enable widget" hint="Toggle the widget on or off site-wide." inline>
            <Switch checked={settings.enabled} onCheckedChange={(v) => setSettings({ ...settings, enabled: v })} />
          </FormRow>

          <div className="h-px bg-border/40" />

          <FormRow label="Animation style" hint="Choose how the widget draws attention.">
            <div className="grid grid-cols-3 gap-2">
              {(["radar", "bounce", "none"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSettings({ ...settings, animation_style: s })}
                  className={`px-3 py-2 rounded-lg text-[12px] capitalize border transition-colors ${settings.animation_style === s ? "border-primary bg-primary/10 text-foreground" : "border-border/60 text-muted-foreground hover:bg-muted/30"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </FormRow>

          {settings.animation_style !== "none" && (
            <FormRow label="Intensity">
              <div className="grid grid-cols-3 gap-2">
                {(["low", "med", "high"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSettings({ ...settings, animation_intensity: s })}
                    className={`px-3 py-1.5 rounded-lg text-[12px] capitalize border transition-colors ${settings.animation_intensity === s ? "border-primary bg-primary/10 text-foreground" : "border-border/60 text-muted-foreground hover:bg-muted/30"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </FormRow>
          )}

          <div className="h-px bg-border/40" />

          <FormRow label="Expand button icon" hint="Shown when 2+ icons. Defaults to a chat bubble." inline>
            <ExpandIconUpload
              value={settings.expand_icon_url}
              onChange={(url) => setSettings({ ...settings, expand_icon_url: url })}
            />
          </FormRow>
        </div>
      </Section>

      {/* Icons list */}
      <Section
        title="Icons"
        description="Pick a brand preset or upload a custom (square) icon."
        actions={
          <Button variant="outline" size="sm" onClick={addIcon} className="h-9">
            <Plus size={14} className="mr-1" /> Add
          </Button>
        }
      >
        <div className="space-y-3">
          {icons.length === 0 && (
            <EmptyState
              title="No icons yet"
              description='Click "Add" to create your first floating contact icon.'
            />
          )}

          {icons.map((ic, idx) => (
            <div key={ic.id} className="border border-border/40 rounded-xl p-3 sm:p-4 space-y-3 bg-muted/[0.04]">
              <div className="flex items-center gap-2">
                <div className="flex flex-col -space-y-0.5 text-muted-foreground/40 shrink-0">
                  <button type="button" onClick={() => move(idx, -1)} className="hover:text-foreground transition-colors h-5 w-5 flex items-center justify-center" aria-label="Move up"><ChevronUp size={14} /></button>
                  <button type="button" onClick={() => move(idx, 1)} className="hover:text-foreground transition-colors h-5 w-5 flex items-center justify-center" aria-label="Move down"><ChevronDown size={14} /></button>
                </div>
                <GripVertical size={14} className="text-muted-foreground/20 hidden sm:block shrink-0" />
                <Input value={ic.label} onChange={(e) => updateIcon(idx, { label: e.target.value })} placeholder="Label" className="flex-1 sm:w-36 sm:flex-none h-11 sm:h-9 text-[13px]" />
                <Switch checked={ic.enabled} onCheckedChange={(v) => updateIcon(idx, { enabled: v })} className="sm:hidden" />
                <Button variant="ghost" size="sm" onClick={() => removeIcon(idx)} className="text-destructive h-11 w-11 sm:h-9 sm:w-9 p-0 shrink-0"><Trash2 size={14} /></Button>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={ic.url}
                  onChange={(e) => updateIcon(idx, { url: e.target.value })}
                  placeholder="https://wa.me/..."
                  inputMode="url"
                  className="flex-1 h-11 sm:h-9 text-[13px]"
                />
                <Switch checked={ic.enabled} onCheckedChange={(v) => updateIcon(idx, { enabled: v })} className="hidden sm:inline-flex" />
              </div>

              <IconPicker icon={ic} onChange={(patch) => updateIcon(idx, patch)} />

              <div className="grid grid-cols-2 sm:flex sm:items-center sm:gap-4 sm:flex-wrap gap-3 pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 font-medium">Bg</span>
                  <input type="color" value={ic.bg_color} onChange={(e) => updateIcon(idx, { bg_color: e.target.value, icon_color: getReadableColor(e.target.value) })} className="w-9 h-9 rounded cursor-pointer border border-border/60 bg-transparent shrink-0" />
                  <Input value={ic.bg_color} onChange={(e) => updateIcon(idx, { bg_color: e.target.value })} className="flex-1 sm:w-24 sm:flex-none h-9 text-[11px] font-mono min-w-0" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 font-medium">Icon</span>
                  <input type="color" value={ic.icon_color} onChange={(e) => updateIcon(idx, { icon_color: e.target.value })} className="w-9 h-9 rounded cursor-pointer border border-border/60 bg-transparent shrink-0" />
                  <button
                    type="button"
                    onClick={() => updateIcon(idx, { icon_color: getReadableColor(ic.bg_color) })}
                    className="text-[12px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline px-1"
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <StickyActionBar visible={dirty} message="Unsaved changes">
        <Button variant="ghost" onClick={() => window.location.reload()}>Discard</Button>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </StickyActionBar>
    </div>
  );
};

export default FloatingIconsManager;
