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
import { BeamsBackground } from "@/components/ui/beams-background";
import { OrderTrackingParallaxCard } from "@/components/ui/order-tracking-parallax-card";

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
        if (!row) setError("No order found with this number");
        else setOrder(row);
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
      if (!data || data.length === 0) setError("No orders found for this phone number");
      else if (data.length === 1) setOrder(data[0]);
      else setOrders(data);
    } else {
      const { data } = await supabase.rpc("track_order", { _order_number: searchValue.trim() });
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) setError("No order found with this number");
      else setOrder(row);
    }
    setLoading(false);
  };

  const currentStep = order ? statusSteps.indexOf(order.order_status) : -1;

  return (
    <div className="relative overflow-hidden page-enter">
      {/* Cinematic beams backdrop covering full page */}
      <BeamsBackground intensity="medium" className="!fixed inset-0 -z-10" />
      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(180,150,230,0.10) 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.7) 0%, transparent 60%)",
        }}
      />

      <div className="section-padding pt-16 sm:pt-20 pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto">
          {/* Eyebrow crest */}
          <div className="fade-up flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-12 bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-[10px] uppercase tracking-[0.42em] text-muted-foreground font-display">
              The Vault · Tracking
            </span>
            <span className="h-px w-12 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Hero title */}
          <div className="fade-up text-center mb-3">
            <h1 className="text-[34px] sm:text-5xl font-semibold tracking-[-0.03em] text-foreground leading-[1.05]">
              Trace Your <em className="font-display italic text-primary">Treasure</em>
            </h1>
          </div>
          <p className="fade-up text-center text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-6">
            Every artifact carries a sigil. Enter yours to summon its current journey through the vault network.
          </p>
          <div className="fade-up premium-divider max-w-[80px] mx-auto mb-10" />

          {/* Search panel */}
          <div className="fade-up glass-card rounded-[28px] p-5 sm:p-7 mb-10 relative overflow-hidden">
            {/* Inner shimmer hairline */}
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/[0.04]" />

            {/* Segmented control */}
            <div className="relative mb-5 inline-flex p-1 rounded-full border border-border/40 bg-background/40 backdrop-blur-md">
              {(["order", "phone"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setSearchType(t); setSearchValue(""); setError(""); setOrder(null); setOrders([]); }}
                  className={`relative px-5 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-300 ${
                    searchType === t
                      ? "bg-gradient-to-b from-primary/90 to-primary text-primary-foreground shadow-[0_4px_20px_-6px_hsl(var(--primary)/0.55)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "order" ? "Order Number" : "Phone Number"}
                </button>
              ))}
            </div>

            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <SearchIcon
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors duration-300"
                />
                <Input
                  value={searchValue}
                  onChange={(e) => {
                    if (searchType === "phone") setSearchValue(e.target.value.replace(/\D/g, "").slice(0, 11));
                    else setSearchValue(e.target.value.trim());
                  }}
                  placeholder={searchType === "order" ? "e.g. AEROM-00231" : "11-digit phone number"}
                  className="pl-11 h-12 rounded-full bg-background/40 border-border/40 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20 backdrop-blur-md text-sm tracking-wide"
                  inputMode={searchType === "phone" ? "numeric" : "text"}
                  maxLength={searchType === "phone" ? 11 : undefined}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-7 rounded-full bg-gradient-to-b from-primary/90 to-primary text-primary-foreground font-medium tracking-wide shadow-[0_8px_28px_-8px_hsl(var(--primary)/0.6)] hover:shadow-[0_10px_32px_-6px_hsl(var(--primary)/0.7)] hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-300"
              >
                {loading ? "Summoning…" : "Trace Order"}
              </Button>
            </form>

            {!loading && error && (
              <p className="mt-4 text-xs text-destructive/90 tracking-wide animate-fade-in">{error}</p>
            )}
          </div>

          {/* Cinematic globe orb (decorative only when no result yet) */}
          {!order && orders.length === 0 && !showLoadingSkeleton && (
            <div className="fade-up relative mx-auto w-full max-w-[460px] mb-4">
              {/* Concentric rings */}
              <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute h-[105%] w-[105%] rounded-full border border-primary/10 animate-[spin_60s_linear_infinite]" />
                <div className="absolute h-[88%] w-[88%] rounded-full border border-primary/[0.07] animate-[spin_90s_linear_infinite_reverse]" />
              </div>
              {/* Inner glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(180,150,230,0.34), rgba(180,150,230,0.08) 45%, transparent 70%)",
                }}
              />
              <GlobePulse />
              <div className="mt-5 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.42em] text-muted-foreground">
                <span className="h-px w-14 bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="font-display flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inset-0 rounded-full bg-primary/70 animate-ping" />
                    <span className="relative rounded-full h-1.5 w-1.5 bg-primary" />
                  </span>
                  Live Vault Network
                </span>
                <span className="h-px w-14 bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>
              <p className="mt-3 text-center text-[11px] text-muted-foreground/70 tracking-wide max-w-xs mx-auto">
                Monitoring relays across the obsidian corridor in real time.
              </p>
            </div>
          )}

          {showLoadingSkeleton && (
            <div className="space-y-4 fade-up">
              <div className="glass-card rounded-[28px] p-6 space-y-4">
                <Skeleton className="h-4 w-28 mb-2" />
                <div className="h-px bg-border/40 mb-4" />
                <div className="flex items-center justify-between">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <Skeleton className="w-11 h-11 rounded-full" />
                      <Skeleton className="h-2.5 w-14" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card rounded-[28px] p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {orders.length > 1 && !order && (
            <div className="space-y-3 mb-6 fade-up">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {toBanglaDigits(orders.length)} artifacts found
              </p>
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => { setOrder(o); setOrders([]); }}
                  className="group w-full text-left glass-card rounded-2xl p-5 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-12px_hsl(var(--primary)/0.4)] transition-all duration-300 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground tracking-wide">#{o.order_number}</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{CURRENCY_SYMBOL}{toBanglaDigits(Number(o.total).toFixed(0))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-primary/80">{statusLabels[o.order_status] || o.order_status}</span>
                    <span className="text-xs text-muted-foreground">{toBanglaDigits(new Date(o.created_at).toLocaleDateString("bn-BD"))}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {order && (
            <div className="fade-up space-y-6">
              {orders.length > 0 && (
                <button onClick={() => setOrder(null)} className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors">
                  ← Back to results
                </button>
              )}

              {/* Parallax 3D status card */}
              <OrderTrackingParallaxCard
                orderId={order.order_number}
                product={
                  (order.items && order.items[0]?.name)
                    ? `${order.items[0].name}${order.items.length > 1 ? ` + ${toBanglaDigits(order.items.length - 1)} more` : ""}`
                    : "Your Order"
                }
                status={order.order_status as any}
                eta={
                  order.order_status === "delivered"
                    ? "Delivered"
                    : order.order_status === "shipped"
                      ? "1–2 days"
                      : "2–4 days"
                }
                total={`${CURRENCY_SYMBOL}${toBanglaDigits(Number(order.total).toFixed(0))}`}
              />


              {/* Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="glass-card rounded-[28px] p-6 space-y-3.5">
                  <h3 className="text-[10px] uppercase tracking-[0.42em] text-muted-foreground font-display mb-1">Manifest</h3>
                  <div className="premium-divider mb-2" />
                  <Row label="Date" value={toBanglaDigits(new Date(order.created_at).toLocaleDateString("bn-BD"))} />
                  <Row label="Payment" value={paymentLabels[order.payment_status] || order.payment_status} />
                  {order.tracking_number && <Row label="Tracking" value={order.tracking_number} />}
                  {order.steadfast_tracking_code && <Row label="Courier (Steadfast)" value={order.steadfast_tracking_code} />}
                  {order.steadfast_status && <Row label="Courier status" value={String(order.steadfast_status).replace(/_/g, " ")} mono />}
                </div>

                <div className="glass-card rounded-[28px] p-6 space-y-2">
                  <h3 className="text-[10px] uppercase tracking-[0.42em] text-muted-foreground font-display mb-1">Ledger</h3>
                  <div className="premium-divider mb-2" />
                  <Row label="Subtotal" value={`${CURRENCY_SYMBOL}${toBanglaDigits(Number(order.subtotal).toFixed(0))}`} />
                  {Number(order.discount_amount) > 0 && (
                    <Row
                      label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`}
                      value={`-${CURRENCY_SYMBOL}${toBanglaDigits(Number(order.discount_amount).toFixed(0))}`}
                      accent
                    />
                  )}
                  <Row label="Shipping" value={`${CURRENCY_SYMBOL}${toBanglaDigits(Number(order.shipping_cost).toFixed(0))}`} />
                  <div className="pt-3 mt-2 border-t border-border/40 flex justify-between items-baseline">
                    <span className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Total</span>
                    <span className="text-xl font-semibold tracking-tight tabular-nums text-foreground">
                      {CURRENCY_SYMBOL}{toBanglaDigits(Number(order.total).toFixed(0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="glass-card rounded-[28px] p-6">
                <h3 className="text-[10px] uppercase tracking-[0.42em] text-muted-foreground font-display mb-1">Artifacts</h3>
                <div className="premium-divider mb-4" />
                <div className="divide-y divide-border/30">
                  {(order.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-3 text-sm">
                      <span className="text-foreground tracking-wide">
                        {item.name}
                        <span className="text-muted-foreground"> · ×{toBanglaDigits(item.quantity || 1)}</span>
                      </span>
                      <span className="text-foreground font-medium tabular-nums">
                        {CURRENCY_SYMBOL}{toBanglaDigits(Number(item.price * (item.quantity || 1)).toFixed(0))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
    <span className={`${accent ? "text-primary" : "text-foreground"} ${mono ? "capitalize" : ""} font-medium tabular-nums tracking-wide`}>
      {value}
    </span>
  </div>
);

export default TrackOrder;
