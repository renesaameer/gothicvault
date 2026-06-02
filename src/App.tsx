import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import Layout from "@/components/layout/Layout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ApiProvider } from "@/lib/api/react-query-provider.js";
import { AuthProvider } from "@/lib/api/auth-context.js";

import Index from "./pages/Index";
import OrderConfirmation from "./pages/OrderConfirmation";

const Shop = lazy(() => import("./pages/Shop"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Policies = lazy(() => import("./pages/Policies"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));

const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));

const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Products = lazy(() => import("./pages/admin/Products"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Customers = lazy(() => import("./pages/admin/Customers"));
const CouponManager = lazy(() => import("./pages/admin/CouponManager"));
const OfferManager = lazy(() => import("./pages/admin/OfferManager"));
const UserRoles = lazy(() => import("./pages/admin/UserRoles"));
const POS = lazy(() => import("./pages/admin/POS"));
const InquiriesManager = lazy(() => import("./pages/admin/InquiriesManager"));
const EcomDriveLogs = lazy(() => import("./pages/admin/EcomDriveLogs"));
const IncompleteOrders = lazy(() => import("./pages/admin/IncompleteOrders"));

// Taxonomy
const TaxonomyLayout = lazy(() => import("./components/admin/TaxonomyLayout"));
const CategoryManager = lazy(() => import("./pages/admin/CategoryManager"));
const TagManager = lazy(() => import("./pages/admin/TagManager"));
const BrandManager = lazy(() => import("./pages/admin/BrandManager"));

// Settings
const SettingsLayout = lazy(() => import("./components/admin/SettingsLayout"));
const HomepageManager = lazy(() => import("./pages/admin/HomepageManager"));
const FeaturedCategoriesManager = lazy(() => import("./pages/admin/FeaturedCategoriesManager"));
const VideoTestimonialsManager = lazy(() => import("./pages/admin/VideoTestimonialsManager"));
const AnnouncementEditor = lazy(() => import("./components/admin/AnnouncementEditor"));
const ShopSettings = lazy(() => import("./pages/admin/ShopSettings"));
const DeliverySettings = lazy(() => import("./pages/admin/DeliverySettings"));
const DeliveryPartners = lazy(() => import("./pages/admin/DeliveryPartners"));
const TrackingPixels = lazy(() => import("./pages/admin/TrackingPixels"));
const InvoiceSettings = lazy(() => import("./pages/admin/InvoiceSettings"));
const AboutManager = lazy(() => import("./pages/admin/AboutManager"));
const ContactManager = lazy(() => import("./pages/admin/ContactManager"));
const PolicyManager = lazy(() => import("./pages/admin/PolicyManager"));
const FloatingIconsManager = lazy(() => import("./pages/admin/FloatingIconsManager"));
const DirectOrderChannels = lazy(() => import("./pages/admin/DirectOrderChannels"));
const FooterEditor = lazy(() => import("./pages/admin/FooterEditor"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

if (typeof window !== "undefined") {
  try {
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: "nam-rq-cache",
      throttleTime: 1000,
    });
    persistQueryClient({
      queryClient,
      persister,
      maxAge: 24 * 60 * 60 * 1000,
      buster: "v1",
      dehydrateOptions: {
        shouldDehydrateQuery: (q) => {
          const k = q.queryKey?.[0];
          return k === "admin" || k === "layout-data" || k === "tracking-pixels";
        },
      },
    });
  } catch {
    // localStorage unavailable
  }
}

if (typeof window !== "undefined") {
  const prefetch = () => {
    import("./pages/Shop");
    import("./pages/ProductDetails");
    import("./pages/Cart");
    import("./pages/Checkout");
    import("./pages/About");
    import("./pages/Contact");
    import("./pages/Policies");
    import("./pages/TrackOrder");
  };

  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback?.(
      prefetch,
      { timeout: 2000 }
    );
  } else {
    setTimeout(prefetch, 800);
  }
}

const StorefrontSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={null}>{children}</Suspense>
);

const A = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={null}>{children}</Suspense>
);

// Settings children render without their own page title (SettingsLayout owns it)
const settingsChild = (Component: React.ComponentType<{ hideTitle?: boolean }>) => (
  <A><Component hideTitle /></A>
);

const App = () => (
  <ErrorBoundary>
    <ApiProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={100}>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/shop" element={<StorefrontSuspense><Shop /></StorefrontSuspense>} />
                  <Route path="/product/:id" element={<StorefrontSuspense><ProductDetails /></StorefrontSuspense>} />
                  <Route path="/about" element={<StorefrontSuspense><About /></StorefrontSuspense>} />
                  <Route path="/contact" element={<StorefrontSuspense><Contact /></StorefrontSuspense>} />
                  <Route path="/policies" element={<StorefrontSuspense><Policies /></StorefrontSuspense>} />
                  <Route path="/policies/:tab" element={<StorefrontSuspense><Policies /></StorefrontSuspense>} />
                  <Route path="/cart" element={<StorefrontSuspense><Cart /></StorefrontSuspense>} />
                  <Route path="/checkout" element={<StorefrontSuspense><Checkout /></StorefrontSuspense>} />
                  <Route path="/order-confirmation" element={<OrderConfirmation />} />
                  <Route path="/track-order" element={<StorefrontSuspense><TrackOrder /></StorefrontSuspense>} />
                </Route>

                <Route path="/admin/login" element={<StorefrontSuspense><AdminLogin /></StorefrontSuspense>} />

                <Route path="/admin" element={<A><AdminLayout /></A>}>
                  <Route index element={<A><Dashboard /></A>} />
                  <Route path="products" element={<A><Products /></A>} />
                  <Route path="orders" element={<A><Orders /></A>} />
                  <Route path="incomplete-orders" element={<A><IncompleteOrders /></A>} />
                  <Route path="customers" element={<A><Customers /></A>} />
                  <Route path="coupons" element={<A><CouponManager /></A>} />
                  <Route path="offers" element={<A><OfferManager /></A>} />
                  <Route path="roles" element={<A><UserRoles /></A>} />
                  <Route path="pos" element={<A><POS /></A>} />
                  <Route path="inquiries" element={<A><InquiriesManager /></A>} />
                  <Route path="ecomdrive-logs" element={<A><EcomDriveLogs /></A>} />

                  {/* Taxonomy */}
                  <Route path="taxonomy" element={<A><TaxonomyLayout /></A>}>
                    <Route index element={<Navigate to="/admin/taxonomy/categories" replace />} />
                    <Route path="categories" element={<A><CategoryManager hideTitle /></A>} />
                    <Route path="tags" element={<A><TagManager hideTitle /></A>} />
                    <Route path="brands" element={<A><BrandManager hideTitle /></A>} />
                  </Route>

                  {/* Settings */}
                  <Route path="settings" element={<A><SettingsLayout /></A>}>
                    <Route index element={<Navigate to="/admin/settings/homepage" replace />} />
                    <Route path="homepage" element={settingsChild(HomepageManager)} />
                    <Route path="featured-categories" element={settingsChild(FeaturedCategoriesManager)} />
                    <Route path="video-testimonials" element={settingsChild(VideoTestimonialsManager)} />
                    <Route path="announcement" element={<A><AnnouncementEditor /></A>} />
                    <Route path="shop" element={settingsChild(ShopSettings)} />
                    <Route path="delivery" element={settingsChild(DeliverySettings)} />
                    <Route path="courier" element={settingsChild(DeliveryPartners)} />
                    <Route path="tracking" element={settingsChild(TrackingPixels)} />
                    <Route path="invoice" element={settingsChild(InvoiceSettings)} />
                    <Route path="about" element={settingsChild(AboutManager)} />
                    <Route path="contact" element={settingsChild(ContactManager)} />
                    <Route path="policies" element={settingsChild(PolicyManager)} />
                    <Route path="floating" element={settingsChild(FloatingIconsManager)} />
                    <Route path="direct-order" element={settingsChild(DirectOrderChannels)} />
                    <Route path="footer" element={settingsChild(FooterEditor)} />
                  </Route>

                  {/* Legacy redirects */}
                  <Route path="brands" element={<Navigate to="/admin/taxonomy/brands" replace />} />
                  <Route path="categories" element={<Navigate to="/admin/taxonomy/categories" replace />} />
                </Route>

                <Route path="*" element={<StorefrontSuspense><NotFound /></StorefrontSuspense>} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ApiProvider>
  </ErrorBoundary>
);

export default App;
