import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, ShoppingCart, Inbox } from "lucide-react";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import { cn } from "@/lib/utils";

const relTime = (iso: string) => {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return `${Math.floor(d)}s`;
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
};

const NotificationBell = () => {
  const { items, unseenByType, markAllSeen, markSeen } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const unseen = unseenByType.total;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const go = async (n: typeof items[number]) => {
    setOpen(false);
    if (!n.admin_seen) await markSeen(n.type);
    if (n.url) navigate(n.url);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted/60 active:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unseen > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center tabular-nums shadow-sm">
            {unseen > 99 ? "99+" : unseen}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-w-[92vw] bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <div>
              <p className="text-[13px] font-semibold text-foreground tracking-tight">Notifications</p>
              <p className="text-[11px] text-muted-foreground/70">{unseen} unread</p>
            </div>
            {unseen > 0 && (
              <button
                onClick={() => markAllSeen()}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted/60 transition-colors"
              >
                <Check size={11} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={20} className="mx-auto text-muted-foreground/40 mb-1.5" />
                <p className="text-[12px] text-muted-foreground/70">No notifications yet</p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = n.type === "order" ? ShoppingCart : Inbox;
                return (
                  <button
                    key={n.id}
                    onClick={() => go(n)}
                    className={cn(
                      "w-full text-left flex gap-3 px-4 py-3 border-b border-border/30 last:border-0 hover:bg-muted/40 transition-colors",
                      !n.admin_seen && "bg-primary/[0.03]",
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                      n.type === "order"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    )}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12.5px] font-medium text-foreground truncate">{n.title}</p>
                        {!n.admin_seen && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        )}
                      </div>
                      {n.message && (
                        <p className="text-[11.5px] text-muted-foreground truncate">{n.message}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[10.5px] text-muted-foreground/70">
                        {n.amount > 0 && (
                          <span className="tabular-nums font-medium text-foreground/70">
                            {CURRENCY_SYMBOL}{Math.round(n.amount)}
                          </span>
                        )}
                        <span>· {relTime(n.created_at)} ago</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
