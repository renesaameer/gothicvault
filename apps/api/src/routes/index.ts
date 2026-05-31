import { FastifyInstance } from 'fastify';
import healthRoutes from './health.js';
import { authRoutes } from '../modules/auth/auth.routes.js';

export default async function routes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes, { prefix: '/api' });
  await fastify.register(authRoutes, { prefix: '/api' });
}
