import prisma from '../../utils/prisma.js';
import { hashPassword, comparePassword } from './utils/password.js';
import { generateTokenPair, verifyRefreshToken, type TokenPayload } from './utils/jwt.js';
import { RegisterDto, LoginDto, type AuthResponse, type UserResponse } from './dto/index.js';
import logger from '../../utils/logger.js';
import type { FastifyInstance } from 'fastify';

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  async register(data: RegisterDto): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingProfile = await prisma.profile.findUnique({
        where: { userId: data.userId },
      });

      if (existingProfile) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await hashPassword(data.password);

      // Create profile with hashed password
      const profile = await prisma.profile.create({
        data: {
          userId: data.userId,
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

      const roles = userRoles.map((r: { role: string }) => r.role);

      // Generate tokens
      const payload: TokenPayload = {
        userId: profile.userId,
        email: profile.email,
        roles,
      };

      const tokens = generateTokenPair(this.fastify, payload);

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
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
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

      const roles = userRoles.map((r: { role: string }) => r.role);

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

      const tokens = generateTokenPair(this.fastify, payload);

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
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      logger.error({ msg: 'Error logging in user', error });
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(this.fastify, refreshToken);

      // Find user
      const profile = await prisma.profile.findUnique({
        where: { userId: payload.userId },
      });

      if (!profile) {
        throw new Error('Invalid refresh token');
      }

      // Get user roles
      const userRoles = await prisma.userRole.findMany({
        where: { userId: profile.id },
      });

      const roles = userRoles.map((r: { role: string }) => r.role);

      // Generate new tokens
      const newPayload: TokenPayload = {
        userId: profile.userId,
        email: profile.email,
        roles,
      };

      const tokens = generateTokenPair(this.fastify, newPayload);

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
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
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

      const roles = userRoles.map((r: { role: string }) => r.role);

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
      // In a production environment, you would invalidate the refresh token
      // For now, we'll just log the logout
      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error({ msg: 'Error logging out user', error });
      throw error;
    }
  }
}
