import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type IncompleteRow = {
  id: string;
  customer_name: string | null;
  phone: string;
  email: string | null;
  address: Record<string, any>;
  cart_items: any[];
  subtotal: number;
  delivery_charge: number;
  total: number;
  coupon: string | null;
  payment_method: string | null;
  recovered: boolean;
  converted_order_id: string | null;
  recovery_notes?: string | null;
};

type Mode = "view" | "edit" | "recover";

interface Props {
  row: IncompleteRow | null;
  mode: Mode;
  onClose: () => void;
}

const num = (v: any, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const RecoveryDialog = ({ row, mode, onClose }: Props) => {
  const qc = useQueryClient();
  const isView = mode === "view";
  const isRecover = mode === "recover";

  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("");
  const [shipping, setShipping] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [payment, setPayment] = useState("cod");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row) return;
    setItems(Array.isArray(row.cart_items) ? row.cart_items.map((it: any) => ({ ...it })) : []);
    setName(row.customer_name ?? "");
    setPhone(row.phone ?? "");
    setEmail(row.email ?? "");
    const addr = row.address ?? {};
    setLine1(addr.line1 ?? addr.address ?? "");
    setCity(addr.city ?? "");
    setZone(addr.delivery_zone ?? addr.zone ?? "");
    setShipping(num(row.delivery_charge));
    setDiscount(0);
    setCoupon(row.coupon ?? "");
    setPayment(row.payment_method ?? "cod");
    setNotes("");
  }, [row?.id, mode]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + num(it.sale_price ?? it.price) * num(it.quantity, 1), 0),
    [items],
  );
  const total = Math.max(0, subtotal + num(shipping) - num(discount));

  if (!row) return null;

  const setQty = (i: number, q: number) => {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, quantity: Math.max(1, q) } : it)));
  };
  const removeItem = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i));

  const buildAddress = () => ({ ...(row.address ?? {}), line1, city, delivery_zone: zone });

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase.rpc as any)("admin_update_incomplete_order", {
        _id: row.id,
        _payload: {
          customer_name: name,
          email,
          phone,
          address: buildAddress(),
          cart_items: items,
          subtotal,
          delivery_charge: shipping,
          total,
          coupon: coupon || null,
          payment_method: payment,
        } as any,
      });
      if (error) throw error;
      toast.success("Incomplete cart updated");
      qc.invalidateQueries({ queryKey: ["admin", "incomplete-orders"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRecover = async () => {
    if (row.recovered) {
      toast.error("Already recovered");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await (supabase.rpc as any)("recover_incomplete_order", {
        _incomplete_id: row.id,
        _payload: {
          customer_name: name,
          customer_phone: phone,
          customer_email: email || null,
          customer_address: line1,
          customer_city: city,
          shipping_address: buildAddress(),
          items,
          subtotal,
          discount_amount: discount,
          shipping_cost: shipping,
          total,
          payment_method: payment,
          coupon_code: coupon || null,
          recovery_notes: notes || null,
        } as any,
      });
      if (error) throw error;
      const result = data as any;
      toast.success(
        result?.already_recovered
          ? `Already recovered as ${result.order_number}`
          : `Order ${result?.order_number ?? ""} created`,
      );
      qc.invalidateQueries({ queryKey: ["admin", "incomplete-orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Recovery failed");
    } finally {
      setSaving(false);
    }
  };

  const title =
    mode === "view" ? "Cart details" : mode === "edit" ? "Edit incomplete cart" : "Recover incomplete cart";

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Customer */}
          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 font-semibold">Customer</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} disabled={isView} /></Field>
              <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isView} /></Field>
              <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={isView} /></Field>
              <Field label="City"><Input value={city} onChange={(e) => setCity(e.target.value)} disabled={isView} /></Field>
              <Field label="Address" className="sm:col-span-2"><Input value={line1} onChange={(e) => setLine1(e.target.value)} disabled={isView} /></Field>
              <Field label="Zone"><Input value={zone} onChange={(e) => setZone(e.target.value)} disabled={isView} /></Field>
              <Field label="Payment"><Input value={payment} onChange={(e) => setPayment(e.target.value)} disabled={isView} /></Field>
            </div>
          </section>

          {/* Items */}
          <section className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 font-semibold">Items</p>
            <div className="space-y-2">
              {items.length === 0 && <p className="text-xs text-muted-foreground">No items.</p>}
              {items.map((it, i) => {
                const price = num(it.sale_price ?? it.price);
                const qty = num(it.quantity, 1);
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{it.name ?? "Item"}</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {CURRENCY_SYMBOL}{price} × {qty} = {CURRENCY_SYMBOL}{price * qty}
                      </p>
                    </div>
                    {!isView && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setQty(i, qty - 1)} className="h-7 w-7 rounded-md border border-border/60 hover:bg-muted flex items-center justify-center"><Minus size={12} /></button>
                        <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
                        <button onClick={() => setQty(i, qty + 1)} className="h-7 w-7 rounded-md border border-border/60 hover:bg-muted flex items-center justify-center"><Plus size={12} /></button>
                        <button onClick={() => removeItem(i)} className="h-7 w-7 rounded-md text-destructive hover:bg-destructive/10 flex items-center justify-center ml-1"><Trash2 size={12} /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Totals */}
          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 font-semibold">Totals</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Shipping">
                <Input type="number" value={shipping} onChange={(e) => setShipping(num(e.target.value))} disabled={isView} />
              </Field>
              <Field label="Discount">
                <Input type="number" value={discount} onChange={(e) => setDiscount(num(e.target.value))} disabled={isView || !isRecover} />
              </Field>
              <Field label="Coupon">
                <Input value={coupon} onChange={(e) => setCoupon(e.target.value)} disabled={isView} />
              </Field>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Subtotal {CURRENCY_SYMBOL}{subtotal}</span>
              <span className="text-lg font-semibold tabular-nums">{CURRENCY_SYMBOL}{total}</span>
            </div>
          </section>

          {isRecover && (
            <section className="space-y-2">
              <Label className="text-xs">Recovery notes (internal)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional context for the order log" />
            </section>
          )}
        </div>

        <DialogFooter className={cn("gap-2", "sm:gap-2")}>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {mode === "edit" && (
            <Button onClick={handleSaveEdit} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          )}
          {mode === "recover" && (
            <Button onClick={handleRecover} disabled={saving || row.recovered} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {row.recovered ? "Already recovered" : saving ? "Recovering…" : "Confirm & create order"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label className="text-[11px] text-muted-foreground">{label}</Label>
    {children}
  </div>
);

export default RecoveryDialog;