import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { validateEnv } from '../utils/env.js';

const env = validateEnv();

export default fp(async (fastify, _options) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Gothic Vault API',
        description: 'Backend API for Gothic Vault E-commerce',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${env.HOST}:${env.PORT}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
}, {
  name: 'swagger-plugin',
});
