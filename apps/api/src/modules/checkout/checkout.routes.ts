import { FastifyInstance } from 'fastify';
import { optionalAuthenticate } from '../auth/middleware/optional-auth.middleware.js';
import { checkoutRateLimit, generalRateLimit } from '../auth/middleware/rate-limit.middleware.js';
import { CartService } from '../cart/cart.service.js';
import { errorResponseSchema } from '../cart/utils/swagger-schemas.js';
import { CheckoutController } from './checkout.controller.js';
import { CheckoutService } from './checkout.service.js';

export async function checkoutRoutes(fastify: FastifyInstance) {
  const cartService = new CartService();
  const checkoutService = new CheckoutService(cartService);
  const checkoutController = new CheckoutController(checkoutService);

  fastify.post('/checkout/validate', {
    preHandler: [optionalAuthenticate, generalRateLimit()],
    schema: {
      tags: ['Checkout'],
      summary: 'Validate cart before checkout',
      headers: {
        type: 'object',
        properties: {
          'x-cart-token': { type: 'string' },
          authorization: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            cartId: { type: 'string' },
            cartToken: { type: 'string' },
            itemCount: { type: 'number' },
            totals: { type: 'object', additionalProperties: true },
          },
        },
        400: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
    handler: checkoutController.validate.bind(checkoutController),
  });

  fastify.post('/checkout', {
    preHandler: [optionalAuthenticate, checkoutRateLimit()],
    schema: {
      tags: ['Checkout'],
      summary: 'Create order from cart (guest or authenticated)',
      headers: {
        type: 'object',
        properties: {
          'x-cart-token': { type: 'string' },
          authorization: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['customerName', 'customerPhone', 'customerAddress', 'shippingAddress', 'paymentMethod'],
        properties: {
          customerName: { type: 'string' },
          customerEmail: { type: 'string' },
          customerPhone: { type: 'string' },
          customerAddress: { type: 'string' },
          customerCity: { type: 'string' },
          shippingAddress: { type: 'object', additionalProperties: true },
          billingAddress: { type: 'object', additionalProperties: true },
          paymentMethod: {
            type: 'string',
            enum: ['cod', 'bkash', 'nagad', 'rocket', 'card', 'bank_transfer'],
          },
          deliveryZoneId: { type: 'string' },
          shippingCost: { type: 'number' },
          notes: { type: 'string' },
          paymentProvider: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            order: { type: 'object', additionalProperties: true },
          },
        },
        400: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
    handler: checkoutController.checkout.bind(checkoutController),
  });
}
