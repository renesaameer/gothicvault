import { FastifyInstance } from 'fastify';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { authenticate } from './middleware/auth.middleware.js';
import { loginRateLimit, generalRateLimit } from './middleware/rate-limit.middleware.js';

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify);
  const authController = new AuthController(authService);

  // Register route
  fastify.post('/auth/register', {
    preHandler: [generalRateLimit()],
    handler: authController.register.bind(authController),
  });

  // Login route
  fastify.post('/auth/login', {
    preHandler: [loginRateLimit()],
    handler: authController.login.bind(authController),
  });

  // Refresh token route
  fastify.post('/auth/refresh', {
    preHandler: [generalRateLimit()],
    handler: authController.refreshToken.bind(authController),
  });

  // Get current user route (protected)
  fastify.get('/auth/me', {
    preHandler: [authenticate, generalRateLimit()],
    handler: authController.getCurrentUser.bind(authController),
  });

  // Logout route (protected)
  fastify.post('/auth/logout', {
    preHandler: [authenticate, generalRateLimit()],
    handler: authController.logout.bind(authController),
  });
}
