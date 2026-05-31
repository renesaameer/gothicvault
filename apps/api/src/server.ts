import 'dotenv/config';
import Fastify from 'fastify';
import { validateEnv } from './utils/env.js';
import logger from './utils/logger.js';
import { plugins } from './plugins/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';

const env = validateEnv();

const fastify = Fastify({
  logger: false,
});

async function startServer() {
  try {
    // Register plugins
    for (const plugin of plugins) {
      await fastify.register(plugin);
    }

    // Register error handler
    fastify.setErrorHandler(errorHandler);

    // Register routes
    await fastify.register(routes);

    // Start server
    await fastify.listen({ port: env.PORT, host: env.HOST });
    
    logger.info(`🚀 Server listening on http://${env.HOST}:${env.PORT}`);
    logger.info(`📚 API Documentation: http://${env.HOST}:${env.PORT}/docs`);
  } catch (error) {
    logger.error({ msg: 'Failed to start server', error });
    process.exit(1);
  }
}

startServer();
