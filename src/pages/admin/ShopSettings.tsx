import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { Section, FormRow, StickyActionBar } from "@/components/admin/ui";
import { useDirtyForm } from "@/hooks/useDirtyForm";

const ShopSettings = ({ hideTitle }: { hideTitle?: boolean }) => {
  const [settings, setSettings] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCat, setNewCat] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { dirty, rebase } = useDirtyForm(settings);
  const queryClient = useQueryClient();

  const fetchData = async () => {
    const [sRes, cRes] = await Promise.all([
      supabase.from("shop_settings").select("*").eq("id", "default").single(),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setSettings(sRes.data);
    rebase(sRes.data);
    setCategories(cRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    // Strip server-managed columns before update so we never send stale id/updated_at
    const { id: _id, updated_at: _u, ...payload } = settings;
    const { error } = await supabase.from("shop_settings").update(payload).eq("id", "default");
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      rebase(settings);
      // Storefront caches layout-data in localStorage with a 5min staleTime, so a plain
      // invalidate isn't enough — remove + refetch forces fresh data into both memory and
      // the persisted cache so toggles apply instantly across the app.
      queryClient.removeQueries({ queryKey: ["layout-data"] });
      queryClient.removeQueries({ queryKey: ["homepage-critical"] });
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["layout-data"] }),
        queryClient.refetchQueries({ queryKey: ["homepage-critical"] }),
      ]);
      toast({ title: "Settings saved" });
    }
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    const slug = newCat.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { error } = await supabase.from("categories").insert({ name: newCat, slug, sort_order: categories.length });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setNewCat(""); fetchData(); toast({ title: "Category added" }); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    fetchData();
    toast({ title: "Category deleted" });
  };

  if (loading || !settings) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5 pb-20">
      {!hideTitle && <h1 className="text-xl font-semibold text-foreground tracking-tight">Shop settings</h1>}

      <Section title="Browsing" description="Search and sorting on the shop page">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-foreground">Search enabled</span>
            <Switch checked={settings.search_enabled} onCheckedChange={(v) => setSettings({ ...settings, search_enabled: v })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-foreground">Sorting enabled</span>
            <Switch checked={settings.sorting_enabled} onCheckedChange={(v) => setSettings({ ...settings, sorting_enabled: v })} />
          </div>
          <FormRow label="Default sorting">
            <Select value={settings.default_sorting} onValueChange={(v) => setSettings({ ...settings, default_sorting: v })}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">New</SelectItem>
                <SelectItem value="price_low">Price: low to high</SelectItem>
                <SelectItem value="price_high">Price: high to low</SelectItem>
              </SelectContent>
            </Select>
          </FormRow>
        </div>
      </Section>

      <Section title="Product card" description="What customers see on each product card">
        <div className="space-y-4">
          <FormRow label="Primary card button" hint="Controls the main call-to-action on product cards.">
            <Select value={settings.card_cta_mode ?? "view_details"} onValueChange={(v) => setSettings({ ...settings, card_cta_mode: v })}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="view_details">View details</SelectItem>
                <SelectItem value="add_to_cart">Add to cart</SelectItem>
              </SelectContent>
            </Select>
          </FormRow>

          <div className="pt-2 border-t border-border/30 space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Visible buttons</p>
            {[
              { key: "card_show_view_details", label: "View details" },
              { key: "card_show_add_to_cart", label: "Add to cart" },
              { key: "card_show_buy_now", label: "Buy now" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[13px] text-foreground">{label}</span>
                <Switch
                  checked={settings[key] !== false}
                  onCheckedChange={(v) => setSettings({ ...settings, [key]: v })}
                />
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Categories" description="Used as tags and shop filters">
        <div className="space-y-2 mb-4">
          {categories.length === 0 ? (
            <p className="text-[12px] text-muted-foreground/60 py-2">No categories yet.</p>
          ) : categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <span className="text-[13px] text-foreground">{c.name}</span>
              <Button variant="ghost" size="sm" onClick={() => deleteCategory(c.id)} className="text-destructive hover:text-destructive h-8 w-8 p-0">
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input className="h-11" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category name" />
          <Button size="sm" className="h-11" onClick={addCategory}><Plus size={14} className="mr-1" /> Add</Button>
        </div>
      </Section>

      <StickyActionBar visible={dirty} message="Unsaved shop settings">
        <Button size="sm" variant="ghost" onClick={() => fetchData()} disabled={saving}>Discard</Button>
        <Button size="sm" onClick={saveSettings} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </StickyActionBar>
    </div>
  );
};

export default ShopSettings;
