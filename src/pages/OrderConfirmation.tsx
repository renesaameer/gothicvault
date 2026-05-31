import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircleIcon } from "@/components/ui/icons";
import { trackPurchase } from "@/lib/trackingEvents";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const OrderConfirmation = () => {
  const [params] = useSearchParams();
  const orderNumber = params.get("order") || "N/A";
  const total = Number(params.get("total") || 0);
  useDocumentMeta({
    title: "Order Confirmed — AEROM",
    description: "Thank you for shopping with AEROM Your order has been received.",
    canonicalPath: "/order-confirmation",
  });

  useEffect(() => {
    if (orderNumber !== "N/A" && total > 0) {
      let items: { id: string; name: string; price: number; quantity: number }[] | undefined;
      let userData: any | undefined;
      try {
        const stored = sessionStorage.getItem("last_order_items");
        if (stored) {
          items = JSON.parse(stored);
          sessionStorage.removeItem("last_order_items");
        }
        const u = sessionStorage.getItem("last_order_user");
        if (u) {
          userData = JSON.parse(u);
          sessionStorage.removeItem("last_order_user");
        }
      } catch {}
      trackPurchase({ orderNumber, total, items, userData });
    }
  }, [orderNumber, total]);

  return (
    <div className="section-padding py-12 sm:py-16 text-center page-enter">
      <div className="fade-up">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6 animate-float">
          <CheckCircleIcon className="w-10 h-10 text-primary" />
        </div>
        <h1 className="apple-heading-md text-foreground mb-3">Order placed successfully!</h1>
        <p className="apple-body mb-2">Thank you for your order.</p>
        <p className="text-sm text-muted-foreground mb-8">
          Your order number is <strong className="text-foreground">{orderNumber}</strong>. We'll contact you shortly to confirm.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/track-order?order=${orderNumber}`}
            className="inline-flex items-center justify-center border border-primary/30 text-foreground px-8 py-4 rounded-full text-sm font-medium hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
          >
            Track Order
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-4 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-[0_4px_16px_-6px_hsl(var(--primary)/0.35)]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
