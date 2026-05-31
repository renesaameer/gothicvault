import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, Copy, GripVertical } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Cat {
  id: string;
  sort_order: number;
  enabled: boolean;
  title: string;
  subtitle: string | null;
  link: string | null;
  desktop_image: string | null;
  mobile_image: string | null;
  text_color: string;
  text_align: "left" | "center" | "right";
  overlay_opacity: number;
  focal_x: number;
  focal_y: number;
}

const defaults = {
  enabled: true, title: "", subtitle: "", link: "/shop",
  desktop_image: "", mobile_image: "",
  text_color: "#ffffff", text_align: "left" as const,
  overlay_opacity: 0.15, focal_x: 50, focal_y: 50,
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
        className="relative w-full max-w-sm aspect-[4/5] bg-secondary rounded-md overflow-hidden cursor-crosshair border border-border"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onChange(Math.round(((e.clientX - r.left) / r.width) * 100), Math.round(((e.clientY - r.top) / r.height) * 100));
        }}
      >
        <img src={src} alt="" className="w-full h-full object-cover" />
        <div className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow-md ring-1 ring-black/40" style={{ left: `${x}%`, top: `${y}%` }} />
      </div>
    </div>
  );
};

const Form = ({ c, set }: { c: Cat; set: (u: Partial<Cat>) => void }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <ImageUpload value={c.desktop_image ? [c.desktop_image] : []} onChange={(u) => set({ desktop_image: u[0] || "" })} multiple={false} label="Desktop image" hint="Recommended portrait 1200 × 1500 px" />
      <ImageUpload value={c.mobile_image ? [c.mobile_image] : []} onChange={(u) => set({ mobile_image: u[0] || "" })} multiple={false} label="Mobile image (optional)" hint="Recommended 800 × 1000 px" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Input placeholder="Title (e.g. T-shirts)" value={c.title} onChange={(e) => set({ title: e.target.value })} />
      <Input placeholder="Subtitle (optional)" value={c.subtitle ?? ""} onChange={(e) => set({ subtitle: e.target.value })} />
    </div>
    <Input placeholder="Link URL (e.g. /shop?category=t-shirts)" value={c.link ?? ""} onChange={(e) => set({ link: e.target.value })} />

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Text alignment</p>
        <div className="flex gap-1.5">
          {(["left","center","right"] as const).map(a => <SegBtn key={a} active={c.text_align === a} onClick={() => set({ text_align: a })}>{a}</SegBtn>)}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Text color</p>
        <input type="color" value={c.text_color} onChange={(e) => set({ text_color: e.target.value })} className="h-9 w-16 rounded border border-border bg-background" />
      </div>
    </div>

    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">Overlay darkness — {Math.round(c.overlay_opacity * 100)}%</p>
      <Slider value={[Math.round(c.overlay_opacity * 100)]} max={100} step={1} onValueChange={(v) => set({ overlay_opacity: (v[0] ?? 15) / 100 })} />
    </div>

    <FocalPicker src={c.desktop_image || ""} x={c.focal_x} y={c.focal_y} onChange={(x, y) => set({ focal_x: x, focal_y: y })} />
  </div>
);

const SortableRow = ({ c, expanded, onToggle, onSwitch, onDelete, onDuplicate, onChange, onSave }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="bg-secondary/50 rounded-lg border border-border">
      <div className="flex items-center gap-2 px-2 py-2">
        <button {...attributes} {...listeners} className="p-1.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing" aria-label="Drag">
          <GripVertical size={14} />
        </button>
        <button className="flex-1 flex items-center gap-2 text-sm font-medium text-foreground text-left" onClick={onToggle}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span className="truncate">{c.title || `Category ${c.sort_order + 1}`}</span>
        </button>
        <Switch checked={c.enabled} onCheckedChange={onSwitch} />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate} aria-label="Duplicate"><Copy size={13} /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete} aria-label="Delete"><Trash2 size={13} /></Button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 border-t border-border pt-3">
          <Form c={c} set={onChange} />
          <Button size="sm" className="mt-3" onClick={onSave}><Save size={13} className="mr-1" /> Save</Button>
        </div>
      )}
    </div>
  );
};

const FeaturedCategoriesManager = ({ hideTitle }: { hideTitle?: boolean }) => {
  const [items, setItems] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { toast } = useToast();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    const { data } = await supabase.from("featured_categories").select("*").order("sort_order");
    setItems((data as unknown as Cat[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEditing({ id: "", sort_order: items.length, ...defaults } as Cat);
    setIsNew(true); setExpanded(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    const { id, ...payload } = editing;
    const { error } = await supabase.from("featured_categories").insert(payload as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Category added" });
    setEditing(null); setIsNew(false); load();
  };

  const saveItem = async (c: Cat) => {
    const { id, ...payload } = c;
    const { error } = await supabase.from("featured_categories").update(payload as any).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Category updated" }); load(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("featured_categories").delete().eq("id", id);
    toast({ title: "Category deleted" }); load();
  };

  const duplicate = async (c: Cat) => {
    const { id, ...payload } = c;
    const copy: any = { ...payload, sort_order: items.length, title: c.title + " (copy)" };
    const { error } = await supabase.from("featured_categories").insert(copy);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Duplicated" }); load();
  };

  const toggleEnabled = async (id: string, v: boolean) => {
    setItems(prev => prev.map(c => c.id === id ? { ...c, enabled: v } : c));
    await supabase.from("featured_categories").update({ enabled: v } as any).eq("id", id);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldI = items.findIndex(s => s.id === e.active.id);
    const newI = items.findIndex(s => s.id === e.over!.id);
    const reordered = arrayMove(items, oldI, newI).map((s, i) => ({ ...s, sort_order: i }));
    setItems(reordered);
    await Promise.all(reordered.map(s => supabase.from("featured_categories").update({ sort_order: s.sort_order } as any).eq("id", s.id)));
  };

  return (
    <div>
      {!hideTitle && <h1 className="text-xl font-semibold text-foreground mb-2">Featured categories</h1>}
      <p className="text-xs text-muted-foreground mb-4">Editorial cards displayed under the hero on the homepage. Drag to reorder.</p>

      <div className="max-w-3xl space-y-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((c) => (
                <SortableRow
                  key={c.id} c={c} expanded={expanded === c.id}
                  onToggle={() => setExpanded(expanded === c.id ? null : c.id)}
                  onSwitch={(v: boolean) => toggleEnabled(c.id, v)}
                  onDelete={() => handleDelete(c.id)}
                  onDuplicate={() => duplicate(c)}
                  onChange={(u: Partial<Cat>) => setItems(prev => prev.map(it => it.id === c.id ? { ...it, ...u } : it))}
                  onSave={() => saveItem(items.find(it => it.id === c.id)!)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {editing && isNew && (
          <div className="border border-border rounded-lg p-3 bg-background">
            <Form c={editing} set={(u) => setEditing({ ...editing!, ...u })} />
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleSave}><Save size={13} className="mr-1" /> Add Category</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setIsNew(false); }}><X size={13} className="mr-1" /> Cancel</Button>
            </div>
          </div>
        )}

        {!editing && <Button size="sm" variant="outline" onClick={startNew}><Plus size={13} className="mr-1" /> Add Category</Button>}
      </div>
    </div>
  );
};

export default FeaturedCategoriesManager;
