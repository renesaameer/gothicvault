import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import { optionalAuthenticate } from '../auth/middleware/optional-auth.middleware.js';
import { generalRateLimit } from '../auth/middleware/rate-limit.middleware.js';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';
import { cartResponseSchema, errorResponseSchema } from './utils/swagger-schemas.js';

export async function cartRoutes(fastify: FastifyInstance) {
  const cartService = new CartService();
  const cartController = new CartController(cartService);

  fastify.post('/cart/token', {
    preHandler: [generalRateLimit()],
    schema: {
      tags: ['Cart'],
      summary: 'Create guest cart token',
      response: {
        200: {
          type: 'object',
          properties: { cartToken: { type: 'string' } },
        },
      },
    },
    handler: cartController.createGuestToken.bind(cartController),
  });

  fastify.get('/cart', {
    preHandler: [optionalAuthenticate, generalRateLimit()],
    schema: {
      tags: ['Cart'],
      summary: 'Get current cart',
      headers: {
        type: 'object',
        properties: {
          'x-cart-token': { type: 'string' },
          authorization: { type: 'string' },
        },
      },
      response: { 200: cartResponseSchema, 400: errorResponseSchema },
    },
    handler: cartController.getCart.bind(cartController),
  });

  fastify.post('/cart/items', {
    preHandler: [optionalAuthenticate, generalRateLimit()],
    schema: {
      tags: ['Cart'],
      summary: 'Add item to cart',
      headers: {
        type: 'object',
        properties: {
          'x-cart-token': { type: 'string' },
          authorization: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string' },
          variantId: { type: 'string', nullable: true },
          quantity: { type: 'integer', minimum: 1, maximum: 99 },
        },
      },
      response: { 200: cartResponseSchema, 400: errorResponseSchema, 409: errorResponseSchema },
    },
    handler: cartController.addItem.bind(cartController),
  });

  fastify.patch('/cart/items/:itemId', {
    preHandler: [optionalAuthenticate, generalRateLimit()],
    schema: {
      tags: ['Cart'],
      summary: 'Update cart item quantity',
      params: {
        type: 'object',
        required: ['itemId'],
        properties: { itemId: { type: 'string' } },
      },
      body: {
        type: 'object',
        required: ['quantity'],
        properties: { quantity: { type: 'integer', minimum: 0, maximum: 99 } },
      },
      response: { 200: cartResponseSchema, 404: errorResponseSchema },
    },
    handler: cartController.updateItem.bind(cartController),
  });

  fastify.delete('/cart/items/:itemId', {
    preHandler: [optionalAuthenticate, generalRateLimit()],
    schema: {
      tags: ['Cart'],
      summary: 'Remove cart item',
      params: {
        type: 'object',
        required: ['itemId'],
        properties: { itemId: { type: 'string' } },
      },
      response: { 200: cartResponseSchema, 404: errorResponseSchema },
    },
    handler: cartController.removeItem.bind(cartController),
  });

  fastify.delete('/cart', {
    preHandler: [optionalAuthenticate, generalRateLimit()],
    schema: {
      tags: ['Cart'],
      summary: 'Clear cart',
      response: { 200: cartResponseSchema },
    },
    handler: cartController.clearCart.bind(cartController),
  });

  fastify.post('/cart/coupon', {
    preHandler: [optionalAuthenticate, generalRateLimit()],
    schema: {
      tags: ['Cart'],
      summary: 'Apply coupon to cart',
      body: {
        type: 'object',
        required: ['code'],
        properties: { code: { type: 'string' } },
      },
      response: { 200: cartResponseSchema, 400: errorResponseSchema },
    },
    handler: cartController.applyCoupon.bind(cartController),
  });

  fastify.delete('/cart/coupon', {
    preHandler: [optionalAuthenticate, generalRateLimit()],
    schema: {
      tags: ['Cart'],
      summary: 'Remove coupon from cart',
      response: { 200: cartResponseSchema },
    },
    handler: cartController.removeCoupon.bind(cartController),
  });

  fastify.post('/cart/merge', {
    preHandler: [authenticate, generalRateLimit()],
    schema: {
      tags: ['Cart'],
      summary: 'Merge guest cart into authenticated user cart',
      headers: {
        type: 'object',
        properties: {
          'x-cart-token': { type: 'string' },
          authorization: { type: 'string' },
        },
      },
      response: { 200: cartResponseSchema },
    },
    handler: cartController.mergeCart.bind(cartController),
  });
}
