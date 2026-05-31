import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminOrders, adminKeys } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, Pencil, Save, X, Plus, FileText, Printer, Search, Truck, Gift, Tag,
  Grid3X3, List, Check, Download, CheckSquare, Square, Clock, Package, CircleCheck,
  CircleX, Loader2, ArrowRight, Copy, Phone, Mail, MapPin
} from "lucide-react";
import { CURRENCY_SYMBOL } from "@/lib/currency";
const printInvoice = async (...args: Parameters<typeof import("@/lib/invoice").printInvoice>) => {
  const mod = await import("@/lib/invoice");
  return mod.printInvoice(...args);
};

import {
  getAllProductOffers,
  calculateAppliedOffers,
  type ProductOffer,
} from "@/lib/productOffers";
import type { CartItem } from "@/data/cartStore";
import { cn } from "@/lib/utils";

const statusOptions = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const paymentStatuses = ["pending", "paid", "failed", "refunded"];

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  all: { icon: Package, color: "text-foreground", bg: "bg-foreground text-background", label: "All" },
  pending: { icon: Clock, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pending" },
  confirmed: { icon: Check, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "Confirmed" },
  processing: { icon: Loader2, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", label: "Processing" },
  shipped: { icon: Truck, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", label: "Shipped" },
  delivered: { icon: CircleCheck, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", label: "Delivered" },
  cancelled: { icon: CircleX, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "Cancel" },
};

const paymentColor = (s: string) => {
  switch (s) {
    case "paid": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "failed": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "refunded": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    default: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  }
};

const Orders = () => {
  const { data: ordersData, isLoading: loading } = useAdminOrders();
  const [orders, setOrders] = useState<any[]>([]);
  const qc = useQueryClient();
  const ordersInitRef = useRef(false);

  // Sync query data to local state for optimistic mutations
  useEffect(() => {
    if (ordersData && !ordersInitRef.current) {
      setOrders(ordersData);
      ordersInitRef.current = true;
    } else if (ordersData) {
      setOrders(ordersData);
    }
  }, [ordersData]);

  const [products, setProducts] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [productOffers, setProductOffers] = useState<ProductOffer[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [creating, setCreating] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [viewMode, setViewMode] = useState<"search" | "grid">("search");
  const [sendingToCourier, setSendingToCourier] = useState(false);
  const [courierDialogOpen, setCourierDialogOpen] = useState(false);
  const [courierOverrides, setCourierOverrides] = useState({ pathao_city_id: "", pathao_zone_id: "", pathao_area_id: "" });
  const [pathaoCities, setPathaoCities] = useState<{ id: number; name: string }[]>([]);
  const [pathaoZones, setPathaoZones] = useState<{ id: number; name: string }[]>([]);
  const [pathaoAreas, setPathaoAreas] = useState<{ id: number; name: string }[]>([]);
  const [pathaoLoading, setPathaoLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [activeCourier, setActiveCourier] = useState<{ slug: string; name: string } | null>(null);
  const [courierWarning, setCourierWarning] = useState("No courier integration is connected.");
  const { toast: courierToast } = useToast();

  const courierConnected = !!activeCourier;
  const courierSupportsBulk = activeCourier?.slug === "steadfast";
  const courierSupportsLocationOverride = activeCourier?.slug === "pathao";

  const pushPendingToCourier = async () => {
    if (!activeCourier) {
      courierToast({ title: "Courier not connected", description: courierWarning, variant: "destructive" });
      return;
    }
    if (!courierSupportsBulk) {
      courierToast({ title: "Bulk push not supported", description: `${activeCourier.name} does not support bulk push.`, variant: "destructive" });
      return;
    }
    setBulkBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("steadfast-proxy", { body: { action: "bulk_create" } });
      if (error) throw error;
      if ((data as any)?.skipped === "not_connected") {
        courierToast({ title: "Courier not connected", description: "Connect a courier in Settings → Courier API.", variant: "destructive" });
        return;
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      const count = (data as any)?.count ?? 0;
      const total = (data as any)?.total ?? 0;
      courierToast({ title: "Courier sync complete", description: `${count}/${total} orders pushed` });
      qc.invalidateQueries({ queryKey: adminKeys.orders });
    } catch (e: any) {
      const message = e?.message || "Courier push failed";
      courierToast({
        title: /not active/i.test(message) ? "Courier account inactive" : "Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setBulkBusy(false);
    }
  };

  const [newOrder, setNewOrder] = useState<any>({
    customer_name: "", customer_email: "", customer_phone: "",
    shipping_address: { country: "Bangladesh", district: "", city: "", line1: "", landmark: "" },
    items: [] as any[],
    shipping_cost: 0, discount_amount: 0, coupon_code: "", notes: "",
    order_status: "pending", payment_status: "pending",
  });
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    qc.invalidateQueries({ queryKey: adminKeys.orders });
  }, [qc]);

  useEffect(() => {
    import("@/lib/productMedia").then(({ attachImagesToProducts }) => {
      Promise.all([
        supabase.from("products").select("id, name, price, sale_price, stock, category_id, brand_id").order("name").then(async r => setProducts(await attachImagesToProducts(r.data ?? []) as any)),
        supabase.from("coupons").select("*").eq("enabled", true).then(r => setCoupons(r.data ?? [])),
        getAllProductOffers().then(setProductOffers),
      ]);
    });
  }, []);

  useEffect(() => {
    supabase
      .from("delivery_partners")
      .select("slug, name, enabled, config")
      .eq("enabled", true)
      .then(({ data }: any) => {
        const partners = (data as any[]) || [];
        // First connected partner becomes the active courier.
        const connected = partners.find(
          (p) => p?.config?.connected === true || p.slug === "pathao" || p.slug === "redx",
        );
        if (connected) {
          setActiveCourier({ slug: connected.slug, name: connected.name || connected.slug });
          setCourierWarning("");
        } else if (partners.length > 0) {
          setActiveCourier(null);
          setCourierWarning(
            partners[0]?.config?.connection_error ||
              "A courier is enabled but not connected. Finish setup in Settings → Courier API.",
          );
        } else {
          setActiveCourier(null);
          setCourierWarning("No courier integration is connected.");
        }
      });
  }, []);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    statusOptions.forEach(s => { counts[s] = 0; });
    orders.forEach(o => { counts[o.order_status] = (counts[o.order_status] || 0) + 1; });
    return counts;
  }, [orders]);

  // Quick status update
  const quickStatusUpdate = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ order_status: newStatus }).eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
      if (selected?.id === orderId) setSelected((prev: any) => ({ ...prev, order_status: newStatus }));
      toast({ title: `Status → ${newStatus}` });
    }
  };

  const quickPaymentUpdate = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ payment_status: newStatus }).eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o));
      if (selected?.id === orderId) setSelected((prev: any) => ({ ...prev, payment_status: newStatus }));
      toast({ title: `Payment → ${newStatus}` });
    }
  };

  const sendToCourier = async (order: any, overrides?: { pathao_city_id?: string; pathao_zone_id?: string; pathao_area_id?: string }) => {
    if (!activeCourier) {
      toast({ title: "Courier not connected", description: courierWarning, variant: "destructive" });
      return;
    }
    setSendingToCourier(true);
    try {
      if (activeCourier.slug === "steadfast") {
        const { data, error } = await supabase.functions.invoke("steadfast-proxy", { body: { action: "create_order", orderId: order.id } });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
        if ((data as any)?.skipped === "not_connected") throw new Error("Connect a courier in Settings → Courier API.");
        const c = (data as any)?.consignment || {};
        const trackingCode = c.tracking_code || c.consignment_id || order.steadfast_tracking_code || order.steadfast_consignment_id;
        const updated = {
          ...order,
          steadfast_consignment_id: c.consignment_id ? String(c.consignment_id) : order.steadfast_consignment_id,
          steadfast_tracking_code: c.tracking_code ?? order.steadfast_tracking_code,
          steadfast_status: c.status ?? order.steadfast_status ?? "in_review",
          delivery_partner: "steadfast",
          tracking_number: trackingCode || order.tracking_number,
          courier_sync_failed: false,
          courier_last_error: null,
        };
        setSelected(updated);
        setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
        qc.invalidateQueries({ queryKey: adminKeys.orders });
        toast({ title: "Sent to courier", description: trackingCode ? `Tracking: ${trackingCode}` : "Order submitted" });
        return;
      }

      const { data: allPartners } = await supabase.from("delivery_partners").select("*").eq("enabled", true);
      const enabledPartners = (allPartners as any[]) || [];
      const partner = enabledPartners.find((p) => p.slug === activeCourier.slug)
        || enabledPartners.find((p) => p.slug === "pathao")
        || enabledPartners.find((p) => p.slug === "redx");
      if (!partner) {
        toast({ title: "No courier configured", description: "Enable a courier in Settings → Courier API", variant: "destructive" });
        return;
      }
      const addr = order.shipping_address || {};
      const fullAddress = [addr.line1, addr.city, addr.district, addr.country].filter(Boolean).join(", ");
      const itemDesc = ((order.items as any[]) || []).map((i: any) => `${i.name} x${i.quantity}`).join(", ");
      const totalQty = ((order.items as any[]) || []).reduce((s: number, i: any) => s + (i.quantity || 1), 0);
      const resp = await supabase.functions.invoke("courier-proxy", {
        body: {
          action: "send_order", partner_id: partner.id,
          order_data: {
            order_number: order.order_number, customer_name: order.customer_name,
            customer_phone: order.customer_phone || "", full_address: fullAddress,
            city: addr.city || "", district: addr.district || "", notes: order.notes || "",
            total_quantity: totalQty, item_description: itemDesc, total: order.total,
            ...(overrides?.pathao_city_id ? { pathao_city_id: overrides.pathao_city_id } : {}),
            ...(overrides?.pathao_zone_id ? { pathao_zone_id: overrides.pathao_zone_id } : {}),
            ...(overrides?.pathao_area_id ? { pathao_area_id: overrides.pathao_area_id } : {}),
          },
        },
      });
      const result = resp.data;
      if (result?.success && result?.tracking_id) {
        await supabase.from("orders").update({ tracking_number: result.tracking_id, order_status: "shipped" }).eq("id", order.id);
        const updated = { ...order, tracking_number: result.tracking_id, order_status: "shipped" };
        setSelected(updated);
        setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
        toast({ title: "Sent to courier", description: result.message });
      } else {
        toast({ title: "Courier error", description: result?.message || result?.error || "Unknown error", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setSendingToCourier(false);
      setCourierDialogOpen(false);
    }
  };

  const handlePhoneChange = (value: string, setter: (v: string) => void) => {
    setter(value.replace(/\D/g, "").slice(0, 11));
  };

  const startEdit = () => {
    setEditData({
      customer_name: selected.customer_name,
      customer_email: selected.customer_email,
      customer_phone: selected.customer_phone || "",
      shipping_address: selected.shipping_address || { country: "Bangladesh", district: "", city: "", line1: "", landmark: "" },
      items: JSON.parse(JSON.stringify((selected.items || []).filter((i: any) => !i.is_free_gift))),
      shipping_cost: Number(selected.shipping_cost) || 0,
      discount_amount: Number(selected.discount_amount) || 0,
      coupon_code: selected.coupon_code || "",
      notes: selected.notes || "",
      order_status: selected.order_status,
      payment_status: selected.payment_status,
    });
    setEditing(true);
  };

  // Offer + coupon helpers
  const productNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    products.forEach(p => { m[p.id] = p.name; });
    return m;
  }, [products]);

  const productPriceMap = useMemo(() => {
    const m: Record<string, number> = {};
    products.forEach(p => { m[p.id] = p.sale_price && p.sale_price < p.price ? p.sale_price : p.price; });
    return m;
  }, [products]);

  const productImageMap = useMemo(() => {
    const m: Record<string, string> = {};
    products.forEach(p => { m[p.id] = p.images?.[0] || ""; });
    return m;
  }, [products]);

  const toCartItems = (items: any[]): CartItem[] =>
    items.filter((i: any) => !i.is_free_gift).map((i: any) => ({
      id: i.product_id || i.id || "",
      productId: i.product_id || i.id || "",
      name: i.name,
      price: Number(i.price),
      image: i.image || "",
      quantity: i.quantity || 1,
    }));

  const computeOffers = (items: any[]) => {
    const cartItems = toCartItems(items);
    const appliedOffers = calculateAppliedOffers(cartItems, productOffers, productNameMap, productPriceMap);
    const offerDiscount = appliedOffers.reduce((s, o) => s + o.discountAmount, 0);
    const freeGiftItems = appliedOffers.flatMap(ao =>
      ao.freeItems.map(f => ({
        product_id: f.productId, name: f.productName, quantity: f.quantity, price: 0,
        image: productImageMap[f.productId] || "", is_free_gift: true, offer_text: ao.displayText,
      }))
    );
    return { appliedOffers, freeGiftItems, offerDiscount };
  };

  const computeCouponDiscount = (data: any) => {
    if (!data.coupon_code) return 0;
    const coupon = coupons.find(c => c.code.toLowerCase() === data.coupon_code.toLowerCase());
    if (!coupon) return 0;
    const subtotal = data.items.reduce((sum: number, item: any) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    if (coupon.min_order_amount && subtotal < Number(coupon.min_order_amount)) return 0;
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return 0;
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return 0;
    if (coupon.discount_type === "percentage") return Math.round(subtotal * Number(coupon.discount_value) / 100);
    return Math.min(Number(coupon.discount_value), subtotal);
  };

  const saveEdit = async () => {
    if (!selected) return;
    const { appliedOffers, freeGiftItems, offerDiscount } = computeOffers(editData.items);
    const couponDisc = computeCouponDiscount(editData);
    const subtotal = editData.items.reduce((sum: number, item: any) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    const totalDiscount = offerDiscount + couponDisc;
    const total = Math.max(0, subtotal - totalDiscount + Number(editData.shipping_cost));
    const allItems = [...editData.items, ...freeGiftItems];

    const { error } = await supabase.from("orders").update({
      customer_name: editData.customer_name, customer_email: editData.customer_email,
      customer_phone: editData.customer_phone || null, shipping_address: editData.shipping_address,
      items: allItems, subtotal, shipping_cost: editData.shipping_cost,
      discount_amount: totalDiscount, coupon_code: editData.coupon_code || null, total,
      notes: editData.notes || null, order_status: editData.order_status, payment_status: editData.payment_status,
    }).eq("id", selected.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const updated = { ...selected, ...editData, items: allItems, subtotal, total, discount_amount: totalDiscount };
      setSelected(updated);
      setOrders(prev => prev.map(o => o.id === selected.id ? updated : o));
      setEditing(false);
      toast({ title: "Order updated" });
    }
  };

  const addProductToOrder = (product: any, data: any, setData: (d: any) => void) => {
    const price = product.sale_price && product.sale_price < product.price ? product.sale_price : product.price;
    const existing = data.items.findIndex((i: any) => i.product_id === product.id);
    if (existing >= 0) {
      const items = [...data.items];
      items[existing] = { ...items[existing], quantity: (items[existing].quantity || 1) + 1 };
      setData({ ...data, items });
    } else {
      setData({
        ...data,
        items: [...data.items, { product_id: product.id, name: product.name, quantity: 1, price, image: product.images?.[0] || "" }],
      });
    }
    setProductSearch("");
  };

  const createOrder = async () => {
    if (!newOrder.customer_name || !newOrder.customer_phone) {
      toast({ title: "Please fill customer name and phone", variant: "destructive" });
      return;
    }
    if (newOrder.customer_phone.length !== 11) {
      toast({ title: "Phone number must be 11 digits", variant: "destructive" });
      return;
    }
    if (newOrder.items.length === 0) {
      toast({ title: "Please add at least one item", variant: "destructive" });
      return;
    }
    const { freeGiftItems, offerDiscount } = computeOffers(newOrder.items);
    const couponDisc = computeCouponDiscount(newOrder);
    const orderNumber = String(Math.floor(10000000000 + Math.random() * 90000000000));
    const subtotal = newOrder.items.reduce((sum: number, item: any) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    const totalDiscount = offerDiscount + couponDisc;
    const total = Math.max(0, subtotal - totalDiscount + Number(newOrder.shipping_cost));
    const allItems = [...newOrder.items.filter((i: any) => i.name), ...freeGiftItems];

    const { error } = await supabase.from("orders").insert({
      order_number: orderNumber, customer_name: newOrder.customer_name,
      customer_email: newOrder.customer_email, customer_phone: newOrder.customer_phone || null,
      shipping_address: newOrder.shipping_address, items: allItems, subtotal,
      shipping_cost: newOrder.shipping_cost, discount_amount: totalDiscount,
      coupon_code: newOrder.coupon_code || null, total, notes: newOrder.notes || null,
      order_status: newOrder.order_status, payment_status: newOrder.payment_status,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await Promise.all(
        allItems.filter((i: any) => i.product_id && i.quantity).map((i: any) =>
          supabase.rpc("decrement_product_stock", { _product_id: i.product_id, _quantity: i.quantity || 1 })
        )
      );
      if (newOrder.coupon_code && couponDisc > 0) await supabase.rpc("increment_coupon_usage", { _code: newOrder.coupon_code });
      if (newOrder.customer_email) await supabase.rpc("subscribe_newsletter", { _email: newOrder.customer_email });
      await supabase.rpc("upsert_checkout_customer", {
        _name: newOrder.customer_name, _email: newOrder.customer_email,
        _phone: newOrder.customer_phone || "", _order_total: total,
      });
      toast({ title: "Order created", description: `Order #${orderNumber}` });
      setCreating(false);
      setNewOrder({
        customer_name: "", customer_email: "", customer_phone: "",
        shipping_address: { country: "Bangladesh", district: "", city: "", line1: "", zip: "", landmark: "" },
        items: [], shipping_cost: 0, discount_amount: 0, coupon_code: "", notes: "",
        order_status: "pending", payment_status: "pending",
      });
      fetchOrders();
    }
  };

  // Reusable order form
  const OrderForm = ({ data, setData, onSave, onCancel, title }: any) => {
    const addr = data.shipping_address || {};
    const updateAddr = (field: string, value: string) => setData({ ...data, shipping_address: { ...addr, [field]: value } });
    const items = (data.items || []).filter((i: any) => !i.is_free_gift);
    const updateItem = (i: number, field: string, value: any) => {
      const newItems = [...items];
      newItems[i] = { ...newItems[i], [field]: value };
      setData({ ...data, items: newItems });
    };
    const removeItem = (i: number) => setData({ ...data, items: items.filter((_: any, idx: number) => idx !== i) });
    const filteredProducts = productSearch.length >= 2
      ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 8)
      : [];
    const gridFilteredProducts = productSearch ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())) : products;
    const { appliedOffers, freeGiftItems, offerDiscount } = computeOffers(items);
    const couponDisc = computeCouponDiscount(data);
    const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    const totalDiscount = offerDiscount + couponDisc;
    const total = Math.max(0, subtotal - totalDiscount + Number(data.shipping_cost || 0));
    const itemQtyMap: Record<string, number> = {};
    items.forEach((i: any) => { if (i.product_id) itemQtyMap[i.product_id] = (itemQtyMap[i.product_id] || 0) + (i.quantity || 1); });

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
            <p className="text-[13px] text-muted-foreground/60 mt-0.5">Fill in order details below</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel} className="rounded-xl gap-1.5"><X size={14} /> Cancel</Button>
        </div>
        <div className="grid gap-5 max-w-3xl">
          <div className="bg-background rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="text-[14px] font-semibold text-foreground tracking-tight">Customer</h3>
            <Input value={data.customer_name} onChange={e => setData({ ...data, customer_name: e.target.value })} placeholder="Full name *" className="rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input value={data.customer_email} onChange={e => setData({ ...data, customer_email: e.target.value })} placeholder="Email (optional)" className="rounded-xl" />
              <Input value={data.customer_phone} onChange={e => handlePhoneChange(e.target.value, v => setData({ ...data, customer_phone: v }))} placeholder="Phone (11 digits) *" inputMode="numeric" maxLength={11} className="rounded-xl" />
            </div>
          </div>
          <div className="bg-background rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="text-[14px] font-semibold text-foreground tracking-tight">Shipping address</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input value={addr.country || "Bangladesh"} onChange={e => updateAddr("country", e.target.value)} placeholder="Country" className="rounded-xl" />
              <Input value={addr.district || ""} onChange={e => updateAddr("district", e.target.value)} placeholder="District" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input value={addr.city || ""} onChange={e => updateAddr("city", e.target.value)} placeholder="City / Thana" className="rounded-xl" />
              <Input value={addr.landmark || ""} onChange={e => updateAddr("landmark", e.target.value)} placeholder="Landmark (optional)" className="rounded-xl" />
            </div>
            <Input value={addr.line1 || ""} onChange={e => updateAddr("line1", e.target.value)} placeholder="Full address" className="rounded-xl" />
          </div>
          <div className="bg-background rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="text-[14px] font-semibold text-foreground tracking-tight">Status</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-muted-foreground/60 mb-1.5 block font-medium">Order Status</label>
                <Select value={data.order_status} onValueChange={v => setData({ ...data, order_status: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">{statusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground/60 mb-1.5 block font-medium">Payment Status</label>
                <Select value={data.payment_status} onValueChange={v => setData({ ...data, payment_status: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">{paymentStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="bg-background rounded-2xl border border-border/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-foreground tracking-tight">Items</h3>
              <div className="flex items-center gap-1">
                <Button variant={viewMode === "search" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("search")} className="h-7 w-7 p-0 rounded-lg"><List size={14} /></Button>
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="h-7 w-7 p-0 rounded-lg"><Grid3X3 size={14} /></Button>
              </div>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <Search size={14} className="text-muted-foreground/50" />
                <Input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder={viewMode === "grid" ? "Filter products..." : "Search products to add..."} className="flex-1 rounded-xl" />
              </div>
              {viewMode === "search" && filteredProducts.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background border border-border/40 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <button key={p.id} type="button" onClick={() => addProductToOrder(p, data, setData)} className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-muted/50 flex items-center gap-3 first:rounded-t-2xl last:rounded-b-2xl transition-colors">
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                      <span className="flex-1 truncate text-foreground/80">{p.name}</span>
                      <span className="text-muted-foreground/60 tabular-nums">{CURRENCY_SYMBOL}{p.sale_price && p.sale_price < p.price ? p.sale_price : p.price}</span>
                      {itemQtyMap[p.id] && <span className="text-[10px] bg-foreground text-background rounded-full px-1.5 py-0.5 font-semibold">{itemQtyMap[p.id]}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {viewMode === "grid" && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {gridFilteredProducts.slice(0, 40).map(p => {
                  const inCart = itemQtyMap[p.id] || 0;
                  const price = p.sale_price && p.sale_price < p.price ? p.sale_price : p.price;
                  return (
                    <button key={p.id} type="button" onClick={() => addProductToOrder(p, data, setData)} className={`relative rounded-xl border p-1.5 text-left transition-all hover:border-foreground/30 ${inCart ? "border-foreground/40 bg-muted/30" : "border-border/40"}`}>
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full aspect-square rounded-lg object-cover mb-1" />}
                      <p className="text-[10px] leading-tight line-clamp-2 text-foreground/80">{p.name}</p>
                      <p className="text-[10px] font-medium text-muted-foreground/60 mt-0.5 tabular-nums">{CURRENCY_SYMBOL}{price}</p>
                      {inCart > 0 && <span className="absolute top-1 right-1 bg-foreground text-background text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{inCart}</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {items.length === 0 && <p className="text-[13px] text-muted-foreground/50">No items added yet.</p>}
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-[13px] bg-muted/30 rounded-xl p-3">
                {item.image && <img src={item.image} alt="" className="w-9 h-9 rounded-lg object-cover" />}
                <span className="flex-1 truncate text-foreground/80">{item.name}</span>
                <Input type="number" value={item.quantity || 1} onChange={e => updateItem(i, "quantity", Math.max(1, +e.target.value))} className="w-16 rounded-lg" min={1} />
                <span className="text-muted-foreground/60 whitespace-nowrap tabular-nums">{CURRENCY_SYMBOL}{item.price}</span>
                <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="text-destructive h-7 w-7 p-0 rounded-lg"><X size={14} /></Button>
              </div>
            ))}
            {freeGiftItems.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-border/30">
                <p className="text-[11px] font-semibold text-primary flex items-center gap-1.5"><Gift size={12} /> Free Gifts (auto-applied)</p>
                {freeGiftItems.map((g: any, i: number) => (
                  <div key={`gift-${i}`} className="flex items-center gap-3 text-[13px] bg-primary/5 border border-primary/15 rounded-xl p-3">
                    {g.image && <img src={g.image} alt="" className="w-9 h-9 rounded-lg object-cover" />}
                    <span className="flex-1 truncate text-foreground/80">{g.name}</span>
                    <span className="text-muted-foreground/60">×{g.quantity}</span>
                    <span className="text-primary font-medium text-[12px]">FREE</span>
                  </div>
                ))}
              </div>
            )}
            {appliedOffers.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-border/30">
                {appliedOffers.map(ao => (
                  <div key={ao.offerId} className="flex items-center gap-2 text-[12px] text-primary">
                    <Tag size={10} /><span>{ao.displayText}</span>
                    {ao.discountAmount > 0 && <span className="ml-auto font-medium tabular-nums">-{CURRENCY_SYMBOL}{ao.discountAmount}</span>}
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <div>
                <label className="text-[12px] text-muted-foreground/60 mb-1.5 block font-medium">Shipping Cost</label>
                <Input type="number" value={data.shipping_cost} onChange={e => setData({ ...data, shipping_cost: +e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground/60 mb-1.5 block font-medium">Coupon Code</label>
                <Input value={data.coupon_code || ""} onChange={e => setData({ ...data, coupon_code: e.target.value })} placeholder="Enter coupon" list="coupon-list" className="rounded-xl" />
                <datalist id="coupon-list">{coupons.map(c => <option key={c.id} value={c.code}>{c.discount_type === "percentage" ? `${c.discount_value}% off` : `${CURRENCY_SYMBOL}${c.discount_value} off`}</option>)}</datalist>
                {couponDisc > 0 && <p className="text-[11px] text-primary mt-1.5 flex items-center gap-1"><Check size={10} /> Saves {CURRENCY_SYMBOL}{couponDisc}</p>}
              </div>
            </div>
            <div className="border-t border-border/30 pt-4 space-y-2 text-[13px]">
              <div className="flex justify-between"><span className="text-muted-foreground/60">Subtotal</span><span className="tabular-nums">{CURRENCY_SYMBOL}{subtotal}</span></div>
              {offerDiscount > 0 && <div className="flex justify-between text-primary"><span>Offer Discount</span><span className="tabular-nums">-{CURRENCY_SYMBOL}{offerDiscount}</span></div>}
              {couponDisc > 0 && <div className="flex justify-between text-primary"><span>Coupon</span><span className="tabular-nums">-{CURRENCY_SYMBOL}{couponDisc}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground/60">Shipping</span><span className="tabular-nums">{CURRENCY_SYMBOL}{Number(data.shipping_cost || 0)}</span></div>
              <div className="flex justify-between font-semibold text-[15px] pt-2 border-t border-border/30"><span>Total</span><span className="tabular-nums">{CURRENCY_SYMBOL}{total}</span></div>
            </div>
          </div>
          <div className="bg-background rounded-2xl border border-border/40 p-6">
            <label className="text-[12px] text-muted-foreground/60 mb-1.5 block font-medium">Notes</label>
            <Textarea value={data.notes || ""} onChange={e => setData({ ...data, notes: e.target.value })} rows={2} placeholder="Order notes" className="rounded-xl" />
          </div>
          <Button onClick={onSave} className="rounded-xl gap-1.5"><Save size={14} /> Save</Button>
        </div>
      </div>
    );
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusTab !== "all") result = result.filter(o => o.order_status === statusTab);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_phone?.includes(q) ||
        o.customer_email?.toLowerCase().includes(q)
      );
    }
    if (paymentFilter !== "all") result = result.filter(o => o.payment_status === paymentFilter);
    if (dateFilter !== "all") {
      const cutoff = new Date();
      if (dateFilter === "today") cutoff.setHours(0, 0, 0, 0);
      else if (dateFilter === "7d") cutoff.setDate(cutoff.getDate() - 7);
      else if (dateFilter === "30d") cutoff.setDate(cutoff.getDate() - 30);
      result = result.filter(o => new Date(o.created_at) >= cutoff);
    }
    return result;
  }, [orders, searchQuery, statusTab, paymentFilter, dateFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === filteredOrders.length ? new Set() : new Set(filteredOrders.map(o => o.id)));
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("orders").update({ order_status: bulkStatus }).in("id", ids);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, order_status: bulkStatus } : o));
      setSelectedIds(new Set());
      setBulkStatus("");
      toast({ title: `${ids.length} orders updated to ${bulkStatus}` });
    }
  };

  const exportCSV = () => {
    const rows = filteredOrders.map(o => ({
      "Order #": o.order_number, "Date": new Date(o.created_at).toLocaleDateString(),
      "Customer": o.customer_name, "Email": o.customer_email || "", "Phone": o.customer_phone || "",
      "Items": ((o.items || []) as any[]).map((i: any) => `${i.name} x${i.quantity || 1}`).join("; "),
      "Subtotal": o.subtotal, "Discount": o.discount_amount || 0, "Shipping": o.shipping_cost,
      "Total": o.total, "Status": o.order_status, "Payment": o.payment_status,
      "Tracking": o.tracking_number || "", "Coupon": o.coupon_code || "",
    }));
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  // ── ORDER DETAIL VIEW ──
  if (creating) return <OrderForm data={newOrder} setData={setNewOrder} onSave={createOrder} onCancel={() => setCreating(false)} title="Create Manual Order" />;
  if (selected && editing) return <OrderForm data={editData} setData={setEditData} onSave={saveEdit} onCancel={() => setEditing(false)} title={`Edit Order ${selected.order_number}`} />;

  if (selected) {
    const addr = selected.shipping_address || {};
    const items = selected.items || [];
    const regularItems = items.filter((i: any) => !i.is_free_gift);
    const giftItems = items.filter((i: any) => i.is_free_gift);
    const currentStatusIdx = statusOptions.indexOf(selected.order_status);
    const nextStatus = currentStatusIdx >= 0 && currentStatusIdx < statusOptions.length - 2 ? statusOptions[currentStatusIdx + 1] : null;
    const StatusIcon = STATUS_CONFIG[selected.order_status]?.icon || Package;

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setEditing(false); }} className="rounded-xl gap-1.5">
            <ChevronLeft size={14} /> Orders
          </Button>
          <div className="flex gap-2 flex-wrap">
            {courierConnected && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setCourierOverrides({ pathao_city_id: "", pathao_zone_id: "", pathao_area_id: "" }); setCourierDialogOpen(true); }}
                disabled={sendingToCourier}
                className="rounded-xl gap-1.5 text-[12px]"
              >
                <Truck size={13} /> {sendingToCourier ? "Sending..." : "Send to Courier"}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => printInvoice({ order: selected })} className="rounded-xl gap-1.5 text-[12px]"><FileText size={13} /> Invoice</Button>
            <Button size="sm" variant="outline" onClick={() => printInvoice({ order: selected }, "receipt")} className="rounded-xl gap-1.5 text-[12px]"><Printer size={13} /> Receipt</Button>
            <Button size="sm" onClick={startEdit} className="rounded-xl gap-1.5 text-[12px]"><Pencil size={13} /> Edit</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 max-w-5xl">
          <div className="lg:col-span-2 space-y-5">
            {/* Order header */}
            <div className="bg-background rounded-2xl border border-border/40 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-semibold text-foreground tracking-tight">Order #{selected.order_number}</h1>
                  <p className="text-[12px] text-muted-foreground/50 mt-0.5">{new Date(selected.created_at).toLocaleString()}</p>
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{CURRENCY_SYMBOL}{Number(selected.total).toLocaleString()}</p>
              </div>

              {/* Status timeline */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 mt-4">
                {statusOptions.filter(s => s !== "cancelled").map((s, i) => {
                  const config = STATUS_CONFIG[s];
                  const Icon = config.icon;
                  const isActive = selected.order_status === s;
                  const isPast = statusOptions.indexOf(selected.order_status) > i;
                  const isCancelled = selected.order_status === "cancelled";
                  return (
                    <div key={s} className="flex items-center">
                      <button
                        onClick={() => quickStatusUpdate(selected.id, s)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap",
                          isActive && !isCancelled ? config.bg : isPast && !isCancelled ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-muted/50 text-muted-foreground/60 hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon size={12} />
                        {config.label}
                      </button>
                      {i < statusOptions.length - 2 && <ArrowRight size={10} className="mx-0.5 text-muted-foreground/20 shrink-0" />}
                    </div>
                  );
                })}
              </div>
              {selected.order_status === "cancelled" && (
                <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[11px] font-medium w-fit">
                  <CircleX size={12} /> Cancel
                </div>
              )}
              {nextStatus && selected.order_status !== "cancelled" && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <Button size="sm" onClick={() => quickStatusUpdate(selected.id, nextStatus)} className="gap-1.5 text-[12px] rounded-xl">
                    <ArrowRight size={12} /> Move to {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                  </Button>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-background rounded-2xl border border-border/40 p-6">
              <h3 className="text-[14px] font-semibold text-foreground tracking-tight mb-4">Items ({regularItems.length})</h3>
              {regularItems.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-border/20 last:border-0">
                  {item.image && <img src={item.image} alt="" className="w-11 h-11 rounded-xl object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{item.name}</p>
                    {item.variant && <p className="text-[11px] text-muted-foreground/50">{item.variant}</p>}
                  </div>
                  <span className="text-[12px] text-muted-foreground/50">×{item.quantity || 1}</span>
                  <span className="text-[13px] font-medium text-foreground tabular-nums">{CURRENCY_SYMBOL}{Number(item.price * (item.quantity || 1)).toFixed(0)}</span>
                </div>
              ))}
              {giftItems.length > 0 && giftItems.map((item: any, i: number) => (
                <div key={`gift-${i}`} className="flex items-center gap-3 py-3 bg-primary/5 rounded-xl px-3 mt-2">
                  {item.image && <img src={item.image} alt="" className="w-11 h-11 rounded-xl object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{item.name}</p>
                    <span className="text-[10px] text-primary font-medium">🎁 FREE GIFT</span>
                  </div>
                  <span className="text-[12px] text-muted-foreground/50">×{item.quantity || 1}</span>
                </div>
              ))}
              <div className="border-t border-border/30 mt-4 pt-4 space-y-2 text-[13px]">
                <div className="flex justify-between"><span className="text-muted-foreground/60">Subtotal</span><span className="tabular-nums">{CURRENCY_SYMBOL}{Number(selected.subtotal).toLocaleString()}</span></div>
                {Number(selected.discount_amount) > 0 && (
                  <div className="flex justify-between text-primary"><span>Discount{selected.coupon_code ? ` (${selected.coupon_code})` : ""}</span><span className="tabular-nums">-{CURRENCY_SYMBOL}{Number(selected.discount_amount).toLocaleString()}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground/60">Shipping</span><span className="tabular-nums">{CURRENCY_SYMBOL}{Number(selected.shipping_cost).toLocaleString()}</span></div>
                <div className="flex justify-between font-semibold text-[16px] pt-2 border-t border-border/30"><span>Total</span><span className="tabular-nums">{CURRENCY_SYMBOL}{Number(selected.total).toLocaleString()}</span></div>
              </div>
            </div>

            {selected.notes && (
              <div className="bg-background rounded-2xl border border-border/40 p-6">
                <h3 className="text-[14px] font-semibold text-foreground tracking-tight mb-2">Notes</h3>
                <p className="text-[13px] text-muted-foreground/70 whitespace-pre-line leading-relaxed">{selected.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-background rounded-2xl border border-border/40 p-6 space-y-3">
              <h3 className="text-[14px] font-semibold text-foreground tracking-tight">Customer</h3>
              <p className="text-[14px] font-medium text-foreground">{selected.customer_name}</p>
              {selected.customer_email && (
                <button onClick={() => copyToClipboard(selected.customer_email)} className="flex items-center gap-2 text-[13px] text-muted-foreground/70 hover:text-foreground transition-colors group w-full">
                  <Mail size={13} className="shrink-0" /> <span className="truncate">{selected.customer_email}</span> <Copy size={11} className="opacity-0 group-hover:opacity-100 shrink-0" />
                </button>
              )}
              {selected.customer_phone && (
                <button onClick={() => copyToClipboard(selected.customer_phone)} className="flex items-center gap-2 text-[13px] text-muted-foreground/70 hover:text-foreground transition-colors group">
                  <Phone size={13} /> {selected.customer_phone} <Copy size={11} className="opacity-0 group-hover:opacity-100" />
                </button>
              )}
            </div>

            {(addr.line1 || addr.city) && (
              <div className="bg-background rounded-2xl border border-border/40 p-6 space-y-2">
                <h3 className="text-[14px] font-semibold text-foreground tracking-tight">Shipping Address</h3>
                <p className="text-[13px] text-muted-foreground/70 leading-relaxed">
                  {addr.line1}{addr.landmark ? ` (${addr.landmark})` : ""}<br />
                  {addr.city}{addr.district ? `, ${addr.district}` : ""}<br />
                  {addr.country}
                </p>
              </div>
            )}

            <div className="bg-background rounded-2xl border border-border/40 p-6 space-y-3">
              <h3 className="text-[14px] font-semibold text-foreground tracking-tight">Payment</h3>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground/60">Status</span>
                <Select value={selected.payment_status || "pending"} onValueChange={v => quickPaymentUpdate(selected.id, v)}>
                  <SelectTrigger className="w-[120px] h-8 text-[12px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">{paymentStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selected.tracking_number && (
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground/60">Tracking</span>
                  <button onClick={() => copyToClipboard(selected.tracking_number)} className="text-[13px] font-medium text-foreground flex items-center gap-1.5 hover:text-primary transition-colors">
                    {selected.tracking_number} <Copy size={11} />
                  </button>
                </div>
              )}
              {(selected.steadfast_tracking_code || selected.steadfast_consignment_id || selected.courier_last_error) && (
                <div className="pt-3 border-t border-border/30 space-y-1.5">
                  <p className="text-[12px] font-medium text-foreground">Courier</p>
                  {(selected.steadfast_tracking_code || selected.steadfast_consignment_id) && (
                    <button onClick={() => copyToClipboard(selected.steadfast_tracking_code || selected.steadfast_consignment_id)} className="text-[12px] text-muted-foreground/70 hover:text-foreground flex items-center gap-1.5">
                      {selected.steadfast_tracking_code || selected.steadfast_consignment_id} <Copy size={10} />
                    </button>
                  )}
                  {selected.steadfast_status && <p className="text-[11px] text-muted-foreground/60">Status: {selected.steadfast_status}</p>}
                  {selected.courier_last_error && <p className="text-[11px] text-destructive">{selected.courier_last_error}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Courier Send Dialog with Pathao Location Dropdowns */}
        <Dialog open={courierDialogOpen} onOpenChange={setCourierDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Truck size={16} /> Send to Courier
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-xl p-3 space-y-1">
                <p className="text-[12px] font-medium text-foreground">{selected.customer_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {[selected.shipping_address?.line1, selected.shipping_address?.city, selected.shipping_address?.district].filter(Boolean).join(", ")}
                </p>
                <p className="text-[11px] text-muted-foreground">District: {selected.shipping_address?.district || "—"} · City: {selected.shipping_address?.city || "—"}</p>
              </div>

              {!courierConnected && (
                <p className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">Courier not connected — {courierWarning}</p>
              )}

              {courierSupportsLocationOverride && <div className="border border-border/40 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                    <MapPin size={13} /> Pathao Location Override
                  </div>
                  <Button
                    type="button" variant="outline" size="sm"
                    className="rounded-lg text-[11px] h-7 gap-1"
                    disabled={pathaoLoading}
                    onClick={async () => {
                      setPathaoLoading(true);
                      try {
                        const { data: partners } = await (supabase.from("delivery_partners").select("id") as any).eq("slug", "pathao").eq("enabled", true).single();
                        if (!partners) { toast({ title: "Pathao not configured", variant: "destructive" }); return; }
                        const resp = await supabase.functions.invoke("courier-proxy", {
                          body: { action: "pathao_locations", partner_id: partners.id, location_type: "cities" },
                        });
                        if (resp.data?.items) {
                          setPathaoCities(resp.data.items);
                          setPathaoZones([]); setPathaoAreas([]);
                          setCourierOverrides({ pathao_city_id: "", pathao_zone_id: "", pathao_area_id: "" });
                          toast({ title: `${resp.data.items.length} cities loaded` });
                        } else {
                          toast({ title: "Failed to load cities", description: resp.data?.error, variant: "destructive" });
                        }
                      } catch (e: any) {
                        toast({ title: "Error", description: e.message, variant: "destructive" });
                      } finally { setPathaoLoading(false); }
                    }}
                  >
                    {pathaoLoading ? <Loader2 size={11} className="animate-spin" /> : null}
                    Fetch Locations
                  </Button>
                </div>

                {pathaoCities.length > 0 ? (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">City</Label>
                      <Select
                        value={courierOverrides.pathao_city_id}
                        onValueChange={async (v) => {
                          setCourierOverrides(p => ({ ...p, pathao_city_id: v, pathao_zone_id: "", pathao_area_id: "" }));
                          setPathaoZones([]); setPathaoAreas([]);
                          try {
                            const { data: partners } = await (supabase.from("delivery_partners").select("id") as any).eq("slug", "pathao").eq("enabled", true).single();
                            if (!partners) return;
                            const resp = await supabase.functions.invoke("courier-proxy", {
                              body: { action: "pathao_locations", partner_id: partners.id, location_type: "zones", parent_id: Number(v) },
                            });
                            if (resp.data?.items) setPathaoZones(resp.data.items);
                          } catch {}
                        }}
                      >
                        <SelectTrigger className="rounded-lg text-[12px] h-8 mt-1"><SelectValue placeholder="Select city..." /></SelectTrigger>
                        <SelectContent className="rounded-xl max-h-60">
                          {pathaoCities.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {pathaoZones.length > 0 && (
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Zone</Label>
                        <Select
                          value={courierOverrides.pathao_zone_id}
                          onValueChange={async (v) => {
                            setCourierOverrides(p => ({ ...p, pathao_zone_id: v, pathao_area_id: "" }));
                            setPathaoAreas([]);
                            try {
                              const { data: partners } = await (supabase.from("delivery_partners").select("id") as any).eq("slug", "pathao").eq("enabled", true).single();
                              if (!partners) return;
                              const resp = await supabase.functions.invoke("courier-proxy", {
                                body: { action: "pathao_locations", partner_id: partners.id, location_type: "areas", parent_id: Number(v) },
                              });
                              if (resp.data?.items) setPathaoAreas(resp.data.items);
                            } catch {}
                          }}
                        >
                          <SelectTrigger className="rounded-lg text-[12px] h-8 mt-1"><SelectValue placeholder="Select zone..." /></SelectTrigger>
                          <SelectContent className="rounded-xl max-h-60">
                            {pathaoZones.map(z => <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {pathaoAreas.length > 0 && (
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Area</Label>
                        <Select
                          value={courierOverrides.pathao_area_id}
                          onValueChange={v => setCourierOverrides(p => ({ ...p, pathao_area_id: v }))}
                        >
                          <SelectTrigger className="rounded-lg text-[12px] h-8 mt-1"><SelectValue placeholder="Select area..." /></SelectTrigger>
                          <SelectContent className="rounded-xl max-h-60">
                            {pathaoAreas.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground/60">Click "Fetch Locations" to load Pathao cities, then select city → zone → area. Leave empty for auto-detection.</p>
                )}
              </div>}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setCourierDialogOpen(false)} className="rounded-xl text-[12px]">Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  const overrides = courierOverrides.pathao_city_id || courierOverrides.pathao_zone_id
                    ? courierOverrides : undefined;
                  sendToCourier(selected, overrides);
                }}
                disabled={sendingToCourier || !courierConnected}
                className="rounded-xl text-[12px] gap-1.5"
              >
                {sendingToCourier ? <><Loader2 size={13} className="animate-spin" /> Sending...</> : <><Truck size={13} /> Send</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── ORDER LIST VIEW ──
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Orders</h1>
          <p className="text-[13px] text-muted-foreground/60 mt-0.5">{orders.length} total orders</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={exportCSV} className="rounded-xl gap-1.5 text-[12px]"><Download size={13} /> CSV</Button>
          {courierConnected && courierSupportsBulk && (
            <Button size="sm" variant="outline" onClick={pushPendingToCourier} disabled={bulkBusy} className="rounded-xl gap-1.5 text-[12px]"><Truck size={13} /> {bulkBusy ? "Sending…" : "Push pending to Courier"}</Button>
          )}
          <Button size="sm" onClick={() => setCreating(true)} className="rounded-xl gap-1.5 text-[12px]"><Plus size={13} /> Manual Order</Button>
        </div>
      </div>

      {!courierConnected && (
        <div className="mb-5 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-[12px] text-destructive">
          Courier not connected — {courierWarning}
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
        {["all", ...statusOptions].map(s => {
          const config = STATUS_CONFIG[s];
          const Icon = config.icon;
          const count = statusCounts[s] || 0;
          const isActive = statusTab === s;
          return (
            <button
              key={s}
              onClick={() => { setStatusTab(s); setSelectedIds(new Set()); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all whitespace-nowrap shrink-0",
                isActive ? "bg-foreground text-background" : "bg-muted/40 text-muted-foreground/60 hover:text-foreground hover:bg-muted/70"
              )}
            >
              <Icon size={13} />
              {config.label}
              <span className={cn(
                "ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums",
                isActive ? "bg-background/20 text-background" : "bg-foreground/8 text-muted-foreground/50"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search order #, name, phone, email..." className="pl-9 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full sm:w-[130px] h-10 text-[12px] rounded-xl"><SelectValue placeholder="Payment" /></SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All payments</SelectItem>
              {paymentStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[120px] h-10 text-[12px] rounded-xl"><SelectValue placeholder="Date" /></SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-muted/30 border border-border/30 rounded-2xl p-4 mb-5 flex items-center gap-3 flex-wrap">
          <span className="text-[13px] font-medium text-foreground">{selectedIds.size} selected</span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 text-[12px] rounded-xl"><SelectValue placeholder="Set status..." /></SelectTrigger>
            <SelectContent className="rounded-xl">{statusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
          </Select>

          <Button size="sm" variant="default" onClick={handleBulkStatusUpdate} disabled={!bulkStatus} className="h-8 text-[12px] rounded-xl">Apply</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="h-8 text-[12px] rounded-xl">Clear</Button>
        </div>
      )}

      <p className="text-[12px] text-muted-foreground/50 mb-3">{filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}</p>

      {loading ? (
        <div className="bg-background rounded-2xl border border-border/40 overflow-hidden">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/20 last:border-0">
              <Skeleton className="w-4 h-4 rounded" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-36" /></div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground/50">
          <Package size={36} className="mx-auto mb-4 opacity-20" />
          <p className="text-[14px] font-medium">{orders.length === 0 ? "No orders yet" : "No orders match your filters"}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-background rounded-2xl border border-border/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="px-4 py-3.5 w-8">
                      <button onClick={toggleSelectAll} className="text-muted-foreground/40 hover:text-foreground">
                        {selectedIds.size === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3.5 font-medium text-muted-foreground/50 text-[12px] uppercase tracking-wide">Order</th>
                    <th className="text-left px-4 py-3.5 font-medium text-muted-foreground/50 text-[12px] uppercase tracking-wide">Customer</th>
                    <th className="text-left px-4 py-3.5 font-medium text-muted-foreground/50 text-[12px] uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3.5 font-medium text-muted-foreground/50 text-[12px] uppercase tracking-wide">Payment</th>
                    <th className="text-right px-4 py-3.5 font-medium text-muted-foreground/50 text-[12px] uppercase tracking-wide">Total</th>
                    <th className="text-right px-4 py-3.5 font-medium text-muted-foreground/50 text-[12px] uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => {
                    const orderStatus = o.order_status || "pending";
                    const paymentStatus = o.payment_status || "pending";
                    const config = STATUS_CONFIG[orderStatus] || STATUS_CONFIG.pending;
                    return (
                      <tr key={o.id} className="border-b border-border/15 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                        <td className="px-4 py-3.5" onClick={e => { e.stopPropagation(); toggleSelect(o.id); }}>
                          <button className="text-muted-foreground/40 hover:text-foreground">
                            {selectedIds.has(o.id) ? <CheckSquare size={16} className="text-foreground" /> : <Square size={16} />}
                          </button>
                        </td>
                        <td className="px-4 py-3.5" onClick={() => setSelected(o)}>
                          <span className="font-medium text-foreground">{o.order_number}</span>
                          <p className="text-[11px] text-muted-foreground/40">{((o.items || []) as any[]).length} item{((o.items || []) as any[]).length !== 1 ? "s" : ""}</p>
                        </td>
                        <td className="px-4 py-3.5" onClick={() => setSelected(o)}>
                          <span className="text-foreground/80">{o.customer_name}</span>
                          {o.customer_phone && <p className="text-[11px] text-muted-foreground/40">{o.customer_phone}</p>}
                        </td>
                        <td className="px-4 py-3.5" onClick={() => setSelected(o)}>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full capitalize ${config.bg}`}>
                            <config.icon size={10} />{orderStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5" onClick={() => setSelected(o)}>
                          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full capitalize ${paymentColor(paymentStatus)}`}>{paymentStatus}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-foreground tabular-nums" onClick={() => setSelected(o)}>
                          {CURRENCY_SYMBOL}{Number(o.total).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right text-muted-foreground/50 text-[12px]" onClick={() => setSelected(o)}>
                          {new Date(o.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {filteredOrders.map(o => {
              const orderStatus = o.order_status || "pending";
              const paymentStatus = o.payment_status || "pending";
              const config = STATUS_CONFIG[orderStatus] || STATUS_CONFIG.pending;
              return (
                <div key={o.id} onClick={() => setSelected(o)} className="bg-background rounded-2xl border border-border/40 p-4 active:bg-muted/30 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold text-foreground">#{o.order_number}</span>
                    <span className="text-[14px] font-semibold text-foreground tabular-nums">{CURRENCY_SYMBOL}{Number(o.total).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-foreground/70">{o.customer_name}</span>
                    <span className="text-[11px] text-muted-foreground/50">{new Date(o.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${config.bg}`}>
                      <config.icon size={9} />{orderStatus}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${paymentColor(paymentStatus)}`}>{paymentStatus}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Orders;
