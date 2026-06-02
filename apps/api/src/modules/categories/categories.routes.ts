import { FastifyInstance } from 'fastify';
import { CategoriesService } from './categories.service.js';
import { CategoriesController } from './categories.controller.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import { requireStaff } from '../auth/middleware/role.middleware.js';
import { generalRateLimit } from '../auth/middleware/rate-limit.middleware.js';

export async function categoriesRoutes(fastify: FastifyInstance) {
  const categoriesService = new CategoriesService();
  const categoriesController = new CategoriesController(categoriesService);

  // Get all categories (public)
  fastify.get('/categories', {
    preHandler: [generalRateLimit()],
    handler: categoriesController.getAllCategories.bind(categoriesController),
  });

  // Get category tree (public)
  fastify.get('/categories/tree', {
    preHandler: [generalRateLimit()],
    handler: categoriesController.getCategoryTree.bind(categoriesController),
  });

  // Get category by ID (public)
  fastify.get('/categories/:id', {
    preHandler: [generalRateLimit()],
    handler: categoriesController.getCategoryById.bind(categoriesController),
  });

  // Get category by slug (public)
  fastify.get('/categories/slug/:slug', {
    preHandler: [generalRateLimit()],
    handler: categoriesController.getCategoryBySlug.bind(categoriesController),
  });

  // Create category (admin/staff only)
  fastify.post('/categories', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: categoriesController.createCategory.bind(categoriesController),
  });

  // Update category (admin/staff only)
  fastify.put('/categories/:id', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: categoriesController.updateCategory.bind(categoriesController),
  });

  // Delete category (admin/staff only)
  fastify.delete('/categories/:id', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: categoriesController.deleteCategory.bind(categoriesController),
  });
}
