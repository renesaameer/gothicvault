import { FastifyInstance } from 'fastify';
import healthRoutes from './health.js';

export default async function routes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes, { prefix: '/api' });
}
