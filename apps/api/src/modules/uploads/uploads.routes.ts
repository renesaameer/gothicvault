import { FastifyInstance } from 'fastify';
import { UploadsService } from './uploads.service.js';
import { UploadsController } from './uploads.controller.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import { requireStaff } from '../auth/middleware/role.middleware.js';
import { generalRateLimit } from '../auth/middleware/rate-limit.middleware.js';

export async function uploadsRoutes(fastify: FastifyInstance) {
  const uploadsService = new UploadsService();
  const uploadsController = new UploadsController(uploadsService);

  // Upload single file (admin/staff only)
  fastify.post('/uploads/single', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: uploadsController.uploadSingle.bind(uploadsController),
  });

  // Upload multiple files (admin/staff only)
  fastify.post('/uploads/multiple', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: uploadsController.uploadMultiple.bind(uploadsController),
  });

  // Delete file (admin/staff only)
  fastify.delete('/uploads', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: uploadsController.deleteFile.bind(uploadsController),
  });

  // Update file (admin/staff only)
  fastify.put('/uploads', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: uploadsController.updateFile.bind(uploadsController),
  });

  // Get product media (public)
  fastify.get('/uploads/product/:productId', {
    preHandler: [generalRateLimit()],
    handler: uploadsController.getProductMedia.bind(uploadsController),
  });

  // Create product media (admin/staff only)
  fastify.post('/uploads/product/:productId', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: uploadsController.createProductMedia.bind(uploadsController),
  });

  // Delete product media (admin/staff only)
  fastify.delete('/uploads/product/:productId/:id', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: uploadsController.deleteProductMedia.bind(uploadsController),
  });
}
