import { useMemo, useState, lazy, Suspense } from "react";
import { useDashboardData, useSteadfastBalance } from "@/hooks/useAdminData";
import { Package, ShoppingCart, DollarSign, Users, AlertTriangle, TrendingUp, Truck, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCY_SYMBOL } from "@/lib/currency";

import { cn } from "@/lib/utils";
import { PageHeader, Section, StatCard, EmptyState } from "@/components/admin/ui";
import AdminErrorBoundary from "@/components/admin/AdminErrorBoundary";

const SalesChart = lazy(() => import("@/components/admin/SalesChart"));

const SteadfastBalanceCard = () => {
  const { data, isLoading, error } = useSteadfastBalance();
  if (error || (data && data.error)) return null;
  const balance = data?.balance ?? null;
  return (
    <div className="a-card a-card-hover p-4 sm:p-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl a-tone-info flex items-center justify-center">
          <Truck size={16} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: "hsl(var(--a-muted))" }}>
            Steadfast COD balance
          </p>
          <p className="text-lg font-semibold tabular-nums" style={{ color: "hsl(var(--a-ink))" }}>
            {isLoading ? "…" : balance != null ? `${CURRENCY_SYMBOL}${balance.toLocaleString()}` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
};

interface SalesDataPoint { label: string; revenue: number; orders: number; }

const Dashboard = () => {
  const { data: raw, isLoading } = useDashboardData();
  const [dateFilter, setDateFilter] = useState("30");

  const computed = useMemo(() => {
    if (!raw) return null;
    const { products, productCount, orders, customerCount } = raw;
    const filterDays = dateFilter === "1" ? 1 : dateFilter === "7" ? 7 : dateFilter === "90" ? 90 : 30;
    const cutoff = new Date(Date.now() - filterDays * 86400000).toISOString();
    const filteredOrders = orders.filter((o: any) => o.created_at >= cutoff);
    const revenue = filteredOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
    const todayCutoff = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const todayRevenue = orders.filter((o: any) => o.created_at >= todayCutoff).reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
    const allTimeRevenue = orders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);

    const lowStock = products.filter((p: any) => p.stock <= 5).slice(0, 5);
    const recentOrders = [...orders].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach((o: any) => {
      ((o.items as any[]) ?? []).forEach((item: any) => {
        const key = item.id || item.name;
        if (!itemCounts[key]) itemCounts[key] = { name: item.name || "Unknown", count: 0, revenue: 0 };
        itemCounts[key].count += item.quantity || 1;
        itemCounts[key].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });
    const bestSellers = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    const chartData: SalesDataPoint[] = [];
    const now = new Date();
    if (filterDays <= 1) {
      for (let h = 0; h < 24; h++) {
        const hourOrders = filteredOrders.filter((o: any) => new Date(o.created_at).getHours() === h);
        chartData.push({ label: `${h.toString().padStart(2, "0")}:00`, revenue: hourOrders.reduce((s: number, o: any) => s + (Number(o.total) || 0), 0), orders: hourOrders.length });
      }
    } else {
      const days = Math.min(filterDays, 30);
      for (let d = days - 1; d >= 0; d--) {
        const date = new Date(now); date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().slice(0, 10);
        const dayOrders = filteredOrders.filter((o: any) => o.created_at.slice(0, 10) === dateStr);
        chartData.push({ label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), revenue: dayOrders.reduce((s: number, o: any) => s + (Number(o.total) || 0), 0), orders: dayOrders.length });
      }
    }

    return {
      stats: { products: productCount, orders: filteredOrders.length, revenue, customers: customerCount, todayRevenue, allTimeRevenue },
      lowStock, recentOrders, bestSellers, salesChart: chartData,
    };
  }, [raw, dateFilter]);

  if (isLoading || !computed) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="a-skeleton h-8 w-36" />
          <div className="a-skeleton h-10 w-[140px]" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1,2,3,4].map(i => <div key={i} className="a-skeleton h-[108px] rounded-2xl" />)}
        </div>
        <div className="a-skeleton h-[72px] rounded-2xl" />
        <div className="a-skeleton h-72 rounded-2xl" />
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="a-skeleton h-56 rounded-2xl" />
          <div className="a-skeleton h-56 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { stats, lowStock, recentOrders, bestSellers, salesChart } = computed;
  const fmtMoney = (n: number) => `${CURRENCY_SYMBOL}${n.toLocaleString()}`;
  const rangeLabel = dateFilter === "1" ? "Today" : dateFilter === "7" ? "Last 7 days" : dateFilter === "30" ? "Last 30 days" : "Last 90 days";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back — here's what's happening."
        actions={
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px] rounded-xl text-[13px] h-10 border-0 shadow-[var(--a-shadow-ring),var(--a-shadow-xs)] bg-[hsl(var(--a-surface))]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard tone="success" icon={DollarSign} label="Revenue" value={fmtMoney(stats.revenue)} sub={`Today ${fmtMoney(stats.todayRevenue)}`} />
        <StatCard tone="info" icon={ShoppingCart} label="Orders" value={stats.orders} sub={rangeLabel} />
        <StatCard tone="violet" icon={Package} label="Products" value={stats.products} />
        <StatCard tone="warning" icon={Users} label="Customers" value={stats.customers} sub="All-time" />
      </div>

      <SteadfastBalanceCard />

      <Section title="Sales overview" description={rangeLabel}>
        <div className="h-56 sm:h-64">
          {salesChart.every((p) => p.revenue === 0 && p.orders === 0) ? (
            <EmptyState icon={<BarChart3 size={18} />} title="No sales in this range" description="Once orders come in, you'll see them here." />
          ) : (
            <AdminErrorBoundary
              label="SalesChart"
              fallback={(reset) => (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                  <p className="text-[13px]" style={{ color: "hsl(var(--a-muted))" }}>Chart unavailable.</p>
                  <button onClick={reset} className="text-[12px] font-medium underline" style={{ color: "hsl(var(--a-ink))" }}>Retry</button>
                </div>
              )}
            >
              <Suspense fallback={<div className="a-skeleton w-full h-full rounded-xl" />}>
                <SalesChart data={salesChart} dense={dateFilter === "1"} />
              </Suspense>
            </AdminErrorBoundary>
          )}
        </div>
      </Section>

      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Low stock" description="Products running low (≤ 5)">
          {lowStock.length === 0 ? (
            <EmptyState icon={<AlertTriangle size={18} />} title="All good" description="No products are running low on stock." />
          ) : (
            <div className="space-y-2.5">
              {lowStock.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center text-[13px]">
                  <span className="text-foreground/85 truncate pr-4">{p.name || p.id}</span>
                  <span className="text-destructive font-medium shrink-0 tabular-nums">{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Best sellers" description="Top performers by quantity sold">
          {bestSellers.length === 0 ? (
            <EmptyState icon={<TrendingUp size={18} />} title="No data yet" description="Sales data will appear here once orders come in." />
          ) : (
            <div className="space-y-2.5">
              {bestSellers.map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-[13px]">
                  <span className="text-foreground/85 truncate pr-4">{p.name}</span>
                  <span className="text-muted-foreground/70 font-medium shrink-0 tabular-nums">{p.count} sold · {fmtMoney(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="Recent orders">
        {recentOrders.length === 0 ? (
          <EmptyState icon={<ShoppingCart size={18} />} title="No orders yet" description="New orders will appear here." />
        ) : (
          <div className="space-y-3">
            {recentOrders.map((o: any) => (
              <div key={o.id} className="flex justify-between items-center">
                <div className="min-w-0 pr-3">
                  <p className="text-[13px] font-medium text-foreground truncate">{o.order_number}</p>
                  <p className="text-[12px] text-muted-foreground/60 truncate">{o.customer_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-medium text-foreground tabular-nums">{fmtMoney(Number(o.total))}</p>
                  <span className={cn(
                    "text-[10px] capitalize font-medium px-2 py-0.5 rounded-full",
                    o.order_status === "pending" ? "bg-amber-500/10 text-amber-700" :
                    o.order_status === "delivered" ? "bg-green-500/10 text-green-700" :
                    "bg-muted/70 text-muted-foreground"
                  )}>{o.order_status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

export default Dashboard;
