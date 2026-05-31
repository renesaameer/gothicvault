import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { callEcomDrive } from "@/hooks/useEcomDrive";
import { ChevronDown, ChevronRight, Download, RefreshCw, RotateCcw } from "lucide-react";

const PAGE = 100;

const EcomDriveLogs = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "success" | "failed">("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    let q: any = (supabase.from as any)("ecomdrive_logs").select("*").order("created_at", { ascending: false }).limit(PAGE);
    if (filter === "success") q = q.eq("success", true);
    if (filter === "failed") q = q.eq("success", false);
    if (from) q = q.gte("created_at", from);
    if (to) q = q.lte("created_at", to + "T23:59:59");
    const { data, error } = await q;
    if (error) toast({ title: "Failed to load logs", description: error.message, variant: "destructive" });
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter, from, to]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter((r) =>
      (r.invoice_number || "").toLowerCase().includes(s) ||
      (r.endpoint || "").toLowerCase().includes(s) ||
      (r.error || "").toLowerCase().includes(s) ||
      (r.order_id || "").toLowerCase().includes(s)
    );
  }, [rows, search]);

  const exportCsv = () => {
    const headers = ["created_at", "endpoint", "method", "http_status", "success", "invoice_number", "order_id", "retry_attempt", "error"];
    const csv = [headers.join(",")].concat(
      filtered.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ecomdrive-logs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const retry = async (orderId: string | null) => {
    if (!orderId) return;
    try {
      const r = await callEcomDrive("push_order", { orderId, force: true });
      toast({ title: r?.success ? "Pushed" : "Push failed", description: r?.error });
      load();
    } catch (e: any) {
      toast({ title: "Retry failed", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Courier Logs</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />CSV</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex gap-1">
          {(["all", "success", "failed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 h-9 rounded-lg text-xs font-medium border ${filter === f ? "bg-foreground text-background border-foreground" : "bg-background border-border/40 text-muted-foreground"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground mb-0.5">From</div>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-36" />
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground mb-0.5">To</div>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-36" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search invoice / endpoint / error" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9" />
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-background overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No logs.</div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((r) => {
              const isOpen = !!open[r.id];
              return (
                <div key={r.id} className="text-xs">
                  <button className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/30" onClick={() => setOpen((o) => ({ ...o, [r.id]: !isOpen }))}>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {r.success ? "OK" : "FAIL"}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground w-12">{r.http_status ?? "—"}</span>
                    <span className="font-medium truncate">{r.method} {r.endpoint}</span>
                    <span className="text-muted-foreground truncate">{r.invoice_number || ""}</span>
                    {r.retry_attempt > 0 && <span className="text-[10px] text-amber-600">retry #{r.retry_attempt}</span>}
                    <span className="ml-auto text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 space-y-2">
                      {r.error && <div className="text-red-600">{r.error}</div>}
                      {r.request_payload && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Request</div>
                          <pre className="bg-muted/40 rounded p-2 overflow-x-auto text-[11px]">{JSON.stringify(r.request_payload, null, 2)}</pre>
                        </div>
                      )}
                      {r.response_body && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Response</div>
                          <pre className="bg-muted/40 rounded p-2 overflow-x-auto text-[11px]">{JSON.stringify(r.response_body, null, 2)}</pre>
                        </div>
                      )}
                      {!r.success && r.order_id && (
                        <Button size="sm" variant="outline" onClick={() => retry(r.order_id)}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Retry push
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EcomDriveLogs;
