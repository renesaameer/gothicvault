import { Outlet, useLocation, Link } from "react-router-dom";
import {
  Home, Megaphone, Store, Truck, Package, Eye, FileText,
  Info, Phone, ScrollText, MessageCircle, PanelBottom, Send, LayoutGrid, Shield, Video,
  ChevronRight,
} from "lucide-react";

export type SettingsTab = {
  to: string;
  label: string;
  description: string;
  icon: typeof Home;
  load: () => Promise<unknown>;
};

// Order matches the user-requested submenu list.
export const settingsTabs: SettingsTab[] = [
  { to: "/admin/settings/homepage", label: "Homepage", description: "Manage homepage sections and visibility", icon: Home, load: () => import("@/pages/admin/HomepageManager") },
  { to: "/admin/settings/shop", label: "Shop Page", description: "Layout, filters, and product grid behavior", icon: Store, load: () => import("@/pages/admin/ShopSettings") },
  { to: "/admin/settings/footer", label: "Footer", description: "Footer links, columns, and brand info", icon: PanelBottom, load: () => import("@/pages/admin/FooterEditor") },
  { to: "/admin/settings/floating", label: "Floating Icons", description: "Floating buttons and quick contacts", icon: MessageCircle, load: () => import("@/pages/admin/FloatingIconsManager") },
  { to: "/admin/settings/delivery", label: "Delivery", description: "Delivery zones, charges, and free thresholds", icon: Truck, load: () => import("@/pages/admin/DeliverySettings") },
  { to: "/admin/settings/courier", label: "Courier API", description: "Pathao, Steadfast, and courier integrations", icon: Package, load: () => import("@/pages/admin/DeliveryPartners") },
  { to: "/admin/settings/invoice", label: "Invoice", description: "Invoice branding, footer, and defaults", icon: FileText, load: () => import("@/pages/admin/InvoiceSettings") },
  { to: "/admin/settings/tracking", label: "Tracking", description: "Meta, GA4, and TikTok marketing pixels", icon: Eye, load: () => import("@/pages/admin/TrackingPixels") },
  { to: "/admin/settings/about", label: "About", description: "About page sections and copy", icon: Info, load: () => import("@/pages/admin/AboutManager") },
  { to: "/admin/settings/contact", label: "Contact", description: "Contact details, form, and social links", icon: Phone, load: () => import("@/pages/admin/ContactManager") },
  { to: "/admin/settings/policies", label: "Policies", description: "Returns, shipping, privacy, and terms", icon: ScrollText, load: () => import("@/pages/admin/PolicyManager") },
  { to: "/admin/settings/featured-categories", label: "Featured Categories", description: "Highlighted categories on the homepage", icon: LayoutGrid, load: () => import("@/pages/admin/FeaturedCategoriesManager") },
  { to: "/admin/settings/video-testimonials", label: "Video Testimonials", description: "Customer reels carousel on the homepage", icon: Video, load: () => import("@/pages/admin/VideoTestimonialsManager") },
  { to: "/admin/settings/announcement", label: "Announcement", description: "Top announcement bar message and link", icon: Megaphone, load: () => import("@/components/admin/AnnouncementEditor") },
  { to: "/admin/settings/direct-order", label: "Direct Order", description: "WhatsApp, Messenger, and direct order channels", icon: Send, load: () => import("@/pages/admin/DirectOrderChannels") },
  { to: "/admin/roles", label: "User Roles", description: "Admin and staff permission management", icon: Shield, load: () => import("@/pages/admin/UserRoles") },
];

const SettingsLayout = () => {
  const location = useLocation();
  const active = settingsTabs.find(t => location.pathname.startsWith(t.to)) ?? settingsTabs[0];
  const Icon = active.icon;

  return (
    <div className="min-w-0">
      {/* Page header — identity, breadcrumb, actions */}
      <header className="a-settings-header">
        <div className="a-settings-header-inner">
          <nav aria-label="Breadcrumb" className="a-breadcrumb">
            <Link to="/admin" className="a-breadcrumb-link">Admin</Link>
            <ChevronRight size={11} className="a-breadcrumb-sep" />
            <span className="a-breadcrumb-link">Settings</span>
            <ChevronRight size={11} className="a-breadcrumb-sep" />
            <span className="a-breadcrumb-current">{active.label}</span>
          </nav>

          <div className="a-settings-title-row">
            <div className="flex items-start gap-3 min-w-0">
              <div className="a-settings-title-icon" aria-hidden="true">
                <Icon size={16} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <h1 className="a-settings-title">{active.label} Settings</h1>
                <p className="a-settings-subtitle">{active.description}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section key={location.pathname} className="a-page-fade min-w-0 pt-5 sm:pt-6">
        <Outlet />
      </section>
    </div>
  );
};

export default SettingsLayout;
