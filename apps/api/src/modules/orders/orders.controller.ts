import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import logger from '../../utils/logger.js';
import type { AuthenticatedUser } from '../auth/middleware/auth.middleware.js';
import { resolveProfileId } from '../cart/utils/cart-context.js';
import { orderQuerySchema, refundPlaceholderSchema, updateOrderStatusSchema } from './dto/index.js';
import { OrderError, OrdersService } from './orders.service.js';

export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  private handleError(error: unknown, reply: FastifyReply) {
    if (error instanceof ZodError) {
      reply.status(400).send({ error: 'Validation error', details: error.errors });
      return;
    }

    if (error instanceof OrderError) {
      reply.status(error.statusCode).send({ error: error.message, code: error.code });
      return;
    }

    logger.error({ msg: 'Orders controller error', error });
    reply.status(500).send({ error: 'Internal server error' });
  }

  private isStaff(user?: AuthenticatedUser) {
    return Boolean(user?.roles?.some((role) => role === 'admin' || role === 'staff'));
  }

  async getMyOrders(request: FastifyRequest, reply: FastifyReply) {
    try {
      const profileId = await resolveProfileId(request);
      if (!profileId) {
        reply.status(401).send({ error: 'Unauthorized' });
        return;
      }

      const query = orderQuerySchema.parse(request.query);
      const result = await this.ordersService.getUserOrders(profileId, query);
      reply.send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async getOrderById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { orderId } = request.params as { orderId: string };
      const user = (request as FastifyRequest & { user?: AuthenticatedUser }).user;
      const profileId = await resolveProfileId(request);
      const staff = this.isStaff(user);

      await this.ordersService.assertOrderAccess(orderId, profileId, staff);
      const order = await this.ordersService.getOrderById(orderId);
      reply.send({ order });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async getOrderByNumber(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { orderNumber } = request.params as { orderNumber: string };
      const order = await this.ordersService.getOrderByNumber(orderNumber);
      reply.send({ order });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async getAllOrders(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = orderQuerySchema.parse(request.query);
      const result = await this.ordersService.getAllOrders(query);
      reply.send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async updateOrderStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { orderId } = request.params as { orderId: string };
      const data = updateOrderStatusSchema.parse(request.body);
      const order = await this.ordersService.updateOrderStatus(orderId, data);
      reply.send({ order });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async cancelOrder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { orderId } = request.params as { orderId: string };
      const user = (request as FastifyRequest & { user?: AuthenticatedUser }).user;
      const profileId = await resolveProfileId(request);
      const staff = this.isStaff(user);

      await this.ordersService.assertOrderAccess(orderId, profileId, staff);
      const order = await this.ordersService.cancelOrder(orderId);
      reply.send({ order });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async createRefundPlaceholder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { orderId } = request.params as { orderId: string };
      const data = refundPlaceholderSchema.parse(request.body);
      const order = await this.ordersService.createRefundPlaceholder(orderId, data);
      reply.send({ order });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async getInvoice(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { orderId } = request.params as { orderId: string };
      const user = (request as FastifyRequest & { user?: AuthenticatedUser }).user;
      const profileId = await resolveProfileId(request);
      const staff = this.isStaff(user);

      await this.ordersService.assertOrderAccess(orderId, profileId, staff);
      const invoice = await this.ordersService.getInvoice(orderId);
      reply.send({ invoice });
    } catch (error) {
      this.handleError(error, reply);
    }
  }
}
