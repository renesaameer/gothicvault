import { Decimal } from '@prisma/client/runtime/library';
import type { Coupon, DiscountType, Product, ProductVariant } from '@prisma/client';
import {
  addMoney,
  decimalToNumber,
  maxMoney,
  multiplyMoney,
  roundMoney,
  toDecimal,
} from '../../../utils/money.js';

export interface PricedLineItem {
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  sku: string | null;
  imageUrl: string | null;
  variantLabel: string | null;
  quantity: number;
  unitPrice: Decimal;
  compareAtPrice: Decimal | null;
  lineSubtotal: Decimal;
  lineDiscount: Decimal;
  lineTotal: Decimal;
  stockAvailable: number;
  productStatus: string;
  variantActive: boolean | null;
}

export interface CartTotals {
  subtotal: Decimal;
  productDiscount: Decimal;
  couponDiscount: Decimal;
  discountTotal: Decimal;
  shipping: Decimal;
  total: Decimal;
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  coupon?: Coupon;
  discountAmount?: Decimal;
}

export function resolveUnitPrice(product: Product, variant?: ProductVariant | null): Decimal {
  if (variant) {
    return toDecimal(variant.salePrice ?? variant.price);
  }
  return toDecimal(product.salePrice ?? product.price);
}

export function resolveComparePrice(product: Product, variant?: ProductVariant | null): Decimal | null {
  if (variant?.salePrice) {
    return toDecimal(variant.price);
  }
  if (product.salePrice) {
    return toDecimal(product.price);
  }
  return product.comparePrice ? toDecimal(product.comparePrice) : null;
}

export function resolveStock(product: Product, variant?: ProductVariant | null): number {
  if (variant) return variant.stock;
  return product.stock;
}

export function buildVariantLabel(variant?: ProductVariant | null): string | null {
  if (!variant?.optionValues) return null;
  const values = variant.optionValues as Record<string, string>;
  const parts = Object.entries(values).map(([key, value]) => `${key}: ${value}`);
  return parts.length > 0 ? parts.join(', ') : null;
}

export function priceLineItem(input: {
  product: Product;
  variant?: ProductVariant | null;
  quantity: number;
  imageUrl?: string | null;
}): PricedLineItem {
  const unitPrice = resolveUnitPrice(input.product, input.variant);
  const compareAt = resolveComparePrice(input.product, input.variant);
  const lineSubtotal = multiplyMoney(unitPrice, input.quantity);
  const compareLine = compareAt ? multiplyMoney(compareAt, input.quantity) : lineSubtotal;
  const lineDiscount = maxMoney(compareLine.minus(lineSubtotal), 0);
  const lineTotal = lineSubtotal;

  return {
    productId: input.product.id,
    variantId: input.variant?.id ?? null,
    name: input.product.name,
    slug: input.product.slug,
    sku: input.variant?.sku ?? input.product.sku,
    imageUrl: input.imageUrl ?? input.variant?.imageUrl ?? null,
    variantLabel: buildVariantLabel(input.variant),
    quantity: input.quantity,
    unitPrice,
    compareAtPrice: compareAt,
    lineSubtotal,
    lineDiscount,
    lineTotal,
    stockAvailable: resolveStock(input.product, input.variant),
    productStatus: input.product.status,
    variantActive: input.variant ? input.variant.active : null,
  };
}

export function calculateCartTotals(
  lines: PricedLineItem[],
  couponDiscount: Decimal = toDecimal(0),
  shipping: Decimal = toDecimal(0),
): CartTotals {
  const subtotal = lines.reduce((sum, line) => addMoney(sum, line.lineSubtotal), toDecimal(0));
  const productDiscount = lines.reduce((sum, line) => addMoney(sum, line.lineDiscount), toDecimal(0));
  const discountTotal = addMoney(productDiscount, couponDiscount);
  const total = maxMoney(addMoney(subtotal, shipping).minus(couponDiscount), 0);

  return {
    subtotal: roundMoney(subtotal),
    productDiscount: roundMoney(productDiscount),
    couponDiscount: roundMoney(couponDiscount),
    discountTotal: roundMoney(discountTotal),
    shipping: roundMoney(shipping),
    total: roundMoney(total),
  };
}

export function validateCouponForCart(
  coupon: Coupon,
  cartSubtotal: Decimal,
): CouponValidationResult {
  const now = new Date();

  if (!coupon.enabled) {
    return { valid: false, error: 'COUPON_DISABLED' };
  }

  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { valid: false, error: 'COUPON_EXPIRED' };
  }

  if (coupon.startDate && coupon.startDate > now) {
    return { valid: false, error: 'COUPON_NOT_STARTED' };
  }

  if (coupon.endDate && coupon.endDate < now) {
    return { valid: false, error: 'COUPON_EXPIRED' };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: 'COUPON_MAX_USES' };
  }

  const minTotal = coupon.minCartTotal ?? coupon.minOrderAmount;
  if (minTotal && cartSubtotal.lessThan(toDecimal(minTotal))) {
    return {
      valid: false,
      error: 'MIN_ORDER',
      coupon,
    };
  }

  const discountAmount = calculateCouponDiscount(coupon.discountType, coupon.discountValue, cartSubtotal);

  return {
    valid: true,
    coupon,
    discountAmount,
  };
}

export function calculateCouponDiscount(
  discountType: DiscountType,
  discountValue: Decimal,
  cartSubtotal: Decimal,
): Decimal {
  if (discountType === 'percentage') {
    return roundMoney(multiplyMoney(cartSubtotal, decimalToNumber(discountValue) / 100));
  }
  if (discountType === 'fixed') {
    return roundMoney(minMoney(discountValue, cartSubtotal));
  }
  if (discountType === 'free_shipping') {
    return toDecimal(0);
  }
  return toDecimal(0);
}

function minMoney(a: Decimal, b: Decimal): Decimal {
  return a.lessThan(b) ? a : b;
}

export function defaultShippingPlaceholder(subtotal: Decimal): Decimal {
  if (subtotal.greaterThanOrEqualTo(2000)) {
    return toDecimal(0);
  }
  return toDecimal(120);
}

export function serializeTotals(totals: CartTotals) {
  return {
    subtotal: decimalToNumber(totals.subtotal),
    productDiscount: decimalToNumber(totals.productDiscount),
    couponDiscount: decimalToNumber(totals.couponDiscount),
    discountTotal: decimalToNumber(totals.discountTotal),
    shipping: decimalToNumber(totals.shipping),
    total: decimalToNumber(totals.total),
  };
}

export function serializeLine(line: PricedLineItem) {
  return {
    productId: line.productId,
    variantId: line.variantId,
    name: line.name,
    slug: line.slug,
    sku: line.sku,
    image: line.imageUrl,
    variant: line.variantLabel,
    quantity: line.quantity,
    unitPrice: decimalToNumber(line.unitPrice),
    compareAtPrice: line.compareAtPrice ? decimalToNumber(line.compareAtPrice) : null,
    lineSubtotal: decimalToNumber(line.lineSubtotal),
    lineDiscount: decimalToNumber(line.lineDiscount),
    lineTotal: decimalToNumber(line.lineTotal),
    stockAvailable: line.stockAvailable,
    productStatus: line.productStatus,
    variantActive: line.variantActive,
  };
}
