import { FastifyInstance } from 'fastify';
import { HealthResponse } from '../types/index.js';
import prisma from '../utils/prisma.js';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (_request, _reply) => {
    const uptime = process.uptime();
    let databaseStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (error) {
      databaseStatus = 'disconnected';
    }

    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime,
      database: databaseStatus,
    };

    return response;
  });

  fastify.get('/readiness', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    } catch (error) {
      reply.status(503);
      return { status: 'not ready', error: 'Database connection failed' };
    }
  });
}
