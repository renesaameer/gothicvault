import prisma from '../../utils/prisma.js';
import { convertDecimalToNumber } from '../../utils/decimal.js';
import { toDecimal } from '../../utils/money.js';
import type { AddToCartDto, ApplyCouponDto, UpdateCartItemDto } from './dto/index.js';
import type { CartContext } from './utils/cart-context.js';
import { generateCartToken } from './utils/cart-context.js';
import {
  calculateCartTotals,
  defaultShippingPlaceholder,
  priceLineItem,
  serializeLine,
  serializeTotals,
  validateCouponForCart,
  type PricedLineItem,
} from './utils/pricing.js';
import { CartValidationError, validateLineForCart } from './utils/validation.js';
const CART_TTL_DAYS = 30;

export class CartService {
  private cartInclude = {
    items: {
      include: {
        product: {
          include: {
            media: { where: { variantId: null }, orderBy: { sortOrder: 'asc' as const }, take: 1 },
          },
        },
        variant: true,
      },
    },
  } as const;

  async getOrCreateCart(context: CartContext) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CART_TTL_DAYS);

    if (context.profileId) {
      let cart = await prisma.cart.findFirst({
        where: { profileId: context.profileId },
        include: this.cartInclude,
      });

      if (cart) {
        if (cart.cartToken !== context.cartToken) {
          cart = await prisma.cart.update({
            where: { id: cart.id },
            data: { cartToken: context.cartToken, expiresAt },
            include: this.cartInclude,
          });
        }
        return cart;
      }

      return prisma.cart.create({
        data: {
          profileId: context.profileId,
          cartToken: context.cartToken,
          expiresAt,
        },
        include: this.cartInclude,
      });
    }

    let cart = await prisma.cart.findUnique({
      where: { cartToken: context.cartToken },
      include: this.cartInclude,
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          cartToken: context.cartToken,
          expiresAt,
        },
        include: this.cartInclude,
      });
    }

    return cart;
  }

  async mergeGuestCartOnLogin(profileId: string, cartToken: string) {
    const guestCart = await prisma.cart.findUnique({
      where: { cartToken },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreateCart({ profileId, cartToken, isAuthenticated: true });
    }

    const userCart = await prisma.cart.findFirst({ where: { profileId } });

    if (!userCart) {
      return prisma.cart.update({
        where: { id: guestCart.id },
        data: { profileId },
        include: this.cartInclude,
      });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of guestCart.items) {
        const existing = await tx.cartItem.findFirst({
          where: {
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId,
          },
        });

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            },
          });
        }
      }

      await tx.cart.delete({ where: { id: guestCart.id } });
    });

    return prisma.cart.findUnique({
      where: { id: userCart.id },
      include: this.cartInclude,
    });
  }

  private async loadProductLine(productId: string, variantId?: string | null) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new CartValidationError('Product not found', 'PRODUCT_NOT_FOUND', 404);
    }

    let variant = null;
    if (variantId) {
      variant = await prisma.productVariant.findFirst({
        where: { id: variantId, productId },
      });
      if (!variant) {
        throw new CartValidationError('Variant not found', 'VARIANT_NOT_FOUND', 404);
      }
    }

    return { product, variant };
  }

  private buildLinesFromCart(cart: Awaited<ReturnType<typeof this.getOrCreateCart>>): PricedLineItem[] {
    return (cart?.items ?? []).map((item) =>
      priceLineItem({
        product: item.product,
        variant: item.variant,
        quantity: item.quantity,
        imageUrl: item.product.media[0]?.imageUrl ?? item.variant?.imageUrl ?? null,
      }),
    );
  }

  private async resolveCouponDiscount(couponCode: string | null | undefined, subtotal: ReturnType<typeof toDecimal>) {
    if (!couponCode) {
      return { coupon: null, couponDiscount: toDecimal(0) };
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (!coupon) {
      throw new CartValidationError('Invalid coupon code', 'INVALID_COUPON');
    }

    const validation = validateCouponForCart(coupon, subtotal);
    if (!validation.valid) {
      throw new CartValidationError(validation.error ?? 'Invalid coupon', validation.error ?? 'INVALID_COUPON');
    }

    return {
      coupon,
      couponDiscount: validation.discountAmount ?? toDecimal(0),
    };
  }

  async buildCartResponse(cart: NonNullable<Awaited<ReturnType<typeof this.getOrCreateCart>>>) {
    const lines = this.buildLinesFromCart(cart);
    const subtotal = lines.reduce((sum, line) => sum.add(line.lineSubtotal), toDecimal(0));

    let couponInfo = null;
    let couponDiscount = toDecimal(0);

    if (cart.couponCode) {
      try {
        const resolved = await this.resolveCouponDiscount(cart.couponCode, subtotal);
        couponDiscount = resolved.couponDiscount;
        if (resolved.coupon) {
          couponInfo = {
            code: resolved.coupon.code,
            discountType: resolved.coupon.discountType,
            discountValue: convertDecimalToNumber(resolved.coupon.discountValue),
            discountAmount: convertDecimalToNumber(couponDiscount),
          };
        }
      } catch {
        await prisma.cart.update({
          where: { id: cart.id },
          data: { couponCode: null },
        });
      }
    }

    const shipping = defaultShippingPlaceholder(subtotal);
    const totals = calculateCartTotals(lines, couponDiscount, shipping);

    return {
      cartToken: cart.cartToken,
      coupon: couponInfo,
      items: lines.map((line) => ({
        id: cart.items.find(
          (i) => i.productId === line.productId && (i.variantId ?? null) === line.variantId,
        )?.id,
        ...serializeLine(line),
      })),
      totals: serializeTotals(totals),
      itemCount: lines.reduce((count, line) => count + line.quantity, 0),
    };
  }

  async getCart(context: CartContext) {
    const cart = await this.getOrCreateCart(context);
    return this.buildCartResponse(cart);
  }

  async addItem(context: CartContext, data: AddToCartDto) {
    const { product, variant } = await this.loadProductLine(data.productId, data.variantId ?? null);
    const preview = priceLineItem({ product, variant, quantity: data.quantity });
    validateLineForCart(preview, data.quantity);

    const cart = await this.getOrCreateCart(context);

    const existing = cart.items.find(
      (item) =>
        item.productId === data.productId && (item.variantId ?? null) === (data.variantId ?? null),
    );

    if (existing) {
      const newQuantity = existing.quantity + data.quantity;
      validateLineForCart(preview, newQuantity);
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: data.productId,
          variantId: data.variantId ?? null,
          quantity: data.quantity,
        },
      });
    }

    const updated = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: this.cartInclude,
    });

    return this.buildCartResponse(updated!);
  }

  async updateItem(context: CartContext, itemId: string, data: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(context);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new CartValidationError('Cart item not found', 'CART_ITEM_NOT_FOUND', 404);
    }

    if (data.quantity === 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      const line = priceLineItem({
        product: item.product,
        variant: item.variant,
        quantity: data.quantity,
      });
      validateLineForCart(line, data.quantity);
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: data.quantity },
      });
    }

    const updated = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: this.cartInclude,
    });

    return this.buildCartResponse(updated!);
  }

  async removeItem(context: CartContext, itemId: string) {
    const cart = await this.getOrCreateCart(context);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new CartValidationError('Cart item not found', 'CART_ITEM_NOT_FOUND', 404);
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    const updated = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: this.cartInclude,
    });

    return this.buildCartResponse(updated!);
  }

  async clearCart(context: CartContext) {
    const cart = await this.getOrCreateCart(context);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: null },
    });

    return this.buildCartResponse({
      ...cart,
      items: [],
      couponCode: null,
    });
  }

  async applyCoupon(context: CartContext, data: ApplyCouponDto) {
    const cart = await this.getOrCreateCart(context);
    const lines = this.buildLinesFromCart(cart);

    if (lines.length === 0) {
      throw new CartValidationError('Cart is empty', 'CART_EMPTY');
    }

    const subtotal = lines.reduce((sum, line) => sum.add(line.lineSubtotal), toDecimal(0));
    const code = data.code.trim().toUpperCase();
    await this.resolveCouponDiscount(code, subtotal);

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: code },
    });

    const updated = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: this.cartInclude,
    });

    return this.buildCartResponse(updated!);
  }

  async removeCoupon(context: CartContext) {
    const cart = await this.getOrCreateCart(context);
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: null },
    });

    const updated = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: this.cartInclude,
    });

    return this.buildCartResponse(updated!);
  }

  async validateCartForCheckout(cartId: string) {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: this.cartInclude,
    });

    if (!cart) {
      throw new CartValidationError('Cart not found', 'CART_NOT_FOUND', 404);
    }

    const lines = this.buildLinesFromCart(cart);
    for (const line of lines) {
      validateLineForCart(line);
    }

    const subtotal = lines.reduce((sum, line) => sum.add(line.lineSubtotal), toDecimal(0));
    const { coupon, couponDiscount } = await this.resolveCouponDiscount(cart.couponCode, subtotal);
    const shipping = defaultShippingPlaceholder(subtotal);
    const totals = calculateCartTotals(lines, couponDiscount, shipping);

    return { cart, lines, coupon, totals };
  }

  async getCartById(cartId: string) {
    return prisma.cart.findUnique({
      where: { id: cartId },
      include: this.cartInclude,
    });
  }

  async assertCartOwnership(cartId: string, context: CartContext) {
    const cart = await this.getCartById(cartId);
    if (!cart) {
      throw new CartValidationError('Cart not found', 'CART_NOT_FOUND', 404);
    }

    if (context.profileId && cart.profileId && cart.profileId !== context.profileId) {
      throw new CartValidationError('Cart access denied', 'CART_FORBIDDEN', 403);
    }

    if (!context.profileId && cart.cartToken !== context.cartToken) {
      throw new CartValidationError('Cart access denied', 'CART_FORBIDDEN', 403);
    }

    return cart;
  }

  async createGuestToken() {
    return { cartToken: generateCartToken() };
  }
}

export { CartValidationError };
