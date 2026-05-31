import 'dotenv/config';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateEnv } from './utils/env.js';
import logger from './utils/logger.js';
import { plugins } from './plugins/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = validateEnv();

const fastify = Fastify({
  logger: false,
});

async function startServer() {
  try {
    // Register multipart support
    await fastify.register(multipart, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    });

    // Register static file serving
    await fastify.register(fastifyStatic, {
      root: path.join(__dirname, '../uploads'),
      prefix: '/uploads/',
    });

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
