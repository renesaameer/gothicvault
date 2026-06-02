import Fastify from 'fastify';
import routes from '../src/routes/index.js';
import { errorHandler } from '../src/middleware/error-handler.js';

export async function build() {
  const app = Fastify({
    logger: false,
  });

  app.setErrorHandler(errorHandler);
  await app.register(routes);

  return app;
}
