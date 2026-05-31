import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchIcon, PackageIcon, TruckIcon, CheckCircleIcon, ClockIcon } from "@/components/ui/icons";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CURRENCY_SYMBOL, toBanglaDigits } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { GlobePulse } from "@/components/ui/cobe-globe-pulse";

const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];
const statusLabels: Record<string, string> = { pending: "Pending", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped", delivered: "Delivered" };
const paymentLabels: Record<string, string> = { pending: "Pending", paid: "Paid", failed: "Failed", refunded: "Refunded", cod: "Cash on Delivery" };
const statusIcons: Record<string, any> = { pending: ClockIcon, confirmed: CheckCircleIcon, processing: PackageIcon, shipped: TruckIcon, delivered: CheckCircleIcon };

const TrackOrder = () => {
  useDocumentMeta({
    title: "Track Your Order — AEROM",
    description: "Track your AEROM order status in real time using your order number or phone number.",
    canonicalPath: "/track-order",
  });
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState<"order" | "phone">("order");
  const [order, setOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoSearched, setAutoSearched] = useState(false);

  const showLoadingSkeleton = useDelayedLoading(loading, 160);

  useEffect(() => {
    const prefilledOrder = searchParams.get("order");
    if (prefilledOrder) {
      setSearchValue(prefilledOrder);
      setSearchType("order");
    }
  }, [searchParams]);

  useEffect(() => {
    if (autoSearched) return;
    const prefilledOrder = searchParams.get("order");
    if (prefilledOrder && prefilledOrder.trim()) {
      setAutoSearched(true);
      (async () => {
        setLoading(true);
        setError("");
        setOrder(null);
        setOrders([]);
        const { data } = await supabase.rpc("track_order", { _order_number: prefilledOrder.trim() });
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
          setError("No order found with this number");
        } else {
          setOrder(row);
        }
        setLoading(false);
      })();
    }
  }, [searchParams, autoSearched]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      setError("Enter your order number or phone number");
      return;
    }
    setError("");
    setLoading(true);
    setOrder(null);
    setOrders([]);

    if (searchType === "phone") {
      const { data } = await supabase.rpc("track_orders_by_phone", { _phone: searchValue.trim() });
      if (!data || data.length === 0) {
        setError("No orders found for this phone number");
      } else if (data.length === 1) {
        setOrder(data[0]);
      } else {
        setOrders(data);
      }
    } else {
      const { data } = await supabase.rpc("track_order", { _order_number: searchValue.trim() });
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setError("No order found with this number");
      } else {
        setOrder(row);
      }
    }
    setLoading(false);
  };

  const currentStep = order ? statusSteps.indexOf(order.order_status) : -1;

  return (
    <div className="section-padding py-12 sm:py-16 page-enter">
      <div className="fade-up">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-2">Track your order</h1>
          <p className="text-sm text-muted-foreground mb-3">Enter your order number or phone to see status.</p>
          <div className="premium-divider max-w-[40px] mb-6" />

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setSearchType("order"); setSearchValue(""); setError(""); setOrder(null); setOrders([]); }}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 ${searchType === "order" ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary/70 border border-border/40 text-foreground hover:border-border"}`}
            >
              Order number
            </button>
            <button
              type="button"
              onClick={() => { setSearchType("phone"); setSearchValue(""); setError(""); setOrder(null); setOrders([]); }}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 ${searchType === "phone" ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary/70 border border-border/40 text-foreground hover:border-border"}`}
            >
              Phone number
            </button>
          </div>

          <form onSubmit={handleTrack} className="flex gap-3 mb-8">
            <Input
              value={searchValue}
              onChange={(e) => {
                if (searchType === "phone") {
                  setSearchValue(e.target.value.replace(/\D/g, "").slice(0, 11));
                } else {
                  setSearchValue(e.target.value.trim());
                }
              }}
              placeholder={searchType === "order" ? "Enter your order number" : "Enter 11-digit phone number"}
              className="flex-1"
              inputMode={searchType === "phone" ? "numeric" : "text"}
              maxLength={searchType === "phone" ? 11 : undefined}
            />
            <Button type="submit" disabled={loading} className="shadow-sm active:scale-[0.97] transition-transform duration-150">
              <SearchIcon size={16} className="mr-1.5" />
              {loading ? "..." : "Track"}
            </Button>
          </form>

          {showLoadingSkeleton && (
            <div className="space-y-4 mb-6">
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <Skeleton className="h-4 w-28 mb-2" />
                <div className="h-[1px] bg-muted mb-4" />
                <div className="flex items-center justify-between">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <Skeleton className="h-2.5 w-14" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
                <div className="border-t border-border/40 pt-3 space-y-2">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          )}

          {!loading && error && <p className="text-sm text-destructive mb-6">{error}</p>}

          {orders.length > 1 && !order && (
            <div className="space-y-3 mb-6">
              <p className="text-sm text-muted-foreground">{toBanglaDigits(orders.length)} orders found:</p>
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => { setOrder(o); setOrders([]); }}
                  className="w-full text-left glass-card rounded-xl p-4 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-150 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">#{o.order_number}</span>
                    <span className="text-sm font-medium text-foreground tabular-nums">{CURRENCY_SYMBOL}{toBanglaDigits(Number(o.total).toFixed(0))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{statusLabels[o.order_status] || o.order_status}</span>
                    <span className="text-xs text-muted-foreground">{toBanglaDigits(new Date(o.created_at).toLocaleDateString("bn-BD"))}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {order && (
            <div className="fade-up space-y-6">
              {orders.length > 0 && (
                <button onClick={() => { setOrder(null); }} className="text-sm text-muted-foreground hover:text-primary transition-colors">← Back to results</button>
              )}

              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-foreground mb-1">Order Status</h2>
                <div className="premium-divider mb-6" />
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-border/40" />
                  <div className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-150" style={{ width: `${Math.max(0, currentStep) / (statusSteps.length - 1) * 100}%` }} />
                  {statusSteps.map((step, i) => {
                    const Icon = statusIcons[step];
                    const isActive = i <= currentStep;
                    const isCurrent = i === currentStep;
                    return (
                      <div key={step} className="relative flex flex-col items-center z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 ${isActive ? "bg-primary text-primary-foreground shadow-[0_2px_8px_-3px_hsl(var(--primary)/0.3)]" : "bg-secondary text-muted-foreground border border-border/40"} ${isCurrent ? "ring-4 ring-primary/15 scale-110" : ""}`}>
                          <Icon size={16} />
                        </div>
                        <span className={`text-[11px] mt-2 ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>{statusLabels[step] || step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order number</span>
                  <span className="text-foreground font-medium">{order.order_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-foreground">{toBanglaDigits(new Date(order.created_at).toLocaleDateString("bn-BD"))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="text-foreground">{paymentLabels[order.payment_status] || order.payment_status}</span>
                </div>
                {order.tracking_number && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tracking</span>
                    <span className="text-foreground">{order.tracking_number}</span>
                  </div>
                )}
                {order.steadfast_tracking_code && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Courier tracking (Steadfast)</span>
                    <span className="text-foreground">{order.steadfast_tracking_code}</span>
                  </div>
                )}
                {order.steadfast_status && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Courier status</span>
                    <span className="text-foreground capitalize">{String(order.steadfast_status).replace(/_/g, " ")}</span>
                  </div>
                )}
                <div className="border-t border-border/40 pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Items</h3>
                  {(order.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-1.5">
                      <span className="text-foreground">{item.name} × {toBanglaDigits(item.quantity || 1)}</span>
                      <span className="text-foreground font-medium tabular-nums">{CURRENCY_SYMBOL}{toBanglaDigits(Number(item.price * (item.quantity || 1)).toFixed(0))}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border/40 pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">{CURRENCY_SYMBOL}{toBanglaDigits(Number(order.subtotal).toFixed(0))}</span>
                  </div>
                  {Number(order.discount_amount) > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
                      <span className="tabular-nums">-{CURRENCY_SYMBOL}{toBanglaDigits(Number(order.discount_amount).toFixed(0))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="tabular-nums">{CURRENCY_SYMBOL}{toBanglaDigits(Number(order.shipping_cost).toFixed(0))}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border/40">
                    <span>Total</span>
                    <span className="tabular-nums">{CURRENCY_SYMBOL}{toBanglaDigits(Number(order.total).toFixed(0))}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
