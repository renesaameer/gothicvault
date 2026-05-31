import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  LogOut, Menu, X, Tag,
  FolderTree, Percent, MonitorSmartphone, Mail,
  Home, Store, Search, Command, ChevronRight, Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import NotificationBell from "@/components/admin/NotificationBell";
import { settingsTabs } from "@/components/admin/SettingsLayout";
import AdminErrorBoundary from "@/components/admin/AdminErrorBoundary";

const prefetchAdminRoutes = (role: "admin" | "staff" | string | null) => {
  const run = () => {
    import("@/pages/admin/Dashboard");
    import("@/pages/admin/Products");
    import("@/pages/admin/Orders");
    import("@/components/admin/TaxonomyLayout");
    import("@/components/admin/SettingsLayout");
    if (role === "admin") {
      import("@/pages/admin/Customers");
      import("@/pages/admin/CouponManager");
      import("@/pages/admin/OfferManager");
      import("@/pages/admin/InquiriesManager");
    }
    // Warm every settings tab module so navigation between them is instant.
    import("@/components/admin/SettingsLayout").then(mod => {
      const tabs = (mod as { settingsTabs?: Array<{ load: () => Promise<unknown> }> }).settingsTabs;
      tabs?.forEach(t => { try { t.load(); } catch { /* noop */ } });
    });
  };
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback?.(run, { timeout: 2000 });
  } else {
    setTimeout(run, 200);
  }
};

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  end?: boolean;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/pos", icon: MonitorSmartphone, label: "POS" },
  { to: "/admin/products", icon: Package, label: "Products" },
  { to: "/admin/taxonomy", icon: FolderTree, label: "Taxonomy" },
  { to: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/admin/incomplete-orders", icon: Inbox, label: "Incomplete" },
  { to: "/admin/customers", icon: Users, label: "Customers" },
  { to: "/admin/coupons", icon: Tag, label: "Coupons" },
  { to: "/admin/offers", icon: Percent, label: "Offers" },
  { to: "/admin/inquiries", icon: Mail, label: "Inquiries" },
];

const STAFF_ALLOWED = new Set(["Dashboard", "POS", "Products", "Taxonomy", "Orders", "Incomplete", "Settings"]);
const STAFF_SETTINGS_ALLOWED = new Set([
  "Homepage", "Shop Page", "Footer", "Floating Icons", "Delivery", "Courier API",
  "Invoice", "Tracking", "About", "Contact", "Policies", "Featured Categories",
  "Announcement", "Direct Order",
]);

const ROUTE_LOADERS: Record<string, () => Promise<unknown>> = {
  "/admin": () => import("@/pages/admin/Dashboard"),
  "/admin/pos": () => import("@/pages/admin/POS"),
  "/admin/products": () => import("@/pages/admin/Products"),
  "/admin/taxonomy": () => import("@/components/admin/TaxonomyLayout"),
  "/admin/orders": () => import("@/pages/admin/Orders"),
  "/admin/incomplete-orders": () => import("@/pages/admin/IncompleteOrders"),
  "/admin/customers": () => import("@/pages/admin/Customers"),
  "/admin/coupons": () => import("@/pages/admin/CouponManager"),
  "/admin/offers": () => import("@/pages/admin/OfferManager"),
  "/admin/inquiries": () => import("@/pages/admin/InquiriesManager"),
  "/admin/roles": () => import("@/pages/admin/UserRoles"),
  "/admin/ecomdrive-logs": () => import("@/pages/admin/EcomDriveLogs"),
};
const prefetched = new Set<string>();
const prefetchRoute = (to: string) => {
  if (prefetched.has(to)) return;
  prefetched.add(to);
  ROUTE_LOADERS[to]?.();
};
const prefetchSetting = (load: () => Promise<unknown>, key: string) => {
  if (prefetched.has(key)) return;
  prefetched.add(key);
  load();
};

const QUICK_NAV_ITEMS = [
  ...navItems,
  ...settingsTabs.map(t => ({ to: t.to, icon: t.icon, label: t.label } as NavItem)),
];

const QuickNav = ({ open, onClose, navigate }: { open: boolean; onClose: () => void; navigate: (path: string) => void }) => {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (!query.trim()) return QUICK_NAV_ITEMS;
    const q = query.toLowerCase();
    return QUICK_NAV_ITEMS.filter(item => item.label.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => { if (open) setQuery(""); }, [open]);
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-[18%] left-1/2 -translate-x-1/2 z-[101] w-[92%] max-w-[440px] bg-background rounded-2xl border border-border/60 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
          <Search size={16} className="text-muted-foreground/60 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Jump to…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
            onKeyDown={e => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && filtered.length > 0) { navigate(filtered[0].to); onClose(); }
            }}
          />
          <kbd className="hidden sm:inline-flex text-[10px] px-2 py-1 rounded-md bg-muted/60 text-muted-foreground/60 font-mono">ESC</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 text-center py-8">No results</p>
          ) : (
            filtered.map(item => (
              <button
                key={item.to}
                onClick={() => { navigate(item.to); onClose(); }}
                className="w-full flex items-center gap-3 px-5 py-3 text-sm text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                <item.icon size={16} className="text-muted-foreground/50" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight size={12} className="text-muted-foreground/30" />
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};

const AdminLayout = () => {
  const { user, role, loading, isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  const { unseenByType, markSeen } = useAdminNotifications();

  // Auto-clear unread badge when admin opens the related page
  useEffect(() => {
    if (location.pathname.startsWith("/admin/orders") && unseenByType.order > 0) {
      markSeen("order");
    }
    if (location.pathname.startsWith("/admin/incomplete-orders") && unseenByType.incomplete_order > 0) {
      markSeen("incomplete_order");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, unseenByType.order, unseenByType.incomplete_order]);

  const badgeFor = (to: string): number => {
    if (to === "/admin/orders") return unseenByType.order;
    if (to === "/admin/incomplete-orders") return unseenByType.incomplete_order;
    return 0;
  };

  useEffect(() => {
    if (!loading && (!user || !role)) navigate("/admin/login");
    if (!loading && user && role) prefetchAdminRoutes(role);
  }, [user, role, loading, navigate]);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setQuickNavOpen(prev => !prev); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filteredItems = useMemo(() => navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (role === "staff" && !STAFF_ALLOWED.has(item.label)) return false;
    return true;
  }), [role, isAdmin]);

  const isActive = (path: string, end?: boolean) =>
    end ? location.pathname === path : location.pathname.startsWith(path);
  const isSettingsPath = location.pathname.startsWith("/admin/settings") || location.pathname.startsWith("/admin/roles");
  const roleLabel = role === "admin" ? "Admin" : role === "staff" ? "Staff" : role ?? "";

  // Persisted collapsible Settings — open by default when any settings/roles route is active
  const [settingsOpen, setSettingsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("admin:settings-open");
    if (stored !== null) return stored === "1";
    return typeof location !== "undefined" &&
      (location.pathname.startsWith("/admin/settings") || location.pathname.startsWith("/admin/roles"));
  });
  useEffect(() => {
    if (isSettingsPath && !settingsOpen) setSettingsOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettingsPath]);
  useEffect(() => {
    try { window.localStorage.setItem("admin:settings-open", settingsOpen ? "1" : "0"); } catch { /* noop */ }
  }, [settingsOpen]);

  const visibleSettings = useMemo(
    () => settingsTabs.filter(t => {
      if (t.to === "/admin/roles") return isAdmin;
      if (role === "staff" && !STAFF_SETTINGS_ALLOWED.has(t.label)) return false;
      return true;
    }),
    [role, isAdmin]
  );

  const authed = !!user && !!role;
  if (!loading && !authed) return null;

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  return (
    <div className="admin-shell min-h-screen flex">

      <QuickNav open={quickNavOpen} onClose={() => setQuickNavOpen(false)} navigate={navigate} />

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "a-sidebar fixed lg:sticky top-0 left-0 z-50 h-screen w-[220px] flex flex-col transition-transform duration-200 ease-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}>
        {/* Brand */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--a-ink))" }}
            >
              <Store size={13} className="text-white" />
            </div>
            <div className="min-w-0 leading-tight">
              <h2 className="font-semibold text-[13px] tracking-tight truncate" style={{ color: "hsl(var(--a-ink))" }}>
                AEROM
              </h2>
              <p className="text-[10px]" style={{ color: "hsl(var(--a-soft))" }}>{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-[hsl(var(--a-sunken))] transition-colors"
            style={{ color: "hsl(var(--a-muted))" }}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <button
            onClick={() => setQuickNavOpen(true)}
            className="w-full flex items-center gap-2 px-2.5 h-8 rounded-lg transition-colors text-[12px]"
            style={{
              background: "hsl(var(--a-sunken))",
              color: "hsl(var(--a-muted))",
            }}
          >
            <Search size={12} />
            <span className="flex-1 text-left">Search…</span>
            <kbd
              className="hidden sm:inline-flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded font-mono"
              style={{ background: "hsl(var(--a-surface))", color: "hsl(var(--a-soft))" }}
            >
              <Command size={8} />K
            </kbd>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pt-1 pb-2 space-y-0.5">
          {filteredItems.map(item => {
            const active = isActive(item.to, item.end);
            const badge = badgeFor(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onMouseEnter={() => prefetchRoute(item.to)}
                onTouchStart={() => prefetchRoute(item.to)}
                onClick={() => setSidebarOpen(false)}
                className={cn("a-nav-item", active && "is-active")}
              >
                <item.icon size={15} strokeWidth={active ? 2.1 : 1.7} />
                <span className="flex-1 truncate">{item.label}</span>
                {badge > 0 && (
                  <span
                    className="min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center tabular-nums"
                    style={{
                      background: "hsl(var(--a-danger))",
                      color: "white",
                    }}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Settings — collapsible group */}
          {visibleSettings.length > 0 && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setSettingsOpen(o => !o)}
                aria-expanded={settingsOpen}
                aria-controls="admin-settings-submenu"
                className={cn("a-nav-item w-full text-left", isSettingsPath && "is-active")}
              >
                <Settings size={15} strokeWidth={isSettingsPath ? 2.1 : 1.7} />
                <span className="flex-1 truncate">Settings</span>
                <ChevronRight size={13} className={cn("a-nav-caret", settingsOpen && "is-open")} />
              </button>
              <div
                id="admin-settings-submenu"
                className={cn("a-nav-sub-list", settingsOpen && "is-open")}
              >
                <div>
                  <div className="a-nav-sub-inner">
                    {visibleSettings.map(tab => {
                      const subActive = location.pathname.startsWith(tab.to);
                      return (
                        <NavLink
                          key={tab.to}
                          to={tab.to}
                          onMouseEnter={() => prefetchSetting(tab.load, tab.to)}
                          onTouchStart={() => prefetchSetting(tab.load, tab.to)}
                          onClick={() => setSidebarOpen(false)}
                          className={cn("a-nav-sub", subActive && "is-active")}
                        >
                          <tab.icon size={12} strokeWidth={subActive ? 2.1 : 1.7} />
                          <span className="truncate">{tab.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-2 space-y-0.5" style={{ boxShadow: "inset 0 1px 0 hsl(var(--a-stroke))" }}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 text-[12px] h-8 rounded-lg hover:bg-[hsl(var(--a-sunken))]"
            style={{ color: "hsl(var(--a-muted))" }}
            onClick={() => navigate("/")}
          >
            <Home size={13} /> View store
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 text-[12px] h-8 rounded-lg hover:bg-[hsl(var(--a-danger-bg))] hover:text-[hsl(var(--a-danger))]"
            style={{ color: "hsl(var(--a-soft))" }}
            onClick={handleLogout}
          >
            <LogOut size={13} /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 min-h-screen pb-[env(safe-area-inset-bottom)]">
        {/* Mobile header */}
        <header
          className="sticky top-0 z-30 px-2 py-2 flex items-center gap-1 lg:hidden"
          style={{
            background: "hsl(var(--a-canvas) / 0.85)",
            backdropFilter: "blur(14px) saturate(180%)",
            WebkitBackdropFilter: "blur(14px) saturate(180%)",
            boxShadow: "inset 0 -1px 0 hsl(var(--a-stroke))",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[hsl(var(--a-sunken))] active:bg-[hsl(var(--a-canvas-2))] transition-colors"
            style={{ color: "hsl(var(--a-ink))" }}
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>
          <span className="text-[14px] font-semibold flex-1 tracking-tight truncate" style={{ color: "hsl(var(--a-ink))" }}>
            Admin
          </span>
          <NotificationBell />
          <button
            onClick={() => setQuickNavOpen(true)}
            className="p-2 rounded-lg hover:bg-[hsl(var(--a-sunken))] active:bg-[hsl(var(--a-canvas-2))] transition-colors"
            style={{ color: "hsl(var(--a-muted))" }}
            aria-label="Search"
          >
            <Search size={16} />
          </button>
        </header>

        <div className="p-3 sm:p-5 lg:p-7 max-w-[1280px] mx-auto w-full min-w-0">
          {/* Desktop top bar with notification bell */}
          <div className="hidden lg:flex items-center justify-end mb-1 -mt-1">
            <NotificationBell />
          </div>
          {/* Page fade — keyed on pathname for premium route transition */}
          <div key={location.pathname} className="a-page-fade">
            {authed && (
              <AdminErrorBoundary label={location.pathname}>
                <Outlet />
              </AdminErrorBoundary>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
