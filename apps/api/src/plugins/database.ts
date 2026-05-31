import fp from 'fastify-plugin';
import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';

export default fp(async (fastify, _options) => {
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  });

  fastify.decorate('prisma', prisma);
  
  logger.info('Database plugin loaded');
}, {
  name: 'database-plugin',
});
