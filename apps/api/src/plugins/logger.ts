import fp from 'fastify-plugin';
import logger from '../utils/logger.js';

export default fp(async (fastify, _options) => {
  fastify.addHook('onRequest', async (request) => {
    request.log = logger;
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const responseTime = reply.elapsedTime;
    logger.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: `${responseTime.toFixed(2)}ms`,
    });
  });
}, {
  name: 'logger-plugin',
});
