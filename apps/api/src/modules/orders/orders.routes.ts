import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import { requireAdmin, requireStaff } from '../auth/middleware/role.middleware.js';
import { generalRateLimit } from '../auth/middleware/rate-limit.middleware.js';
import { errorResponseSchema } from '../cart/utils/swagger-schemas.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

const orderObjectSchema = {
  type: 'object',
  additionalProperties: true,
};

export async function ordersRoutes(fastify: FastifyInstance) {
  const ordersService = new OrdersService();
  const ordersController = new OrdersController(ordersService);

  fastify.get('/orders/me', {
    preHandler: [authenticate, generalRateLimit()],
    schema: {
      tags: ['Orders'],
      summary: 'Get authenticated user orders',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          orderStatus: { type: 'string' },
          paymentStatus: { type: 'string' },
          fulfillmentStatus: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: orderObjectSchema },
            pagination: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
    handler: ordersController.getMyOrders.bind(ordersController),
  });

  fastify.get('/orders/number/:orderNumber', {
    preHandler: [generalRateLimit()],
    schema: {
      tags: ['Orders'],
      summary: 'Get order by order number (confirmation page)',
      params: {
        type: 'object',
        required: ['orderNumber'],
        properties: { orderNumber: { type: 'string' } },
      },
      response: { 200: { type: 'object', properties: { order: orderObjectSchema } }, 404: errorResponseSchema },
    },
    handler: ordersController.getOrderByNumber.bind(ordersController),
  });

  fastify.get('/orders/:orderId', {
    preHandler: [authenticate, generalRateLimit()],
    schema: {
      tags: ['Orders'],
      summary: 'Get order details (owner or staff)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['orderId'],
        properties: { orderId: { type: 'string' } },
      },
      response: { 200: { type: 'object', properties: { order: orderObjectSchema } }, 403: errorResponseSchema },
    },
    handler: ordersController.getOrderById.bind(ordersController),
  });

  fastify.get('/orders/:orderId/invoice', {
    preHandler: [authenticate, generalRateLimit()],
    schema: {
      tags: ['Orders'],
      summary: 'Get invoice-ready order payload',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['orderId'],
        properties: { orderId: { type: 'string' } },
      },
      response: { 200: { type: 'object', properties: { invoice: orderObjectSchema } } },
    },
    handler: ordersController.getInvoice.bind(ordersController),
  });

  fastify.get('/admin/orders', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    schema: {
      tags: ['Orders'],
      summary: 'Admin/staff list all orders',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          orderStatus: { type: 'string' },
          paymentStatus: { type: 'string' },
          fulfillmentStatus: { type: 'string' },
          search: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: orderObjectSchema },
            pagination: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
    handler: ordersController.getAllOrders.bind(ordersController),
  });

  fastify.patch('/admin/orders/:orderId', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    schema: {
      tags: ['Orders'],
      summary: 'Update order status fields',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['orderId'],
        properties: { orderId: { type: 'string' } },
      },
      body: { type: 'object', additionalProperties: true },
      response: { 200: { type: 'object', properties: { order: orderObjectSchema } } },
    },
    handler: ordersController.updateOrderStatus.bind(ordersController),
  });

  fastify.post('/orders/:orderId/cancel', {
    preHandler: [authenticate, generalRateLimit()],
    schema: {
      tags: ['Orders'],
      summary: 'Cancel order (owner or staff)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['orderId'],
        properties: { orderId: { type: 'string' } },
      },
      response: { 200: { type: 'object', properties: { order: orderObjectSchema } }, 409: errorResponseSchema },
    },
    handler: ordersController.cancelOrder.bind(ordersController),
  });

  fastify.post('/admin/orders/:orderId/refund', {
    preHandler: [authenticate, requireAdmin(), generalRateLimit()],
    schema: {
      tags: ['Orders'],
      summary: 'Create refund placeholder (payment gateway integration pending)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['orderId'],
        properties: { orderId: { type: 'string' } },
      },
      body: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          reason: { type: 'string' },
          provider: { type: 'string', enum: ['stripe', 'bkash', 'sslcommerz', 'manual'] },
        },
      },
      response: { 200: { type: 'object', properties: { order: orderObjectSchema } } },
    },
    handler: ordersController.createRefundPlaceholder.bind(ordersController),
  });
}
