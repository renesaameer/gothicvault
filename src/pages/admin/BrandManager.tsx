import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminBrands, adminKeys } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ChevronLeft, Tag } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import { Section, FormRow, EmptyState } from "@/components/admin/ui";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  enabled: boolean;
  sort_order: number;
}

const emptyBrand: Omit<Brand, "id"> = {
  name: "", slug: "", logo_url: null, description: null, enabled: true, sort_order: 0,
};

const BrandManager = ({ hideTitle }: { hideTitle?: boolean } = {}) => {
  const { data, isLoading } = useAdminBrands();
  const brands = (data?.brands ?? []) as Brand[];
  const productCounts = data?.productCounts ?? {};
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Brand | null>(null);
  const [isNew, setIsNew] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!editing) return;
    const slug = editing.slug || editing.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = { ...editing, slug };

    try {
      if (isNew) {
        const { id, ...rest } = payload as any;
        const { error } = await supabase.from("brands").insert(rest);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brands").update(payload).eq("id", editing.id);
        if (error) throw error;
      }
      toast({ title: isNew ? "Brand created" : "Brand updated" });
      setEditing(null);
      setIsNew(false);
      qc.invalidateQueries({ queryKey: adminKeys.brands });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (productCounts[brand.id]) {
      toast({ title: "Cannot delete", description: `${brand.name} has ${productCounts[brand.id]} active products.`, variant: "destructive" });
      return;
    }
    if (!confirm(`Delete "${brand.name}"?`)) return;
    qc.setQueryData(adminKeys.brands, (old: any) => old ? { ...old, brands: old.brands.filter((b: any) => b.id !== brand.id) } : old);
    toast({ title: "Brand deleted" });
    await supabase.from("brands").delete().eq("id", brand.id);
    qc.invalidateQueries({ queryKey: adminKeys.brands });
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="-ml-2 gap-1" onClick={() => { setEditing(null); setIsNew(false); }}>
            <ChevronLeft size={16} /> Back
          </Button>
          <Button size="sm" onClick={handleSave}>{isNew ? "Create" : "Save"}</Button>
        </div>

        <Section title={isNew ? "New brand" : "Edit brand"} description="Brand details">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Brand name" required>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </FormRow>
            <FormRow label="Slug" hint="Auto-generated if empty">
              <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="auto" />
            </FormRow>
            <FormRow label="Description" className="sm:col-span-2">
              <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
            </FormRow>
          </div>
        </Section>

        <Section title="Logo">
          <ImageUpload
            value={editing.logo_url ? [editing.logo_url] : []}
            onChange={(urls) => setEditing({ ...editing, logo_url: urls[0] || null })}
            label="Brand logo"
            hint="400 × 200 px · transparent PNG recommended"
          />
        </Section>

        <Section title="Visibility">
          <FormRow label="Enabled" hint="Show this brand on the storefront" inline>
            <Switch checked={editing.enabled} onCheckedChange={(v) => setEditing({ ...editing, enabled: v })} />
          </FormRow>
        </Section>
      </div>
    );
  }

  return (
    <Section
      title={hideTitle ? undefined : "Brands"}
      description={hideTitle ? undefined : "Manage product brands"}
      actions={
        <Button size="sm" onClick={() => { setEditing({ id: "", ...emptyBrand } as Brand); setIsNew(true); }}>
          <Plus size={14} className="mr-1" /> Add
        </Button>
      }
    >
      {isLoading ? (
        <p className="text-[13px] text-muted-foreground">Loading…</p>
      ) : brands.length === 0 ? (
        <EmptyState icon={<Tag size={20} />} title="No brands yet" description="Add brands to associate them with products." />
      ) : (
        <div className="space-y-1">
          {brands.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2 py-2 px-2 -mx-2 rounded-lg hover:bg-muted/40 transition">
              <div className="flex items-center gap-2.5 min-w-0">
                {b.logo_url ? (
                  <img src={b.logo_url} alt={b.name} className="w-9 h-9 rounded-lg object-contain bg-muted border border-border/60 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-muted/60 border border-border/60 shrink-0 flex items-center justify-center">
                    <Tag size={14} className="text-muted-foreground/50" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground truncate">{b.name}</span>
                    {!b.enabled && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Off</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground/70 truncate">/{b.slug} · {productCounts[b.id] || 0} products</div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(b); setIsNew(false); }}><Pencil size={14} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(b)}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
};

export default BrandManager;
