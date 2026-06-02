import { FastifyInstance } from 'fastify';
import { AnalyticsService } from './analytics.service.js';
import { AnalyticsController } from './analytics.controller.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import { requireStaff } from '../auth/middleware/role.middleware.js';
import { generalRateLimit } from '../auth/middleware/rate-limit.middleware.js';

export async function analyticsRoutes(fastify: FastifyInstance) {
  const analyticsService = new AnalyticsService();
  const analyticsController = new AnalyticsController(analyticsService);

  // Get sales stats (admin/staff only)
  fastify.get('/analytics/sales', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: analyticsController.getSalesStats.bind(analyticsController),
  });

  // Get order stats (admin/staff only)
  fastify.get('/analytics/orders', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: analyticsController.getOrderStats.bind(analyticsController),
  });

  // Get top products (admin/staff only)
  fastify.get('/analytics/top-products', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: analyticsController.getTopProducts.bind(analyticsController),
  });

  // Get recent orders (admin/staff only)
  fastify.get('/analytics/recent-orders', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: analyticsController.getRecentOrders.bind(analyticsController),
  });

  // Get dashboard stats (admin/staff only)
  fastify.get('/analytics/dashboard', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: analyticsController.getDashboardStats.bind(analyticsController),
  });
}
