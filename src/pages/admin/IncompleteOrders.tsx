import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CURRENCY_SYMBOL, toBanglaDigits } from "@/lib/currency";
import { Search, Phone, Mail, MapPin, Package, Clock, CheckCircle2, Inbox, Eye, Pencil, Sparkles, Trash2, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";
import RecoveryDialog, { type IncompleteRow as DialogRow } from "@/components/admin/incomplete/RecoveryDialog";
import BulkRecoverDialog from "@/components/admin/incomplete/BulkRecoverDialog";
import { toast } from "sonner";

type IncompleteRow = {
  id: string;
  session_id: string;
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
  checkout_step: string;
  recovery_status: string;
  recovered: boolean;
  converted_order_id: string | null;
  last_activity: string;
  created_at: string;
  contact_attempts?: number;
  recovery_notes?: string | null;
};

const PAGE_SIZE = 25;

const relTime = (iso: string) => {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};

const IncompleteOrders = () => {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "incomplete-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incomplete_orders")
        .select("*")
        .order("last_activity", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as IncompleteRow[];
    },
    staleTime: 60_000,
  });

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "contacted" | "recovered">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<{ row: DialogRow | null; mode: "view" | "edit" | "recover" }>({ row: null, mode: "view" });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setPage(1); setSelected(new Set()); }, [query, filter]);

  // Meaningful entries only: valid phone (11 digits), at least one item, some progress
  const meaningful = useMemo(
    () =>
      rows.filter(
        (r) =>
          /^01[0-9]{9}$/.test(r.phone) &&
          Array.isArray(r.cart_items) &&
          r.cart_items.length > 0,
      ),
    [rows],
  );

  const filtered = useMemo(() => {
    let out = meaningful;
    if (filter === "pending") out = out.filter((r) => !r.recovered && r.recovery_status !== "contacted");
    if (filter === "contacted") out = out.filter((r) => !r.recovered && r.recovery_status === "contacted");
    if (filter === "recovered") out = out.filter((r) => r.recovered);
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (r) =>
          r.phone.includes(q) ||
          (r.customer_name ?? "").toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q),
      );
    }
    return out;
  }, [meaningful, filter, query]);

  const stats = useMemo(() => {
    const total = meaningful.length;
    const recovered = meaningful.filter((r) => r.recovered).length;
    const abandoned = meaningful.filter((r) => !r.recovered);
    const abandonedValue = abandoned.reduce((s, r) => s + Number(r.total ?? 0), 0);
    const rate = total ? Math.round((recovered / total) * 100) : 0;

    const counts = new Map<string, { name: string; count: number }>();
    abandoned.forEach((r) =>
      (r.cart_items ?? []).forEach((it: any) => {
        const key = it.product_id ?? it.id ?? it.name;
        if (!key) return;
        const prev = counts.get(key) ?? { name: it.name ?? "Unnamed", count: 0 };
        prev.count += Number(it.quantity ?? 1);
        counts.set(key, prev);
      }),
    );
    const topAbandoned = Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { total, recovered, rate, abandonedValue, topAbandoned };
  }, [meaningful]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedRows = useMemo(() => meaningful.filter((r) => selected.has(r.id)), [meaningful, selected]);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((r) => next.delete(r.id));
      else pageRows.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const clearSelection = () => setSelected(new Set());

  const handleBulkContacted = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const { error } = await (supabase.rpc as any)("bulk_mark_incomplete_contacted", { _ids: ids });
    if (error) toast.error(error.message);
    else {
      toast.success(`Marked ${ids.length} as contacted`);
      qc.invalidateQueries({ queryKey: ["admin", "incomplete-orders"] });
      clearSelection();
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const { error } = await (supabase.rpc as any)("bulk_delete_incomplete", { _ids: ids });
    if (error) toast.error(error.message);
    else {
      toast.success(`Deleted ${ids.length}`);
      qc.invalidateQueries({ queryKey: ["admin", "incomplete-orders"] });
      clearSelection();
    }
    setConfirmDelete(false);
  };

  return (
    <div className="max-w-6xl pb-24">
      <div className="mb-5">
        <h1 className="text-[20px] sm:text-2xl font-semibold tracking-tight text-foreground">Incomplete orders</h1>
        <p className="text-[13px] text-muted-foreground/70 mt-0.5">
          Carts where the customer entered a valid phone but did not place the order.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={Inbox} label="Total" value={toBanglaDigits(stats.total)} />
        <StatCard icon={CheckCircle2} label="Recovered" value={toBanglaDigits(stats.recovered)} tone="success" />
        <StatCard icon={Clock} label="Recovery rate" value={`${toBanglaDigits(stats.rate)}%`} />
        <StatCard icon={Package} label="Abandoned value" value={`${CURRENCY_SYMBOL}${toBanglaDigits(Math.round(stats.abandonedValue))}`} tone="warn" />
      </div>

      {/* Top abandoned products */}
      {stats.topAbandoned.length > 0 && (
        <div className="bg-background border border-border/60 rounded-2xl p-4 mb-5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/60 font-semibold mb-2">
            Most abandoned products
          </p>
          <div className="flex flex-wrap gap-2">
            {stats.topAbandoned.map((p) => (
              <span key={p.name} className="inline-flex items-center gap-1.5 text-xs bg-muted/60 px-2.5 py-1 rounded-full">
                {p.name} <span className="text-muted-foreground tabular-nums">×{toBanglaDigits(p.count)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search phone, name, or email…"
            className="pl-9 h-10"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-[180px] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending recovery</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="recovered">Recovered</SelectItem>
          </SelectContent>
        </Select>
        {pageRows.length > 0 && (
          <label className="flex items-center gap-2 px-3 h-10 rounded-lg border border-border/60 text-xs text-muted-foreground cursor-pointer hover:bg-muted/40">
            <Checkbox checked={allOnPageSelected} onCheckedChange={toggleAllOnPage} />
            <span>Select page</span>
          </label>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : pageRows.length === 0 ? (
        <div className="bg-background border border-border/60 rounded-2xl p-10 text-center">
          <Inbox className="mx-auto text-muted-foreground/40 mb-2" size={28} />
          <p className="text-sm text-muted-foreground">No matching incomplete orders.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pageRows.map((r) => (
            <Row
              key={r.id}
              r={r}
              selected={selected.has(r.id)}
              onToggle={() => toggleOne(r.id)}
              onView={() => setDialog({ row: r as any, mode: "view" })}
              onEdit={() => setDialog({ row: r as any, mode: "edit" })}
              onRecover={() => setDialog({ row: r as any, mode: "recover" })}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            Page {toBanglaDigits(page)} of {toBanglaDigits(pageCount)} · {toBanglaDigits(filtered.length)} entries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted/60 disabled:opacity-40"
            >Prev</button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted/60 disabled:opacity-40"
            >Next</button>
          </div>
        </div>
      )}

      {/* Sticky bulk action toolbar */}
      {selected.size > 0 && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:max-w-2xl z-40 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg px-3 sm:px-4 py-2.5 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-foreground">
            {toBanglaDigits(selected.size)} selected
          </span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={handleBulkContacted} className="gap-1.5 h-8">
            <PhoneCall size={12} /> Contacted
          </Button>
          <Button size="sm" onClick={() => setBulkOpen(true)} className="gap-1.5 h-8 bg-primary text-primary-foreground hover:bg-primary/90">
            <Sparkles size={12} /> Recover
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} className="gap-1.5 h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 size={12} /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={clearSelection} className="h-8 text-muted-foreground">Cancel</Button>
        </div>
      )}

      <RecoveryDialog row={dialog.row} mode={dialog.mode} onClose={() => setDialog({ row: null, mode: "view" })} />
      <BulkRecoverDialog rows={selectedRows as any} open={bulkOpen} onClose={() => { setBulkOpen(false); clearSelection(); }} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} incomplete cart{selected.size === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const StatCard = ({
  icon: Icon, label, value, tone,
}: { icon: any; label: string; value: string; tone?: "success" | "warn" }) => (
  <div className="bg-background border border-border/60 rounded-2xl p-4">
    <div className="flex items-center gap-2 text-muted-foreground/70 mb-1.5">
      <Icon size={14} className={cn(
        tone === "success" && "text-green-600",
        tone === "warn" && "text-amber-600",
      )} />
      <span className="text-[11px] uppercase tracking-wide font-semibold">{label}</span>
    </div>
    <p className="text-xl font-semibold text-foreground tabular-nums">{value}</p>
  </div>
);

const statusBadge = (r: IncompleteRow) => {
  if (r.recovered) return { label: "Recovered", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" };
  if (r.recovery_status === "contacted") return { label: "Contacted", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" };
  if (r.recovery_status === "expired") return { label: "Expired", cls: "bg-muted text-muted-foreground" };
  return { label: "Pending", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" };
};

const Row = ({
  r, selected, onToggle, onView, onEdit, onRecover,
}: {
  r: IncompleteRow;
  selected: boolean;
  onToggle: () => void;
  onView: () => void;
  onEdit: () => void;
  onRecover: () => void;
}) => {
  const addr = r.address ?? {};
  const addrLine = [addr.line1, addr.city, addr.delivery_zone].filter(Boolean).join(", ");
  const badge = statusBadge(r);
  const itemNames = (r.cart_items ?? []).map((it: any) => `${it.name ?? "Item"}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`).join(", ");
  return (
    <div className={cn(
      "bg-background border rounded-xl p-3.5 sm:p-4 transition-all duration-150",
      selected ? "border-primary/60 ring-1 ring-primary/30" : "border-border/60 hover:border-border",
    )}>
      <div className="flex items-start gap-3">
        <div className="pt-1 shrink-0">
          <Checkbox checked={selected} onCheckedChange={onToggle} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-foreground text-[14px] truncate">
                  {r.customer_name || "Unnamed customer"}
                </p>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", badge.cls)}>
                  {badge.label}
                </span>
                {r.recovery_status !== "recovered" && (r.contact_attempts ?? 0) > 0 && (
                  <span className="text-[10px] text-muted-foreground">· {r.contact_attempts}× contacted</span>
                )}
              </div>
              <div className="mt-1.5 grid sm:grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Phone size={11} /> {toBanglaDigits(r.phone)}</span>
                {r.email && <span className="inline-flex items-center gap-1.5 truncate"><Mail size={11} /> {r.email}</span>}
                {addrLine && <span className="inline-flex items-center gap-1.5 sm:col-span-2 truncate"><MapPin size={11} /> {addrLine}</span>}
              </div>
              {itemNames && (
                <p className="text-[11px] text-muted-foreground/80 mt-2 line-clamp-1">
                  <Package size={10} className="inline mr-1 -mt-0.5" />{itemNames}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                {r.payment_method ?? "no payment"} · last activity {relTime(r.last_activity)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-semibold text-foreground tabular-nums">
                {CURRENCY_SYMBOL}{toBanglaDigits(Math.round(Number(r.total ?? 0)))}
              </p>
              {r.coupon && (
                <p className="text-[10px] text-muted-foreground">coupon: {r.coupon}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <Button size="sm" variant="outline" onClick={onView} className="h-8 gap-1.5 text-xs">
              <Eye size={12} /> View
            </Button>
            <Button size="sm" variant="outline" onClick={onEdit} disabled={r.recovered} className="h-8 gap-1.5 text-xs">
              <Pencil size={12} /> Edit
            </Button>
            <Button
              size="sm"
              onClick={onRecover}
              disabled={r.recovered}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles size={12} /> {r.recovered ? "Recovered" : "Recover"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncompleteOrders;