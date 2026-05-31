import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useDirtyForm } from "@/hooks/useDirtyForm";
import { PageHeader, Section, EmptyState } from "@/components/admin/ui";
import { Plus, Trash2, Loader2, GripVertical, Video as VideoIcon, Image as ImageIcon, Star, Eye, EyeOff } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import { parseVideoUrl, buildEmbedUrl } from "@/lib/videoUrl";

const PreviewThumb: React.FC<{ url: string; thumbnail: string | null }> = ({ url, thumbnail }) => {
  const src = parseVideoUrl(url);
  if (src.kind === "invalid") {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
        <VideoIcon size={24} />
      </div>
    );
  }
  if (src.kind === "youtube" || src.kind === "vimeo") {
    const poster = thumbnail || (src.kind === "youtube" ? src.thumbnail : null);
    if (poster) {
      return (
        <div className="relative w-full h-full">
          <img src={poster} alt="" className="w-full h-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white text-[10px] uppercase tracking-wider">
              {src.kind === "youtube" ? "YT" : "Vimeo"}
            </span>
          </span>
        </div>
      );
    }
    const embed = buildEmbedUrl(src, { autoplay: false, muted: true, loop: false, controls: false });
    return embed ? (
      <iframe src={embed} className="w-full h-full border-0" title="preview" />
    ) : null;
  }
  return (
    <video
      src={src.src}
      poster={thumbnail || undefined}
      muted
      loop
      playsInline
      autoPlay
      className="w-full h-full object-cover"
    />
  );
};

interface VideoTestimonial {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string | null;
  subtitle: string | null;
  product_id: string | null;
  cta_text: string | null;
  cta_enabled: boolean;
  enabled: boolean;
  featured: boolean;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  sort_order: number;
}

interface ProductOption { id: string; name: string; slug: string; }

const blank = (): VideoTestimonial => ({
  id: `new-${Math.random().toString(36).slice(2)}`,
  video_url: "",
  thumbnail_url: null,
  title: "",
  subtitle: "",
  product_id: null,
  cta_text: "Shop Now",
  cta_enabled: true,
  enabled: true,
  featured: false,
  autoplay: true,
  muted: true,
  loop: true,
  sort_order: 0,
});

const VideoTestimonialsManager = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<VideoTestimonial[]>([]);
  const [original, setOriginal] = useState<VideoTestimonial[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dragIdx = useRef<number | null>(null);

  const dirty = JSON.stringify(rows) !== JSON.stringify(original);
  useDirtyForm(dirty);

  useEffect(() => {
    (async () => {
      const [vRes, pRes] = await Promise.all([
        supabase.from("video_testimonials").select("*").order("sort_order"),
        supabase.from("products").select("id, name, slug").order("name"),
      ]);
      const data = ((vRes.data as VideoTestimonial[]) || []).map((r, i) => ({ ...r, sort_order: r.sort_order ?? i }));
      setRows(data);
      setOriginal(JSON.parse(JSON.stringify(data)));
      setProducts((pRes.data as ProductOption[]) || []);
      setLoading(false);
    })();
  }, []);

  const update = (id: string, patch: Partial<VideoTestimonial>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const add = () => setRows((r) => [...r, { ...blank(), sort_order: r.length }]);

  const remove = (id: string) => setRows((r) => r.filter((x) => x.id !== id));

  const move = (from: number, to: number) => {
    if (from === to) return;
    setRows((r) => {
      const next = [...r];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next.map((x, i) => ({ ...x, sort_order: i }));
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const incomplete = rows.find((r) => !r.video_url);
      if (incomplete) {
        toast({ title: "Each video needs a URL", variant: "destructive" });
        setSaving(false);
        return;
      }

      // Diff: delete removed
      const originalIds = new Set(original.filter((o) => !o.id.startsWith("new-")).map((o) => o.id));
      const currentIds = new Set(rows.filter((r) => !r.id.startsWith("new-")).map((r) => r.id));
      const toDelete = [...originalIds].filter((id) => !currentIds.has(id));
      if (toDelete.length) {
        await supabase.from("video_testimonials").delete().in("id", toDelete);
      }

      // Upsert
      for (const r of rows) {
        const payload = {
          video_url: r.video_url,
          thumbnail_url: r.thumbnail_url || null,
          title: r.title || null,
          subtitle: r.subtitle || null,
          product_id: r.product_id || null,
          cta_text: r.cta_text || "Shop Now",
          cta_enabled: r.cta_enabled,
          enabled: r.enabled,
          featured: r.featured,
          autoplay: r.autoplay,
          muted: r.muted,
          loop: r.loop,
          sort_order: r.sort_order,
        };
        if (r.id.startsWith("new-")) {
          await supabase.from("video_testimonials").insert(payload);
        } else {
          await supabase.from("video_testimonials").update(payload).eq("id", r.id);
        }
      }

      // Refresh
      const { data } = await supabase.from("video_testimonials").select("*").order("sort_order");
      const fresh = ((data as VideoTestimonial[]) || []);
      setRows(fresh);
      setOriginal(JSON.parse(JSON.stringify(fresh)));
      toast({ title: "Video testimonials saved" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" size={16} /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Video Testimonials"
        subtitle="Customer UGC reels shown on the homepage above the FAQ section."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={add} size="sm">
              <Plus size={14} className="mr-1.5" /> Add video
            </Button>
            <Button onClick={handleSave} disabled={!dirty || saving} size="sm">
              {saving ? <Loader2 className="animate-spin mr-1.5" size={14} /> : null}
              Save changes
            </Button>
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<VideoIcon size={20} />}
          title="No videos yet"
          description="Add your first customer video to showcase real experiences."
          action={<Button onClick={add}><Plus size={14} className="mr-1.5" /> Add video</Button>}
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div
              key={r.id}
              draggable
              onDragStart={() => (dragIdx.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIdx.current != null) { move(dragIdx.current, i); dragIdx.current = null; } }}
              className="bg-background rounded-2xl border border-border/40 p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  aria-label="Drag to reorder"
                  className="mt-2 text-muted-foreground/50 hover:text-foreground cursor-grab active:cursor-grabbing"
                >
                  <GripVertical size={16} />
                </button>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4">
                  {/* Preview / video URL */}
                  <div className="space-y-2">
                    <div className="aspect-[9/16] rounded-xl overflow-hidden bg-muted/40 border border-border/30">
                      <PreviewThumb url={r.video_url} thumbnail={r.thumbnail_url} />
                    </div>
                    <VideoUploadField
                      value={r.video_url}
                      onChange={(url) => update(r.id, { video_url: url })}
                    />
                  </div>

                  <div className="space-y-3">
                    {/* Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Title</label>
                        <Input
                          value={r.title || ""}
                          onChange={(e) => update(r.id, { title: e.target.value })}
                          placeholder="e.g. Loves the everyday carry"
                          className="h-9 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Subtitle</label>
                        <Input
                          value={r.subtitle || ""}
                          onChange={(e) => update(r.id, { subtitle: e.target.value })}
                          placeholder="Optional caption"
                          className="h-9 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Linked product</label>
                        <select
                          value={r.product_id || ""}
                          onChange={(e) => update(r.id, { product_id: e.target.value || null })}
                          className="w-full h-9 rounded-lg border border-input bg-background px-3 text-[13px]"
                        >
                          <option value="">— None —</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">CTA text</label>
                        <Input
                          value={r.cta_text || ""}
                          onChange={(e) => update(r.id, { cta_text: e.target.value })}
                          placeholder="Shop Now"
                          className="h-9 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Thumbnail */}
                    <div>
                      <ImageUpload
                        value={r.thumbnail_url ? [r.thumbnail_url] : []}
                        onChange={(urls) => update(r.id, { thumbnail_url: urls[0] || null })}
                        multiple={false}
                        label="Thumbnail (optional)"
                        hint="Shown before the video loads. Defaults to the first frame."
                      />
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border/30">
                      <Toggle label="Enabled" icon={r.enabled ? Eye : EyeOff} checked={r.enabled} onChange={(v) => update(r.id, { enabled: v })} />
                      <Toggle label="Featured" icon={Star} checked={r.featured} onChange={(v) => update(r.id, { featured: v })} />
                      <Toggle label="Show CTA" checked={r.cta_enabled} onChange={(v) => update(r.id, { cta_enabled: v })} />
                      <Toggle label="Autoplay" checked={r.autoplay} onChange={(v) => update(r.id, { autoplay: v })} />
                      <Toggle label="Muted" checked={r.muted} onChange={(v) => update(r.id, { muted: v })} />
                      <Toggle label="Loop" checked={r.loop} onChange={(v) => update(r.id, { loop: v })} />
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button variant="ghost" size="sm" onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 size={13} className="mr-1.5" /> Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Toggle: React.FC<{ label: string; icon?: any; checked: boolean; onChange: (v: boolean) => void }> = ({ label, icon: Icon, checked, onChange }) => (
  <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/30 cursor-pointer hover:bg-muted/30 transition">
    <span className="flex items-center gap-1.5 text-[12px] text-foreground">
      {Icon && <Icon size={12} className="text-muted-foreground" />}
      {label}
    </span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </label>
);

const VideoUploadField: React.FC<{ value: string; onChange: (url: string) => void }> = ({ value, onChange }) => {
  const trimmed = (value || "").trim();
  const isValid = !trimmed || /^https?:\/\/.+/i.test(trimmed);
  return (
    <div className="space-y-1.5">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="YouTube, Vimeo, or direct video URL"
        className={`h-9 text-[12px] rounded-lg ${!isValid ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
      />
      <p className="text-[10.5px] text-muted-foreground/70 leading-snug">
        Paste any video URL — YouTube, Vimeo, or a direct file (.mp4, .webm, .mov).
      </p>
      {!isValid && (
        <p className="text-[10.5px] text-destructive">Must start with http:// or https://</p>
      )}
    </div>
  );
};

export default VideoTestimonialsManager;
