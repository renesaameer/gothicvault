import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service.js';
import { registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema } from './dto/index.js';
import { ZodError } from 'zod';
import logger from '../../utils/logger.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = registerSchema.parse(request.body);
      const result = await this.authService.register(data);

      // Set HttpOnly cookie for refresh token
      reply.setCookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      // Return only access token in body (refresh token in cookie)
      reply.status(201).send({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      logger.error({ msg: 'Error in register controller', error });

      if (error instanceof ZodError) {
        reply.status(400).send({ error: 'Validation error', details: error.errors });
      } else if (error instanceof Error && error.message === 'User already exists') {
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

      // Set HttpOnly cookie for refresh token
      reply.setCookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      // Return only access token in body (refresh token in cookie)
      reply.send({
        user: result.user,
        accessToken: result.accessToken,
      });
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
      // Get refresh token from cookie first, fall back to body
      const refreshTokenFromCookie = request.cookies.refresh_token;
      const refreshTokenFromBody = refreshTokenSchema.parse(request.body).refreshToken;
      const refreshToken = refreshTokenFromCookie || refreshTokenFromBody;

      if (!refreshToken) {
        reply.status(401).send({ error: 'Refresh token required' });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      // Set new HttpOnly cookie for refresh token
      reply.setCookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      // Return only access token in body (refresh token in cookie)
      reply.send({
        user: result.user,
        accessToken: result.accessToken,
      });
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

      // Clear refresh token cookie
      reply.clearCookie('refresh_token', {
        path: '/',
      });

      reply.status(204).send();
    } catch (error) {
      logger.error({ msg: 'Error in logout controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = forgotPasswordSchema.parse(request.body);
      await this.authService.forgotPassword(data);

      // Always return success to prevent email enumeration
      reply.send({ message: 'If an account exists with this email, a password reset link has been sent.' });
    } catch (error) {
      logger.error({ msg: 'Error in forgot password controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = resetPasswordSchema.parse(request.body);
      await this.authService.resetPassword(data);

      reply.send({ message: 'Password has been reset successfully' });
    } catch (error) {
      logger.error({ msg: 'Error in reset password controller', error });

      if (error instanceof Error && error.message === 'Invalid or expired reset token') {
        reply.status(400).send({ error: 'Invalid or expired reset token' });
      } else if (error instanceof Error && error.message === 'Invalid reset token') {
        reply.status(400).send({ error: 'Invalid reset token' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async verifyEmail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = verifyEmailSchema.parse(request.body);
      await this.authService.verifyEmail(data.token);

      reply.send({ message: 'Email verified successfully' });
    } catch (error) {
      logger.error({ msg: 'Error in verify email controller', error });

      if (error instanceof Error && error.message === 'Invalid verification token') {
        reply.status(400).send({ error: 'Invalid verification token' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }
}
