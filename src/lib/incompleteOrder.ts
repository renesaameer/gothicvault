import { supabase } from "@/integrations/supabase/client";

// Bangladesh mobile: 11 digits starting with 01. Matches DB-side validation.
const BD_PHONE_RE = /^01[0-9]{9}$/;
const SESSION_KEY = "aerom_checkout_session";

export function isValidBdPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  return BD_PHONE_RE.test(phone.replace(/\D/g, ""));
}

export function getCheckoutSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `eph-${Date.now()}`;
  }
}

export function clearCheckoutSession(): void {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

export type IncompleteOrderPayload = {
  sessionId: string;
  phone: string;
  customerName?: string;
  email?: string;
  address?: Record<string, unknown>;
  cartItems: Array<Record<string, unknown>>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  coupon?: string | null;
  paymentMethod?: string | null;
  checkoutStep?: string;
};

export async function upsertIncompleteOrder(p: IncompleteOrderPayload): Promise<void> {
  if (!isValidBdPhone(p.phone) || !p.cartItems?.length) return;
  await supabase.rpc("upsert_incomplete_order", {
    _session_id: p.sessionId,
    _phone: p.phone.replace(/\D/g, ""),
    _customer_name: p.customerName || null,
    _email: p.email || null,
    _address: (p.address ?? {}) as any,
    _cart_items: p.cartItems as any,
    _subtotal: p.subtotal || 0,
    _delivery_charge: p.deliveryCharge || 0,
    _total: p.total || 0,
    _coupon: p.coupon ?? null,
    _payment_method: p.paymentMethod ?? null,
    _checkout_step: p.checkoutStep || "started",
  });
}

export async function markIncompleteOrderRecovered(
  sessionId: string,
  phone: string,
  orderId: string,
): Promise<void> {
  if (!isValidBdPhone(phone) || !orderId) return;
  await supabase.rpc("mark_incomplete_order_recovered", {
    _session_id: sessionId,
    _phone: phone.replace(/\D/g, ""),
    _order_id: orderId,
  });
}