import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, X, Percent } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import { CURRENCY_SYMBOL } from "@/lib/currency";

interface Offer {
  id: string;
  name: string;
  discount_type: string;
  discount_value: number;
  start_date: string | null;
  end_date: string | null;
  apply_to: string;
  target_ids: string[];
  banner_image: string | null;
  featured: boolean;
  enabled: boolean;
}

const emptyOffer: Omit<Offer, "id"> = {
  name: "", discount_type: "percentage", discount_value: 0,
  start_date: null, end_date: null, apply_to: "entire_store",
  target_ids: [], banner_image: null, featured: false, enabled: true,
};

const OfferManager = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    const [offRes, catRes, brandRes, prodRes] = await Promise.all([
      supabase.from("offers").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name").order("sort_order"),
      supabase.from("brands").select("id, name").order("sort_order"),
      supabase.from("products").select("id, name").order("name"),
    ]);
    setOffers(((offRes.data as unknown) as Offer[]) ?? []);
    setCategories(catRes.data ?? []);
    setBrands(brandRes.data ?? []);
    setProducts(prodRes.data ?? []);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    const payload = {
      name: editing.name,
      discount_type: editing.discount_type,
      discount_value: editing.discount_value,
      start_date: editing.start_date || null,
      end_date: editing.end_date || null,
      apply_to: editing.apply_to,
      target_ids: editing.target_ids,
      banner_image: editing.banner_image,
      featured: editing.featured,
      enabled: editing.enabled,
    };

    try {
      if (isNew) {
        const { error } = await supabase.from("offers").insert(payload as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("offers").update(payload as any).eq("id", editing.id);
        if (error) throw error;
      }
      toast({ title: isNew ? "Offer created" : "Offer updated" });
      setEditing(null);
      setIsNew(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    await supabase.from("offers").delete().eq("id", id);
    toast({ title: "Offer deleted" });
    fetchData();
  };

  const isExpired = (o: Offer) => o.end_date && new Date(o.end_date) < new Date();

  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-foreground">{isNew ? "Create offer" : "Edit Offer"}</h1>
          <Button variant="ghost" size="sm" onClick={() => { setEditing(null); setIsNew(false); }}>
            <X size={16} className="mr-1" /> Cancel
          </Button>
        </div>
        <div className="grid gap-4 max-w-lg">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Offer Name *</label>
            <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Discount Type</label>
              <Select value={editing.discount_type} onValueChange={(v) => setEditing({ ...editing, discount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed ({CURRENCY_SYMBOL})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Discount Value</label>
              <Input type="number" value={editing.discount_value} onChange={(e) => setEditing({ ...editing, discount_value: +e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Start Date</label>
              <Input type="datetime-local" value={editing.start_date?.slice(0, 16) ?? ""} onChange={(e) => setEditing({ ...editing, start_date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">End Date</label>
              <Input type="datetime-local" value={editing.end_date?.slice(0, 16) ?? ""} onChange={(e) => setEditing({ ...editing, end_date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Apply To</label>
            <Select value={editing.apply_to} onValueChange={(v) => setEditing({ ...editing, apply_to: v, target_ids: [] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="entire_store">Entire store</SelectItem>
                <SelectItem value="specific_products">Specific products</SelectItem>
                <SelectItem value="specific_category">Specific categories</SelectItem>
                <SelectItem value="specific_brand">Specific brands</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {editing.apply_to === "specific_products" && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Select Products</label>
              <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.target_ids.includes(p.id)}
                      onChange={(e) => {
                        const ids = e.target.checked
                          ? [...editing.target_ids, p.id]
                          : editing.target_ids.filter((id) => id !== p.id);
                        setEditing({ ...editing, target_ids: ids });
                      }}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          {editing.apply_to === "specific_category" && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Select Category</label>
              <Select value={editing.target_ids[0] ?? ""} onValueChange={(v) => setEditing({ ...editing, target_ids: [v] })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {editing.apply_to === "specific_brand" && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Select Brand</label>
              <Select value={editing.target_ids[0] ?? ""} onValueChange={(v) => setEditing({ ...editing, target_ids: [v] })}>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <ImageUpload
            value={editing.banner_image ? [editing.banner_image] : []}
            onChange={(urls) => setEditing({ ...editing, banner_image: urls[0] || null })}
            label="Banner Image (optional)"
          />
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={editing.enabled} onCheckedChange={(v) => setEditing({ ...editing, enabled: v })} />
              <span className="text-sm">Enabled</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editing.featured} onCheckedChange={(v) => setEditing({ ...editing, featured: v })} />
              <span className="text-sm">Featured</span>
            </div>
          </div>
          <Button onClick={handleSave}>{isNew ? "Create offer" : "Save changes"}</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Percent size={18} className="text-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Offers & Deals</h1>
        </div>
        <Button size="sm" onClick={() => { setEditing({ id: "", ...emptyOffer } as Offer); setIsNew(true); }}>
          <Plus size={14} className="mr-1" /> Create Offer
        </Button>
      </div>
      {offers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No offers yet.</p>
      ) : (
        <div className="space-y-2">
          {offers.map((o) => (
            <div key={o.id} className={`flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3 ${isExpired(o) ? "opacity-50" : ""}`}>
              <div>
                <span className="text-sm font-medium text-foreground">{o.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {o.discount_value}{o.discount_type === "percentage" ? "%" : CURRENCY_SYMBOL} off · {o.apply_to.replace(/_/g, " ")}
                </span>
                {isExpired(o) && <span className="text-[10px] text-destructive ml-2">Expired</span>}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={o.enabled}
                  onCheckedChange={async (v) => {
                    await supabase.from("offers").update({ enabled: v }).eq("id", o.id);
                    setOffers(offers.map((x) => x.id === o.id ? { ...x, enabled: v } : x));
                  }}
                />
                <Button variant="ghost" size="sm" onClick={() => { setEditing(o); setIsNew(false); }}>Edit</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(o.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OfferManager;
