import prisma from '../../utils/prisma.js';
import { hashPassword, comparePassword } from './utils/password.js';
import { generateAccessToken, generateRefreshTokenString, verifyRefreshTokenString, type TokenPayload } from './utils/jwt.js';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, type AuthResponse, type UserResponse } from './dto/index.js';
import logger from '../../utils/logger.js';
import type { FastifyInstance } from 'fastify';

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  async register(data: RegisterDto): Promise<AuthResponse> {
    try {
      // Check if user already exists by email
      const existingProfile = await prisma.profile.findFirst({
        where: { email: data.email },
      });

      if (existingProfile) {
        throw new Error('User already exists');
      }

      // Generate userId server-side
      const userId = crypto.randomUUID();

      // Hash password
      const hashedPassword = await hashPassword(data.password);

      // Create profile with hashed password
      const profile = await prisma.profile.create({
        data: {
          userId,
          email: data.email,
          fullName: data.fullName,
          password: hashedPassword,
          isAdmin: false,
        },
      });

      // Create user role (default to 'user')
      await prisma.userRole.create({
        data: {
          userId: profile.id,
          role: 'user',
        },
      });

      // Get user roles
      const userRoles = await prisma.userRole.findMany({
        where: { userId: profile.id },
      });

      const roles = userRoles.map((r: { role: string }) => r.role as 'user' | 'admin' | 'staff');

      // Generate tokens
      const payload: TokenPayload = {
        userId: profile.userId,
        email: profile.email,
        roles,
      };

      const accessToken = generateAccessToken(this.fastify, payload);
      const refreshTokenString = generateRefreshTokenString(this.fastify, payload);

      // Store refresh token in database
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await prisma.refreshToken.create({
        data: {
          userId: profile.id,
          token: refreshTokenString,
          expiresAt,
        },
      });

      logger.info(`User registered: ${profile.email}`);

      return {
        user: {
          id: profile.id,
          userId: profile.userId,
          email: profile.email,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
          isAdmin: profile.isAdmin,
          roles,
        },
        accessToken,
        refreshToken: refreshTokenString,
      };
    } catch (error) {
      logger.error({ msg: 'Error registering user', error });
      throw error;
    }
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    try {
      // Find user by email
      const profile = await prisma.profile.findFirst({
        where: { email: data.email },
      });

      if (!profile) {
        throw new Error('Invalid credentials');
      }

      // Get user roles
      const userRoles = await prisma.userRole.findMany({
        where: { userId: profile.id },
      });

      const roles = userRoles.map((r: { role: string }) => r.role as 'user' | 'admin' | 'staff');

      // Verify password
      if (!profile.password) {
        throw new Error('Invalid credentials');
      }

      const isPasswordValid = await comparePassword(data.password, profile.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const payload: TokenPayload = {
        userId: profile.userId,
        email: profile.email,
        roles,
      };

      const accessToken = generateAccessToken(this.fastify, payload);
      const refreshTokenString = generateRefreshTokenString(this.fastify, payload);

      // Store refresh token in database
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await prisma.refreshToken.create({
        data: {
          userId: profile.id,
          token: refreshTokenString,
          expiresAt,
        },
      });

      logger.info(`User logged in: ${profile.email}`);

      return {
        user: {
          id: profile.id,
          userId: profile.userId,
          email: profile.email,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
          isAdmin: profile.isAdmin,
          roles,
        },
        accessToken,
        refreshToken: refreshTokenString,
      };
    } catch (error) {
      logger.error({ msg: 'Error logging in user', error });
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token signature
      verifyRefreshTokenString(this.fastify, refreshToken);

      // Find refresh token in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { profile: true },
      });

      if (!storedToken) {
        throw new Error('Invalid refresh token');
      }

      // Check if token is revoked or expired
      if (storedToken.revokedAt || storedToken.expiresAt < new Date()) {
        throw new Error('Invalid refresh token');
      }

      // Find user
      const profile = await prisma.profile.findUnique({
        where: { id: storedToken.userId },
      });

      if (!profile) {
        throw new Error('Invalid refresh token');
      }

      // Get user roles
      const userRoles = await prisma.userRole.findMany({
        where: { userId: profile.id },
      });

      const roles = userRoles.map((r: { role: string }) => r.role as 'user' | 'admin' | 'staff');

      // Generate new tokens
      const newPayload: TokenPayload = {
        userId: profile.userId,
        email: profile.email,
        roles,
      };

      const newAccessToken = generateAccessToken(this.fastify, newPayload);
      const newRefreshTokenString = generateRefreshTokenString(this.fastify, newPayload);

      // Revoke old refresh token and create new one (rotation)
      await prisma.$transaction([
        prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { revokedAt: new Date(), replacedBy: newRefreshTokenString },
        }),
        prisma.refreshToken.create({
          data: {
            userId: profile.id,
            token: newRefreshTokenString,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        }),
      ]);

      logger.info(`Token refreshed for user: ${profile.email}`);

      return {
        user: {
          id: profile.id,
          userId: profile.userId,
          email: profile.email,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
          isAdmin: profile.isAdmin,
          roles,
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshTokenString,
      };
    } catch (error) {
      logger.error({ msg: 'Error refreshing token', error });
      throw new Error('Invalid refresh token');
    }
  }

  async getCurrentUser(userId: string): Promise<UserResponse> {
    try {
      const profile = await prisma.profile.findUnique({
        where: { userId },
      });

      if (!profile) {
        throw new Error('User not found');
      }

      const userRoles = await prisma.userRole.findMany({
        where: { userId: profile.id },
      });

      const roles = userRoles.map((r: { role: string }) => r.role as 'user' | 'admin' | 'staff');

      return {
        id: profile.id,
        userId: profile.userId,
        email: profile.email,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        isAdmin: profile.isAdmin,
        roles,
      };
    } catch (error) {
      logger.error({ msg: 'Error getting current user', error });
      throw error;
    }
  }

  async logout(userId: string): Promise<void> {
    try {
      // Revoke all refresh tokens for this user
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      });

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error({ msg: 'Error logging out user', error });
      throw error;
    }
  }

  async forgotPassword(data: ForgotPasswordDto): Promise<void> {
    try {
      const profile = await prisma.profile.findFirst({
        where: { email: data.email },
      });

      if (!profile) {
        // Don't reveal if email exists
        logger.info(`Password reset requested for non-existent email: ${data.email}`);
        return;
      }

      // Generate reset token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Delete any existing reset tokens for this user
      await prisma.passwordReset.deleteMany({
        where: { userId: profile.id },
      });

      // Create new reset token
      await prisma.passwordReset.create({
        data: {
          email: profile.email || '',
          userId: profile.id,
          token,
          expiresAt,
        },
      });

      // TODO: Send email with reset link
      // For now, just log the token (in production, send email)
      logger.info(`Password reset token generated for ${profile.email}: ${token}`);

      // In production, you would send an email like:
      // await sendPasswordResetEmail(profile.email, token);
    } catch (error) {
      logger.error({ msg: 'Error in forgot password', error });
      throw error;
    }
  }

  async resetPassword(data: ResetPasswordDto): Promise<void> {
    try {
      // Find reset token
      const resetToken = await prisma.passwordReset.findUnique({
        where: { token: data.token },
        include: { profile: true },
      });

      if (!resetToken) {
        throw new Error('Invalid reset token');
      }

      // Check if token is expired or already used
      if (resetToken.expiresAt < new Date() || resetToken.usedAt) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await hashPassword(data.password);

      // Update user password
      await prisma.$transaction([
        prisma.profile.update({
          where: { id: resetToken.userId! },
          data: { password: hashedPassword },
        }),
        prisma.passwordReset.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() },
        }),
        // Revoke all refresh tokens for security
        prisma.refreshToken.updateMany({
          where: { userId: resetToken.userId! },
          data: { revokedAt: new Date() },
        }),
      ]);

      logger.info(`Password reset for user: ${resetToken.profile?.email}`);
    } catch (error) {
      logger.error({ msg: 'Error in reset password', error });
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      // Find user by userId (token is userId for simplicity)
      const profile = await prisma.profile.findUnique({
        where: { userId: token },
      });

      if (!profile) {
        throw new Error('Invalid verification token');
      }

      // Update email verified status
      await prisma.profile.update({
        where: { id: profile.id },
        data: { emailVerified: true },
      });

      logger.info(`Email verified for user: ${profile.email}`);
    } catch (error) {
      logger.error({ msg: 'Error in verify email', error });
      throw error;
    }
  }
}
