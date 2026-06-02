import type { PaymentMethod, PaymentStatus } from '@prisma/client';
import prisma from '../../utils/prisma.js';
import { convertDecimalToNumber } from '../../utils/decimal.js';
import { decimalToNumber, toDecimal } from '../../utils/money.js';
import { CartService, CartValidationError } from '../cart/cart.service.js';
import type { CartContext } from '../cart/utils/cart-context.js';
import { serializeLine, serializeTotals } from '../cart/utils/pricing.js';
import type { CheckoutDto } from './dto/index.js';
import { decrementInventory, InventoryError } from './utils/inventory.js';
import { generateOrderNumber } from './utils/order-number.js';
import logger from '../../utils/logger.js';

function mapPaymentStatus(method: PaymentMethod): PaymentStatus {
  const map: Record<PaymentMethod, PaymentStatus> = {
    cod: 'pending_cod',
    bkash: 'pending_bkash',
    nagad: 'pending_nagad',
    rocket: 'pending_rocket',
    card: 'pending_card',
    bank_transfer: 'pending',
  };
  return map[method] ?? 'pending';
}

function buildLegacyItems(lines: ReturnType<typeof serializeLine>[]) {
  return lines.map((line) => ({
    product_id: line.productId,
    name: line.name,
    variant: line.variant,
    price: line.unitPrice,
    quantity: line.quantity,
    image: line.image,
  }));
}

export class CheckoutService {
  constructor(private cartService: CartService) {}

  async validateCheckout(context: CartContext) {
    const cart = await this.cartService.getOrCreateCart(context);
    await this.cartService.assertCartOwnership(cart.id, context);
    const validated = await this.cartService.validateCartForCheckout(cart.id);

    return {
      valid: true,
      cartId: cart.id,
      cartToken: cart.cartToken,
      itemCount: validated.lines.length,
      totals: serializeTotals(validated.totals),
    };
  }

  async checkout(context: CartContext, data: CheckoutDto) {
    const cart = await this.cartService.getOrCreateCart(context);
    await this.cartService.assertCartOwnership(cart.id, context);

    const { lines, coupon, totals } = await this.cartService.validateCartForCheckout(cart.id);

    let shippingCost = toDecimal(data.shippingCost ?? decimalToNumber(totals.shipping));

    if (data.deliveryZoneId) {
      const zone = await prisma.deliveryZone.findFirst({
        where: { id: data.deliveryZoneId, enabled: true },
      });
      if (!zone) {
        throw new CartValidationError('Invalid delivery zone', 'INVALID_DELIVERY_ZONE');
      }
      shippingCost = zone.deliveryCharge;
    }

    const finalTotals = {
      ...totals,
      shipping: shippingCost,
      total: totals.subtotal.plus(shippingCost).minus(totals.couponDiscount),
    };

    const orderNumber = generateOrderNumber();
    const serializedLines = lines.map(serializeLine);
    const legacyItems = buildLegacyItems(serializedLines);

    const shippingSnapshot = {
      ...data.shippingAddress,
      deliveryZoneId: data.deliveryZoneId ?? null,
      shippingCost: decimalToNumber(shippingCost),
      estimatedDays: data.deliveryZoneId
        ? (
            await prisma.deliveryZone.findUnique({
              where: { id: data.deliveryZoneId },
              select: { estimatedDays: true, zoneName: true, name: true },
            })
          )?.estimatedDays
        : null,
    };

    const pricingSnapshot = {
      subtotal: decimalToNumber(finalTotals.subtotal),
      productDiscount: decimalToNumber(finalTotals.productDiscount),
      couponDiscount: decimalToNumber(finalTotals.couponDiscount),
      discountTotal: decimalToNumber(finalTotals.discountTotal),
      shipping: decimalToNumber(shippingCost),
      total: decimalToNumber(finalTotals.total),
      currency: 'BDT',
    };

    const couponSnapshot = coupon
      ? {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: decimalToNumber(coupon.discountValue),
          appliedAmount: decimalToNumber(finalTotals.couponDiscount),
        }
      : null;

    const paymentStatus = mapPaymentStatus(data.paymentMethod);

    try {
      const order = await prisma.$transaction(async (tx) => {
        await decrementInventory(tx, lines);

        let customer = await tx.customer.findFirst({
          where: { phone: data.customerPhone },
        });

        if (customer) {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: {
              name: data.customerName,
              email: data.customerEmail || undefined,
              address: data.customerAddress,
              city: data.customerCity ?? undefined,
              totalOrders: { increment: 1 },
              totalSpent: { increment: finalTotals.total },
            },
          });
        } else {
          customer = await tx.customer.create({
            data: {
              name: data.customerName,
              email: data.customerEmail || null,
              phone: data.customerPhone,
              address: data.customerAddress,
              city: data.customerCity ?? null,
              totalOrders: 1,
              totalSpent: finalTotals.total,
            },
          });
        }

        const created = await tx.order.create({
          data: {
            orderNumber,
            profileId: context.profileId,
            cartId: cart.id,
            customerId: customer.id,
            customerName: data.customerName,
            customerEmail: data.customerEmail || null,
            customerPhone: data.customerPhone,
            customerAddress: data.customerAddress,
            customerCity: data.customerCity ?? null,
            items: legacyItems,
            subtotal: finalTotals.subtotal,
            shippingCost,
            discountAmount: finalTotals.discountTotal,
            total: finalTotals.total,
            couponCode: coupon?.code ?? null,
            couponSnapshot: couponSnapshot ?? undefined,
            pricingSnapshot,
            shippingSnapshot,
            paymentMethod: data.paymentMethod,
            paymentStatus,
            paymentProvider: data.paymentProvider ?? null,
            orderStatus: 'pending',
            fulfillmentStatus: 'unfulfilled',
            shippingAddress: data.shippingAddress,
            billingAddress: data.billingAddress ?? data.shippingAddress,
            notes: data.notes ?? null,
            refundStatus: 'none',
          },
        });

        for (const line of lines) {
          await tx.orderItem.create({
            data: {
              orderId: created.id,
              productId: line.productId,
              variantId: line.variantId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal: line.lineTotal,
              productSnapshot: {
                id: line.productId,
                name: line.name,
                slug: line.slug,
                sku: line.sku,
                image: line.imageUrl,
                variant: line.variantLabel,
                productStatus: line.productStatus,
              },
              pricingSnapshot: {
                unitPrice: decimalToNumber(line.unitPrice),
                compareAtPrice: line.compareAtPrice ? decimalToNumber(line.compareAtPrice) : null,
                lineSubtotal: decimalToNumber(line.lineSubtotal),
                lineDiscount: decimalToNumber(line.lineDiscount),
                lineTotal: decimalToNumber(line.lineTotal),
                quantity: line.quantity,
              },
            },
          });
        }

        if (coupon) {
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.cart.update({
          where: { id: cart.id },
          data: { couponCode: null },
        });

        return created;
      });

      logger.info(`Order created: ${order.orderNumber}`);

      return convertDecimalToNumber({
        id: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        total: order.total,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        discountAmount: order.discountAmount,
        couponCode: order.couponCode,
        paymentMethod: order.paymentMethod,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        items: order.items,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        pricingSnapshot: order.pricingSnapshot,
        couponSnapshot: order.couponSnapshot,
        shippingSnapshot: order.shippingSnapshot,
        createdAt: order.createdAt,
      });
    } catch (error) {
      if (error instanceof InventoryError) {
        throw new CartValidationError(error.message, error.code, 409);
      }
      logger.error({ msg: 'Checkout transaction failed', error });
      throw error;
    }
  }
}
