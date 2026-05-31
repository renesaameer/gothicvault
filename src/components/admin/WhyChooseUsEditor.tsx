import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const ICON_OPTIONS = [
  "Shield", "Heart", "Star", "Leaf", "Truck", "Award", "Clock", "CheckCircle",
  "ThumbsUp", "Zap", "Lock", "Gem", "Sparkles", "Package", "Recycle", "Eye",
  "Smile", "Gift", "BadgeCheck", "Ribbon"
];

interface Card {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  sort_order: number;
}

const WhyChooseUsEditor = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [editing, setEditing] = useState<Card | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [showOnPdp, setShowOnPdp] = useState(true);
  const { toast } = useToast();

  const fetch = async () => {
    const [cardsRes, shopRes] = await Promise.all([
      supabase.from("why_choose_us_cards").select("*").order("sort_order"),
      supabase.from("shop_settings").select("pdp_show_why_choose_us").eq("id", "default").maybeSingle(),
    ]);
    setCards(cardsRes.data ?? []);
    setShowOnPdp((shopRes.data as any)?.pdp_show_why_choose_us !== false);
  };

  useEffect(() => { fetch(); }, []);

  const togglePdp = async (v: boolean) => {
    setShowOnPdp(v);
    const { error } = await supabase.from("shop_settings").update({ pdp_show_why_choose_us: v } as any).eq("id", "default");
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: v ? "Enabled on product pages" : "Hidden on product pages" });
  };

  const startNew = () => {
    setEditing({ id: "", title: "", description: "", icon_name: "Shield", sort_order: cards.length });
    setIsNew(true);
  };

  const startEdit = (c: Card) => {
    setEditing({ ...c });
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!editing || !editing.title.trim()) return;
    if (isNew) {
      const { error } = await supabase.from("why_choose_us_cards").insert({
        title: editing.title, description: editing.description,
        icon_name: editing.icon_name, sort_order: editing.sort_order
      });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("why_choose_us_cards").update({
        title: editing.title, description: editing.description,
        icon_name: editing.icon_name, sort_order: editing.sort_order
      }).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: isNew ? "Card added" : "Card updated" });
    setEditing(null);
    fetch();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("why_choose_us_cards").delete().eq("id", id);
    toast({ title: "Card deleted" });
    fetch();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2.5 border border-border/40">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Show on Product Details</p>
          <p className="text-xs text-muted-foreground">Display this section under the product tabs.</p>
        </div>
        <Switch checked={showOnPdp} onCheckedChange={togglePdp} />
      </div>
      {cards.map((c) => (
        <div key={c.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
            <p className="text-xs text-muted-foreground truncate">{c.description}</p>
          </div>
          <div className="flex gap-1 ml-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(c)}><Pencil size={13} /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 size={13} /></Button>
          </div>
        </div>
      ))}

      {editing && (
        <div className="border border-border rounded-lg p-3 space-y-2">
          <Input placeholder="Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          <Textarea placeholder="Description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={editing.icon_name} onValueChange={(v) => setEditing({ ...editing, icon_name: v })}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{ICON_OPTIONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" placeholder="Sort order" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: +e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}><Save size={13} className="mr-1" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X size={13} className="mr-1" /> Cancel</Button>
          </div>
        </div>
      )}

      {!editing && <Button size="sm" variant="outline" onClick={startNew}><Plus size={13} className="mr-1" /> Add Card</Button>}
    </div>
  );
};

export default WhyChooseUsEditor;
