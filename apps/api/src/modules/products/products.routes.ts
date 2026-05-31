import { FastifyInstance } from 'fastify';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import { requireStaff } from '../auth/middleware/role.middleware.js';
import { generalRateLimit } from '../auth/middleware/rate-limit.middleware.js';

export async function productsRoutes(fastify: FastifyInstance) {
  const productsService = new ProductsService();
  const productsController = new ProductsController(productsService);

  // Get all products (public)
  fastify.get('/products', {
    preHandler: [generalRateLimit()],
    handler: productsController.getAllProducts.bind(productsController),
  });

  // Get featured products (public)
  fastify.get('/products/featured', {
    preHandler: [generalRateLimit()],
    handler: productsController.getFeaturedProducts.bind(productsController),
  });

  // Get product by ID (public)
  fastify.get('/products/:id', {
    preHandler: [generalRateLimit()],
    handler: productsController.getProductById.bind(productsController),
  });

  // Get product by slug (public)
  fastify.get('/products/slug/:slug', {
    preHandler: [generalRateLimit()],
    handler: productsController.getProductBySlug.bind(productsController),
  });

  // Get related products (public)
  fastify.get('/products/:id/related', {
    preHandler: [generalRateLimit()],
    handler: productsController.getRelatedProducts.bind(productsController),
  });

  // Create product (admin/staff only)
  fastify.post('/products', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: productsController.createProduct.bind(productsController),
  });

  // Update product (admin/staff only)
  fastify.put('/products/:id', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: productsController.updateProduct.bind(productsController),
  });

  // Delete product (admin/staff only)
  fastify.delete('/products/:id', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: productsController.deleteProduct.bind(productsController),
  });
}
