import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { validateEnv } from '../utils/env.js';

const env = validateEnv();

// Parse CORS origins from environment variable
// Supports comma-separated list of origins or a single origin
const corsOrigins = env.CORS_ORIGIN.split(',').map(origin => origin.trim());

export default fp(async (fastify, _options) => {
  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin is in the allowed list
      if (corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400, // 24 hours for preflight caching
  });
}, {
  name: 'cors-plugin',
});
