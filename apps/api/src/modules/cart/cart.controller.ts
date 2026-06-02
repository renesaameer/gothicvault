import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import logger from '../../utils/logger.js';
import { CartService, CartValidationError } from './cart.service.js';
import { addToCartSchema, applyCouponSchema, updateCartItemSchema } from './dto/index.js';
import { buildCartContext } from './utils/cart-context.js';

export class CartController {
  constructor(private cartService: CartService) {}

  private handleError(error: unknown, reply: FastifyReply) {
    if (error instanceof ZodError) {
      reply.status(400).send({ error: 'Validation error', details: error.errors });
      return;
    }

    if (error instanceof CartValidationError) {
      reply.status(error.statusCode).send({ error: error.message, code: error.code });
      return;
    }

    logger.error({ msg: 'Cart controller error', error });
    reply.status(500).send({ error: 'Internal server error' });
  }

  async getCart(request: FastifyRequest, reply: FastifyReply) {
    try {
      const context = await buildCartContext(request);
      const cart = await this.cartService.getCart(context);
      reply.header('x-cart-token', cart.cartToken);
      reply.send(cart);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async addItem(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = addToCartSchema.parse(request.body);
      const context = await buildCartContext(request);
      const cart = await this.cartService.addItem(context, data);
      reply.header('x-cart-token', cart.cartToken);
      reply.send(cart);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async updateItem(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { itemId } = request.params as { itemId: string };
      const data = updateCartItemSchema.parse(request.body);
      const context = await buildCartContext(request);
      const cart = await this.cartService.updateItem(context, itemId, data);
      reply.header('x-cart-token', cart.cartToken);
      reply.send(cart);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async removeItem(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { itemId } = request.params as { itemId: string };
      const context = await buildCartContext(request);
      const cart = await this.cartService.removeItem(context, itemId);
      reply.header('x-cart-token', cart.cartToken);
      reply.send(cart);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async clearCart(request: FastifyRequest, reply: FastifyReply) {
    try {
      const context = await buildCartContext(request);
      const cart = await this.cartService.clearCart(context);
      reply.header('x-cart-token', cart.cartToken);
      reply.send(cart);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async applyCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = applyCouponSchema.parse(request.body);
      const context = await buildCartContext(request);
      const cart = await this.cartService.applyCoupon(context, data);
      reply.header('x-cart-token', cart.cartToken);
      reply.send(cart);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async removeCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const context = await buildCartContext(request);
      const cart = await this.cartService.removeCoupon(context);
      reply.header('x-cart-token', cart.cartToken);
      reply.send(cart);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async createGuestToken(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.cartService.createGuestToken();
      reply.send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async mergeCart(request: FastifyRequest, reply: FastifyReply) {
    try {
      const context = await buildCartContext(request);
      if (!context.profileId) {
        reply.status(401).send({ error: 'Unauthorized' });
        return;
      }
      const cart = await this.cartService.mergeGuestCartOnLogin(
        context.profileId,
        context.cartToken,
      );
      const response = await this.cartService.buildCartResponse(cart!);
      reply.header('x-cart-token', response.cartToken);
      reply.send(response);
    } catch (error) {
      this.handleError(error, reply);
    }
  }
}
