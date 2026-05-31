import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import { toast } from "sonner";
import type { IncompleteRow } from "./RecoveryDialog";

interface Props {
  rows: IncompleteRow[];
  open: boolean;
  onClose: () => void;
}

const BulkRecoverDialog = ({ rows, open, onClose }: Props) => {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const eligible = rows.filter((r) => !r.recovered);

  const run = async () => {
    setRunning(true);
    setProgress(0);
    let ok = 0, fail = 0;
    for (const r of eligible) {
      try {
        const { error } = await (supabase.rpc as any)("recover_incomplete_order", {
          _incomplete_id: r.id,
          _payload: { recovery_notes: "Bulk recovery" },
        });
        if (error) throw error;
        ok++;
      } catch {
        fail++;
      }
      setProgress((p) => p + 1);
    }
    setRunning(false);
    toast.success(`Recovered ${ok}${fail ? `, ${fail} failed` : ""}`);
    qc.invalidateQueries({ queryKey: ["admin", "incomplete-orders"] });
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !running && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk recover {eligible.length} cart{eligible.length === 1 ? "" : "s"}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Each cart will be converted into a real order using its current customer, items, and shipping values.
          Stock will be decremented and an admin notification will fire per order.
        </p>
        <div className="max-h-60 overflow-y-auto border border-border/60 rounded-lg divide-y divide-border/40">
          {eligible.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-2.5 text-sm">
              <span className="truncate">{r.customer_name || "Unnamed"} · {r.phone}</span>
              <span className="tabular-nums text-muted-foreground">{CURRENCY_SYMBOL}{Math.round(Number(r.total ?? 0))}</span>
            </div>
          ))}
        </div>
        {running && (
          <p className="text-xs text-muted-foreground">Processing {progress} / {eligible.length}…</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={running}>Cancel</Button>
          <Button onClick={run} disabled={running || eligible.length === 0}>
            {running ? "Recovering…" : `Recover ${eligible.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkRecoverDialog;