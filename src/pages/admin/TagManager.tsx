import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { adminKeys } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section, EmptyState } from "@/components/admin/ui";

type TagType = "feature" | "material" | "color" | "style" | "audience";
const TYPES: TagType[] = ["feature", "material", "color", "style", "audience"];

interface Tag {
  id: string;
  name: string;
  slug: string;
  type: TagType;
  color: string | null;
  icon: string | null;
  sort_order: number;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

const TagManager = ({ hideTitle }: { hideTitle?: boolean } = {}) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<TagType>("feature");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("tags").select("*").order("type").order("sort_order");
    setTags((data ?? []) as Tag[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addTag = async () => {
    if (!newName.trim()) return;
    const slug = slugify(newName);
    const { error } = await supabase.from("tags").insert({
      name: newName.trim(),
      slug,
      type: activeType,
      color: newColor || null,
      sort_order: tags.filter((t) => t.type === activeType).length,
    });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    setNewName("");
    setNewColor("");
    qc.invalidateQueries({ queryKey: adminKeys.tags });
    load();
  };

  const deleteTag = async (id: string) => {
    if (!confirm("Delete this tag?")) return;
    await supabase.from("tags").delete().eq("id", id);
    setTags(tags.filter((t) => t.id !== id));
  };

  const grouped = tags.filter((t) => t.type === activeType);

  return (
    <div className="space-y-4">
      <Section title={hideTitle ? undefined : "Tags"} description={hideTitle ? undefined : "Attribute labels for filtering"}>
        <div className="-mx-1 px-1 overflow-x-auto mb-4">
          <div className="inline-flex items-center gap-1 p-1 bg-muted/40 rounded-xl min-w-full sm:min-w-0 sm:w-fit">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={cn(
                  "flex-1 sm:flex-none px-3 h-8 rounded-lg text-[12px] font-medium capitalize transition",
                  activeType === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <Input
            placeholder={`Add ${activeType} tag…`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
            className="h-10 flex-1 min-w-[180px]"
          />
          {activeType === "color" && (
            <div className="relative">
              <Input
                placeholder="#000000"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-10 w-32 font-mono text-xs pl-9"
              />
              <span
                className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md border border-border/60"
                style={{ background: newColor || "transparent" }}
              />
            </div>
          )}
          <Button size="sm" onClick={addTag} disabled={!newName.trim()} className="h-10 rounded-xl gap-1.5">
            <Plus size={14} /> Add
          </Button>
        </div>
      </Section>

      <Section title={`${activeType.charAt(0).toUpperCase() + activeType.slice(1)} tags`} description={`${grouped.length} total`}>
        {loading ? (
          <p className="text-[13px] text-muted-foreground">Loading…</p>
        ) : grouped.length === 0 ? (
          <EmptyState icon={<TagIcon size={20} />} title={`No ${activeType} tags`} description="Add tags above to get started." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {grouped.map((t) => (
              <div
                key={t.id}
                className="inline-flex items-center gap-2 pl-3 pr-1 h-9 rounded-full border border-border/60 bg-muted/30 hover:bg-muted/50 transition"
              >
                {t.color && (
                  <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ background: t.color }} />
                )}
                <span className="text-[13px] text-foreground">{t.name}</span>
                <button
                  onClick={() => deleteTag(t.id)}
                  className="w-7 h-7 rounded-full hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive inline-flex items-center justify-center transition"
                  aria-label="Delete tag"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

export default TagManager;
