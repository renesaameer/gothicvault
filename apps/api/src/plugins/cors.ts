import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { validateEnv } from '../utils/env.js';

const env = validateEnv();

export default fp(async (fastify, _options) => {
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });
}, {
  name: 'cors-plugin',
});
