import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, Copy, GripVertical } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Slide {
  id: string;
  sort_order: number;
  enabled: boolean;
  image_url: string;
  mobile_image_url?: string | null;
  video_url?: string | null;
  label?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  cta2_text?: string | null;
  cta2_link?: string | null;
  text_color?: string;
  text_align?: "left" | "center" | "right";
  vertical_position?: "top" | "middle" | "bottom";
  height?: "sm" | "md" | "lg" | "full";
  overlay_opacity?: number;
  focal_x?: number;
  focal_y?: number;
  // legacy
  title?: string | null;
  subtitle?: string | null;
  button_text?: string | null;
  button_link?: string | null;
}

const defaults = {
  enabled: true, image_url: "", mobile_image_url: "", video_url: "",
  label: "", headline: "", subheadline: "",
  cta_text: "Shop Now", cta_link: "/shop",
  cta2_text: "", cta2_link: "",
  text_color: "#ffffff", text_align: "left" as const, vertical_position: "bottom" as const, height: "full" as const,
  overlay_opacity: 0.35, focal_x: 50, focal_y: 50,
};

const SegBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick}
    className={`px-3 h-8 text-[12px] rounded-md border transition-colors ${active ? "bg-foreground text-background border-foreground" : "bg-background border-border text-foreground/70 hover:text-foreground"}`}>
    {children}
  </button>
);

const FocalPicker = ({ src, x, y, onChange }: { src: string; x: number; y: number; onChange: (x: number, y: number) => void }) => {
  if (!src) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">Focal point — click image to set</p>
      <div
        className="relative w-full max-w-sm aspect-video bg-secondary rounded-md overflow-hidden cursor-crosshair border border-border"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onChange(
            Math.round(((e.clientX - r.left) / r.width) * 100),
            Math.round(((e.clientY - r.top) / r.height) * 100),
          );
        }}
      >
        <img src={src} alt="" className="w-full h-full object-cover" />
        <div className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow-md ring-1 ring-black/40" style={{ left: `${x}%`, top: `${y}%` }} />
      </div>
    </div>
  );
};

const SlideForm = ({ s, set }: { s: Slide; set: (u: Partial<Slide>) => void }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <ImageUpload value={s.image_url ? [s.image_url] : []} onChange={(u) => set({ image_url: u[0] || "" })} multiple={false} label="Desktop image" hint="Recommended 1920 × 1080 px" />
      <ImageUpload value={s.mobile_image_url ? [s.mobile_image_url] : []} onChange={(u) => set({ mobile_image_url: u[0] || "" })} multiple={false} label="Mobile image (optional)" hint="Recommended 1080 × 1440 px" />
    </div>
    <Input placeholder="Background video URL (optional, mp4)" value={s.video_url ?? ""} onChange={(e) => set({ video_url: e.target.value })} />

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Input placeholder="Small label (e.g. SPRING'26)" value={s.label ?? ""} onChange={(e) => set({ label: e.target.value })} />
      <Input placeholder="Heading (e.g. COLLECTION IS LIVE)" value={s.headline ?? ""} onChange={(e) => set({ headline: e.target.value })} />
    </div>
    <Textarea placeholder="Subheading / description" value={s.subheadline ?? ""} onChange={(e) => set({ subheadline: e.target.value })} rows={2} />

    <div className="grid grid-cols-2 gap-2">
      <Input placeholder="CTA 1 text" value={s.cta_text ?? ""} onChange={(e) => set({ cta_text: e.target.value })} />
      <Input placeholder="CTA 1 link" value={s.cta_link ?? ""} onChange={(e) => set({ cta_link: e.target.value })} />
      <Input placeholder="CTA 2 text" value={s.cta2_text ?? ""} onChange={(e) => set({ cta2_text: e.target.value })} />
      <Input placeholder="CTA 2 link" value={s.cta2_link ?? ""} onChange={(e) => set({ cta2_link: e.target.value })} />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Text alignment</p>
        <div className="flex gap-1.5">
          {(["left","center","right"] as const).map(a => <SegBtn key={a} active={(s.text_align ?? "left") === a} onClick={() => set({ text_align: a })}>{a}</SegBtn>)}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Vertical position</p>
        <div className="flex gap-1.5">
          {(["top","middle","bottom"] as const).map(a => <SegBtn key={a} active={(s.vertical_position ?? "bottom") === a} onClick={() => set({ vertical_position: a })}>{a}</SegBtn>)}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Hero height</p>
        <div className="flex gap-1.5 flex-wrap">
          {(["sm","md","lg","full"] as const).map(a => <SegBtn key={a} active={(s.height ?? "full") === a} onClick={() => set({ height: a })}>{a.toUpperCase()}</SegBtn>)}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Text color</p>
        <input type="color" value={s.text_color ?? "#ffffff"} onChange={(e) => set({ text_color: e.target.value })} className="h-9 w-16 rounded border border-border bg-background" />
      </div>
    </div>

    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">Overlay darkness — {Math.round(((s.overlay_opacity ?? 0.35) * 100))}%</p>
      <Slider value={[Math.round(((s.overlay_opacity ?? 0.35) * 100))]} max={100} step={1} onValueChange={(v) => set({ overlay_opacity: (v[0] ?? 35) / 100 })} />
    </div>

    <FocalPicker src={s.image_url} x={s.focal_x ?? 50} y={s.focal_y ?? 50} onChange={(x, y) => set({ focal_x: x, focal_y: y })} />
  </div>
);

const SortableRow = ({ s, expanded, onToggle, onSwitch, onDelete, onDuplicate, onChange, onSave }: {
  s: Slide; expanded: boolean;
  onToggle: () => void;
  onSwitch: (v: boolean) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onChange: (u: Partial<Slide>) => void;
  onSave: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="bg-secondary/50 rounded-lg border border-border">
      <div className="flex items-center gap-2 px-2 py-2">
        <button {...attributes} {...listeners} className="p-1.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing" aria-label="Drag">
          <GripVertical size={14} />
        </button>
        <button className="flex-1 flex items-center gap-2 text-sm font-medium text-foreground text-left" onClick={onToggle}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span className="truncate">{s.headline || s.title || s.label || `Slide ${s.sort_order + 1}`}</span>
        </button>
        <Switch checked={s.enabled} onCheckedChange={onSwitch} />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate} aria-label="Duplicate"><Copy size={13} /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete} aria-label="Delete"><Trash2 size={13} /></Button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 border-t border-border pt-3">
          <SlideForm s={s} set={onChange} />
          <Button size="sm" className="mt-3" onClick={onSave}><Save size={13} className="mr-1" /> Save Slide</Button>
        </div>
      )}
    </div>
  );
};

const HeroSlidesEditor = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [autoplay, setAutoplay] = useState(true);
  const [autoplaySpeed, setAutoplaySpeed] = useState(6000);
  const { toast } = useToast();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    const { data } = await supabase.from("hero_slides").select("*").order("sort_order");
    setSlides((data as Slide[]) ?? []);
    const { data: sec } = await supabase.from("homepage_sections").select("content").eq("id", "hero").maybeSingle();
    const c = (sec as any)?.content ?? {};
    setAutoplay(c.autoplay !== false);
    setAutoplaySpeed(Number(c.autoplay_speed) || 6000);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEditing({ id: "", sort_order: slides.length, ...defaults } as Slide);
    setIsNew(true);
    setExpanded(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.image_url) {
      toast({ title: "Image required", description: "Please upload a desktop image.", variant: "destructive" });
      return;
    }
    const { id, title, subtitle, button_text, button_link, ...payload } = editing;
    const { error } = await supabase.from("hero_slides").insert(payload as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Slide added" });
    setEditing(null); setIsNew(false); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    await supabase.from("hero_slides").delete().eq("id", id);
    toast({ title: "Slide deleted" }); load();
  };

  const duplicateSlide = async (s: Slide) => {
    const { id, title, subtitle, button_text, button_link, ...payload } = s;
    const copy: any = { ...payload, sort_order: slides.length, headline: (s.headline || "") + " (copy)" };
    const { error } = await supabase.from("hero_slides").insert(copy);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Slide duplicated" }); load();
  };

  const saveSlide = async (s: Slide) => {
    const { id, title, subtitle, button_text, button_link, ...payload } = s;
    const { error } = await supabase.from("hero_slides").update(payload as any).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Slide updated" }); load(); }
  };

  const toggleEnabled = async (id: string, v: boolean) => {
    setSlides(prev => prev.map(sl => sl.id === id ? { ...sl, enabled: v } : sl));
    await supabase.from("hero_slides").update({ enabled: v } as any).eq("id", id);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldI = slides.findIndex(s => s.id === e.active.id);
    const newI = slides.findIndex(s => s.id === e.over!.id);
    const reordered = arrayMove(slides, oldI, newI).map((s, i) => ({ ...s, sort_order: i }));
    setSlides(reordered);
    await Promise.all(reordered.map(s => supabase.from("hero_slides").update({ sort_order: s.sort_order } as any).eq("id", s.id)));
  };

  const saveSliderSettings = async () => {
    const { data: sec } = await supabase.from("homepage_sections").select("content").eq("id", "hero").maybeSingle();
    const content = { ...(((sec as any)?.content) || {}), autoplay, autoplay_speed: autoplaySpeed };
    const { error } = await supabase.from("homepage_sections").update({ content } as any).eq("id", "hero");
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Slider settings saved" });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-background p-3">
        <p className="text-xs font-semibold text-foreground mb-2">Slider settings</p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={autoplay} onCheckedChange={setAutoplay} /> Autoplay
          </label>
          <label className="flex items-center gap-2 text-xs">
            Speed (ms)
            <Input type="number" className="h-8 w-24" value={autoplaySpeed} onChange={(e) => setAutoplaySpeed(+e.target.value)} />
          </label>
          <Button size="sm" variant="outline" onClick={saveSliderSettings}>Save</Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Drag handle to reorder. Toggle to enable/disable.</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {slides.map((s) => (
              <SortableRow
                key={s.id} s={s} expanded={expanded === s.id}
                onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
                onSwitch={(v) => toggleEnabled(s.id, v)}
                onDelete={() => handleDelete(s.id)}
                onDuplicate={() => duplicateSlide(s)}
                onChange={(u) => setSlides(prev => prev.map(sl => sl.id === s.id ? { ...sl, ...u } : sl))}
                onSave={() => saveSlide(slides.find(sl => sl.id === s.id)!)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {editing && isNew && (
        <div className="border border-border rounded-lg p-3 bg-background">
          <SlideForm s={editing} set={(u) => setEditing({ ...editing!, ...u })} />
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleSave}><Save size={13} className="mr-1" /> Add Slide</Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setIsNew(false); }}><X size={13} className="mr-1" /> Cancel</Button>
          </div>
        </div>
      )}

      {!editing && <Button size="sm" variant="outline" onClick={startNew}><Plus size={13} className="mr-1" /> Add Slide</Button>}
    </div>
  );
};

export default HeroSlidesEditor;
