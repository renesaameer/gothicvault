import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCY_SYMBOL } from "@/lib/currency";
const printInvoice = async (...args: Parameters<typeof import("@/lib/invoice").printInvoice>) => {
  const mod = await import("@/lib/invoice");
  return mod.printInvoice(...args);
};

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Printer,
  Receipt, X, CreditCard, Banknote, Check,
  ScanBarcode, Tag, Maximize, Minimize,
  History, Phone, ChevronDown, Gift, Undo2
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  images: string[];
  stock: number;
  sku: string | null;
  category_id: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface AvailableCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
}

interface AvailableOffer {
  id: string;
  name: string;
  discount_type: string;
  discount_value: number;
  apply_to: string;
  target_ids: string[] | null;
}

const POS = ({ hideTitle }: { hideTitle?: boolean }) => {
  const { toast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; parent_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [placing, setPlacing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [undoingId, setUndoingId] = useState<string | null>(null);

  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [availableOffers, setAvailableOffers] = useState<AvailableOffer[]>([]);
  const [showDiscountPicker, setShowDiscountPicker] = useState(false);

  const [manualBarcode, setManualBarcode] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [prodRes, catRes, couponRes, offerRes] = await Promise.all([
      supabase.from("products").select("id, name, price, sale_price, stock, sku, category_id").gt("stock", 0).order("name"),
      supabase.from("categories").select("id, name, parent_id").order("sort_order"),
      supabase.from("coupons").select("id, code, discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at").eq("enabled", true),
      supabase.from("offers").select("id, name, discount_type, discount_value, apply_to, target_ids").eq("enabled", true),
    ]);
    const { attachImagesToProducts } = await import("@/lib/productMedia");
    setProducts(await attachImagesToProducts((prodRes.data || []) as any[]) as any);
    setCategories(catRes.data || []);
    const now = new Date();
    setAvailableCoupons((couponRes.data || []).filter((c: any) => {
      if (c.expires_at && new Date(c.expires_at) < now) return false;
      if (c.max_uses && c.used_count >= c.max_uses) return false;
      return true;
    }));
    setAvailableOffers(offerRes.data || []);
    setLoading(false);
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    const { data } = await supabase.from("orders")
      .select("id, order_number, customer_name, total, created_at, items, payment_status, notes, subtotal, discount_amount, shipping_cost, customer_email, customer_phone, order_status, coupon_code")
      .ilike("notes", "%POS%")
      .order("created_at", { ascending: false })
      .limit(30);
    setHistory(data || []);
    setHistoryLoading(false);
  };

  const undoSale = async (order: any) => {
    if (!confirm(`Undo sale #${order.order_number}? This will restore stock, reverse customer stats, and delete the order.`)) return;
    setUndoingId(order.id);
    try {
      // 1. Restore stock for each item
      const items = (order.items as any[]) || [];
      await Promise.all(items.map((item: any) =>
        (supabase as any).rpc("increment_product_stock", { _product_id: item.product_id || item.id, _quantity: item.quantity })
      ));

      // 2. Reverse customer stats
      await (supabase as any).rpc("reverse_customer_order", { _email: order.customer_email, _order_total: Number(order.total) });

      // 3. Reverse coupon usage if applicable
      if (order.coupon_code) {
        await (supabase as any).rpc("decrement_coupon_usage", { _code: order.coupon_code });
      }

      // 4. Delete the order
      await supabase.from("orders").delete().eq("id", order.id);

      toast({ title: "Sale undone", description: `Order #${order.order_number} reversed. Stock restored.` });
      setHistory((prev) => prev.filter((h) => h.id !== order.id));
      fetchData(); // refresh product stock
    } catch (err: any) {
      toast({ title: "Undo failed", description: err.message, variant: "destructive" });
    } finally {
      setUndoingId(null);
    }
  };

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);
  const toggleHistory = () => {
    if (!showHistory) fetchHistory();
    setShowHistory((prev) => !prev);
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategory) list = list.filter((p) => p.category_id === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }
    return list;
  }, [products, search, activeCategory]);

  const getPrice = (p: Product) => p.sale_price ?? p.price;

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast({ title: "Stock limit reached", variant: "destructive" });
          return prev;
        }
        return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, [toast]);

  const handleBarcodeScan = useCallback((code: string) => {
    const product = products.find((p) => p.sku?.toLowerCase() === code.toLowerCase());
    if (product) {
      addToCart(product);
      toast({ title: `Scanned: ${product.name}` });
    } else {
      toast({ title: "Product not found", description: `SKU: ${code}`, variant: "destructive" });
    }
  }, [products, toast, addToCart]);

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.product.id !== productId) return c;
        const newQty = c.quantity + delta;
        if (newQty > c.product.stock) { toast({ title: "Stock limit reached", variant: "destructive" }); return c; }
        return { ...c, quantity: newQty };
      }).filter((c) => c.quantity > 0)
    );
  };

  const removeItem = (productId: string) => setCart((prev) => prev.filter((c) => c.product.id !== productId));

  const subtotal = cart.reduce((sum, c) => sum + getPrice(c.product) * c.quantity, 0);

  const applySelectedCoupon = (coupon: AvailableCoupon) => {
    if (coupon.min_order_amount && subtotal < Number(coupon.min_order_amount)) {
      toast({ title: `Min order: ${CURRENCY_SYMBOL}${coupon.min_order_amount}`, variant: "destructive" });
      return;
    }
    const discountAmt = coupon.discount_type === "percentage"
      ? (subtotal * Number(coupon.discount_value)) / 100
      : Number(coupon.discount_value);
    setDiscount(Math.min(discountAmt, subtotal));
    setAppliedCoupon({ ...coupon, type: "coupon" });
    setShowDiscountPicker(false);
    toast({ title: `Coupon applied: ${coupon.code}` });
  };

  const applySelectedOffer = (offer: AvailableOffer) => {
    const discountAmt = offer.discount_type === "percentage"
      ? (subtotal * Number(offer.discount_value)) / 100
      : Number(offer.discount_value);
    setDiscount(Math.min(discountAmt, subtotal));
    setAppliedCoupon({ ...offer, code: offer.name, type: "offer" });
    setShowDiscountPicker(false);
    toast({ title: `Offer applied: ${offer.name}` });
  };

  const removeCoupon = () => { setAppliedCoupon(null); setDiscount(0); };

  const total = Math.max(0, subtotal - discount);

  const completeSale = async () => {
    if (cart.length === 0) { toast({ title: "Cart is empty", variant: "destructive" }); return; }
    setPlacing(true);
    try {
      const orderNumber = Date.now().toString().slice(-11).padStart(11, "0");
      const items = cart.map((c) => ({
        id: c.product.id, name: c.product.name, price: getPrice(c.product),
        quantity: c.quantity, sku: c.product.sku || "", image: c.product.images?.[0] || "",
      }));

      const resolvedEmail = customerEmail || "pos@store.local";
      const resolvedName = customerName || "Walk-in Customer";

      const { data: order, error } = await supabase.from("orders").insert({
        order_number: orderNumber, customer_name: resolvedName, customer_email: resolvedEmail,
        customer_phone: customerPhone || null, items, subtotal, discount_amount: discount,
        shipping_cost: 0, total, order_status: "delivered", payment_status: "paid",
        notes: `POS Sale — ${paymentMethod}`, coupon_code: appliedCoupon?.code || null,
      }).select().single();

      if (error) throw error;

      await Promise.all(cart.map((c) => supabase.rpc("decrement_product_stock", { _product_id: c.product.id, _quantity: c.quantity })));
      await supabase.rpc("upsert_checkout_customer", { _name: resolvedName, _email: resolvedEmail, _phone: customerPhone || "", _order_total: total });
      if (appliedCoupon?.type === "coupon") await supabase.rpc("increment_coupon_usage", { _code: appliedCoupon.code });

      // Auto-subscribe email to newsletter (validation handled in helper)
      if (resolvedEmail && resolvedEmail !== "pos@store.local") {
        const { subscribeToNewsletter } = await import("@/lib/newsletter");
        await subscribeToNewsletter(resolvedEmail);
      }

      setCompletedOrder(order);
      toast({ title: "Sale completed!" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Sale failed", description: err.message, variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  const resetSale = () => {
    setCart([]); setDiscount(0); setCustomerName(""); setCustomerPhone(""); setCustomerEmail("");
    setPaymentMethod("cash"); setCompletedOrder(null); setAppliedCoupon(null);
    searchRef.current?.focus();
  };

  const wrapperClass = isFullscreen
    ? "fixed inset-0 z-[100] bg-background p-4 flex flex-col overflow-hidden"
    : "";

  if (completedOrder) {
    return (
      <div className={wrapperClass}>
        <div className="flex items-center justify-center py-12 flex-1">
          <div className="text-center space-y-5 max-w-sm">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Sale Complete!</h2>
              <p className="text-muted-foreground text-sm mt-1">Order #{completedOrder.order_number}</p>
              <p className="text-2xl font-bold text-foreground mt-2">{CURRENCY_SYMBOL}{Number(completedOrder.total).toFixed(0)}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => printInvoice({ order: completedOrder, storeName: "Store" }, "receipt")} className="gap-1.5">
                <Receipt size={14} /> Receipt
              </Button>
              <Button variant="outline" size="sm" onClick={() => printInvoice({ order: completedOrder, storeName: "Store" }, "a4")} className="gap-1.5">
                <Printer size={14} /> Invoice
              </Button>
            </div>
            <Button onClick={resetSale} className="w-full gap-2">
              <ShoppingCart size={14} /> New Sale
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // History panel
  if (showHistory) {
    return (
      <div className={wrapperClass || "min-h-0"}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2"><History size={18} /> Sale History</h1>
          <div className="flex gap-2">
            {isFullscreen && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen}>
                <Minimize size={16} />
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={toggleHistory}>
              <X size={14} className="mr-1" /> Back to POS
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {historyLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No POS sales yet</p>
          ) : (
            <div className="space-y-2">
              {history.map((order) => (
                <div key={order.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">#{order.order_number}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">{order.payment_status}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{order.customer_name} • {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-[10px] text-muted-foreground">{(order.items as any[])?.length || 0} items • {order.notes?.replace("POS Sale — ", "")}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-foreground">{CURRENCY_SYMBOL}{Number(order.total).toFixed(0)}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printInvoice({ order, storeName: "Store" }, "receipt")} title="Print receipt">
                        <Receipt size={13} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printInvoice({ order, storeName: "Store" }, "a4")} title="Print invoice">
                        <Printer size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => undoSale(order)}
                        disabled={undoingId === order.id}
                        title="Undo sale (restore stock & delete order)"
                      >
                        <Undo2 size={13} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const hasDiscountsAvailable = availableCoupons.length > 0 || availableOffers.length > 0;

  return (
    <div className={wrapperClass}>
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3">
        {!hideTitle && <h1 className="text-lg font-semibold text-foreground">Point of Sale</h1>}
        {hideTitle && <div />}
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={toggleHistory}>
            <History size={14} /> History
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </Button>
        </div>
      </div>

      <div className={`flex flex-col lg:flex-row gap-3 ${isFullscreen ? "flex-1 min-h-0" : ""}`} style={!isFullscreen ? { minHeight: "70vh" } : undefined}>
        {/* LEFT — Products */}
        <div className="flex-1 flex flex-col min-h-0 bg-background rounded-xl border border-border overflow-hidden">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input ref={searchRef} placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-xs" autoFocus />
            </div>
            <div className="relative hidden sm:block">
              <ScanBarcode className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
              <Input
                placeholder="Scan / SKU"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (manualBarcode.trim()) { handleBarcodeScan(manualBarcode.trim()); setManualBarcode(""); }
                  }
                }}
                className="pl-8 w-40 h-9 text-xs"
              />
            </div>
          </div>

          <div className="px-3 py-2 border-b border-border flex gap-1.5 overflow-x-auto flex-shrink-0">
            <Button variant={activeCategory === null ? "default" : "outline"} size="sm" className="text-[11px] h-7 px-2.5" onClick={() => setActiveCategory(null)}>All</Button>
            {categories.filter((c) => !c.parent_id).map((cat) => (
              <Button key={cat.id} variant={activeCategory === cat.id ? "default" : "outline"} size="sm" className="text-[11px] h-7 px-2.5 whitespace-nowrap" onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}>{cat.name}</Button>
            ))}
          </div>

          <div className={`flex-1 overflow-y-auto p-3`} style={!isFullscreen ? { maxHeight: "55vh" } : undefined}>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No products found</p>
            ) : (
              <div className={`grid gap-2 ${isFullscreen ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"}`}>
                {filteredProducts.map((product) => {
                  const inCart = cart.find((c) => c.product.id === product.id);
                  return (
                    <button key={product.id} onClick={() => addToCart(product)} className="relative bg-card border border-border rounded-lg p-2 text-left hover:border-primary/50 transition-colors">
                      <div className="aspect-square rounded-md overflow-hidden bg-muted mb-1.5">
                        {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">No img</div>}
                      </div>
                      <p className="text-[11px] font-medium text-foreground line-clamp-2 leading-tight">{product.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs font-bold text-foreground">{CURRENCY_SYMBOL}{getPrice(product).toFixed(0)}</p>
                        <p className="text-[9px] text-muted-foreground">×{product.stock}</p>
                      </div>
                      {inCart && (
                        <span className="absolute top-1 right-1 text-[9px] px-1 py-0 inline-flex items-center rounded-full border border-transparent bg-primary text-primary-foreground font-semibold">{inCart.quantity}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Cart */}
        <div className={`${isFullscreen ? "w-full lg:w-[380px]" : "w-full lg:w-[340px]"} flex flex-col bg-background rounded-xl border border-border overflow-hidden`}>
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShoppingCart size={14} /> Cart
              {cart.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">{cart.reduce((s, c) => s + c.quantity, 0)}</span>
              )}
            </h2>
          </div>

          <div className={`flex-1 overflow-y-auto p-3 space-y-1.5`} style={!isFullscreen ? { maxHeight: "30vh" } : undefined}>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-1">
                <ShoppingCart size={24} className="opacity-30" />
                <p className="text-xs">Click products to add</p>
              </div>
            ) : cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-2 bg-card rounded-lg p-2 border border-border">
                <div className="w-8 h-8 rounded overflow-hidden bg-muted flex-shrink-0">
                  {item.product.images?.[0] ? <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{item.product.name}</p>
                  <p className="text-[10px] text-muted-foreground">{CURRENCY_SYMBOL}{getPrice(item.product).toFixed(0)} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(item.product.id, -1)}><Minus size={10} /></Button>
                  <span className="text-[11px] font-medium w-4 text-center">{item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(item.product.id, 1)}><Plus size={10} /></Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeItem(item.product.id)}><Trash2 size={10} /></Button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-3 space-y-2.5">
            {/* Customer */}
            <div className="grid grid-cols-2 gap-1.5">
              <Input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-7 text-[11px]" />
              <Input placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="h-7 text-[11px]" />
            </div>

            {/* Discount / Coupon / Offer selector */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-primary/5 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                  {appliedCoupon.type === "offer" ? <Gift size={12} /> : <Tag size={12} />}
                  {appliedCoupon.code} — {appliedCoupon.discount_value}{appliedCoupon.discount_type === "percentage" ? "%" : CURRENCY_SYMBOL} off
                </span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={removeCoupon}><X size={12} /></Button>
              </div>
            ) : (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-[11px] justify-between"
                  onClick={() => setShowDiscountPicker(!showDiscountPicker)}
                >
                  <span className="flex items-center gap-1.5">
                    <Tag size={12} />
                    {hasDiscountsAvailable ? "Select Coupon / Offer / Deal" : "No coupons or offers available"}
                  </span>
                  <ChevronDown size={12} className={`transition-transform ${showDiscountPicker ? "rotate-180" : ""}`} />
                </Button>

                {showDiscountPicker && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {availableCoupons.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0">Coupons</div>
                        {availableCoupons.map((c) => (
                          <button
                            key={c.id}
                            className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between"
                            onClick={() => applySelectedCoupon(c)}
                          >
                            <div>
                              <span className="text-[11px] font-bold text-foreground">{c.code}</span>
                              {c.min_order_amount && Number(c.min_order_amount) > 0 && (
                                <span className="text-[9px] text-muted-foreground ml-1.5">Min {CURRENCY_SYMBOL}{c.min_order_amount}</span>
                              )}
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">
                              {c.discount_value}{c.discount_type === "percentage" ? "%" : CURRENCY_SYMBOL} off
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {availableOffers.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0">Offers & Deals</div>
                        {availableOffers.map((o) => (
                          <button
                            key={o.id}
                            className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between"
                            onClick={() => applySelectedOffer(o)}
                          >
                            <div>
                              <span className="text-[11px] font-medium text-foreground">{o.name}</span>
                              <span className="text-[9px] text-muted-foreground ml-1.5 capitalize">{o.apply_to.replace(/_/g, " ")}</span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-border text-foreground font-semibold">
                              {o.discount_value}{o.discount_type === "percentage" ? "%" : CURRENCY_SYMBOL} off
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!hasDiscountsAvailable && (
                      <p className="text-xs text-muted-foreground text-center py-4">No active coupons or offers</p>
                    )}
                    {/* Manual discount option */}
                    <div className="border-t border-border px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">Manual</span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Amount"
                          value={discount || ""}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          className="h-6 text-[11px] flex-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button size="sm" className="h-6 text-[9px] px-2" onClick={() => { if (discount > 0) { setAppliedCoupon({ code: "Manual", discount_value: discount, discount_type: "fixed", type: "manual" }); setShowDiscountPicker(false); } }}>
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment */}
            <div className="flex gap-1.5">
              {[
                { key: "cash", label: "Cash", icon: Banknote },
                { key: "card", label: "Card", icon: CreditCard },
                { key: "mobile", label: "Mobile", icon: Phone },
              ].map((m) => (
                <Button key={m.key} variant={paymentMethod === m.key ? "default" : "outline"} size="sm" className="flex-1 text-[10px] h-7 gap-1" onClick={() => setPaymentMethod(m.key)}>
                  <m.icon size={12} /> {m.label}
                </Button>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{CURRENCY_SYMBOL}{subtotal.toFixed(0)}</span></div>
              {discount > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount</span><span>-{CURRENCY_SYMBOL}{discount.toFixed(0)}</span></div>}
              <div className="flex justify-between font-bold text-foreground text-sm pt-1 border-t border-border"><span>Total</span><span>{CURRENCY_SYMBOL}{total.toFixed(0)}</span></div>
            </div>

            <Button onClick={completeSale} disabled={placing || cart.length === 0} className="w-full gap-2 h-9 text-xs">
              {placing ? "Processing..." : `Complete Sale — ${CURRENCY_SYMBOL}${total.toFixed(0)}`}
            </Button>
          </div>
        </div>
      </div>

      {/* Click outside to close discount picker */}
      {showDiscountPicker && <div className="fixed inset-0 z-40" onClick={() => setShowDiscountPicker(false)} />}
    </div>
  );
};

export default POS;
