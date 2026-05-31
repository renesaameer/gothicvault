import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import { Section, FormRow, EmptyState, StickyActionBar } from "@/components/admin/ui";
import { useDirtyForm } from "@/hooks/useDirtyForm";

interface Zone {
  id: string;
  zone_name: string;
  areas: string;
  delivery_charge: number;
  free_delivery_minimum: number | null;
  estimated_days: string;
  enabled: boolean;
  sort_order: number;
}

const empty: Omit<Zone, "id"> = {
  zone_name: "", areas: "", delivery_charge: 0, free_delivery_minimum: null,
  estimated_days: "3-5 days", enabled: true, sort_order: 0,
};

const DeliverySettings = ({ hideTitle }: { hideTitle?: boolean }) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOnPdp, setShowOnPdp] = useState(true);
  const { toast } = useToast();
  const { dirty, rebase } = useDirtyForm(editing);

  const fetch = async () => {
    const [zonesRes, shopRes] = await Promise.all([
      supabase.from("delivery_zones").select("*").order("sort_order"),
      supabase.from("shop_settings").select("pdp_show_shipment_details").eq("id", "default").maybeSingle(),
    ]);
    const rows = ((zonesRes.data as any[]) ?? []).map((r) => ({
      ...r,
      zone_name: r.zone_name || r.name || "",
      areas: Array.isArray(r.areas) ? r.areas.join(", ") : (r.areas ?? ""),
    })) as Zone[];
    setZones(rows);
    setShowOnPdp((shopRes.data as any)?.pdp_show_shipment_details !== false);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const togglePdpVisibility = async (v: boolean) => {
    setShowOnPdp(v);
    const { error } = await supabase
      .from("shop_settings")
      .update({ pdp_show_shipment_details: v } as any)
      .eq("id", "default");
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setShowOnPdp(!v);
    } else {
      toast({ title: v ? "Shown on product page" : "Hidden on product page" });
    }
  };

  const startEdit = (zone: Zone, fresh: boolean) => {
    setIsNew(fresh);
    setEditing(zone);
    rebase(zone);
  };

  const toPayload = (z: Zone) => {
    const areasArr = (z.areas || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      name: z.zone_name,
      zone_name: z.zone_name,
      areas: areasArr,
      delivery_charge: z.delivery_charge,
      shipping_cost: z.delivery_charge,
      free_delivery_minimum: z.free_delivery_minimum,
      free_shipping_threshold: z.free_delivery_minimum,
      estimated_days: z.estimated_days,
      enabled: z.enabled,
      sort_order: z.sort_order,
    };
  };

  const save = async () => {
    if (!editing || !editing.zone_name.trim()) return;
    setSaving(true);
    const payload = toPayload(editing);
    if (isNew) {
      const { error } = await supabase.from("delivery_zones").insert(payload as any);
      setSaving(false);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("delivery_zones").update(payload as any).eq("id", editing.id);
      setSaving(false);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: isNew ? "Zone added" : "Zone updated" });
    setEditing(null);
    setIsNew(false);
    fetch();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this delivery zone?")) return;
    await supabase.from("delivery_zones").delete().eq("id", id);
    toast({ title: "Zone deleted" });
    fetch();
  };

  if (editing) {
    return (
      <div className="max-w-2xl space-y-5 pb-20">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-foreground tracking-tight">{isNew ? "Add zone" : "Edit zone"}</h2>
          <Button variant="ghost" size="sm" onClick={() => { setEditing(null); setIsNew(false); }} className="h-9 w-9 p-0"><X size={14} /></Button>
        </div>

        <Section title="Zone details">
          <div className="space-y-4">
            <FormRow label="Zone name" required>
              <Input className="h-11" value={editing.zone_name} onChange={(e) => setEditing({ ...editing, zone_name: e.target.value })} placeholder="Inside Dhaka" />
            </FormRow>
            <FormRow label="Areas" hint="Comma-separated list shown on the product page.">
              <Input className="h-11" value={editing.areas} onChange={(e) => setEditing({ ...editing, areas: e.target.value })} placeholder="Mirpur, Uttara, Gulshan" />
            </FormRow>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormRow label={`Delivery charge (${CURRENCY_SYMBOL})`}>
                <Input className="h-11" type="number" inputMode="numeric" value={editing.delivery_charge} onChange={(e) => setEditing({ ...editing, delivery_charge: +e.target.value })} />
              </FormRow>
              <FormRow label={`Free delivery from (${CURRENCY_SYMBOL})`} hint="Leave empty for none.">
                <Input className="h-11" type="number" inputMode="numeric" value={editing.free_delivery_minimum ?? ""} onChange={(e) => setEditing({ ...editing, free_delivery_minimum: e.target.value ? +e.target.value : null })} />
              </FormRow>
            </div>
            <FormRow label="Estimated days">
              <Input className="h-11" value={editing.estimated_days} onChange={(e) => setEditing({ ...editing, estimated_days: e.target.value })} placeholder="3-5 days" />
            </FormRow>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[13px] font-medium text-foreground">Enabled</span>
              <Switch checked={editing.enabled} onCheckedChange={(v) => setEditing({ ...editing, enabled: v })} />
            </div>
          </div>
        </Section>

        <StickyActionBar visible={isNew || dirty} message={isNew ? "New zone — not saved" : "Unsaved changes"}>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setIsNew(false); }}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving || !editing.zone_name.trim()}>{saving ? "Saving…" : isNew ? "Add zone" : "Save"}</Button>
        </StickyActionBar>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!hideTitle && <h1 className="text-xl font-semibold text-foreground tracking-tight">Delivery</h1>}

      <Section
        title="Show on product page"
        description="Display zones, charges and estimated days under the buy buttons."
        actions={<Switch checked={showOnPdp} onCheckedChange={togglePdpVisibility} />}
      >
        <p className="text-[12px] text-muted-foreground/60">Customers see your delivery zones and shipping rates on every product page.</p>
      </Section>

      <Section
        title="Zones & rates"
        description="Manage delivery zones, charges and free shipping thresholds"
        actions={
          <Button size="sm" className="h-9" onClick={() => startEdit({ id: "", ...empty } as Zone, true)}>
            <Plus size={14} className="mr-1" /> Add zone
          </Button>
        }
      >
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : zones.length === 0 ? (
          <EmptyState
            title="No delivery zones yet"
            description="Add your first zone to define delivery charges."
            action={<Button size="sm" onClick={() => startEdit({ id: "", ...empty } as Zone, true)}><Plus size={14} className="mr-1" /> Add zone</Button>}
          />
        ) : (
          <div className="space-y-2">
            {zones.map((z) => (
              <div key={z.id} className="rounded-xl border border-border/40 p-3 sm:p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[13px] font-semibold text-foreground truncate">{z.zone_name}</h3>
                    {!z.enabled && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Disabled</span>}
                  </div>
                  {z.areas && <p className="text-[12px] text-muted-foreground/70 mb-1.5 truncate">{z.areas}</p>}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/70 tabular-nums">
                    <span>{CURRENCY_SYMBOL}{z.delivery_charge}</span>
                    {z.free_delivery_minimum && <span>Free over {CURRENCY_SYMBOL}{z.free_delivery_minimum}</span>}
                    <span>{z.estimated_days}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(z, false)} className="h-9 w-9 p-0"><Pencil size={14} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(z.id)} className="h-9 w-9 p-0 text-destructive hover:text-destructive"><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

export default DeliverySettings;
