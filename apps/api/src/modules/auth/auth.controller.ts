import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './dto/index.js';
import logger from '../../utils/logger.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = registerSchema.parse(request.body);
      const result = await this.authService.register(data);
      
      reply.status(201).send(result);
    } catch (error) {
      logger.error({ msg: 'Error in register controller', error });
      
      if (error instanceof Error && error.message === 'User already exists') {
        reply.status(409).send({ error: 'User already exists' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = loginSchema.parse(request.body);
      const result = await this.authService.login(data);
      
      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in login controller', error });
      
      if (error instanceof Error && error.message === 'Invalid credentials') {
        reply.status(401).send({ error: 'Invalid credentials' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = refreshTokenSchema.parse(request.body);
      const result = await this.authService.refreshToken(data.refreshToken);
      
      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in refresh token controller', error });
      
      if (error instanceof Error && error.message === 'Invalid refresh token') {
        reply.status(401).send({ error: 'Invalid refresh token' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.userId;
      
      if (!userId) {
        reply.status(401).send({ error: 'Unauthorized' });
        return;
      }
      
      const result = await this.authService.getCurrentUser(userId);
      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in get current user controller', error });
      
      if (error instanceof Error && error.message === 'User not found') {
        reply.status(404).send({ error: 'User not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.userId;
      
      if (!userId) {
        reply.status(401).send({ error: 'Unauthorized' });
        return;
      }
      
      await this.authService.logout(userId);
      reply.status(204).send();
    } catch (error) {
      logger.error({ msg: 'Error in logout controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }
}
