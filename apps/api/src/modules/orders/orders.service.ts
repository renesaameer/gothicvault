import type { Prisma } from '@prisma/client';
import prisma from '../../utils/prisma.js';
import { convertDecimalToNumber } from '../../utils/decimal.js';
import { restoreInventory } from '../checkout/utils/inventory.js';
import type { OrderQueryDto, RefundPlaceholderDto, UpdateOrderStatusDto } from './dto/index.js';
import { buildInvoice } from './utils/invoice.js';
import logger from '../../utils/logger.js';

export class OrderError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = 'OrderError';
  }
}

export class OrdersService {
  private orderInclude = {
    orderItems: true,
    customer: true,
  } as const;

  async getOrderById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: this.orderInclude,
    });

    if (!order) {
      throw new OrderError('Order not found', 'ORDER_NOT_FOUND', 404);
    }

    return convertDecimalToNumber(order);
  }

  async getOrderByNumber(orderNumber: string) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: this.orderInclude,
    });

    if (!order) {
      throw new OrderError('Order not found', 'ORDER_NOT_FOUND', 404);
    }

    return convertDecimalToNumber(order);
  }

  async assertOrderAccess(orderId: string, profileId: string | null, isStaff: boolean) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, profileId: true, customerPhone: true },
    });

    if (!order) {
      throw new OrderError('Order not found', 'ORDER_NOT_FOUND', 404);
    }

    if (isStaff) return order;

    if (!profileId || order.profileId !== profileId) {
      throw new OrderError('Order access denied', 'ORDER_FORBIDDEN', 403);
    }

    return order;
  }

  async getUserOrders(profileId: string, query: OrderQueryDto) {
    const where: Prisma.OrderWhereInput = { profileId };
    if (query.orderStatus) where.orderStatus = query.orderStatus;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.fulfillmentStatus) where.fulfillmentStatus = query.fulfillmentStatus;

    const skip = (query.page - 1) * query.limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: this.orderInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: convertDecimalToNumber(orders),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getAllOrders(query: OrderQueryDto) {
    const where: Prisma.OrderWhereInput = {};

    if (query.orderStatus) where.orderStatus = query.orderStatus;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.fulfillmentStatus) where.fulfillmentStatus = query.fulfillmentStatus;

    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { customerPhone: { contains: query.search } },
        { customerEmail: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: this.orderInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: convertDecimalToNumber(orders),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async updateOrderStatus(orderId: string, data: UpdateOrderStatusDto) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(data.orderStatus && { orderStatus: data.orderStatus }),
        ...(data.paymentStatus && { paymentStatus: data.paymentStatus }),
        ...(data.fulfillmentStatus && { fulfillmentStatus: data.fulfillmentStatus }),
        ...(data.trackingNumber !== undefined && { trackingNumber: data.trackingNumber }),
        ...(data.deliveryPartner !== undefined && { deliveryPartner: data.deliveryPartner }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: this.orderInclude,
    });

    return convertDecimalToNumber(order);
  }

  async cancelOrder(orderId: string) {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!existing) {
      throw new OrderError('Order not found', 'ORDER_NOT_FOUND', 404);
    }

    if (existing.orderStatus === 'cancelled') {
      throw new OrderError('Order is already cancelled', 'ORDER_ALREADY_CANCELLED');
    }

    if (['shipped', 'delivered'].includes(existing.orderStatus)) {
      throw new OrderError('Cannot cancel shipped or delivered order', 'ORDER_NOT_CANCELLABLE', 409);
    }

    const order = await prisma.$transaction(async (tx) => {
      await restoreInventory(
        tx,
        existing.orderItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      );

      return tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: 'cancelled',
          fulfillmentStatus: 'cancelled',
          cancelledAt: new Date(),
        },
        include: { orderItems: true, customer: true },
      });
    });

    logger.info(`Order cancelled: ${order.orderNumber}`);
    return convertDecimalToNumber(order);
  }

  async createRefundPlaceholder(orderId: string, data: RefundPlaceholderDto) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new OrderError('Order not found', 'ORDER_NOT_FOUND', 404);
    }

    const refundSnapshot = {
      status: 'pending',
      provider: data.provider,
      amount: data.amount ?? null,
      reason: data.reason ?? null,
      requestedAt: new Date().toISOString(),
      externalRefundId: null,
      note: 'Refund gateway integration pending (Stripe/bKash/SSLCommerz)',
    };

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        refundStatus: 'pending',
        refundSnapshot,
        paymentStatus: order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus,
      },
      include: this.orderInclude,
    });

    return convertDecimalToNumber(updated);
  }

  async getInvoice(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) {
      throw new OrderError('Order not found', 'ORDER_NOT_FOUND', 404);
    }

    const invoiceSettings = await prisma.invoiceSettings.findFirst();

    return buildInvoice(order, order.orderItems, {
      storeName: invoiceSettings?.storeName,
      storeAddress: invoiceSettings?.storeAddress,
      storePhone: invoiceSettings?.storePhone,
      storeEmail: invoiceSettings?.storeEmail,
      logoUrl: invoiceSettings?.logoUrl,
    });
  }
}
