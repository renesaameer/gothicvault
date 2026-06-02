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
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user',
      description: 'Create a new user account with email and password',
      body: {
        type: 'object',
        required: ['email', 'password', 'fullName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          fullName: { type: 'string', minLength: 2 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                email: { type: 'string' },
                fullName: { type: 'string' },
                avatarUrl: { type: 'string', nullable: true },
                isAdmin: { type: 'boolean' },
                roles: { type: 'array', items: { type: 'string' } },
              },
            },
            accessToken: { type: 'string' },
          },
        },
      },
    },
    handler: authController.register.bind(authController),
  });

  // Login route
  fastify.post('/auth/login', {
    preHandler: [loginRateLimit()],
    schema: {
      tags: ['Auth'],
      summary: 'Login user',
      description: 'Authenticate user with email and password',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                email: { type: 'string' },
                fullName: { type: 'string' },
                avatarUrl: { type: 'string', nullable: true },
                isAdmin: { type: 'boolean' },
                roles: { type: 'array', items: { type: 'string' } },
              },
            },
            accessToken: { type: 'string' },
          },
        },
      },
    },
    handler: authController.login.bind(authController),
  });

  // Refresh token route
  fastify.post('/auth/refresh', {
    preHandler: [generalRateLimit()],
    schema: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      description: 'Get a new access token using a valid refresh token',
      body: {
        type: 'object',
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                email: { type: 'string' },
                fullName: { type: 'string' },
                avatarUrl: { type: 'string', nullable: true },
                isAdmin: { type: 'boolean' },
                roles: { type: 'array', items: { type: 'string' } },
              },
            },
            accessToken: { type: 'string' },
          },
        },
      },
    },
    handler: authController.refreshToken.bind(authController),
  });

  // Get current user route (protected)
  fastify.get('/auth/me', {
    preHandler: [authenticate, generalRateLimit()],
    schema: {
      tags: ['Auth'],
      summary: 'Get current user',
      description: 'Get the currently authenticated user information',
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'Bearer token' },
        },
        required: ['authorization'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            email: { type: 'string' },
            fullName: { type: 'string' },
            avatarUrl: { type: 'string', nullable: true },
            isAdmin: { type: 'boolean' },
            roles: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    handler: authController.getCurrentUser.bind(authController),
  });

  // Logout route (protected)
  fastify.post('/auth/logout', {
    preHandler: [authenticate, generalRateLimit()],
    schema: {
      tags: ['Auth'],
      summary: 'Logout user',
      description: 'Logout the currently authenticated user',
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'Bearer token' },
        },
        required: ['authorization'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    handler: authController.logout.bind(authController),
  });

  // Forgot password route
  fastify.post('/auth/forgot-password', {
    preHandler: [generalRateLimit()],
    schema: {
      tags: ['Auth'],
      summary: 'Request password reset',
      description: 'Send a password reset link to the user email',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    handler: authController.forgotPassword.bind(authController),
  });

  // Reset password route
  fastify.post('/auth/reset-password', {
    preHandler: [generalRateLimit()],
    schema: {
      tags: ['Auth'],
      summary: 'Reset password',
      description: 'Reset password using a valid reset token',
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string' },
          password: { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    handler: authController.resetPassword.bind(authController),
  });

  // Verify email route
  fastify.post('/auth/verify-email', {
    preHandler: [generalRateLimit()],
    schema: {
      tags: ['Auth'],
      summary: 'Verify email',
      description: 'Verify user email address',
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    handler: authController.verifyEmail.bind(authController),
  });
}
