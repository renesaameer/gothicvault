import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface Testimonial {
  id: string;
  name: string;
  review: string;
  rating: number;
  image_url: string | null;
  sort_order: number;
}

const TestimonialsEditor = () => {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [isNew, setIsNew] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("testimonials").select("*").order("sort_order");
    setItems(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEditing({ id: "", name: "", review: "", rating: 5, image_url: null, sort_order: items.length });
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!editing || !editing.name.trim() || !editing.review.trim()) return;
    const payload = { name: editing.name, review: editing.review, rating: editing.rating, image_url: editing.image_url, sort_order: editing.sort_order };
    if (isNew) {
      const { error } = await supabase.from("testimonials").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("testimonials").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: isNew ? "Testimonial added" : "Testimonial updated" });
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("testimonials").delete().eq("id", id);
    toast({ title: "Testimonial deleted" });
    load();
  };

  return (
    <div className="space-y-3">
      {items.map((t) => (
        <div key={t.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{t.name} — ⭐ {t.rating}</p>
            <p className="text-xs text-muted-foreground truncate">{t.review}</p>
          </div>
          <div className="flex gap-1 ml-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing({ ...t }); setIsNew(false); }}><Pencil size={13} /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(t.id)}><Trash2 size={13} /></Button>
          </div>
        </div>
      ))}

      {editing && (
        <div className="border border-border rounded-lg p-3 space-y-2">
          <Input placeholder="Customer name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          <Textarea placeholder="Review text" value={editing.review} onChange={(e) => setEditing({ ...editing, review: e.target.value })} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" min={1} max={5} placeholder="Rating (1-5)" value={editing.rating} onChange={(e) => setEditing({ ...editing, rating: Math.min(5, Math.max(1, +e.target.value)) })} />
            <Input type="number" placeholder="Sort order" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: +e.target.value })} />
          </div>
          <ImageUpload
            value={editing.image_url ? [editing.image_url] : []}
            onChange={(urls) => setEditing({ ...editing, image_url: urls[0] || null })}
            multiple={false}
            label="Customer Photo (optional)"
            hint="Recommended: 200 × 200 px · Square · JPG or PNG"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}><Save size={13} className="mr-1" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X size={13} className="mr-1" /> Cancel</Button>
          </div>
        </div>
      )}

      {!editing && <Button size="sm" variant="outline" onClick={startNew}><Plus size={13} className="mr-1" /> Add Testimonial</Button>}
    </div>
  );
};

export default TestimonialsEditor;
