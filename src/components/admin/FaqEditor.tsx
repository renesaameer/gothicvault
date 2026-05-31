import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

const FaqEditor = () => {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("home_faqs").select("*").order("sort_order");
    setItems(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEditing({ id: "", question: "", answer: "", sort_order: items.length });
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!editing || !editing.question.trim() || !editing.answer.trim()) return;
    const payload = { question: editing.question, answer: editing.answer, sort_order: editing.sort_order };
    if (isNew) {
      const { error } = await supabase.from("home_faqs").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("home_faqs").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: isNew ? "FAQ added" : "FAQ updated" });
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("home_faqs").delete().eq("id", id);
    toast({ title: "FAQ deleted" });
    load();
  };

  return (
    <div className="space-y-3">
      {items.map((f) => (
        <div key={f.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{f.question}</p>
            <p className="text-xs text-muted-foreground truncate">{f.answer}</p>
          </div>
          <div className="flex gap-1 ml-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing({ ...f }); setIsNew(false); }}><Pencil size={13} /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(f.id)}><Trash2 size={13} /></Button>
          </div>
        </div>
      ))}

      {editing && (
        <div className="border border-border rounded-lg p-3 space-y-2">
          <Input placeholder="Question" value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} />
          <Textarea placeholder="Answer" value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} rows={3} />
          <Input type="number" placeholder="Sort order" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: +e.target.value })} className="w-32" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}><Save size={13} className="mr-1" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X size={13} className="mr-1" /> Cancel</Button>
          </div>
        </div>
      )}

      {!editing && <Button size="sm" variant="outline" onClick={startNew}><Plus size={13} className="mr-1" /> Add FAQ</Button>}
    </div>
  );
};

export default FaqEditor;
