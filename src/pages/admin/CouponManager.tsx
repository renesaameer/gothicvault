import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminCoupons, adminKeys } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, X, Pencil, Copy, Tag, Clock, Users, ShoppingCart } from "lucide-react";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  enabled: boolean;
  expires_at: string | null;
  created_at: string;
}

type FormState = {
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: string;
  expires_at: string;
};

const emptyForm: FormState = {
  code: "", discount_type: "percentage", discount_value: 10,
  min_order_amount: 0, max_uses: "", expires_at: "",
};

const CouponManager = () => {
  const { data: couponsData, isLoading: loading } = useAdminCoupons();
  const coupons = (couponsData ?? []) as Coupon[];
  const qc = useQueryClient();
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const validate = (): boolean => {
    if (!form.code.trim()) {
      toast({ title: "Coupon code is required", variant: "destructive" }); return false;
    }
    if (form.code.trim().length < 3) {
      toast({ title: "Code must be at least 3 characters", variant: "destructive" }); return false;
    }
    if (form.discount_value <= 0) {
      toast({ title: "Discount value must be greater than 0", variant: "destructive" }); return false;
    }
    if (form.discount_type === "percentage" && form.discount_value > 100) {
      toast({ title: "Percentage discount cannot exceed 100%", variant: "destructive" }); return false;
    }
    if (form.max_uses && parseInt(form.max_uses) <= 0) {
      toast({ title: "Max uses must be a positive number", variant: "destructive" }); return false;
    }
    if (form.expires_at && new Date(form.expires_at) < new Date()) {
      toast({ title: "Expiry date must be in the future", variant: "destructive" }); return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_order_amount: form.min_order_amount || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
    };

    let error;
    if (view === "edit" && editId) {
      ({ error } = await supabase.from("coupons").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("coupons").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: view === "edit" ? "Coupon updated" : "Coupon created" });
      resetForm();
      qc.invalidateQueries({ queryKey: adminKeys.coupons });
    }
  };

  const resetForm = () => {
    setView("list");
    setEditId(null);
    setForm(emptyForm);
  };

  const startEdit = (c: Coupon) => {
    setEditId(c.id);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount ?? 0,
      max_uses: c.max_uses ? String(c.max_uses) : "",
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : "",
    });
    setView("edit");
  };

  const duplicateCoupon = (c: Coupon) => {
    setForm({
      code: c.code + "_COPY",
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount ?? 0,
      max_uses: c.max_uses ? String(c.max_uses) : "",
      expires_at: "",
    });
    setView("add");
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    // Optimistic
    qc.setQueryData(adminKeys.coupons, (old: any[]) => old?.map((c) => c.id === id ? { ...c, enabled } : c));
    await supabase.from("coupons").update({ enabled }).eq("id", id);
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon permanently?")) return;
    // Optimistic
    qc.setQueryData(adminKeys.coupons, (old: any[]) => old?.filter((c) => c.id !== id));
    toast({ title: "Coupon deleted" });
    await supabase.from("coupons").delete().eq("id", id);
  };

  const getCouponStatus = (c: Coupon): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    if (!c.enabled) return { label: "Disabled", variant: "secondary" };
    if (c.expires_at && new Date(c.expires_at) < new Date()) return { label: "Expired", variant: "destructive" };
    if (c.max_uses && c.used_count >= c.max_uses) return { label: "Limit Reached", variant: "destructive" };
    return { label: "Active", variant: "default" };
  };

  // Stats
  const activeCoupons = coupons.filter(c => {
    if (!c.enabled) return false;
    if (c.expires_at && new Date(c.expires_at) < new Date()) return false;
    if (c.max_uses && c.used_count >= c.max_uses) return false;
    return true;
  }).length;
  const totalUsed = coupons.reduce((sum, c) => sum + c.used_count, 0);

  if (view === "add" || view === "edit") {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-foreground">{view === "edit" ? "Edit Coupon" : "Create Coupon"}</h1>
          <Button variant="ghost" size="sm" onClick={resetForm}><X size={16} className="mr-1" /> Cancel</Button>
        </div>
        <div className="grid gap-5 max-w-lg">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Coupon Code *</label>
            <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE20" className="font-mono" />
            <p className="text-xs text-muted-foreground mt-1">Customers enter this code at checkout</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Discount Type</label>
              <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ({CURRENCY_SYMBOL})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Value {form.discount_type === "percentage" ? "(%)" : `(${CURRENCY_SYMBOL})`}
              </label>
              <Input
                type="number"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: +e.target.value })}
                min={1}
                max={form.discount_type === "percentage" ? 100 : undefined}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Min Order ({CURRENCY_SYMBOL})</label>
              <Input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: +e.target.value })} min={0} />
              <p className="text-xs text-muted-foreground mt-1">0 = no minimum</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Max Uses</label>
              <Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" min={1} />
              <p className="text-xs text-muted-foreground mt-1">Empty = unlimited</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Expires At</label>
            <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">Leave empty for no expiry</p>
          </div>

          {/* Preview */}
          <div className="bg-secondary/50 rounded-xl p-4 border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-foreground" />
              <span className="font-mono font-semibold text-foreground">{form.code || "CODE"}</span>
              <span className="text-sm text-muted-foreground">—</span>
              <span className="text-sm text-foreground">
                {form.discount_type === "percentage" ? `${form.discount_value}% off` : `${CURRENCY_SYMBOL}${form.discount_value} off`}
              </span>
            </div>
            {form.min_order_amount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">on orders above {CURRENCY_SYMBOL}{form.min_order_amount}</p>
            )}
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : view === "edit" ? "Update Coupon" : "Create Coupon"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] sm:text-2xl font-semibold tracking-tight text-foreground">Coupons</h1>
          <p className="text-[13px] text-muted-foreground/70 mt-0.5">{coupons.length} total · {activeCoupons} active · {totalUsed} redemptions</p>
        </div>
        <Button size="sm" onClick={() => setView("add")}><Plus size={14} className="mr-1" /> New</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 bg-background rounded-xl border border-border">
          <Tag size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No coupons yet. Create your first coupon to start offering discounts.</p>
          <Button size="sm" onClick={() => setView("add")}><Plus size={14} className="mr-1" /> Create Coupon</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => {
            const status = getCouponStatus(c);
            return (
              <div key={c.id} className="bg-background rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-foreground font-mono">{c.code}</span>
                      <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">{status.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {c.discount_type === "percentage" ? `${c.discount_value}% off` : `${CURRENCY_SYMBOL}${c.discount_value} off`}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                      {(c.min_order_amount ?? 0) > 0 && <span>Min: {CURRENCY_SYMBOL}{c.min_order_amount}</span>}
                      <span>Used: {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</span>
                      {c.expires_at && (
                        <span className={new Date(c.expires_at) < new Date() ? "text-destructive" : ""}>
                          {new Date(c.expires_at) < new Date() ? "Expired" : "Expires"}: {new Date(c.expires_at).toLocaleDateString()}
                        </span>
                      )}
                      <span>Created: {new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch checked={c.enabled} onCheckedChange={(v) => toggleEnabled(c.id, v)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(c)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateCoupon(c)}>
                      <Copy size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteCoupon(c.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CouponManager;
