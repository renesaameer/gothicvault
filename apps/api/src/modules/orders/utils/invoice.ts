import type { Order, OrderItem } from '@prisma/client';
import { decimalToNumber } from '../../../utils/money.js';

export interface InvoicePayload {
  invoiceNumber: string;
  issuedAt: string;
  store: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
  };
  customer: {
    name: string;
    email?: string | null;
    phone: string;
    address: string;
    city?: string | null;
  };
  billingAddress: unknown;
  shippingAddress: unknown;
  lineItems: Array<{
    description: string;
    sku: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  summary: {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
    couponCode?: string | null;
  };
  payment: {
    method: string | null;
    status: string;
  };
  fulfillmentStatus: string;
  orderStatus: string;
  notes?: string | null;
}

export function buildInvoice(
  order: Order,
  orderItems: OrderItem[],
  storeSettings?: {
    storeName?: string | null;
    storeAddress?: string | null;
    storePhone?: string | null;
    storeEmail?: string | null;
    logoUrl?: string | null;
  },
): InvoicePayload {
  return {
    invoiceNumber: order.orderNumber,
    issuedAt: order.createdAt.toISOString(),
    store: {
      name: storeSettings?.storeName ?? 'Gothic Vault',
      address: storeSettings?.storeAddress,
      phone: storeSettings?.storePhone,
      email: storeSettings?.storeEmail,
      logoUrl: storeSettings?.logoUrl,
    },
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address: order.customerAddress,
      city: order.customerCity,
    },
    billingAddress: order.billingAddress ?? order.shippingAddress,
    shippingAddress: order.shippingAddress,
    lineItems: orderItems.map((item) => {
      const snapshot = item.productSnapshot as { name?: string; sku?: string | null };
      return {
        description: snapshot.name ?? 'Product',
        sku: snapshot.sku ?? null,
        quantity: item.quantity,
        unitPrice: decimalToNumber(item.unitPrice),
        lineTotal: decimalToNumber(item.lineTotal),
      };
    }),
    summary: {
      subtotal: decimalToNumber(order.subtotal),
      discount: decimalToNumber(order.discountAmount),
      shipping: decimalToNumber(order.shippingCost),
      total: decimalToNumber(order.total),
      couponCode: order.couponCode,
    },
    payment: {
      method: order.paymentMethod,
      status: order.paymentStatus,
    },
    fulfillmentStatus: order.fulfillmentStatus,
    orderStatus: order.orderStatus,
    notes: order.notes,
  };
}
