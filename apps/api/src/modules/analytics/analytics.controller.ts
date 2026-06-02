import { FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsService } from './analytics.service.js';
import logger from '../../utils/logger.js';

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  async getSalesStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;
      
      const stats = await this.analyticsService.getSalesStats(parsedStartDate, parsedEndDate);
      reply.send(stats);
    } catch (error) {
      logger.error({ msg: 'Error in get sales stats controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getOrderStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;
      
      const stats = await this.analyticsService.getOrderStats(parsedStartDate, parsedEndDate);
      reply.send(stats);
    } catch (error) {
      logger.error({ msg: 'Error in get order stats controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getTopProducts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { limit = '10', startDate, endDate } = request.query as { limit?: string; startDate?: string; endDate?: string };
      const parsedLimit = parseInt(limit, 10);
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;
      
      const products = await this.analyticsService.getTopProducts(parsedLimit, parsedStartDate, parsedEndDate);
      reply.send(products);
    } catch (error) {
      logger.error({ msg: 'Error in get top products controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getRecentOrders(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { limit = '10' } = request.query as { limit?: string };
      const parsedLimit = parseInt(limit, 10);
      
      const orders = await this.analyticsService.getRecentOrders(parsedLimit);
      reply.send(orders);
    } catch (error) {
      logger.error({ msg: 'Error in get recent orders controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getDashboardStats(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.analyticsService.getDashboardStats();
      reply.send(stats);
    } catch (error) {
      logger.error({ msg: 'Error in get dashboard stats controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }
}
