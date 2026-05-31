import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { callEcomDrive } from "@/hooks/useEcomDrive";
import { Loader2, Send, RotateCcw, RefreshCw, Truck } from "lucide-react";

interface Props {
  order: any;
  onChanged?: () => void;
}

const EcomDriveOrderPanel = ({ order, onChanged }: Props) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const status = order.ecomdrive_status || "not_pushed";
  const pushed = status === "pushed";
  const failed = status === "failed";

  const run = async (label: string, fn: () => Promise<any>, key: string) => {
    setBusy(key);
    try {
      const res = await fn();
      if (res?.success === false) throw new Error(res.error || "Failed");
      toast({ title: `${label} succeeded` });
      onChanged?.();
    } catch (e: any) {
      toast({ title: `${label} failed`, description: e?.message || String(e), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-border/40 bg-background p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Courier</div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
            pushed ? "bg-emerald-100 text-emerald-700" :
            failed ? "bg-red-100 text-red-700" :
            "bg-muted text-muted-foreground"
          }`}
        >
          {pushed ? "Sent to courier" : failed ? "Send failed" : "Not sent"}
        </span>
      </div>

      {pushed && (
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {order.ecomdrive_invoice_number && <Field label="Invoice" value={order.ecomdrive_invoice_number} />}
          {order.ecomdrive_courier_name && <Field label="Courier" value={order.ecomdrive_courier_name} />}
          {order.ecomdrive_tracking_id && <Field label="Tracking ID" value={order.ecomdrive_tracking_id} />}
          {order.ecomdrive_rider_name && <Field label="Rider" value={`${order.ecomdrive_rider_name}${order.ecomdrive_rider_phone ? " · " + order.ecomdrive_rider_phone : ""}`} />}
          {order.ecomdrive_pushed_at && <Field label="Pushed" value={new Date(order.ecomdrive_pushed_at).toLocaleString()} />}
          {order.ecomdrive_last_status_sync && <Field label="Last sync" value={new Date(order.ecomdrive_last_status_sync).toLocaleString()} />}
        </div>
      )}

      {failed && order.ecomdrive_error && (
        <div className="text-[11px] text-red-600 bg-red-50 rounded p-2">
          {order.ecomdrive_error}
          {order.ecomdrive_retry_count > 0 && <span className="ml-2 text-muted-foreground">retry #{order.ecomdrive_retry_count}</span>}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!pushed && (
          <Button size="sm" onClick={() => run("Send", () => callEcomDrive("push_order", { orderId: order.id }), "push")} disabled={!!busy}>
            {busy === "push" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
            Send to courier
          </Button>
        )}
        {failed && (
          <Button size="sm" variant="outline" onClick={() => run("Retry", () => callEcomDrive("push_order", { orderId: order.id, force: true }), "retry")} disabled={!!busy}>
            {busy === "retry" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RotateCcw className="h-3 w-3 mr-1" />}
            Retry send
          </Button>
        )}
        {pushed && (
          <Button size="sm" variant="outline" onClick={() => run("Sync tracking", () => callEcomDrive("sync_tracking", { orderId: order.id }), "sync")} disabled={!!busy}>
            {busy === "sync" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
            Sync tracking
          </Button>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="font-medium truncate">{value}</div>
  </div>
);

export default EcomDriveOrderPanel;
