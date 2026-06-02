import type { PricedLineItem } from './pricing.js';

export class CartValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = 'CartValidationError';
  }
}

export function validateLineForCart(line: PricedLineItem, requestedQuantity?: number): void {
  if (line.productStatus !== 'active') {
    throw new CartValidationError('Product is not available for purchase', 'PRODUCT_INACTIVE');
  }

  if (line.variantId && line.variantActive === false) {
    throw new CartValidationError('Selected variant is not available', 'VARIANT_INACTIVE');
  }

  const quantity = requestedQuantity ?? line.quantity;

  if (quantity < 1) {
    throw new CartValidationError('Quantity must be at least 1', 'INVALID_QUANTITY');
  }

  if (quantity > line.stockAvailable) {
    throw new CartValidationError('Insufficient stock', 'INSUFFICIENT_STOCK', 409);
  }
}

export function validateCartLines(lines: PricedLineItem[]): void {
  if (lines.length === 0) {
    throw new CartValidationError('Cart is empty', 'CART_EMPTY');
  }

  for (const line of lines) {
    validateLineForCart(line);
  }
}
