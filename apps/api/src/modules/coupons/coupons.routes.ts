import { FastifyInstance } from 'fastify';
import { CouponsService } from './coupons.service.js';
import { CouponsController } from './coupons.controller.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import { requireStaff } from '../auth/middleware/role.middleware.js';
import { generalRateLimit } from '../auth/middleware/rate-limit.middleware.js';

export async function couponsRoutes(fastify: FastifyInstance) {
  const couponsService = new CouponsService();
  const couponsController = new CouponsController(couponsService);

  // Get all coupons (admin/staff only)
  fastify.get('/coupons', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: couponsController.getAllCoupons.bind(couponsController),
  });

  // Get coupon by ID (admin/staff only)
  fastify.get('/coupons/:id', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: couponsController.getCouponById.bind(couponsController),
  });

  // Get coupon by code (admin/staff only)
  fastify.get('/coupons/code/:code', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: couponsController.getCouponByCode.bind(couponsController),
  });

  // Create coupon (admin/staff only)
  fastify.post('/coupons', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: couponsController.createCoupon.bind(couponsController),
  });

  // Update coupon (admin/staff only)
  fastify.put('/coupons/:id', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: couponsController.updateCoupon.bind(couponsController),
  });

  // Toggle coupon status (admin/staff only)
  fastify.patch('/coupons/:id/toggle', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: couponsController.toggleCouponStatus.bind(couponsController),
  });

  // Delete coupon (admin/staff only)
  fastify.delete('/coupons/:id', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: couponsController.deleteCoupon.bind(couponsController),
  });
}
