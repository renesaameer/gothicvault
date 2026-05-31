import { FastifyInstance } from 'fastify';
import { validateEnv } from '../../../utils/env.js';

const env = validateEnv();

export interface TokenPayload {
  userId: string;
  email: string | null;
  roles: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function generateAccessToken(fastify: FastifyInstance, payload: TokenPayload): string {
  return fastify.jwt.sign(payload, { expiresIn: env.JWT_EXPIRES_IN });
}

export function generateRefreshToken(fastify: FastifyInstance, payload: TokenPayload): string {
  return fastify.jwt.sign(payload, { expiresIn: '30d' });
}

export function generateTokenPair(fastify: FastifyInstance, payload: TokenPayload): TokenPair {
  const accessToken = generateAccessToken(fastify, payload);
  const refreshToken = generateRefreshToken(fastify, payload);
  return { accessToken, refreshToken };
}

export function verifyAccessToken(fastify: FastifyInstance, token: string): TokenPayload {
  return fastify.jwt.verify(token) as TokenPayload;
}

export function verifyRefreshToken(fastify: FastifyInstance, token: string): TokenPayload {
  return fastify.jwt.verify(token) as TokenPayload;
}
