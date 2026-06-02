import { Prisma } from '@prisma/client';
import type { PricedLineItem } from '../../cart/utils/pricing.js';

export class InventoryError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'InventoryError';
  }
}

export async function decrementInventory(
  tx: Prisma.TransactionClient,
  lines: PricedLineItem[],
): Promise<void> {
  for (const line of lines) {
    if (line.variantId) {
      const result = await tx.productVariant.updateMany({
        where: {
          id: line.variantId,
          stock: { gte: line.quantity },
          active: true,
        },
        data: { stock: { decrement: line.quantity } },
      });

      if (result.count !== 1) {
        throw new InventoryError(`Insufficient stock for variant ${line.variantId}`, 'INSUFFICIENT_STOCK');
      }
      continue;
    }

    const result = await tx.product.updateMany({
      where: {
        id: line.productId,
        stock: { gte: line.quantity },
        status: 'active',
      },
      data: { stock: { decrement: line.quantity } },
    });

    if (result.count !== 1) {
      throw new InventoryError(`Insufficient stock for product ${line.productId}`, 'INSUFFICIENT_STOCK');
    }
  }
}

export async function restoreInventory(
  tx: Prisma.TransactionClient,
  lines: Array<{ productId: string | null; variantId: string | null; quantity: number }>,
): Promise<void> {
  for (const line of lines) {
    if (line.variantId) {
      await tx.productVariant.update({
        where: { id: line.variantId },
        data: { stock: { increment: line.quantity } },
      });
      continue;
    }

    if (line.productId) {
      await tx.product.update({
        where: { id: line.productId },
        data: { stock: { increment: line.quantity } },
      });
    }
  }
}
