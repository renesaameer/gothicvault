import { FastifyInstance } from 'fastify';
import healthRoutes from './health.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { productsRoutes } from '../modules/products/products.routes.js';
import { uploadsRoutes } from '../modules/uploads/uploads.routes.js';

export default async function routes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes, { prefix: '/api' });
  await fastify.register(authRoutes, { prefix: '/api' });
  await fastify.register(productsRoutes, { prefix: '/api' });
  await fastify.register(uploadsRoutes, { prefix: '/api' });
}
